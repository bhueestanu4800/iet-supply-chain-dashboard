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