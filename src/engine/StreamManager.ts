import { Row, KPIMetrics } from './types';
import { RowStore } from './RowStore';
import { DOMRenderer } from './DOMRenderer';

export class StreamManager {
  private store: RowStore;
  private renderer: DOMRenderer | null = null;
  private isPaused = false;
  private isDraining = false;

  // Bounded pending changed set
  private pendingChangedIds = new Set<string>();
  private drainBatchSize = 50; // Tunable constant for progressive frame draining

  // Animation frame rendering state
  private renderPending = false;
  private animFrameId = -1;

  // Ingestion metrics tracking
  private updatesProcessedThisPeriod = 0;
  private lastMetricsCalculationTime = performance.now();
  private currentIngestionRate = 0;

  // Listeners for cold UI updates (React state updates)
  private metricsListeners: ((metrics: KPIMetrics, visibleCount: number) => void)[] = [];
  private pauseListeners: ((isPaused: boolean) => void)[] = [];

  // Interval for calculating ingestion rate
  private metricsTimerId: any = null;

  constructor(store: RowStore) {
    this.store = store;

    // Periodically calculate ingestion rate (every 1s)
    this.metricsTimerId = setInterval(this.calculateIngestionRate, 1000);
  }

  public setRenderer(renderer: DOMRenderer) {
    this.renderer = renderer;
    this.renderer.forceRender();
    this.triggerMetricsCallback();
  }

  private calculateIngestionRate = () => {
    const now = performance.now();
    const elapsedSeconds = (now - this.lastMetricsCalculationTime) / 1000;
    
    if (elapsedSeconds > 0) {
      this.currentIngestionRate = Math.round(this.updatesProcessedThisPeriod / elapsedSeconds);
    }
    
    this.updatesProcessedThisPeriod = 0;
    this.lastMetricsCalculationTime = now;

    // Trigger metrics update for the React shell (gives live queued count when paused)
    this.triggerMetricsCallback();
  };

  /**
   * Main entry point for injecting streaming data.
   * Dispatched every 200ms.
   */
  public ingestBatch(batch: (Partial<Row> & { project_id: string })[]) {
    const batchSize = batch.length;
    this.updatesProcessedThisPeriod += batchSize;

    // Ingestion and Store Mutation continue running underneath in real-time
    const flashAlerts: { id: string; field: keyof Row; isAnomaly: boolean }[] = [];

    for (let i = 0; i < batchSize; i++) {
      const patch = batch[i];
      const id = patch.project_id;
      
      // Mutate in-place, O(log N) binary reindexing maintains sorted index immediately
      const triggerFlash = this.store.ingestRow(patch);
      this.pendingChangedIds.add(id);

      // Track alert flashes if rendering is active
      if (!this.isPaused && !this.isDraining && triggerFlash && this.renderer) {
        const isAnomaly = patch.project_status === 'Critical' || patch.project_status === 'Failed' || (patch.roi_percent !== undefined && parseFloat(String(patch.roi_percent)) < 10);
        const field = patch.project_status !== undefined ? 'project_status' : 'roi_percent';
        flashAlerts.push({ id, field, isAnomaly });
      }
    }

    if (!this.isPaused && !this.isDraining) {
      // Normal flow: schedule a DOM commit for this frame
      this.requestRender();

      // Trigger cell flashing after render commits
      if (flashAlerts.length > 0 && this.renderer) {
        requestAnimationFrame(() => {
          for (let f = 0; f < flashAlerts.length; f++) {
            const { id, field, isAnomaly } = flashAlerts[f];
            this.renderer?.flashCell(id, field, isAnomaly);
          }
        });
      }
    }
  }

  public requestRender() {
    if (!this.renderPending && !this.isPaused) {
      this.renderPending = true;
      this.animFrameId = requestAnimationFrame(this.renderTick);
    }
  }

  private renderTick = () => {
    this.renderPending = false;

    if (this.isDraining) {
      this.drainPendingBatch();
    } else if (this.renderer) {
      // Dispatch O(K) patch update, then clear frame buffer
      this.renderer.onDataUpdate(this.pendingChangedIds);
      this.pendingChangedIds.clear();
      this.triggerMetricsCallback();
    }
  };

  /**
   * Drains a bounded slice of pending IDs across multiple animation frames.
   * Bypasses heavy full re-renders and re-uses the O(K) patch path.
   */
  private drainPendingBatch() {
    const itemsToProcess = Math.min(this.pendingChangedIds.size, this.drainBatchSize);
    
    if (itemsToProcess === 0 || this.isPaused) {
      this.isDraining = false;
      this.requestRender();
      this.triggerMetricsCallback();
      return;
    }

    // Extract a chunk slice from the Set
    const iterator = this.pendingChangedIds.values();
    const drainedSlice = new Set<string>();
    for (let i = 0; i < itemsToProcess; i++) {
      const nextItem = iterator.next();
      if (nextItem.done) break;
      drainedSlice.add(nextItem.value);
    }

    // Remove drained items from the pending Set
    drainedSlice.forEach(id => this.pendingChangedIds.delete(id));

    // Dispatch targeted patches to DOM for visible items in this chunk
    if (this.renderer) {
      this.renderer.onDataUpdate(drainedSlice);
    }

    // Throttled notification update to keep UI and charts moving progressively
    this.triggerMetricsCallback();

    // Schedule next frame drain if items remain
    if (this.pendingChangedIds.size > 0 && !this.isPaused) {
      this.animFrameId = requestAnimationFrame(this.renderTick);
    } else {
      this.isDraining = false;
      this.triggerMetricsCallback();
    }
  }

  public setPauseState(paused: boolean) {
    if (this.isPaused === paused) return;
    this.isPaused = paused;

    // Notify pause state listeners
    for (let l = 0; l < this.pauseListeners.length; l++) {
      this.pauseListeners[l](paused);
    }

    if (!paused) {
      // Resuming: start progressive frame-by-frame draining if we have pending changes
      if (this.pendingChangedIds.size > 0) {
        if (!this.isDraining) {
          this.isDraining = true;
          this.requestRender();
        }
      } else {
        this.requestRender();
      }
    } else {
      // Pausing: stop loops and cancel scheduled render ticks, but preserve pending Set
      if (this.animFrameId !== -1) {
        cancelAnimationFrame(this.animFrameId);
        this.animFrameId = -1;
      }
      this.renderPending = false;
      this.isDraining = false;
      this.triggerMetricsCallback(); // Update UI to reflect PAUSED state immediately
    }
  }

  public getPauseState(): boolean {
    return this.isPaused;
  }

  public getQueuedCount(): number {
    return this.pendingChangedIds.size;
  }

  public getPoolSize(): number {
    return this.renderer ? this.renderer.poolSize : 0;
  }

  public getIngestionRate(): number {
    return this.currentIngestionRate;
  }

  // Listeners registration
  public subscribeMetrics(listener: (metrics: KPIMetrics, visibleCount: number) => void): () => void {
    this.metricsListeners.push(listener);
    listener(this.store.getMetrics(this.currentIngestionRate, this.pendingChangedIds.size), this.store.visibleIds.length);
    return () => {
      this.metricsListeners = this.metricsListeners.filter(l => l !== listener);
    };
  }

  public subscribePause(listener: (isPaused: boolean) => void): () => void {
    this.pauseListeners.push(listener);
    listener(this.isPaused);
    return () => {
      this.pauseListeners = this.pauseListeners.filter(l => l !== listener);
    };
  }

  private triggerMetricsCallback() {
    const metrics = this.store.getMetrics(this.currentIngestionRate, this.pendingChangedIds.size);
    const visibleCount = this.store.visibleIds.length;
    for (let l = 0; l < this.metricsListeners.length; l++) {
      this.metricsListeners[l](metrics, visibleCount);
    }
  }

  public destroy() {
    if (this.metricsTimerId) {
      clearInterval(this.metricsTimerId);
    }
    if (this.animFrameId !== -1) {
      cancelAnimationFrame(this.animFrameId);
    }
  }
}
