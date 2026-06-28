import { Row, SortCriterion, FilterSettings, KPIMetrics } from './types';

// Strict sanitization helper functions to handle CSV text casting
function parseBoolean(val: any): boolean {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    const lower = val.toLowerCase().trim();
    return lower === 'yes' || lower === 'true' || lower === '1';
  }
  return !!val;
}

function parseNum(val: any): number {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    // Strip currency symbols and commas
    return parseInt(val.replace(/[$,\s]/g, ''), 10) || 0;
  }
  return 0;
}

function parseFloatNum(val: any): number {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    // Strip percentage signs and commas
    return parseFloat(val.replace(/[%\s]/g, '')) || 0;
  }
  return 0;
}

export class RowStore {
  public store = new Map<string, Row>();
  public sortedIds: string[] = [];
  public visibleIds: string[] = [];
  public visibleIdsSet = new Set<string>();
  public recentAnomalies: Row[] = [];
  public recentEvents: { project_id: string; timestamp: number; desc: string }[] = [];
  
  // Insertion order tracking for eviction cap
  private insertionQueue: string[] = [];
  private maxRetainedRows = 5000;

  // Running KPI counters
  private runningTotalProjects = 0;
  private runningTotalRobots = 0;
  private runningTotalSavingsUSD = 0;
  private runningTotalHoursSaved = 0;
  private runningAIEnabledCount = 0;
  private runningCloudDeploymentCount = 0;
  private runningAnomalyCount = 0;
  private totalUpdatesProcessed = 0;
  private runningTotalROIPercent = 0;
  public runningFailedCount = 0;

  // Filter/Sort settings
  public sortCriteria: SortCriterion[] = [{ field: 'roi_percent', direction: 'desc' }];
  public filterSettings: FilterSettings = {
    project_status: 'all',
    automation_type: 'all',
    department: 'all',
    industry: 'all',
    country: 'all',
    ai_enabled: 'all',
    cloud_deployment: 'all',
  };
  public searchQueryString = '';
  private searchTokens: string[] = [];

  // Configuration change listeners (for debounced local storage persistence)
  private configListeners: (() => void)[] = [];

  constructor(maxRetainedRows = 5000) {
    this.maxRetainedRows = maxRetainedRows;
  }

  // Generate folding comparator for sorting
  public getCompareFn() {
    const store = this.store;
    const criteria = this.sortCriteria;
    return (aId: string, bId: string): number => {
      if (aId === bId) return 0;
      const a = store.get(aId);
      const b = store.get(bId);
      if (!a) return 1;
      if (!b) return -1;

      for (const c of criteria) {
        const valA = a[c.field];
        const valB = b[c.field];
        if (valA !== valB) {
          let result = 0;
          if (typeof valA === 'string' && typeof valB === 'string') {
            result = valA.localeCompare(valB);
          } else if (typeof valA === 'number' && typeof valB === 'number') {
            result = valA - valB;
          } else if (typeof valA === 'boolean' && typeof valB === 'boolean') {
            result = (valA ? 1 : 0) - (valB ? 1 : 0);
          }
          return c.direction === 'asc' ? result : -result;
        }
      }
      return aId.localeCompare(bId);
    };
  }

  private matchesCurrentFilters(row: Row): boolean {
    const f = this.filterSettings;
    if (f.project_status !== 'all' && row.project_status !== f.project_status) return false;
    if (f.automation_type !== 'all' && row.automation_type !== f.automation_type) return false;
    if (f.department !== 'all' && row.department !== f.department) return false;
    if (f.industry !== 'all' && row.industry !== f.industry) return false;
    if (f.country !== 'all' && row.country !== f.country) return false;

    if (f.ai_enabled !== 'all') {
      if (row.ai_enabled !== (f.ai_enabled === 'true')) return false;
    }
    if (f.cloud_deployment !== 'all') {
      if (row.cloud_deployment !== (f.cloud_deployment === 'true')) return false;
    }

    if (this.searchTokens.length > 0) {
      const searchStr = row._searchString;
      for (const token of this.searchTokens) {
        if (searchStr.indexOf(token) === -1) {
          return false;
        }
      }
    }

    return true;
  }

  private isAnomaly(row: Row): boolean {
    const statusLower = row.project_status.toLowerCase();
    return (
      statusLower === 'failed' ||
      statusLower === 'critical' ||
      statusLower === 'error' ||
      row.roi_percent < 10
    );
  }

  private isFailedOrCritical(status: string): boolean {
    const lower = status.toLowerCase();
    return lower === 'failed' || lower === 'critical';
  }

  // Precompute searchable string
  private precomputeSearchString(row: Row): string {
    return `${row.project_id} ${row.project_name} ${row.company_id} ${row.country} ${row.industry}`
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Ingests a raw data patch, mutating the store in-place.
   * Maintains running counters and updates sorted/filtered arrays.
   */
  public ingestRow(patch: Partial<Row> & { project_id: string }): boolean {
    this.totalUpdatesProcessed++;
    const id = patch.project_id;
    let row = this.store.get(id);

    const compareFn = this.getCompareFn();
    let isNew = false;
    let flashAlert = false;

    // Track pre-mutation stats to update running KPI deltas
    let oldRobots = 0;
    let oldSavings = 0;
    let oldHours = 0;
    let oldAI = false;
    let oldCloud = false;
    let oldAnomaly = false;
    let oldFailed = false;
    let matchedBefore = false;

    if (row) {
      oldRobots = row.robots_deployed;
      oldSavings = row.annual_savings_usd;
      oldHours = row.employee_hours_saved;
      oldAI = row.ai_enabled;
      oldCloud = row.cloud_deployment;
      oldAnomaly = this.isAnomaly(row);
      oldFailed = this.isFailedOrCritical(row.project_status);
      matchedBefore = this.visibleIdsSet.has(id);

      // Remove from sorted index BEFORE mutating
      const oldSortIndex = this.binarySearchFind(this.sortedIds, id, compareFn);
      if (oldSortIndex !== -1) {
        this.sortedIds.splice(oldSortIndex, 1);
      }

      if (matchedBefore) {
        const oldVisIndex = this.binarySearchFind(this.visibleIds, id, compareFn);
        if (oldVisIndex !== -1) {
          this.visibleIds.splice(oldVisIndex, 1);
          this.visibleIdsSet.delete(id);
        }
      }

      // Mutate in place (avoid spreads!)
      if (patch.company_id !== undefined) row.company_id = patch.company_id;
      if (patch.project_name !== undefined) row.project_name = patch.project_name;
      if (patch.project_status !== undefined) {
        if (row.project_status !== patch.project_status) {
          const newStatusLower = patch.project_status.toLowerCase();
          if (newStatusLower === 'critical' || newStatusLower === 'failed') {
            flashAlert = true;
          }
        }
        row.project_status = patch.project_status;
      }
      if (patch.automation_type !== undefined) row.automation_type = patch.automation_type;
      
      // Strict castings
      if (patch.robots_deployed !== undefined) row.robots_deployed = parseNum(patch.robots_deployed);
      if (patch.annual_savings_usd !== undefined) row.annual_savings_usd = parseNum(patch.annual_savings_usd);
      if (patch.roi_percent !== undefined) {
        const newROI = parseFloatNum(patch.roi_percent);
        if (newROI < row.roi_percent - 15) {
          flashAlert = true;
        }
        this.runningTotalROIPercent += newROI - row.roi_percent;
        row.roi_percent = newROI;
      }
      
      if (patch.department !== undefined) row.department = patch.department;
      if (patch.country !== undefined) row.country = patch.country;
      if (patch.industry !== undefined) row.industry = patch.industry;
      if (patch.employee_hours_saved !== undefined) row.employee_hours_saved = parseNum(patch.employee_hours_saved);
      
      if (patch.ai_enabled !== undefined) row.ai_enabled = parseBoolean(patch.ai_enabled);
      if (patch.cloud_deployment !== undefined) row.cloud_deployment = parseBoolean(patch.cloud_deployment);

      if (patch.start_date !== undefined) row.start_date = patch.start_date;
      if (patch.completion_date !== undefined) row.completion_date = patch.completion_date;
      if (patch.budget_usd !== undefined) row.budget_usd = parseNum(patch.budget_usd);
      if (patch.implementation_partner !== undefined) row.implementation_partner = patch.implementation_partner;

      row._searchString = this.precomputeSearchString(row);
      row._lastUpdatedAt = performance.now();
    } else {
      isNew = true;
      // Initialize full Row object with strict sanitization
      row = {
        project_id: id,
        company_id: patch.company_id || '',
        project_name: patch.project_name || '',
        project_status: patch.project_status || 'Active',
        automation_type: patch.automation_type || 'RPA',
        robots_deployed: parseNum(patch.robots_deployed || 0),
        annual_savings_usd: parseNum(patch.annual_savings_usd || 0),
        roi_percent: parseFloatNum(patch.roi_percent || 0),
        department: patch.department || '',
        country: patch.country || '',
        industry: patch.industry || '',
        employee_hours_saved: parseNum(patch.employee_hours_saved || 0),
        ai_enabled: parseBoolean(patch.ai_enabled || false),
        cloud_deployment: parseBoolean(patch.cloud_deployment || false),
        start_date: patch.start_date || '',
        completion_date: patch.completion_date || '',
        budget_usd: parseNum(patch.budget_usd || 0),
        implementation_partner: patch.implementation_partner || '',
        _searchString: '',
        _lastUpdatedAt: Date.now(),
      };
      row._searchString = this.precomputeSearchString(row);

      this.store.set(id, row);
      this.insertionQueue.push(id);
      this.runningTotalProjects++;
      this.runningTotalROIPercent += row.roi_percent;

      const newStatusLower = row.project_status.toLowerCase();
      if (newStatusLower === 'critical' || newStatusLower === 'failed') {
        flashAlert = true;
      }
    }

    // Apply KPI updates (Deltas)
    const newRobots = row.robots_deployed;
    const newSavings = row.annual_savings_usd;
    const newHours = row.employee_hours_saved;
    const newAI = row.ai_enabled;
    const newCloud = row.cloud_deployment;
    const newAnomaly = this.isAnomaly(row);
    const newFailed = this.isFailedOrCritical(row.project_status);

    this.runningTotalRobots += newRobots - oldRobots;
    this.runningTotalSavingsUSD += newSavings - oldSavings;
    this.runningTotalHoursSaved += newHours - oldHours;
    this.runningAIEnabledCount += (newAI ? 1 : 0) - (oldAI ? 1 : 0);
    this.runningCloudDeploymentCount += (newCloud ? 1 : 0) - (oldCloud ? 1 : 0);
    this.runningAnomalyCount += (newAnomaly ? 1 : 0) - (oldAnomaly ? 1 : 0);
    this.runningFailedCount += (newFailed ? 1 : 0) - (oldFailed ? 1 : 0);

    // Re-insert into sorted index (always O(log N))
    this.binarySearchInsert(this.sortedIds, id, compareFn);

    // Update visibility index
    const matches = this.matchesCurrentFilters(row);
    if (matches) {
      this.binarySearchInsert(this.visibleIds, id, compareFn);
      this.visibleIdsSet.add(id);
    }

    // Check memory limit and evict if necessary
    if (isNew && this.store.size > this.maxRetainedRows) {
      this.evictOldestRow();
    }

    // Update recent anomalies tracking
    if (newAnomaly) {
      this.recentAnomalies = this.recentAnomalies.filter(r => r.project_id !== id);
      this.recentAnomalies.unshift(row);
      if (this.recentAnomalies.length > 5) {
        this.recentAnomalies.pop();
      }
    } else {
      this.recentAnomalies = this.recentAnomalies.filter(r => r.project_id !== id);
    }

    return flashAlert;
  }

  private evictOldestRow() {
    const oldestId = this.insertionQueue.shift();
    if (!oldestId) return;

    const row = this.store.get(oldestId);
    if (!row) return;

    const compareFn = this.getCompareFn();

    // Remove from sortedIds and visibleIds BEFORE deleting from store (uses binary search find)
    const idx = this.binarySearchFind(this.sortedIds, oldestId, compareFn);
    if (idx !== -1) {
      this.sortedIds.splice(idx, 1);
    }

    const visIdx = this.binarySearchFind(this.visibleIds, oldestId, compareFn);
    if (visIdx !== -1) {
      this.visibleIds.splice(visIdx, 1);
      this.visibleIdsSet.delete(oldestId);
    }

    this.recentAnomalies = this.recentAnomalies.filter(r => r.project_id !== oldestId);

    // Remove from store
    this.store.delete(oldestId);
    this.runningTotalProjects--;

    // Update KPI running counts (eviction is a removal)
    this.runningTotalRobots -= row.robots_deployed;
    this.runningTotalSavingsUSD -= row.annual_savings_usd;
    this.runningTotalHoursSaved -= row.employee_hours_saved;
    this.runningAIEnabledCount -= row.ai_enabled ? 1 : 0;
    this.runningCloudDeploymentCount -= row.cloud_deployment ? 1 : 0;
    this.runningAnomalyCount -= this.isAnomaly(row) ? 1 : 0;
    this.runningTotalROIPercent -= row.roi_percent;
    this.runningFailedCount -= this.isFailedOrCritical(row.project_status) ? 1 : 0;
  }

  public mutateRowOnly(patch: Partial<Row> & { project_id: string }): { isNew: boolean; flashAlert: boolean } {
    this.totalUpdatesProcessed++;
    const id = patch.project_id;
    let row = this.store.get(id);
    let isNew = false;
    let flashAlert = false;

    // Track pre-mutation stats to update running KPI deltas
    let oldRobots = 0;
    let oldSavings = 0;
    let oldHours = 0;
    let oldAI = false;
    let oldCloud = false;
    let oldAnomaly = false;
    let oldFailed = false;
    let oldStatus = '';

    if (row) {
      oldRobots = row.robots_deployed;
      oldSavings = row.annual_savings_usd;
      oldHours = row.employee_hours_saved;
      oldAI = row.ai_enabled;
      oldCloud = row.cloud_deployment;
      oldAnomaly = this.isAnomaly(row);
      oldFailed = this.isFailedOrCritical(row.project_status);
      oldStatus = row.project_status;

      // Mutate in place (avoid spreads!)
      if (patch.company_id !== undefined) row.company_id = patch.company_id;
      if (patch.project_name !== undefined) row.project_name = patch.project_name;
      if (patch.project_status !== undefined) {
        if (row.project_status !== patch.project_status) {
          const newStatusLower = patch.project_status.toLowerCase();
          if (newStatusLower === 'critical' || newStatusLower === 'failed') {
            flashAlert = true;
          }
        }
        row.project_status = patch.project_status;
      }
      if (patch.automation_type !== undefined) row.automation_type = patch.automation_type;
      
      // Strict castings
      if (patch.robots_deployed !== undefined) row.robots_deployed = parseNum(patch.robots_deployed);
      if (patch.annual_savings_usd !== undefined) row.annual_savings_usd = parseNum(patch.annual_savings_usd);
      if (patch.roi_percent !== undefined) {
        const newROI = parseFloatNum(patch.roi_percent);
        if (newROI < row.roi_percent - 15) {
          flashAlert = true;
        }
        this.runningTotalROIPercent += newROI - row.roi_percent;
        row.roi_percent = newROI;
      }
      
      if (patch.department !== undefined) row.department = patch.department;
      if (patch.country !== undefined) row.country = patch.country;
      if (patch.industry !== undefined) row.industry = patch.industry;
      if (patch.employee_hours_saved !== undefined) row.employee_hours_saved = parseNum(patch.employee_hours_saved);
      
      if (patch.ai_enabled !== undefined) row.ai_enabled = parseBoolean(patch.ai_enabled);
      if (patch.cloud_deployment !== undefined) row.cloud_deployment = parseBoolean(patch.cloud_deployment);

      if (patch.start_date !== undefined) row.start_date = patch.start_date;
      if (patch.completion_date !== undefined) row.completion_date = patch.completion_date;
      if (patch.budget_usd !== undefined) row.budget_usd = parseNum(patch.budget_usd);
      if (patch.implementation_partner !== undefined) row.implementation_partner = patch.implementation_partner;

      row._searchString = this.precomputeSearchString(row);
      row._lastUpdatedAt = Date.now();
    } else {
      isNew = true;
      row = {
        project_id: id,
        company_id: patch.company_id || '',
        project_name: patch.project_name || '',
        project_status: patch.project_status || 'Active',
        automation_type: patch.automation_type || 'RPA',
        robots_deployed: parseNum(patch.robots_deployed || 0),
        annual_savings_usd: parseNum(patch.annual_savings_usd || 0),
        roi_percent: parseFloatNum(patch.roi_percent || 0),
        department: patch.department || '',
        country: patch.country || '',
        industry: patch.industry || '',
        employee_hours_saved: parseNum(patch.employee_hours_saved || 0),
        ai_enabled: parseBoolean(patch.ai_enabled || false),
        cloud_deployment: parseBoolean(patch.cloud_deployment || false),
        start_date: patch.start_date || '',
        completion_date: patch.completion_date || '',
        budget_usd: parseNum(patch.budget_usd || 0),
        implementation_partner: patch.implementation_partner || '',
        _searchString: '',
        _lastUpdatedAt: Date.now(),
      };
      row._searchString = this.precomputeSearchString(row);

      this.store.set(id, row);
      this.insertionQueue.push(id);
      this.runningTotalProjects++;
      this.runningTotalROIPercent += row.roi_percent;

      const newStatusLower = row.project_status.toLowerCase();
      if (newStatusLower === 'critical' || newStatusLower === 'failed') {
        flashAlert = true;
      }
    }

    // Apply KPI updates (Deltas)
    const newRobots = row.robots_deployed;
    const newSavings = row.annual_savings_usd;
    const newHours = row.employee_hours_saved;
    const newAI = row.ai_enabled;
    const newCloud = row.cloud_deployment;
    const newAnomaly = this.isAnomaly(row);
    const newFailed = this.isFailedOrCritical(row.project_status);

    this.runningTotalRobots += newRobots - oldRobots;
    this.runningTotalSavingsUSD += newSavings - oldSavings;
    this.runningTotalHoursSaved += newHours - oldHours;
    this.runningAIEnabledCount += (newAI ? 1 : 0) - (oldAI ? 1 : 0);
    this.runningCloudDeploymentCount += (newCloud ? 1 : 0) - (oldCloud ? 1 : 0);
    this.runningAnomalyCount += (newAnomaly ? 1 : 0) - (oldAnomaly ? 1 : 0);
    this.runningFailedCount += (newFailed ? 1 : 0) - (oldFailed ? 1 : 0);

    this.runningTotalRobots += newRobots - oldRobots;
    this.runningTotalSavingsUSD += newSavings - oldSavings;
    this.runningTotalHoursSaved += newHours - oldHours;
    this.runningAIEnabledCount += (newAI ? 1 : 0) - (oldAI ? 1 : 0);
    this.runningCloudDeploymentCount += (newCloud ? 1 : 0) - (oldCloud ? 1 : 0);
    this.runningAnomalyCount += (newAnomaly ? 1 : 0) - (oldAnomaly ? 1 : 0);

    // Evict if limit exceeded
    if (isNew && this.store.size > this.maxRetainedRows) {
      this.evictOldestRow();
    }

    // Update recent anomalies tracking
    if (newAnomaly) {
      this.recentAnomalies = this.recentAnomalies.filter(r => r.project_id !== id);
      this.recentAnomalies.unshift(row);
      if (this.recentAnomalies.length > 5) {
        this.recentAnomalies.pop();
      }
    } else {
      this.recentAnomalies = this.recentAnomalies.filter(r => r.project_id !== id);
    }

    // Add recent events logs
    if (isNew) {
      this.addRecentEvent(id, 'New project created');
    } else {
      if (patch.project_status && patch.project_status.toLowerCase() === 'active' && patch.project_status !== oldStatus) {
        this.addRecentEvent(id, 'Status changed to Active');
      } else if (newAnomaly && !oldAnomaly) {
        this.addRecentEvent(id, 'Low ROI alert triggered');
      } else if (newRobots > oldRobots && oldRobots > 0) {
        this.addRecentEvent(id, 'Automation deployed');
      } else if (Math.abs(newSavings - oldSavings) > 150000 && oldSavings > 0) {
        this.addRecentEvent(id, 'ROI spike detected');
      }
    }

    return { isNew, flashAlert };
  }

  public reindexRow(id: string) {
    const row = this.store.get(id);
    if (!row) return;

    const compareFn = this.getCompareFn();

    // Remove from sortedIds and visibleIds using indexOf (row already mutated)
    const oldSortIdx = this.sortedIds.indexOf(id);
    if (oldSortIdx !== -1) {
      this.sortedIds.splice(oldSortIdx, 1);
    }

    const oldVisIdx = this.visibleIds.indexOf(id);
    if (oldVisIdx !== -1) {
      this.visibleIds.splice(oldVisIdx, 1);
      this.visibleIdsSet.delete(id);
    }

    // Insert into sorted index
    this.binarySearchInsert(this.sortedIds, id, compareFn);

    // Insert into visible index if matches filters
    if (this.matchesCurrentFilters(row)) {
      this.binarySearchInsert(this.visibleIds, id, compareFn);
      this.visibleIdsSet.add(id);
    }
  }

  // Public setter for sort criteria. Triggers complete resort (human action paced)
  public setSortCriteria(criteria: SortCriterion[]) {
    this.sortCriteria = criteria;
    this.rebuildIndexes();
    this.triggerConfigChange();
  }

  // Public setter for filters. Triggers linear re-filtration (human action paced, no sort)
  public setFilters(filters: Partial<FilterSettings>) {
    this.filterSettings = { ...this.filterSettings, ...filters };
    this.computeVisibleIds();
    this.triggerConfigChange();
  }

  // Public setter for search text. Triggers linear re-filtration (human action paced, no sort)
  public setSearchQuery(query: string) {
    this.searchQueryString = query;
    this.searchTokens = query.trim().toLowerCase().split(/\s+/).filter(t => t.length > 0);
    this.computeVisibleIds();
    this.triggerConfigChange();
  }

  // Atomic settings restoration on mount (prevents redundant intermediate sort/filter triggers)
  public restoreSettings(filters: Partial<FilterSettings>, searchQuery: string, sortCriteria: SortCriterion[]) {
    this.filterSettings = { ...this.filterSettings, ...filters };
    this.searchQueryString = searchQuery;
    this.searchTokens = searchQuery.trim().toLowerCase().split(/\s+/).filter(t => t.length > 0);
    this.sortCriteria = sortCriteria;
    this.rebuildIndexes();
    this.triggerConfigChange();
  }

  // Configuration change listeners hooks
  public subscribeConfigChange(listener: () => void): () => void {
    this.configListeners.push(listener);
    return () => {
      this.configListeners = this.configListeners.filter(l => l !== listener);
    };
  }

  private triggerConfigChange() {
    for (let l = 0; l < this.configListeners.length; l++) {
      this.configListeners[l]();
    }
  }

  // Re-derivation pipeline producing the single source of truth for visible project IDs
  public computeVisibleIds() {
    this.visibleIds = [];
    this.visibleIdsSet.clear();
    for (let i = 0; i < this.sortedIds.length; i++) {
      const id = this.sortedIds[i];
      const row = this.store.get(id);
      if (row && this.matchesCurrentFilters(row)) {
        this.visibleIds.push(id);
        this.visibleIdsSet.add(id);
      }
    }
  }

  // Complete index resort on human-paced sort configuration change
  private rebuildIndexes() {
    const compareFn = this.getCompareFn();
    this.sortedIds = Array.from(this.store.keys());
    this.sortedIds.sort(compareFn);
    this.computeVisibleIds();
  }

  // Retrieve current KPIs
  public getMetrics(ingestionRate = 0, queuedCount = 0): KPIMetrics {
    const total = this.runningTotalProjects;
    return {
      totalProjects: total,
      totalRobots: this.runningTotalRobots,
      totalSavingsUSD: this.runningTotalSavingsUSD,
      averageROI: total > 0 ? this.calculateAverageROI() : 0,
      totalHoursSaved: this.runningTotalHoursSaved,
      aiEnabledCount: this.runningAIEnabledCount,
      cloudDeploymentCount: this.runningCloudDeploymentCount,
      anomalyCount: this.runningAnomalyCount,
      ingestionRate,
      queuedCount,
    };
  }

  private calculateAverageROI(): number {
    const total = this.runningTotalProjects;
    return total > 0 ? this.runningTotalROIPercent / total : 0;
  }

  // Binary search utilities
  public binarySearchFind(
    arr: string[],
    id: string,
    compareFn: (aId: string, bId: string) => number
  ): number {
    let low = 0;
    let high = arr.length - 1;
    while (low <= high) {
      const mid = (low + high) >>> 1;
      const cmp = compareFn(id, arr[mid]);
      if (cmp < 0) {
        high = mid - 1;
      } else if (cmp > 0) {
        low = mid + 1;
      } else {
        return mid;
      }
    }
    return -1;
  }

  private binarySearchInsert(
    arr: string[],
    id: string,
    compareFn: (aId: string, bId: string) => number
  ): number {
    let low = 0;
    let high = arr.length - 1;
    while (low <= high) {
      const mid = (low + high) >>> 1;
      const cmp = compareFn(id, arr[mid]);
      if (cmp < 0) {
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }
    arr.splice(low, 0, id);
    return low;
  }

  public addRecentEvent(projectId: string, desc: string) {
    if (this.recentEvents.length > 0 && this.recentEvents[0].project_id === projectId && this.recentEvents[0].desc === desc) {
      return;
    }
    this.recentEvents.unshift({
      project_id: projectId,
      timestamp: Date.now(),
      desc,
    });
    if (this.recentEvents.length > 5) {
      this.recentEvents.pop();
    }
  }
}
