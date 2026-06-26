export interface Supplier {
  supplier_id: string;
  name: string;
  country: string;
  category: string;
  base_lead_time_days: number;
  historic_defect_rate: number;
  spend_usd: number;
  risk_score: number;
}

export interface ComponentCategoryData {
  supplier_count: number;
  total_spend_usd: number;
  inventory_value_usd: number;
  localized_risk_weight: number;
  growth_rate_pct: number;
  forecast_demand_trajectory: number[];
}

export interface ComponentMatrix {
  [category: string]: ComponentCategoryData;
}

export interface CommodityPriceRecord {
  month: string; // Format YYYY-MM-DD
  commodity: string;
  price_usd: number;
}

export interface CommodityData {
  current_price_usd: number;
  delta_30d_pct: number;
  delta_90d_pct: number;
  history: CommodityPriceRecord[];
}

export interface CommodityMatrix {
  [commodity: string]: CommodityData;
}

export interface SimulationPayload {
  supplier_delay: number;
  port_congestion: number;
  demand_increase: number; // Decimal (e.g. 0.15 = 15% increase)
  material_shortage: number; // Decimal
  weather_impact: number; // Decimal
  geopolitical_risk: number; // Decimal
}

export interface SimulationResults {
  forecasted_otif_pct: number;
  production_delays_days: number;
  inventory_impact_ratio: number;
  revenue_risk_usd: number;
  open_po_pool_value_usd: number;
}

export interface OperationalAlert {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  category: string;
  message: string;
}

export interface ExecutiveSummary {
  total_active_suppliers: number;
  spend_sums_usd: number;
  weighted_average_lead_time_days: number;
  system_wide_otif_pct: number;
  critical_suppliers_count: number;
  operational_threshold_alerts: OperationalAlert[];
}

export interface AIInsight {
  id: string;
  type: 'CONCENTRATION_RISK' | 'MONOPOLY_RISK' | 'LEAD_TIME_OUTLIER' | 'DEFECT_RATE_OUTLIER' | string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  anomaly: string;
  recommendation: string;
}

export interface AIInsightsResponse {
  insights_count: number;
  insights: AIInsight[];
}
