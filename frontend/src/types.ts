// Explicit typing specifications for the IET Simulator Engine
export interface SimulationPayload {
  supplier_delay: number;
  port_congestion: number;
  demand_increase: number;
  material_shortage: number;
  weather_impact: number;
  geopolitical_risk: number;
}

export interface SimulationResults {
  forecasted_otif_pct: number;
  production_delays_days: number;
  inventory_impact_pct: number;
  revenue_risk_usd: number;
  open_po_pool_value_usd: number;
}

// Global Commodity Intelligence mappings
export interface CommodityHistoryItem {
  month: string;
  commodity: string;
  price_usd: number;
}

export interface CommodityMetrics {
  current_price_usd: number;
  delta_30d_pct: number;
  delta_90d_pct: number;
  history: CommodityHistoryItem[];
}

export interface CommodityMatrix {
  [key: string]: CommodityMetrics;
}

// Executive Alert and Telemetry payload mappings
export interface AlertItem {
  id: number;
  severity: string;
  message: string;
  timestamp: string;
}

export interface ExecutiveSummary {
  total_active_suppliers: number;
  critical_suppliers: number;
  average_lead_time_days: number;
  global_otif_percentage: number;
  procurement_spend_usd: number;
  composite_risk_score: number;
  co2_footprint_estimate_mt: number;
  open_purchase_orders: number;
  recent_alerts: AlertItem[];
}

export interface AIInsightsResponse {
  id: string;
  type: string;
  text: string;
  action: string;
}

// Component Matrix tracking structural map
export interface ComponentMetricItem {
  component: string;
  inventory_on_hand: number;
  average_lead_time_days: number;
  current_demand: number;
  forecast_demand: number;
  aggregate_risk: number;
  supplier_count: number;
}

export type ComponentMatrix = ComponentMetricItem[];