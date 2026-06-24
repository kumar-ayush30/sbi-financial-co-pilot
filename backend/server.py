"""SBI Financial Co-Pilot - FastAPI backend.

Architecture:
- MongoDB collections: users, financial_profiles, transactions, subscriptions,
  financial_health_scores, recommendations, wealth_projections, ai_insights, otps, audit_logs
- JWT auth (access + refresh tokens)
- AI agents powered by Gemini 3 Flash via Emergent Universal LLM key
"""
import os
import io
import csv
import json
import uuid
import logging
from datetime import datetime, timezone, timedelta, date
from pathlib import Path
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Request
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from dotenv import load_dotenv

from auth_utils import (
    hash_password, verify_password, create_token, decode_token,
    generate_otp, get_current_user_id, validate_password_strength,
)
from ai_agents import (
    expense_detective, cost_cutting_advisor, sbi_product_recommender,
    financial_health_score, wealth_projection, ai_chat,
)
from seed_data import generate_sample_transactions

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("sbi-copilot")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="SBI Financial Co-Pilot API", version="1.0.0")
api = APIRouter(prefix="/api")

# ============================================================
# Rate limiter (simple in-memory)
# ============================================================
_rate_buckets: Dict[str, List[float]] = {}


def rate_limit(key: str, max_calls: int = 30, window_sec: int = 60) -> bool:
    now = datetime.now(timezone.utc).timestamp()
    bucket = _rate_buckets.setdefault(key, [])
    bucket[:] = [t for t in bucket if now - t < window_sec]
    if len(bucket) >= max_calls:
        return False
    bucket.append(now)
    return True


# ============================================================
# Models
# ============================================================
class RegisterReq(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(min_length=10, max_length=15)
    password: str
    age: Optional[int] = Field(default=None, ge=18, le=100)
    monthly_income: Optional[float] = Field(default=None, ge=0)
    risk_tolerance: Optional[str] = Field(default="medium")
    financial_goal: Optional[str] = None
    pan: Optional[str] = None
    aadhaar_last4: Optional[str] = None
    sbi_account_last4: Optional[str] = None


class LoginReq(BaseModel):
    email: EmailStr
    password: str


class RefreshReq(BaseModel):
    refresh_token: str


class OTPReq(BaseModel):
    phone: str


class OTPVerifyReq(BaseModel):
    phone: str
    otp: str


class TransactionIn(BaseModel):
    transaction_date: str
    amount: float
    merchant_name: str
    category: str
    transaction_type: str  # debit | credit
    description: Optional[str] = ""
    payment_method: Optional[str] = "UPI"


class WealthSimReq(BaseModel):
    monthly_investment: float = Field(ge=0)
    years: int = Field(ge=1, le=40)
    expected_return: float = Field(ge=0, le=30)


class ChatReq(BaseModel):
    question: str = Field(min_length=2, max_length=500)


class ProfileUpdate(BaseModel):
    age: Optional[int] = None
    monthly_income: Optional[float] = None
    risk_tolerance: Optional[str] = None
    financial_goal: Optional[str] = None
    target_savings: Optional[float] = None


# ============================================================
# Helpers
# ============================================================
async def audit(user_id: Optional[str], action: str, request: Request, details: str = ""):
    try:
        await db.audit_logs.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "action": action,
            "ip": request.client.host if request.client else "unknown",
            "user_agent": request.headers.get("user-agent", ""),
            "details": details,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    except Exception as e:
        logger.error(f"audit log error: {e}")


def clean(doc: dict) -> dict:
    """Strip MongoDB _id."""
    doc.pop("_id", None)
    return doc


async def get_user(user_id: str) -> dict:
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(404, "User not found")
    return user


async def get_profile(user_id: str) -> dict:
    p = await db.financial_profiles.find_one({"user_id": user_id}, {"_id": 0})
    return p or {}


# ============================================================
# AUTH
# ============================================================
@api.post("/auth/register")
async def register(body: RegisterReq, request: Request):
    if not rate_limit(f"register:{request.client.host}", 10, 300):
        raise HTTPException(429, "Too many requests")
    err = validate_password_strength(body.password)
    if err:
        raise HTTPException(400, err)

    existing = await db.users.find_one({"email": body.email})
    if existing:
        raise HTTPException(400, "Email already registered")

    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    user_doc = {
        "id": user_id,
        "full_name": body.full_name,
        "email": body.email,
        "phone": body.phone,
        "password_hash": hash_password(body.password),
        "is_verified": False,
        "pan": body.pan,
        "aadhaar_last4": body.aadhaar_last4,
        "sbi_account_last4": body.sbi_account_last4,
        "created_at": now,
        "updated_at": now,
    }
    await db.users.insert_one(user_doc)

    profile_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "age": body.age,
        "monthly_income": body.monthly_income or 65000,
        "risk_tolerance": body.risk_tolerance or "medium",
        "financial_goal": body.financial_goal or "Build emergency fund",
        "target_savings": 500000,
        "created_at": now,
    }
    await db.financial_profiles.insert_one(profile_doc)

    # Seed sample transactions so new users see meaningful data instantly
    sample_txns = generate_sample_transactions(user_id, body.monthly_income or 65000, months_back=3)
    for t in sample_txns:
        t["id"] = str(uuid.uuid4())
        t["created_at"] = now
    if sample_txns:
        await db.transactions.insert_many(sample_txns)

    await audit(user_id, "register", request)
    access = create_token(user_id, "access")
    refresh = create_token(user_id, "refresh")
    user_doc.pop("_id", None)
    user_doc.pop("password_hash", None)
    return {
        "access_token": access, "refresh_token": refresh, "token_type": "bearer",
        "user": user_doc,
    }


@api.post("/auth/login")
async def login(body: LoginReq, request: Request):
    if not rate_limit(f"login:{request.client.host}:{body.email}", 8, 300):
        raise HTTPException(429, "Too many login attempts. Try again later.")
    user = await db.users.find_one({"email": body.email})
    if not user or not verify_password(body.password, user.get("password_hash", "")):
        await audit(user.get("id") if user else None, "login_failed", request, body.email)
        raise HTTPException(401, "Invalid credentials")

    await audit(user["id"], "login", request)
    access = create_token(user["id"], "access")
    refresh = create_token(user["id"], "refresh")
    user.pop("_id", None)
    user.pop("password_hash", None)
    return {"access_token": access, "refresh_token": refresh, "token_type": "bearer", "user": user}


@api.post("/auth/refresh")
async def refresh_token(body: RefreshReq):
    payload = decode_token(body.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(401, "Invalid refresh token")
    return {"access_token": create_token(payload["sub"], "access"), "token_type": "bearer"}


@api.post("/auth/otp/send")
async def send_otp(body: OTPReq, request: Request):
    if not rate_limit(f"otp:{body.phone}", 3, 300):
        raise HTTPException(429, "Too many OTP requests")
    code = generate_otp()
    await db.otps.update_one(
        {"phone": body.phone},
        {"$set": {
            "phone": body.phone,
            "code": code,
            "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat(),
            "verified": False,
        }},
        upsert=True,
    )
    await audit(None, "otp_sent", request, body.phone)
    # NOTE: In production this would be sent via SMS (Twilio/MSG91).
    # For demo we return it in the response. ALWAYS works with 123456 as fallback.
    return {"sent": True, "demo_otp": code, "message": "OTP sent (demo mode). For testing you may also use 123456."}


@api.post("/auth/otp/verify")
async def verify_otp(body: OTPVerifyReq, request: Request):
    rec = await db.otps.find_one({"phone": body.phone})
    valid_demo = body.otp == "123456"
    valid_real = rec and rec.get("code") == body.otp and \
        datetime.fromisoformat(rec["expires_at"]) > datetime.now(timezone.utc)
    if not (valid_demo or valid_real):
        raise HTTPException(400, "Invalid or expired OTP")
    if rec:
        await db.otps.update_one({"phone": body.phone}, {"$set": {"verified": True}})
    await audit(None, "otp_verified", request, body.phone)
    return {"verified": True}


@api.get("/auth/me")
async def me(user_id: str = Depends(get_current_user_id)):
    user = await get_user(user_id)
    profile = await get_profile(user_id)
    return {"user": user, "profile": profile}


@api.put("/auth/profile")
async def update_profile(body: ProfileUpdate, user_id: str = Depends(get_current_user_id)):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if updates:
        await db.financial_profiles.update_one({"user_id": user_id}, {"$set": updates}, upsert=True)
    return await get_profile(user_id)


# ============================================================
# TRANSACTIONS
# ============================================================
@api.get("/transactions")
async def list_transactions(user_id: str = Depends(get_current_user_id), limit: int = 200, category: Optional[str] = None):
    q = {"user_id": user_id}
    if category:
        q["category"] = category
    cursor = db.transactions.find(q, {"_id": 0}).sort("transaction_date", -1).limit(limit)
    return await cursor.to_list(limit)


@api.post("/transactions")
async def create_transaction(body: TransactionIn, user_id: str = Depends(get_current_user_id)):
    doc = body.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["user_id"] = user_id
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.transactions.insert_one(doc)
    return clean(doc)


@api.delete("/transactions/{txn_id}")
async def delete_transaction(txn_id: str, user_id: str = Depends(get_current_user_id)):
    res = await db.transactions.delete_one({"id": txn_id, "user_id": user_id})
    if res.deleted_count == 0:
        raise HTTPException(404, "Transaction not found")
    return {"deleted": True}


@api.post("/transactions/upload-csv")
async def upload_csv(file: UploadFile = File(...), user_id: str = Depends(get_current_user_id)):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(400, "Only CSV files allowed")
    content = (await file.read()).decode("utf-8", errors="ignore")
    reader = csv.DictReader(io.StringIO(content))
    rows = []
    for r in reader:
        # Flexible column mapping
        rl = {k.lower().strip(): v for k, v in r.items() if k}
        amount_raw = rl.get("amount") or rl.get("debit") or rl.get("credit") or "0"
        try:
            amount = float(str(amount_raw).replace(",", "").replace("₹", "").strip() or 0)
        except Exception:
            amount = 0
        if amount == 0:
            continue
        ttype = "credit" if (rl.get("credit") or rl.get("type", "").lower() == "credit") else "debit"
        rows.append({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "transaction_date": rl.get("date") or rl.get("transaction_date") or datetime.now().date().isoformat(),
            "amount": abs(amount),
            "merchant_name": rl.get("merchant") or rl.get("description") or rl.get("merchant_name") or "Unknown",
            "category": rl.get("category") or "Other",
            "transaction_type": ttype,
            "description": rl.get("description") or "",
            "payment_method": rl.get("payment_method") or "UPI",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    if rows:
        await db.transactions.insert_many(rows)
    return {"imported": len(rows)}


@api.post("/transactions/upload-pdf")
async def upload_pdf(file: UploadFile = File(...), user_id: str = Depends(get_current_user_id)):
    # PDF parsing requires extra libs; we accept and acknowledge for demo
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files allowed")
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(400, "File too large (max 10MB)")
    await db.uploaded_statements.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "file_name": file.filename,
        "file_type": "pdf",
        "size": len(content),
        "processed": False,
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"uploaded": True, "note": "PDF received. Full extraction is mocked in this demo; use CSV upload for full ingestion."}


# ============================================================
# DASHBOARD
# ============================================================
async def _compute_monthly(user_id: str) -> Dict[str, float]:
    cutoff = (datetime.now(timezone.utc) - timedelta(days=30)).date().isoformat()
    txns = await db.transactions.find(
        {"user_id": user_id, "transaction_date": {"$gte": cutoff}}, {"_id": 0}
    ).to_list(1000)
    income = sum(float(t["amount"]) for t in txns if t["transaction_type"] == "credit")
    expense = sum(float(t["amount"]) for t in txns if t["transaction_type"] == "debit")
    return {"monthly_income": income, "monthly_expenses": expense, "txns": txns}


@api.get("/dashboard/summary")
async def dashboard_summary(user_id: str = Depends(get_current_user_id)):
    data = await _compute_monthly(user_id)
    profile = await get_profile(user_id)
    monthly_income = data["monthly_income"] or float(profile.get("monthly_income", 0) or 0)
    monthly_expenses = data["monthly_expenses"]
    balance = max(0, (monthly_income - monthly_expenses) * 6 + 50000)  # mock running balance
    health = financial_health_score(data["txns"], monthly_income, balance)
    potential_savings = round(monthly_expenses * 0.15, 2)
    return {
        "balance": round(balance, 2),
        "monthly_income": round(monthly_income, 2),
        "monthly_expenses": round(monthly_expenses, 2),
        "potential_savings": potential_savings,
        "health_score": health["score"],
        "net_savings": round(monthly_income - monthly_expenses, 2),
    }


# ============================================================
# FINANCIAL HEALTH
# ============================================================
@api.get("/financial-health")
async def get_financial_health(user_id: str = Depends(get_current_user_id)):
    data = await _compute_monthly(user_id)
    profile = await get_profile(user_id)
    income = data["monthly_income"] or float(profile.get("monthly_income", 0) or 0)
    balance = max(0, (income - data["monthly_expenses"]) * 6 + 50000)
    result = financial_health_score(data["txns"], income, balance)
    await db.financial_health_scores.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "overall_score": result["score"],
        **{k: v for k, v in result["breakdown"].items()},
        "generated_at": datetime.now(timezone.utc).isoformat(),
    })
    return result


# ============================================================
# AI CHAT
# ============================================================
@api.post("/ai/chat")
async def ai_chat_endpoint(body: ChatReq, user_id: str = Depends(get_current_user_id)):
    data = await _compute_monthly(user_id)
    profile = await get_profile(user_id)
    by_cat: Dict[str, float] = {}
    for t in data["txns"]:
        if t["transaction_type"] == "debit":
            by_cat[t["category"]] = by_cat.get(t["category"], 0) + float(t["amount"])
    top_cats = dict(sorted(by_cat.items(), key=lambda x: -x[1])[:5])
    context = {
        "monthly_income": data["monthly_income"],
        "monthly_expenses": data["monthly_expenses"],
        "top_categories": top_cats,
        "age": profile.get("age"),
        "goal": profile.get("financial_goal"),
        "health_score": financial_health_score(data["txns"], data["monthly_income"], 50000)["score"],
    }
    answer = await ai_chat(body.question, context, user_id)
    await db.ai_insights.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "question": body.question,
        "answer": answer,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"answer": answer}


@api.get("/ai/chat-history")
async def chat_history(user_id: str = Depends(get_current_user_id), limit: int = 20):
    items = await db.ai_insights.find({"user_id": user_id}, {"_id": 0}).sort("generated_at", -1).limit(limit).to_list(limit)
    return items


# ============================================================
# RECOMMENDATIONS
# ============================================================
@api.get("/recommendations")
async def get_recommendations(user_id: str = Depends(get_current_user_id)):
    data = await _compute_monthly(user_id)
    profile = await get_profile(user_id)
    income = data["monthly_income"] or float(profile.get("monthly_income", 0) or 0)

    detective = await expense_detective(data["txns"], user_id)
    savings = await cost_cutting_advisor(data["txns"], income, user_id)
    products = await sbi_product_recommender({
        "age": profile.get("age", 30),
        "monthly_income": income,
        "risk_tolerance": profile.get("risk_tolerance", "medium"),
        "financial_goal": profile.get("financial_goal", "wealth growth"),
    }, user_id)

    # Persist
    now = datetime.now(timezone.utc).isoformat()
    for r in savings:
        await db.recommendations.insert_one({
            "id": str(uuid.uuid4()), "user_id": user_id,
            "title": r.get("title", ""), "description": r.get("description", ""),
            "monthly_saving": r.get("potential_saving", 0), "priority": 1,
            "generated_at": now,
        })
    for p in products:
        await db.sbi_product_recommendations.insert_one({
            "id": str(uuid.uuid4()), "user_id": user_id,
            **p, "generated_at": now,
        })

    return {
        "expense_insights": detective,
        "savings_opportunities": savings,
        "sbi_products": products,
    }


# ============================================================
# WEALTH SIMULATOR
# ============================================================
@api.post("/wealth-simulator")
async def wealth_simulator(body: WealthSimReq, user_id: str = Depends(get_current_user_id)):
    result = wealth_projection(body.monthly_investment, body.years, body.expected_return)
    await db.wealth_projections.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "monthly_investment": body.monthly_investment,
        "years": body.years,
        "expected_return": body.expected_return,
        "future_value": result["projected_value"],
        "generated_at": datetime.now(timezone.utc).isoformat(),
    })
    return result


# ============================================================
# ANALYTICS
# ============================================================
@api.get("/analytics/monthly-spending")
async def monthly_spending(user_id: str = Depends(get_current_user_id)):
    txns = await db.transactions.find({"user_id": user_id}, {"_id": 0}).to_list(2000)
    buckets: Dict[str, Dict[str, float]] = {}
    for t in txns:
        ym = t["transaction_date"][:7]  # YYYY-MM
        b = buckets.setdefault(ym, {"month": ym, "income": 0, "expense": 0})
        if t["transaction_type"] == "credit":
            b["income"] += float(t["amount"])
        else:
            b["expense"] += float(t["amount"])
    return sorted(buckets.values(), key=lambda x: x["month"])


@api.get("/analytics/category-breakdown")
async def category_breakdown(user_id: str = Depends(get_current_user_id)):
    cutoff = (datetime.now(timezone.utc) - timedelta(days=30)).date().isoformat()
    txns = await db.transactions.find(
        {"user_id": user_id, "transaction_date": {"$gte": cutoff}, "transaction_type": "debit"},
        {"_id": 0},
    ).to_list(2000)
    cats: Dict[str, float] = {}
    for t in txns:
        cats[t["category"]] = cats.get(t["category"], 0) + float(t["amount"])
    return [{"category": k, "amount": round(v, 2)} for k, v in sorted(cats.items(), key=lambda x: -x[1])]


@api.get("/analytics/savings-trend")
async def savings_trend(user_id: str = Depends(get_current_user_id)):
    txns = await db.transactions.find({"user_id": user_id}, {"_id": 0}).to_list(2000)
    buckets: Dict[str, Dict[str, float]] = {}
    for t in txns:
        ym = t["transaction_date"][:7]
        b = buckets.setdefault(ym, {"month": ym, "savings": 0, "income": 0, "expense": 0})
        if t["transaction_type"] == "credit":
            b["income"] += float(t["amount"])
        else:
            b["expense"] += float(t["amount"])
    out = []
    for ym in sorted(buckets):
        b = buckets[ym]
        b["savings"] = round(b["income"] - b["expense"], 2)
        out.append(b)
    return out


# ============================================================
# Mount + Middleware
# ============================================================
@api.get("/")
async def root():
    return {"app": "SBI Financial Co-Pilot", "version": "1.0.0", "status": "ok"}


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled(request: Request, exc: Exception):
    logger.exception(f"Unhandled: {exc}")
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.on_event("shutdown")
async def shutdown_db():
    client.close()
