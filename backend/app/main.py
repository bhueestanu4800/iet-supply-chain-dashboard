import os
import numpy as np
import pandas as pd
from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from backend.app.models import SimulationPayload

app = FastAPI(
    title="IET Supply Chain Risk Intelligence API",
    description="Enterprise API supporting heavy industrial engineering and energy procurement constraints.",
    version="1.0.0"
)

# Robust CORS Configuration to allow local development dashboard integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths relative to this file
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SUPPLIERS_PATH = os.path.join(BASE_DIR, "data", "suppliers.csv")
COMMODITIES_PATH = os.path.join(BASE_DIR, "data", "commodity_prices.csv")
ORDERS_PATH = os.path.join(BASE_DIR, "data", "purchase_orders.csv")

def load_suppliers() -> pd.DataFrame:
    if not os.path.exists(SUPPLIERS_PATH):
        raise HTTPException(status_code=500, detail=f"Suppliers dataset not found at {SUPPLIERS_PATH}")
    return pd.read_csv(SUPPLIERS_PATH)

def load_commodities() -> pd.DataFrame:
    if not os.path.exists(COMMODITIES_PATH):
        raise HTTPException(status_code=500, detail=f"Commodities dataset not found at {COMMODITIES_PATH}")
    return pd.read_csv(COMMODITIES_PATH)

def load_orders() -> pd.DataFrame:
    if not os.path.exists(ORDERS_PATH):
        raise HTTPException(status_code=500, detail=f"Purchase orders dataset not found at {ORDERS_PATH}")
    return pd.read_csv(ORDERS_PATH)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "IET Supply Chain Risk Intelligence Backend",
        "documentation": "/docs"
    }

@app.get("/api/v1/executive/summary")
def get_executive_summary():
    df_suppliers = load_suppliers()
    df_po = load_orders()

    total_suppliers = int(df_suppliers["supplier_id"].nunique())
    spend_sums = float(df_suppliers["spend_usd"].sum())
    
    # Weighted average lead time by supplier spend
    total_spend = df_suppliers["spend_usd"].sum()
    if total_spend > 0:
        weighted_avg_lt = float((df_suppliers["base_lead_time_days"] * df_suppliers["spend_usd"]).sum() / total_spend)
    else:
        weighted_avg_lt = 0.0

    # System wide OTIF (for delivered POs)
    delivered_pos = df_po[df_po["status"] == "Delivered"]
    if len(delivered_pos) > 0:
        system_wide_otif = float(delivered_pos["otif_status"].mean() * 100.0)
    else:
        system_wide_otif = 0.0

    critical_count = int((df_suppliers["risk_score"] > 65).sum())

    # Build structured operational thresholds and alerts
    alerts = []
    
    if critical_count > 0:
        alerts.append({
            "id": "ALT-001",
            "severity": "CRITICAL",
            "category": "Supplier Risk",
            "message": f"Critical Exposure: {critical_count} key suppliers exceed risk score threshold of 65."
        })
        
    if system_wide_otif < 85.0:
        alerts.append({
            "id": "ALT-002",
            "severity": "WARNING",
            "category": "Delivery Performance",
            "message": f"System-Wide OTIF levels have fallen below target to {system_wide_otif:.1f}%."
        })
        
    # Check for semiconductor lead times specifically
    semi_sups = df_suppliers[df_suppliers["category"] == "Industrial Semiconductors"]
    if len(semi_sups) > 0 and semi_sups["base_lead_time_days"].mean() > 120:
        alerts.append({
            "id": "ALT-003",
            "severity": "WARNING",
            "category": "Lead Time Degradation",
            "message": f"Industrial Semiconductors are showing severe supply latency (Average: {semi_sups['base_lead_time_days'].mean():.1f} days)."
        })

    alerts.append({
        "id": "ALT-004",
        "severity": "INFO",
        "category": "Market Intelligence",
        "message": "Lithium and Copper spot prices exhibit high upward drift due to heavy datacenter infrastructure grids."
    })

    return {
        "total_active_suppliers": total_suppliers,
        "spend_sums_usd": round(spend_sums, 2),
        "weighted_average_lead_time_days": round(weighted_avg_lt, 1),
        "system_wide_otif_pct": round(system_wide_otif, 2),
        "critical_suppliers_count": critical_count,
        "operational_threshold_alerts": alerts
    }

@app.get("/api/v1/suppliers")
def get_suppliers():
    df_suppliers = load_suppliers()
    # Handle NaN values to prevent JSON parsing errors
    df_clean = df_suppliers.where(pd.notnull(df_suppliers), None)
    return df_clean.to_dict(orient="records")

@app.get("/api/v1/components")
def get_components():
    df_suppliers = load_suppliers()
    
    # Define growth rates for forecasting demand trajectories
    category_growth_rates = {
        "Power Electronics": 8.5,
        "Control Valves": 3.2,
        "PLC Systems": 5.0,
        "Gas Turbine Parts": 2.1,
        "Industrial Semiconductors": 12.4,
        "Heavy Castings": 1.5,
        "High-Pressure Piping": 1.8,
        "Electrical Switchgear": 4.0,
        "Cryogenic Pumps": 2.5,
        "SCADA Hardware": 6.0
    }

    result = {}
    grouped = df_suppliers.groupby("category")
    
    for category, group in grouped:
        total_category_spend = float(group["spend_usd"].sum())
        supplier_count = int(group["supplier_id"].nunique())
        
        # Calculate local weighted risk average based on spend
        if total_category_spend > 0:
            weighted_risk = float((group["risk_score"] * group["spend_usd"]).sum() / total_category_spend)
        else:
            weighted_risk = float(group["risk_score"].mean())

        # Inventory value modeled at 15% of annual category spend
        inventory_value = total_category_spend * 0.15
        
        # Projected demand trajectory for next 6 months
        growth_rate = category_growth_rates.get(category, 3.0)
        base_monthly = total_category_spend / 24.0 # Estimate monthly demand
        
        trajectory = []
        for m in range(1, 7):
            projected = base_monthly * (1.0 + (growth_rate / 100.0) * (m / 12.0))
            trajectory.append(float(np.round(projected, 2)))
            
        result[category] = {
            "supplier_count": supplier_count,
            "total_spend_usd": round(total_category_spend, 2),
            "inventory_value_usd": round(inventory_value, 2),
            "localized_risk_weight": round(weighted_risk, 2),
            "growth_rate_pct": growth_rate,
            "forecast_demand_trajectory": trajectory
        }
        
    return result

@app.get("/api/v1/commodities/trends")
def get_commodity_trends():
    df_comm = load_commodities()
    
    result = {}
    grouped = df_comm.groupby("commodity")
    
    for comm, group in grouped:
        sorted_group = group.sort_values("month")
        history = sorted_group.to_dict(orient="records")
        
        # 30-day and 90-day spot market price delta changes
        # Indices: -1 is latest, -2 is 1 month ago, -4 is 3 months ago
        latest_val = sorted_group.iloc[-1]["price_usd"]
        
        if len(sorted_group) >= 2:
            prev_30d = sorted_group.iloc[-2]["price_usd"]
            delta_30d_pct = float((latest_val - prev_30d) / prev_30d * 100.0)
        else:
            delta_30d_pct = 0.0
            
        if len(sorted_group) >= 4:
            prev_90d = sorted_group.iloc[-4]["price_usd"]
            delta_90d_pct = float((latest_val - prev_90d) / prev_90d * 100.0)
        else:
            delta_90d_pct = 0.0
            
        result[comm] = {
            "current_price_usd": float(np.round(latest_val, 2)),
            "delta_30d_pct": float(np.round(delta_30d_pct, 2)),
            "delta_90d_pct": float(np.round(delta_90d_pct, 2)),
            "history": history
        }
        
    return result

@app.post("/api/v1/simulator/evaluate")
def evaluate_stress_simulation(payload: SimulationPayload):
    df_suppliers = load_suppliers()
    df_po = load_orders()
    
    # Calculate base system OTIF rate for delivered orders
    delivered_pos = df_po[df_po["status"] == "Delivered"]
    base_otif = float(delivered_pos["otif_status"].mean() * 100.0) if len(delivered_pos) > 0 else 85.0
    
    # 1. Calculate OTIF penalty deduction
    # Delays and shortages degrade reliability
    otif_penalty = (
        (payload.supplier_delay * 0.35) + 
        (payload.port_congestion * 0.45) + 
        (payload.material_shortage * 12.0) + 
        (payload.weather_impact * 8.0) + 
        (payload.geopolitical_risk * 10.0)
    )
    forecasted_otif = max(30.0, min(100.0, base_otif - otif_penalty))
    
    # 2. Production delays (days)
    production_delays = (
        payload.supplier_delay + 
        payload.port_congestion + 
        (payload.material_shortage * 22.0) + 
        (payload.weather_impact * 6.5) + 
        (payload.geopolitical_risk * 10.5)
    )
    
    # 3. Inventory impact ratio
    # Base is 1.0. Demands drain stock, shortages and delays choke refill.
    demand_drain = payload.demand_increase * 0.40
    shortage_choke = payload.material_shortage * 0.50
    delay_choke = (payload.supplier_delay + payload.port_congestion) * 0.012
    inventory_impact_ratio = max(0.05, min(1.5, 1.0 - (demand_drain + shortage_choke + delay_choke)))
    
    # 4. Financial risk (USD) against open purchase orders
    open_pos = df_po[df_po["status"] == "Open"]
    total_open_value = float(open_pos["value_usd"].sum())
    
    # Compound risk factor score
    risk_factor = (
        (payload.supplier_delay / 30.0 * 0.20) + 
        (payload.port_congestion / 15.0 * 0.15) + 
        (payload.demand_increase * 0.10) + 
        (payload.material_shortage * 0.25) + 
        (payload.weather_impact * 0.15) + 
        (payload.geopolitical_risk * 0.15)
    )
    risk_factor = max(0.0, min(1.0, risk_factor))
    revenue_risk = total_open_value * risk_factor
    
    return {
        "forecasted_otif_pct": float(np.round(forecasted_otif, 2)),
        "production_delays_days": float(np.round(production_delays, 1)),
        "inventory_impact_ratio": float(np.round(inventory_impact_ratio, 2)),
        "revenue_risk_usd": float(np.round(revenue_risk, 2)),
        "open_po_pool_value_usd": float(np.round(total_open_value, 2))
    }

@app.get("/api/v1/ai-insights")
def get_ai_insights():
    df_suppliers = load_suppliers()
    
    insights = []
    
    # 1. Geographic Concentration Risk
    total_spend = df_suppliers["spend_usd"].sum()
    if total_spend > 0:
        spend_by_country = df_suppliers.groupby("country")["spend_usd"].sum()
        shares = (spend_by_country / total_spend) * 100.0
        
        for country, share in shares.items():
            if share > 25.0:
                insights.append({
                    "id": "INS-GEO-001",
                    "type": "CONCENTRATION_RISK",
                    "severity": "CRITICAL" if share > 35.0 else "WARNING",
                    "anomaly": f"Geographic concentration in {country}: controls {share:.1f}% of total supply chain spend.",
                    "recommendation": f"Diversify parts sourcing from alternative logistics nodes to insulate operations from regional shocks."
                })

    # 2. Supplier Category Monopoly Risk
    for category, group in df_suppliers.groupby("category"):
        cat_spend = group["spend_usd"].sum()
        if cat_spend > 0:
            for _, row in group.iterrows():
                share = (row["spend_usd"] / cat_spend) * 100.0
                if share > 50.0:
                    insights.append({
                        "id": f"INS-MON-{row['supplier_id']}",
                        "type": "MONOPOLY_RISK",
                        "severity": "WARNING",
                        "anomaly": f"Single point of failure in {category}: {row['name']} represents {share:.1f}% of procurement spend.",
                        "recommendation": f"Qualify secondary supplier channels for {category} to build resiliency against single-firm disruptions."
                    })

    # 3. Macro Lead Time Outliers (> 1.5 standard deviations above category average)
    for category, group in df_suppliers.groupby("category"):
        mean_lt = group["base_lead_time_days"].mean()
        std_lt = group["base_lead_time_days"].std()
        
        # Handle case with low variance or single element
        if pd.notnull(std_lt) and std_lt > 0:
            outliers = group[group["base_lead_time_days"] > (mean_lt + 1.5 * std_lt)]
            for _, row in outliers.iterrows():
                insights.append({
                    "id": f"INS-LTO-{row['supplier_id']}",
                    "type": "LEAD_TIME_OUTLIER",
                    "severity": "WARNING",
                    "anomaly": f"Lead-time outlier: {row['name']} in {category} has lead-time of {row['base_lead_time_days']} days (Category avg: {mean_lt:.1f} days).",
                    "recommendation": f"Investigate logistical capacity constraints at {row['name']} or re-route orders to lower-risk suppliers."
                })

    # 4. Defect Rate Outliers (> 1.5 standard deviations above category average)
    for category, group in df_suppliers.groupby("category"):
        mean_df = group["historic_defect_rate"].mean()
        std_df = group["historic_defect_rate"].std()
        
        if pd.notnull(std_df) and std_df > 0:
            outliers = group[group["historic_defect_rate"] > (mean_df + 1.5 * std_df)]
            for _, row in outliers.iterrows():
                insights.append({
                    "id": f"INS-DFO-{row['supplier_id']}",
                    "type": "DEFECT_RATE_OUTLIER",
                    "severity": "CRITICAL" if row["historic_defect_rate"] > 0.04 else "WARNING",
                    "anomaly": f"Defect rate outlier: {row['name']} in {category} reports historic defect rate of {row['historic_defect_rate']:.2%} (Category avg: {mean_df:.2%}).",
                    "recommendation": f"Initiate immediate engineering quality audits or implement a CAP (Corrective Action Plan) for {row['name']}."
                })

    return {
        "insights_count": len(insights),
        "insights": insights
    }
