export interface Row {
  project_id: string;
  company_id: string;
  project_name: string;
  project_status: string; // e.g. 'Active', 'Under Review', 'Failed', 'Paused'
  automation_type: string; // e.g. 'RPA', 'NLP', 'OCR', 'Chatbot'
  robots_deployed: number;
  annual_savings_usd: number;
  roi_percent: number;
  department: string;
  country: string;
  industry: string;
  employee_hours_saved: number;
  ai_enabled: boolean;
  cloud_deployment: boolean;

  start_date: string;
  completion_date: string;
  budget_usd: number;
  implementation_partner: string;

  // Metadata for performance optimization
  _searchString: string; // Precomputed lowercase search index
  _lastUpdatedAt: number; // Ingestion timestamp
}

export type SortDirection = 'asc' | 'desc';

export interface SortCriterion {
  field: keyof Row;
  direction: SortDirection;
}

export interface FilterSettings {
  project_status: string;
  automation_type: string;
  department: string;
  industry: string;
  country: string;
  ai_enabled: string; // 'all' | 'true' | 'false'
  cloud_deployment: string; // 'all' | 'true' | 'false'
}

export interface KPIMetrics {
  totalProjects: number;
  totalRobots: number;
  totalSavingsUSD: number;
  averageROI: number;
  totalHoursSaved: number;
  aiEnabledCount: number;
  cloudDeploymentCount: number;
  anomalyCount: number; // e.g., low ROI or Failed status
  ingestionRate: number; // updates/sec
  queuedCount: number; // Pause queue buffer size
}

export interface EngineEventMap {
  'data-update': {
    visibleCount: number;
    metrics: KPIMetrics;
  };
  'pause-change': {
    isPaused: boolean;
  };
}

export type EngineListener<T> = (data: T) => void;
