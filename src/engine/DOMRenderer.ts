import { Row } from './types';
import { RowStore } from './RowStore';

interface ColumnConfig {
  key: string;
  width: number;
  label: string;
  getValue: (row: Row) => any;
  getText: (val: any, row: Row) => string;
  getClass: (val: any, row: Row) => string;
  align?: 'left' | 'right' | 'center';
}

function getProjectIconHTML(projectId: string): string {
  const num = parseInt(projectId.replace(/\D/g, ''), 10) || 0;
  const index = num % 5;

  let bgClass = 'bg-emerald-50';
  let iconColor = '#10b981';
  let svgContent = '';

  if (index === 0) {
    // Green cube
    bgClass = 'bg-emerald-50';
    iconColor = '#10b981';
    svgContent = `<svg class="w-3.5 h-3.5" stroke="${iconColor}" stroke-width="2" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25"/></svg>`;
  } else if (index === 1) {
    // Purple document
    bgClass = 'bg-purple-50';
    iconColor = '#8b5cf6';
    svgContent = `<svg class="w-3.5 h-3.5" stroke="${iconColor}" stroke-width="2" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>`;
  } else if (index === 2) {
    // Blue network/nodes
    bgClass = 'bg-blue-50';
    iconColor = '#3b82f6';
    svgContent = `<svg class="w-3.5 h-3.5" stroke="${iconColor}" stroke-width="2" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94-3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"/></svg>`;
  } else if (index === 3) {
    // Orange brain/circuit
    bgClass = 'bg-amber-50';
    iconColor = '#f59e0b';
    svgContent = `<svg class="w-3.5 h-3.5" stroke="${iconColor}" stroke-width="2" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z"/></svg>`;
  } else {
    // Green robot head
    bgClass = 'bg-emerald-50';
    iconColor = '#10b981';
    svgContent = `<svg class="w-3.5 h-3.5" stroke="${iconColor}" stroke-width="2" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25M9 7.5h.008v.008H9V7.5zm6 0h.008v.008H15V7.5z"/></svg>`;
  }

  return `
    <div class="flex items-center space-x-2.5">
      <div class="w-6.5 h-6.5 rounded-lg flex items-center justify-center ${bgClass} flex-shrink-0">
        ${svgContent}
      </div>
      <span class="font-mono text-xs font-semibold text-slate-800">${projectId}</span>
    </div>
  `;
}

function getProjectStatusHTML(status: string): string {
  const lower = status.toLowerCase();
  let bgClass = 'bg-slate-100 text-slate-650 border-slate-200';
  let iconSvg = '';

  if (lower === 'completed' || lower === 'success') {
    bgClass = 'bg-emerald-50 text-emerald-700 border-emerald-100/60';
    iconSvg = `<svg class="w-3 h-3 text-emerald-650 mr-1 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
  } else if (lower === 'active' || lower === 'in progress') {
    bgClass = 'bg-blue-50 text-blue-700 border-blue-100/60';
    iconSvg = `<span class="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5 flex-shrink-0 blink-indicator"></span>`;
  } else if (lower === 'failed' || lower === 'critical' || lower === 'error') {
    bgClass = 'bg-rose-50 text-rose-700 border-rose-100/60';
    iconSvg = `<span class="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5 flex-shrink-0"></span>`;
  } else if (lower === 'under review' || lower === 'pending') {
    bgClass = 'bg-amber-50 text-amber-750 border-amber-100/60';
    iconSvg = `<span class="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 flex-shrink-0"></span>`;
  } else {
    iconSvg = `<span class="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5 flex-shrink-0"></span>`;
  }

  return `
    <div class="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${bgClass}">
      ${iconSvg}
      <span class="uppercase tracking-wider">${status}</span>
    </div>
  `;
}

export class DOMRenderer {
  private container: HTMLElement;
  private spacer: HTMLElement;
  private gridBody: HTMLElement;
  private store: RowStore;

  private rowHeight = 56; // px (increased from 44px to match mockup spacing)
  private overscan = 8;
  public poolSize = 0;
  public onRowClick?: (rowId: string) => void;
  public selectedRowId: string | null = null;
  private rowElements: HTMLElement[] = [];
  private cellNodesList: HTMLElement[][] = []; // [slotIndex][cellIndex]

  // Caching to avoid redundant DOM updates
  private slotCaches: {
    rowId: string;
    cellValues: any[];
    cellClasses: string[];
    visible: boolean;
  }[] = [];

  // Mapping from rowId to active slot index for targeted O(K) updates
  private rowIdToSlotIndex = new Map<string, number>();

  // Tracking viewports to check if full re-layout is needed
  private lastViewportRowIds: string[] = [];
  private lastVisibleIds: string[] = [];

  private lastScrollTop = -1;
  private animationFrameId = -1;
  private resizeObserver: ResizeObserver | null = null;
  
  // Custom columns configuration matching the project page mockup exactly
  public columns: ColumnConfig[] = [
    {
      key: 'selected',
      width: 40,
      label: '',
      getValue: (r) => r.project_id === 'PRJ-8902',
      getText: (v) => v ? '☒' : '☐',
      getClass: (v) => v ? 'text-[#014D3E] font-bold text-center w-full block' : 'text-slate-300 text-center w-full block',
      align: 'center',
    },
    {
      key: 'project_id',
      width: 120,
      label: 'Project ID',
      getValue: (r) => r.project_id,
      getText: (v) => v,
      getClass: () => 'cursor-pointer',
    },
    {
      key: 'project_name',
      width: 250,
      label: 'Name',
      getValue: (r) => r, // return whole row to render stacked subtext
      getText: (r) => r.project_name,
      getClass: () => '',
    },
    {
      key: 'project_status',
      width: 120,
      label: 'Status',
      getValue: (r) => r.project_status,
      getText: (v) => v,
      getClass: () => '',
      align: 'center',
    },
    {
      key: 'robots_deployed',
      width: 80,
      label: 'Robots',
      getValue: (r) => r.robots_deployed,
      getText: (v) => v.toLocaleString(),
      getClass: () => 'font-mono text-xs text-slate-800 font-semibold',
      align: 'right',
    },
    {
      key: 'annual_savings_usd',
      width: 100,
      label: 'Savings',
      getValue: (r) => r.annual_savings_usd,
      getText: (v) => {
        if (v >= 1e6) return `$${(v / 1e6).toFixed(1)} M`;
        if (v >= 1e3) return `$${(v / 1e3).toFixed(1)} k`;
        return `$${v}`;
      },
      getClass: () => 'font-mono text-xs text-slate-800 font-bold',
      align: 'right',
    },
    {
      key: 'roi_percent',
      width: 80,
      label: 'ROI %',
      getValue: (r) => r.roi_percent,
      getText: (v) => `${v.toFixed(0)}%`,
      getClass: (v) => `font-mono text-xs font-bold ${v > 100 ? 'text-emerald-600' : 'text-slate-800'}`,
      align: 'right',
    },
    {
      key: 'trend_24h',
      width: 80,
      label: 'Trend (24H)',
      getValue: (r) => r.roi_percent,
      getText: () => '',
      getClass: () => '',
      align: 'center',
    },
    {
      key: 'actions',
      width: 50,
      label: '',
      getValue: () => '...',
      getText: (v) => v,
      getClass: () => 'text-slate-400 hover:text-slate-700 cursor-pointer font-bold text-center w-full block',
      align: 'center',
    }
  ];

  constructor(container: HTMLElement, store: RowStore, overscan = 8) {
    this.container = container;
    this.store = store;
    this.overscan = overscan;

    // Create DOM structure
    this.spacer = document.createElement('div');
    this.spacer.className = 'absolute top-0 left-0 right-0 pointer-events-none';
    this.spacer.style.height = '0px';
    this.spacer.style.zIndex = '-1';
    this.container.appendChild(this.spacer);

    this.gridBody = document.createElement('div');
    this.gridBody.className = 'absolute top-0 left-0 right-0 pointer-events-auto';
    this.gridBody.style.width = 'max-content';
    this.gridBody.style.minWidth = '100%';
    this.gridBody.style.minHeight = '100%';
    this.container.appendChild(this.gridBody);

    this.gridBody.addEventListener('animationend', (e) => {
      const target = e.target as HTMLElement;
      if (target) {
        target.classList.remove('flash-alert-cell', 'flash-update-cell');
      }
    });

    this.recalculatePoolSize();

    this.container.addEventListener('scroll', this.onScroll, { passive: true });

    this.resizeObserver = new ResizeObserver(() => {
      this.recalculatePoolSize();
      this.render(true);
    });
    this.resizeObserver.observe(this.container);
    this.container.addEventListener('click', this.handleContainerClick);
  }

  public recalculatePoolSize() {
    const height = this.container.clientHeight || 500;
    // Add a safety buffer of 5 extra slots to prevent modulo collisions during rapid fractional scroll updates
    const requiredPoolSize = Math.ceil(height / this.rowHeight) + this.overscan * 2 + 5;

    if (requiredPoolSize > this.poolSize) {
      this.adjustPool(requiredPoolSize);
    }
  }

  private adjustPool(targetSize: number) {
    if (targetSize === this.poolSize) return;

    if (targetSize > this.poolSize) {
      const delta = targetSize - this.poolSize;
      const totalColumns = this.columns.length;

      for (let i = 0; i < delta; i++) {
        const rowEl = document.createElement('div');
        rowEl.className = 'absolute left-0 right-0 flex items-center border-b border-slate-100 bg-white hover:bg-slate-50/50 transition-colors duration-75';
        rowEl.style.height = `${this.rowHeight}px`;
        rowEl.style.contain = 'layout paint';
        rowEl.style.display = 'none';

        const cellNodes: HTMLElement[] = [];
        const cachedValues: any[] = [];
        const cachedClasses: string[] = [];

        for (let c = 0; c < totalColumns; c++) {
          const col = this.columns[c];
          const cellEl = document.createElement('div');
          const isNarrow = col.key === 'selected' || col.key === 'actions' || col.key === 'trend_24h';
          cellEl.className = `${isNarrow ? 'px-2' : 'px-4'} flex items-center truncate h-full`;
          cellEl.style.width = `${col.width}px`;
          cellEl.style.flexShrink = '0';
          cellEl.style.flexGrow = col.key === 'project_name' ? '1' : '0';

          if (col.align === 'right') {
            cellEl.style.justifyContent = 'flex-end';
            cellEl.style.textAlign = 'right';
          } else if (col.align === 'center') {
            cellEl.style.justifyContent = 'center';
            cellEl.style.textAlign = 'center';
          } else {
            cellEl.style.justifyContent = 'flex-start';
            cellEl.style.textAlign = 'left';
          }

          const innerSpan = document.createElement('span');
          innerSpan.className = 'truncate w-full';
          cellEl.appendChild(innerSpan);

          rowEl.appendChild(cellEl);
          cellNodes.push(cellEl);

          cachedValues.push(undefined);
          cachedClasses.push('');
        }

        this.gridBody.appendChild(rowEl);
        this.rowElements.push(rowEl);
        this.cellNodesList.push(cellNodes);

        this.slotCaches.push({
          rowId: '',
          cellValues: cachedValues,
          cellClasses: cachedClasses,
          visible: false,
        });
      }
    } else {
      const delta = this.poolSize - targetSize;
      for (let i = 0; i < delta; i++) {
        const rowEl = this.rowElements.pop();
        if (rowEl) {
          this.gridBody.removeChild(rowEl);
        }
        this.cellNodesList.pop();
        this.slotCaches.pop();
      }
    }

    this.poolSize = targetSize;

    // Reset all slot caches to force a clean rendering cycle on size adjustment
    for (let s = 0; s < this.slotCaches.length; s++) {
      const cache = this.slotCaches[s];
      cache.rowId = '';
      cache.visible = false;
      cache.cellValues.fill(undefined);
      if (cache.cellClasses) {
        cache.cellClasses.fill('');
      }
      this.rowElements[s].style.display = 'none';
    }
  }

  private onScroll = () => {
    if (this.animationFrameId === -1) {
      this.animationFrameId = requestAnimationFrame(this.renderTick);
    }
  };

  private renderTick = () => {
    this.animationFrameId = -1;
    this.render();
  };

  public forceRender() {
    this.render(true);
  }

  public render(force = false) {
    if (this.container.clientHeight === 0) return;
    this.recalculatePoolSize();
    const totalCount = this.store.visibleIds.length;
    const spacerHeight = totalCount * this.rowHeight;
    const scrollTop = this.container.scrollTop;
    const visibleIds = this.store.visibleIds;

    if (this.spacer.style.height !== `${spacerHeight}px`) {
      this.spacer.style.height = `${spacerHeight}px`;
    }
    if (this.gridBody.style.height !== `${spacerHeight}px`) {
      this.gridBody.style.height = `${spacerHeight}px`;
    }

    const firstVisibleIndex = Math.max(0, Math.floor(scrollTop / this.rowHeight) - this.overscan);
    if (totalCount > 0 && firstVisibleIndex >= totalCount) {
      this.container.scrollTop = 0;
      return;
    }

    const lastVisibleIndex = Math.min(
      totalCount - 1,
      firstVisibleIndex + this.poolSize - 1,
      Math.ceil((scrollTop + this.container.clientHeight) / this.rowHeight) + this.overscan
    );

    const newViewportIds: string[] = [];
    const usedSlots = new Set<number>();
    this.rowIdToSlotIndex.clear();

    for (let idx = firstVisibleIndex; idx <= lastVisibleIndex; idx++) {
      const slotIndex = idx % this.poolSize;
      usedSlots.add(slotIndex);

      const id = visibleIds[idx];
      newViewportIds.push(id);
      this.rowIdToSlotIndex.set(id, slotIndex);

      const rowEl = this.rowElements[slotIndex];
      const targetY = idx * this.rowHeight;
      
      const transformStr = `translateY(${targetY}px)`;
      if (rowEl.style.transform !== transformStr) {
        rowEl.style.transform = transformStr;
      }

      this.patchSlot(slotIndex, id, force);
    }

    for (let s = 0; s < this.poolSize; s++) {
      if (!usedSlots.has(s)) {
        const cache = this.slotCaches[s];
        if (cache.visible) {
          this.rowElements[s].style.display = 'none';
          cache.visible = false;
          cache.rowId = '';
        }
      }
    }

    this.lastViewportRowIds = newViewportIds;
    this.lastVisibleIds = [...visibleIds];
  }

  private patchSlot(slotIndex: number, rowId: string, force = false) {
    const rowEl = this.rowElements[slotIndex];
    const cellNodes = this.cellNodesList[slotIndex];
    const cache = this.slotCaches[slotIndex];
    const row = this.store.store.get(rowId);

    if (!row) {
      rowEl.style.display = 'none';
      cache.visible = false;
      cache.rowId = '';
      return;
    }

    const isSelected = row.project_id === this.selectedRowId;
    if (isSelected) {
      rowEl.classList.add('bg-slate-50');
      rowEl.classList.remove('bg-white');
    } else {
      rowEl.classList.remove('bg-slate-50');
      rowEl.classList.add('bg-white');
    }

    const isSameRow = cache.rowId === rowId;
    cache.rowId = rowId;
    if (!isSameRow) {
      rowEl.setAttribute('data-row-id', rowId);
    }

    if (!cache.visible) {
      rowEl.style.display = 'flex';
      cache.visible = true;
    }

    // Perform cell patching
    for (let c = 0; c < this.columns.length; c++) {
      const col = this.columns[c];
      const cellEl = cellNodes[c];
      const spanEl = cellEl.firstElementChild as HTMLElement;

      const rawVal = col.getValue(row);
      const text = col.getText(rawVal, row);
      const cls = col.getClass(rawVal, row);

      const valChanged = cache.cellValues[c] !== rawVal || force;
      if (valChanged) {
        if (col.key === 'selected') {
          spanEl.innerHTML = rawVal
            ? '<input type="checkbox" checked disabled class="accent-[#014D3E] h-3.5 w-3.5 cursor-pointer rounded border-slate-350" />'
            : '<input type="checkbox" disabled class="h-3.5 w-3.5 cursor-pointer rounded border-slate-350" />';
        } else if (col.key === 'trend_24h') {
          const isUp = rawVal > 150;
          const color = isUp ? '#10b981' : '#ef4444';
          const points = isUp 
            ? '0,11 15,9 30,13 45,7 60,9 75,3 90,4'
            : '0,4 15,9 30,5 45,12 60,10 75,14 90,13';
          spanEl.innerHTML = `
            <svg class="w-16 h-3.5 overflow-visible" viewBox="0 0 90 16">
              <polyline fill="none" stroke="${color}" stroke-width="1.8" points="${points}" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          `;
        } else if (col.key === 'project_id') {
          spanEl.innerHTML = getProjectIconHTML(rawVal);
        } else if (col.key === 'project_name') {
          spanEl.innerHTML = `
            <div class="flex flex-col min-w-0">
              <span class="font-bold text-slate-800 text-xs leading-tight truncate">${rawVal.project_name}</span>
              <span class="text-[10px] text-slate-400 font-medium leading-none mt-1 truncate">${rawVal.department}</span>
            </div>
          `;
        } else if (col.key === 'project_status') {
          spanEl.innerHTML = getProjectStatusHTML(rawVal);
        } else {
          spanEl.textContent = text;
        }
        cache.cellValues[c] = rawVal;
      }

      const classChanged = cache.cellClasses[c] !== cls || force;
      if (classChanged) {
        const isNarrow = col.key === 'selected' || col.key === 'actions' || col.key === 'trend_24h';
        const baseClass = `col-${col.key} ${isNarrow ? 'px-2' : 'px-4'} flex items-center truncate h-full`;
        cellEl.className = `${baseClass} ${cls}`;
        cache.cellClasses[c] = cls;
      }

      if (!isSameRow && !force) {
        cellEl.classList.remove('flash-alert-cell', 'flash-update-cell');
      }
    }
  }

  public flashCell(rowId: string, field: keyof Row, isAnomaly: boolean) {
    const slotIdx = this.rowIdToSlotIndex.get(rowId);
    if (slotIdx === undefined) return;

    const cache = this.slotCaches[slotIdx];
    if (cache.rowId === rowId) {
      const colIndex = this.columns.findIndex(c => c.key === field);
      if (colIndex !== -1) {
        const cellEl = this.cellNodesList[slotIdx][colIndex];
        cellEl.classList.remove('flash-alert-cell', 'flash-update-cell');
        void cellEl.offsetWidth; // Reflow trigger
        cellEl.classList.add(isAnomaly ? 'flash-alert-cell' : 'flash-update-cell');
      }
    }
  }

  public onDataUpdate(changedIds: Set<string>) {
    const visibleIds = this.store.visibleIds;
    const firstVisibleIndex = Math.max(0, Math.floor(this.container.scrollTop / this.rowHeight) - this.overscan);
    const lastVisibleIndex = Math.min(
      visibleIds.length - 1,
      firstVisibleIndex + this.poolSize - 1,
      Math.ceil((this.container.scrollTop + this.container.clientHeight) / this.rowHeight) + this.overscan
    );

    for (let idx = firstVisibleIndex; idx <= lastVisibleIndex; idx++) {
      const id = visibleIds[idx];
      if (changedIds.has(id)) {
        const slotIdx = this.rowIdToSlotIndex.get(id);
        if (slotIdx !== undefined) {
          this.patchSlot(slotIdx, id, true);
        }
      }
    }
  }

  private handleContainerClick = (e: Event) => {
    const target = e.target as HTMLElement;
    const rowEl = target.closest('[data-row-id]');
    if (rowEl) {
      const rowId = rowEl.getAttribute('data-row-id');
      if (rowId && this.onRowClick) {
        this.onRowClick(rowId);
      }
    }
  };

  public destroy() {
    this.container.removeEventListener('scroll', this.onScroll);
    this.container.removeEventListener('click', this.handleContainerClick);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.animationFrameId !== -1) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}
