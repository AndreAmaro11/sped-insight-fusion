export interface FinancialIndicator {
  id: string;
  name: string;
  slug: string;
  description?: string;
  display_order: number;
  enabled: boolean;
  client_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ReportFilters {
  fiscalYear?: number;
  companyId?: string;
  groupId?: string;
  branchId?: string;
  cnpj?: string;
}

export interface ReportContextType {
  filters: ReportFilters;
  setFilters: (filters: ReportFilters) => void;
  indicators: FinancialIndicator[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export interface KPI {
  id: string;
  name: string;
  value: number;
  previousValue?: number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  format?: 'currency' | 'percentage' | 'number';
}

export interface IndicatorData {
  kpis: KPI[];
  chartData?: any[];
  tableData?: any[];
  lastUpdated: string;
}