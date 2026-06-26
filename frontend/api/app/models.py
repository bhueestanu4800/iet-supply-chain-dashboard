from pydantic import BaseModel, Field

class SimulationPayload(BaseModel):
    supplier_delay: int = Field(
        default=0,
        ge=0,
        le=100,
        description="Average delay in supplier dispatch in days"
    )
    port_congestion: int = Field(
        default=0,
        ge=0,
        le=100,
        description="Average port holding delay in days"
    )
    demand_increase: float = Field(
        default=0.0,
        ge=0.0,
        le=2.0,
        description="Percentage increase in customer demand (e.g., 0.15 = 15% increase)"
    )
    material_shortage: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Raw material shortage index (0.0 = no shortage, 1.0 = severe shortage)"
    )
    weather_impact: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Weather risk severity index (0.0 = clear, 1.0 = severe disruptions)"
    )
    geopolitical_risk: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Geopolitical instability risk index (0.0 = stable, 1.0 = severe embargo/tensions)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "supplier_delay": 5,
                "port_congestion": 3,
                "demand_increase": 0.20,
                "material_shortage": 0.10,
                "weather_impact": 0.0,
                "geopolitical_risk": 0.05
            }
        }
