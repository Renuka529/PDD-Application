import os
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
from bson import ObjectId
from typing import List

from .db import connect_to_mongo, close_mongo_connection, get_db
from .models import (
    PatientCreate, 
    PatientResponse, 
    ClinicalRecord, 
    ForecastingRequest, 
    ForecastingResponse,
    UserSignup,
    UserLogin,
    UserResponse,
    UserUpdate,
    PatientUpdate
)
from .forecaster import run_periodontal_forecast
from .auth import get_password_hash, verify_password, create_access_token, get_current_user

app = FastAPI(
    title="PerioTwin™ Backend",
    description="AI-Based Digital Twin for Periodontal Bone and Attachment Loss Forecasts",
    version="1.0.0"
)

# Enable CORS for React website and Flutter app (mobile/web)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

def serialize_doc(doc) -> dict:
    if not doc:
        return {}
    doc["_id"] = str(doc["_id"])
    return doc

@app.get("/")
def read_root():
    return {
        "status": "online",
        "app": "PerioTwin™ API Gateway",
        "message": "AI-Based Digital Twin for Periodontal Prognosis"
    }

# --- AUTH ENDPOINTS ---

@app.post("/api/auth/signup")
async def signup(user_data: UserSignup, db = Depends(get_db)):
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user_data.password)
    new_user = {
        "email": user_data.email,
        "password": hashed_password,
        "name": user_data.name,
        "created_at": datetime.utcnow()
    }
    result = await db.users.insert_one(new_user)
    created_user = await db.users.find_one({"_id": result.inserted_id})
    created_user = serialize_doc(created_user)
    token = create_access_token(data={"sub": created_user["email"]})
    return {
        "token": token,
        "token_type": "bearer",
        "user": {
            "id": created_user["_id"],
            "email": created_user["email"],
            "name": created_user["name"],
            "created_at": created_user["created_at"].isoformat()
        }
    }

@app.post("/api/auth/login")
async def login(credentials: UserLogin, db = Depends(get_db)):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user = serialize_doc(user)
    token = create_access_token(data={"sub": user["email"]})
    return {
        "token": token,
        "token_type": "bearer",
        "user": {
            "id": user["_id"],
            "email": user["email"],
            "name": user["name"],
            "created_at": user["created_at"].isoformat()
        }
    }

@app.get("/api/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

@app.put("/api/auth/me", response_model=UserResponse)
async def update_me(user_update: UserUpdate, db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    update_data = {}
    if user_update.name is not None:
        update_data["name"] = user_update.name
    if user_update.email is not None:
        if user_update.email != current_user["email"]:
            existing_user = await db.users.find_one({"email": user_update.email})
            if existing_user:
                raise HTTPException(status_code=400, detail="Email already registered")
            update_data["email"] = user_update.email
    if user_update.password is not None:
        update_data["password"] = get_password_hash(user_update.password)
        
    if update_data:
        await db.users.update_one({"_id": ObjectId(current_user["_id"])}, {"$set": update_data})
        updated_user = await db.users.find_one({"_id": ObjectId(current_user["_id"])})
        return serialize_doc(updated_user)
        
    return current_user

# --- PATIENT ENDPOINTS ---

@app.get("/api/patients", response_model=List[PatientResponse])
async def list_patients(db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    cursor = db.patients.find({"dentist_id": current_user["_id"]})
    patients = []
    async for doc in cursor:
        patients.append(serialize_doc(doc))
    return patients

@app.get("/api/patients/{patient_id}", response_model=PatientResponse)
async def get_patient(patient_id: str, db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(patient_id):
        raise HTTPException(status_code=400, detail="Invalid patient ID format")
    doc = await db.patients.find_one({"_id": ObjectId(patient_id), "dentist_id": current_user["_id"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Patient not found or unauthorized")
    return serialize_doc(doc)

@app.post("/api/patients", response_model=PatientResponse)
async def create_patient(patient: PatientCreate, db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    now = datetime.utcnow()
    patient_doc = {
        "name": patient.name,
        "age": patient.age,
        "gender": patient.gender,
        "dentist_id": current_user["_id"],
        "created_at": now,
        "history": [patient.initial_record.dict()]
    }
    result = await db.patients.insert_one(patient_doc)
    doc = await db.patients.find_one({"_id": result.inserted_id})
    return serialize_doc(doc)

@app.post("/api/patients/{patient_id}/records", response_model=PatientResponse)
async def add_clinical_record(patient_id: str, record: ClinicalRecord, db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(patient_id):
        raise HTTPException(status_code=400, detail="Invalid patient ID format")
    
    # Verify patient exists and belongs to this dentist
    doc = await db.patients.find_one({"_id": ObjectId(patient_id), "dentist_id": current_user["_id"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Patient not found or unauthorized")
    
    # Append record
    await db.patients.update_one(
        {"_id": ObjectId(patient_id)},
        {"$push": {"history": record.dict()}}
    )
    
    updated_doc = await db.patients.find_one({"_id": ObjectId(patient_id)})
    return serialize_doc(updated_doc)

@app.post("/api/forecast", response_model=ForecastingResponse)
def get_forecast(req: ForecastingRequest):
    """
    Core engine. Executes Random Forest risk model and LSTM time series
    for a given clinical profile state.
    """
    try:
        forecast = run_periodontal_forecast(req)
        return forecast
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/patients/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: str,
    patient_update: PatientUpdate,
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if not ObjectId.is_valid(patient_id):
        raise HTTPException(status_code=400, detail="Invalid patient ID format")
    
    # Verify patient exists and belongs to this dentist
    doc = await db.patients.find_one({"_id": ObjectId(patient_id), "dentist_id": current_user["_id"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Patient not found or unauthorized")
        
    update_data = {}
    if patient_update.name is not None:
        update_data["name"] = patient_update.name
    if patient_update.age is not None:
        update_data["age"] = patient_update.age
    if patient_update.gender is not None:
        update_data["gender"] = patient_update.gender
        
    if update_data:
        await db.patients.update_one({"_id": ObjectId(patient_id)}, {"$set": update_data})
        
    updated_doc = await db.patients.find_one({"_id": ObjectId(patient_id)})
    return serialize_doc(updated_doc)

@app.delete("/api/patients/{patient_id}")
async def delete_patient(patient_id: str, db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(patient_id):
        raise HTTPException(status_code=400, detail="Invalid patient ID format")
    result = await db.patients.delete_one({"_id": ObjectId(patient_id), "dentist_id": current_user["_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Patient not found or unauthorized")
    return {"message": f"Successfully deleted patient {patient_id}"}
