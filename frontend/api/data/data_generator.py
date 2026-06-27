import os
import datetime
import numpy as np
import pandas as pd

def generate_data():
    # Set random seed for reproducibility
    np.random.seed(42)
    
    # 12 core global countries with country risk coefficient (0-100) and logistics overhead (0-100)
    country_profiles = {
        "USA": {"risk": 15, "logistics": 20},
        "Germany": {"risk": 18, "logistics": 22},
        "UAE": {"risk": 30, "logistics": 35},
        "Saudi Arabia": {"risk": 35, "logistics": 40},
        "India": {"risk": 45, "logistics": 45},
        "China": {"risk": 55, "logistics": 35},
        "Japan": {"risk": 15, "logistics": 25},
        "South Korea": {"risk": 20, "logistics": 28},
        "Singapore": {"risk": 12, "logistics": 15},
        "United Kingdom": {"risk": 15, "logistics": 20},
        "Canada": {"risk": 14, "logistics": 22},
        "Brazil": {"risk": 60, "logistics": 65}
    }
    countries = list(country_profiles.keys())

    # 10 key component categories and material exposure (0-100)
    category_exposure = {
        "Power Electronics": 85,
        "Control Valves": 60,
        "PLC Systems": 80,
        "Gas Turbine Parts": 90,
        "Industrial Semiconductors": 95,
        "Heavy Castings": 50,
        "High-Pressure Piping": 40,
        "Electrical Switchgear": 70,
        "Cryogenic Pumps": 65,
        "SCADA Hardware": 75
    }
    categories = list(category_exposure.keys())

    # Deterministic supplier names elements
    prefixes = ["Apex", "Titan", "Vertex", "Nova", "Precision", "Advanced", "Alliance", "Pacific", "Dynamic", "Matrix", "Summit", "Vector", "Omega", "Alpha", "Genesis", "Aero", "Thermal", "Quantum", "Nexus", "Infiniti"]
    suffixes = ["Systems", "Controls", "Dynamics", "Valves", "Piping", "Switchgear", "Pumps", "Industries", "Solutions", "Engineering", "Manufacturing", "Tech", "Energy", "Flow", "Power", "Grid", "Foundry", "Semiconductors", "Instruments", "Components"]

    # 1. Generate Suppliers (100 suppliers)
    suppliers_list = []
    for i in range(1, 101):
        supplier_id = f"SUP{i:03d}"
        
        # Unique deterministic name from prefixes and suffixes
        name = f"{prefixes[(i-1) % len(prefixes)]} {suffixes[((i-1) // 5) % len(suffixes)]} " + ("Ltd" if i % 3 == 0 else "Inc." if i % 3 == 1 else "Corp.")
        
        # Deterministic choice of country and category
        country = np.random.choice(countries)
        category = np.random.choice(categories)
        
        # Latent quality factor (higher = worse performance, higher risk)
        # We blend uniform random draw with country risk to model vulnerable nodes
        c_risk_norm = country_profiles[country]["risk"] / 100.0
        u = np.random.uniform(0.0, 1.0)
        z = 0.7 * u + 0.3 * c_risk_norm # z ranges from ~0 to ~1
        
        # Base lead time: right skewed distribution, range 10 to 180 days
        base_lead_time_days = int(10 + 170 * (z ** 1.5))
        
        # Historic defect rate: right skewed distribution, range 0.1% to 5.0%
        historic_defect_rate = float(0.001 + 0.049 * (z ** 2.0))
        
        # Spend USD: Log-uniform distribution to mimic realistic enterprise tiers
        spend_usd = float(np.round(np.exp(np.random.uniform(np.log(50000), np.log(3000000))), -2))
        
        # Normalize fields to 0-100 scale for composite risk model
        lead_time_metric = (base_lead_time_days - 10) / (180 - 10) * 100.0
        defect_target_scale = (historic_defect_rate - 0.001) / (0.05 - 0.001) * 100.0
        country_risk_coef = country_profiles[country]["risk"]
        material_exposure = category_exposure[category]
        logistics_overhead = country_profiles[country]["logistics"]
        
        # Composite risk model calculation: Risk = 0.30*LT + 0.20*Defect + 0.20*Country + 0.15*Material + 0.15*Logistics
        risk_score = (
            (0.30 * lead_time_metric) + 
            (0.20 * defect_target_scale) + 
            (0.20 * country_risk_coef) + 
            (0.15 * material_exposure) + 
            (0.15 * logistics_overhead)
        )
        risk_score = float(np.round(risk_score, 2))
        
        suppliers_list.append({
            "supplier_id": supplier_id,
            "name": name,
            "country": country,
            "category": category,
            "base_lead_time_days": base_lead_time_days,
            "historic_defect_rate": historic_defect_rate,
            "spend_usd": spend_usd,
            "risk_score": risk_score
        })
        
    df_suppliers = pd.DataFrame(suppliers_list)
    
    # 2. Generate Commodity Prices (24 months)
    # Monthly tracking over 24 months ending at 2026-06 (2024-07-01 to 2026-06-01)
    months = pd.date_range(start="2024-07-01", end="2026-06-01", freq="MS")
    
    # Initial prices in USD per metric ton (or relative index value)
    commodities_init = {
        "Copper": 8500.0,
        "Nickel": 17500.0,
        "Aluminum": 2200.0,
        "Steel": 750.0,
        "Rare Earth Metals": 140000.0,
        "Lithium": 13500.0
    }
    
    # Define upward stochastic drift (drift) and volatility (vol)
    # Spikes simulate heavy infrastructure/AI data center demand
    commodities_params = {
        "Copper": {"drift": 0.015, "vol": 0.04},
        "Nickel": {"drift": 0.008, "vol": 0.06},
        "Aluminum": {"drift": 0.005, "vol": 0.03},
        "Steel": {"drift": 0.003, "vol": 0.02},
        "Rare Earth Metals": {"drift": 0.022, "vol": 0.07},
        "Lithium": {"drift": 0.028, "vol": 0.09}
    }
    
    commodity_data = []
    for comm, init_price in commodities_init.items():
        params = commodities_params[comm]
        mu = params["drift"]
        sigma = params["vol"]
        
        current_price = init_price
        for month in months:
            # Geometric Brownian Motion step
            z_t = np.random.normal(0, 1)
            step = np.exp((mu - 0.5 * (sigma ** 2)) + sigma * z_t)
            current_price = current_price * step
            
            commodity_data.append({
                "month": month.strftime("%Y-%m-%d"),
                "commodity": comm,
                "price_usd": float(np.round(current_price, 2))
            })
            
    df_commodity = pd.DataFrame(commodity_data)
    
    # 3. Generate Purchase Orders (1000 POs)
    po_list = []
    start_date = datetime.date(2024, 7, 1)
    end_date = datetime.date(2026, 6, 26) # Reference Date from runtime metadata
    days_range = (end_date - start_date).days
    
    # Weight probability of ordering from each supplier based on their spend
    spend_sums = df_suppliers["spend_usd"].sum()
    supplier_probs = df_suppliers["spend_usd"].values / spend_sums
    
    for po_idx in range(1, 1001):
        po_number = f"PO{10000 + po_idx}"
        
        # Sample supplier weighted by spend
        supp_row = df_suppliers.iloc[np.random.choice(len(df_suppliers), p=supplier_probs)]
        supplier_id = supp_row["supplier_id"]
        
        # Purchase order value based on supplier typical PO size (approx spend / 10 POs)
        base_po_val = supp_row["spend_usd"] / 10.0
        po_value = float(np.round(base_po_val * np.random.uniform(0.6, 1.4), 2))
        po_value = max(po_value, 500.0) # Establish floor value
        
        # Random order date within past 24 months
        order_days_offset = np.random.randint(0, days_range + 1)
        order_date = start_date + datetime.timedelta(days=order_days_offset)
        
        # Actual lead time has logistics variance driven by the supplier's risk score
        lead_time_variance = 1.0 + (supp_row["risk_score"] / 200.0) * np.random.uniform(-0.2, 0.4)
        actual_lead_time_days = int(np.round(supp_row["base_lead_time_days"] * lead_time_variance))
        actual_lead_time_days = max(actual_lead_time_days, 1)
        
        delivery_date = order_date + datetime.timedelta(days=actual_lead_time_days)
        
        # Determine status: "Open" if delivery date is after current date (2026-06-26)
        if delivery_date > end_date:
            status = "Open"
        else:
            status = "Delivered"
            
        # Determine OTIF status strictly mapped to performance limits
        # OTIF probability: base 0.98, decremented by defect rate and risk score
        otif_prob = 0.98 - (supp_row["historic_defect_rate"] * 2.5) - (supp_row["risk_score"] / 400.0)
        otif_prob = max(0.40, min(0.99, otif_prob)) # Clamp between 40% and 99%
        
        if status == "Delivered":
            # If actual lead time exceeded base lead time by a threshold, it's late (OTIF = 0)
            if actual_lead_time_days > supp_row["base_lead_time_days"] * 1.15:
                otif_status = 0
            else:
                otif_status = 1 if np.random.rand() < otif_prob else 0
        else:
            # For Open POs, it's not yet delivered, so otif_status is predicted based on performance limits
            otif_status = 1 if np.random.rand() < otif_prob else 0
            
        po_list.append({
            "po_number": po_number,
            "supplier_id": supplier_id,
            "value_usd": po_value,
            "status": status,
            "order_date": order_date.strftime("%Y-%m-%d"),
            "otif_status": otif_status
        })
        
    df_po = pd.DataFrame(po_list)
    
    # Save CSV files into data/
    os.makedirs("data", exist_ok=True)
    df_suppliers.to_csv("data/suppliers.csv", index=False)
    df_commodity.to_csv("data/commodity_prices.csv", index=False)
    df_po.to_csv("data/purchase_orders.csv", index=False)
    
    print("Successfully generated datasets:")
    print(f"  - data/suppliers.csv: {len(df_suppliers)} rows")
    print(f"  - data/commodity_prices.csv: {len(df_commodity)} rows")
    print(f"  - data/purchase_orders.csv: {len(df_po)} rows")
    
    # Run sanity checks
    corr_lt = df_suppliers["risk_score"].corr(df_suppliers["base_lead_time_days"])
    corr_df = df_suppliers["risk_score"].corr(df_suppliers["historic_defect_rate"])
    print(f"  - Correlation: Risk Score & Base Lead Time: {corr_lt:.4f}")
    print(f"  - Correlation: Risk Score & Historic Defect Rate: {corr_df:.4f}")
    
    median_risk = df_suppliers["risk_score"].median()
    low_risk_sups = df_suppliers[df_suppliers["risk_score"] <= median_risk]["supplier_id"]
    high_risk_sups = df_suppliers[df_suppliers["risk_score"] > median_risk]["supplier_id"]
    otif_low = df_po[df_po["supplier_id"].isin(low_risk_sups)]["otif_status"].mean()
    otif_high = df_po[df_po["supplier_id"].isin(high_risk_sups)]["otif_status"].mean()
    print(f"  - OTIF Rate for Low-Risk Suppliers (Risk <= {median_risk:.1f}): {otif_low:.2%}")
    print(f"  - OTIF Rate for High-Risk Suppliers (Risk > {median_risk:.1f}): {otif_high:.2%}")

if __name__ == "__main__":
    generate_data()
