import numpy as np
from typing import List
from .models import ForecastingRequest, ForecastingResponse, ForecastDataPoint

def run_periodontal_forecast(req: ForecastingRequest) -> ForecastingResponse:
    """
    Simulates:
    1. Random Forest classification of periodontal risk.
    2. LSTM sequence modeling for 6-month and 12-month bone and attachment loss.
    """
    # -------------------------------------------------------------
    # 1. RISK ASSESSMENT (Simulated Random Forest Classifier)
    # -------------------------------------------------------------
    # Compute relative risk contribution of each factor
    smoking_weight = 0.35 if req.smoking else 0.0
    
    # Diabetes severity scale
    diab_severity = max(0.0, (req.hba1c - 5.5) / 5.0) if req.diabetes else 0.0
    diab_weight = min(0.35, diab_severity * 0.35)
    
    # Plaque index weight (0 to 100% scale)
    plaque_weight = min(0.18, (req.plaque_index / 100.0) * 0.18)
    
    # Bleeding on Probing weight (0 to 100% scale)
    bop_weight = min(0.12, (req.bleeding_on_probing / 100.0) * 0.12)
    
    # Sum standard baseline risk (0.05 min risk for background age-related wear)
    risk_score = 0.05 + smoking_weight + diab_weight + plaque_weight + bop_weight
    
    # Bounded between 0.0 and 1.0
    risk_probability = float(np.clip(risk_score, 0.05, 0.98))
    
    # Classify category
    if risk_probability >= 0.45:
        risk_category = "Progressing"
    else:
        risk_category = "Stable"
        
    # -------------------------------------------------------------
    # 2. TRAJECTORY FORECAST (Simulated LSTM Time-series Model)
    # -------------------------------------------------------------
    # Bone loss rates (mm/month)
    # Base rate of wear: 0.002 mm/month
    base_rate_bone = 0.002
    rate_bone = (
        base_rate_bone
        + (0.022 if req.smoking else 0.0)
        + (0.015 * (req.hba1c - 5.0) / 4.0 if req.diabetes and req.hba1c > 5.0 else 0.0)
        + (0.018 * (req.plaque_index / 100.0))
        + (0.012 * (req.bleeding_on_probing / 100.0))
    )
    
    # Attachment loss rates (mm/month) - typically progresses slightly faster than bone loss
    base_rate_attach = 0.003
    rate_attach = (
        base_rate_attach
        + (0.028 if req.smoking else 0.0)
        + (0.018 * (req.hba1c - 5.0) / 4.0 if req.diabetes and req.hba1c > 5.0 else 0.0)
        + (0.024 * (req.plaque_index / 100.0))
        + (0.016 * (req.bleeding_on_probing / 100.0))
    )
    
    # Project forward for Month 0, 6, and 12 with a slight non-linear LSTM acceleration curve
    trajectory = []
    for month in [0, 6, 12]:
        if month == 0:
            bone_val = req.current_bone_loss
            attach_val = req.current_attachment_loss
        else:
            # Model non-linear progression by incorporating risk probability as acceleration factor
            acceleration = 1.0 + (risk_probability * 0.25 * (month / 12.0))
            bone_val = req.current_bone_loss + (rate_bone * month * acceleration)
            attach_val = req.current_attachment_loss + (rate_attach * month * acceleration)
        
        trajectory.append(
            ForecastDataPoint(
                month=month,
                bone_loss=round(float(bone_val), 2),
                attachment_loss=round(float(attach_val), 2)
            )
        )
        
    return ForecastingResponse(
        risk_category=risk_category,
        risk_probability=round(risk_probability, 3),
        trajectory=trajectory
    )
