from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime

# -------------------------------------------------------------
# USER AUTHENTICATION SCHEMAS
# -------------------------------------------------------------
class UserSignup(BaseModel):
    email: EmailStr = Field(..., example="doctor@periotwin.com")
    password: str = Field(..., min_length=6, example="securePassword123")
    name: str = Field(..., example="Dr. Sarah Green")

class UserLogin(BaseModel):
    email: EmailStr = Field(..., example="doctor@periotwin.com")
    password: str = Field(..., example="securePassword123")

class UserResponse(BaseModel):
    id: str = Field(..., alias="_id")
    email: EmailStr
    name: str
    created_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, example="Dr. Sarah Green")
    email: Optional[EmailStr] = Field(None, example="doctor@periotwin.com")
    password: Optional[str] = Field(None, min_length=6, example="newSecurePassword123")

# -------------------------------------------------------------
# CLINICAL PERIODONTITIS DATA SCHEMAS
# -------------------------------------------------------------
class ClinicalRecord(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    smoking: bool = Field(..., description="Whether the patient is currently a smoker")
    diabetes: bool = Field(..., description="Whether the patient is diabetic")
    hba1c: float = Field(..., description="HbA1c level in percentage (e.g. 5.5 to 10.0)")
    plaque_index: float = Field(..., description="Plaque index in percentage (0 to 100)")
    bleeding_on_probing: float = Field(..., description="Bleeding on Probing (BOP) percentage (0 to 100)")
    bone_loss_average: float = Field(..., description="Average periodontal bone loss in mm")
    attachment_loss_average: float = Field(..., description="Average clinical attachment loss in mm")

class PatientCreate(BaseModel):
    name: str = Field(..., example="John Doe")
    age: int = Field(..., example=45)
    gender: str = Field(..., example="Male")
    dentist_id: Optional[str] = Field(None, description="Owner dentist user ID")
    initial_record: ClinicalRecord

class PatientResponse(BaseModel):
    id: str = Field(..., alias="_id")
    name: str
    age: int
    gender: str
    dentist_id: Optional[str] = Field(None, description="Owner dentist user ID")
    history: List[ClinicalRecord]
    created_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class PatientUpdate(BaseModel):
    name: Optional[str] = Field(None, example="John Doe")
    age: Optional[int] = Field(None, example=45)
    gender: Optional[str] = Field(None, example="Male")

# -------------------------------------------------------------
# AI DIGITAL TWIN FORECAST SCHEMAS
# -------------------------------------------------------------
class ForecastDataPoint(BaseModel):
    month: int = Field(..., description="Month relative to baseline (0, 6, 12)")
    bone_loss: float = Field(..., description="Predicted average bone loss in mm")
    attachment_loss: float = Field(..., description="Predicted average attachment loss in mm")

class ForecastingRequest(BaseModel):
    smoking: bool
    diabetes: bool
    hba1c: float
    plaque_index: float
    bleeding_on_probing: float
    current_bone_loss: float
    current_attachment_loss: float

class ForecastingResponse(BaseModel):
    risk_category: str = Field(..., description="Risk category: Stable or Progressing")
    risk_probability: float = Field(..., description="Probability of rapid progression (0.0 to 1.0)")
    trajectory: List[ForecastDataPoint] = Field(..., description="Trajectory predictions at 0, 6, and 12 months")
