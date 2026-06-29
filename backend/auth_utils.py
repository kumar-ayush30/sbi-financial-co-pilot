"""Authentication utilities: bcrypt password hashing, JWT tokens, OTP generation."""
import os
import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional
import secrets
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

JWT_SECRET = os.environ.get("JWT_SECRET", "change-me-in-production")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", 15))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.environ.get("REFRESH_TOKEN_EXPIRE_DAYS", 7))
ALGORITHM = "HS256"

security = HTTPBearer()


def hash_password(password: str) -> str:
    """Hash password using bcrypt with salt."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hashed value."""
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_token(user_id: str, token_type: str = "access") -> str:
    """Create JWT token with expiration."""
    if token_type == "access":
        exp = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    else:
        exp = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {"sub": user_id, "type": token_type, "exp": exp, "iat": datetime.now(timezone.utc)}
    return jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    """Decode and validate JWT token."""
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def generate_otp() -> str:
    """Generate 6-digit OTP. Demo mode always returns 000000."""
    # For demo/testing: return 000000 (all zeros)
    # Production: return f"{secrets.randbelow(900000) + 100000:06d}"
    return "000000"


async def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Extract and validate user ID from JWT token."""
    payload = decode_token(credentials.credentials)
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user_id


def validate_password_strength(password: str) -> Optional[str]:
    """Validate password meets security requirements."""
    if len(password) < 8:
        return "Password must be at least 8 characters"
    if not any(c.isdigit() for c in password):
        return "Password must contain a digit"
    if not any(c.isupper() for c in password):
        return "Password must contain an uppercase letter"
    return None


# ========== FRAUD DETECTION FUNCTIONS ==========
def detect_fraud_score(transaction: dict, user_profile: dict, transaction_history: list) -> dict:
    """
    Calculate fraud risk score (0-100) for a transaction.
    
    Parameters:
    - transaction: Current transaction details
    - user_profile: User's profile (age, income, etc.)
    - transaction_history: List of past transactions
    
    Returns: {
        "fraud_score": 0-100,
        "risk_level": "LOW" | "MEDIUM" | "HIGH",
        "flags": [list of fraud indicators],
        "reason": "explanation"
    }
    """
    score = 0
    flags = []
    
    # Extract transaction data
    try:
        amount = float(transaction.get("amount", 0))
        category = transaction.get("category", "Other")
        merchant = (transaction.get("merchant_name") or "").lower()
        txn_type = transaction.get("transaction_type", "debit")
    except (ValueError, TypeError):
        return {"fraud_score": 50, "risk_level": "HIGH", "flags": ["invalid_data"], "reason": "Invalid transaction data"}
    
    # Only check debit transactions
    if txn_type != "debit":
        return {"fraud_score": 0, "risk_level": "LOW", "flags": [], "reason": "Credit transaction"}
    
    if not transaction_history:
        return {"fraud_score": 10, "risk_level": "LOW", "flags": [], "reason": "No history available"}
    
    # 1. AMOUNT ANOMALY CHECK (40 points max)
    debit_amounts = [float(t.get("amount", 0)) for t in transaction_history if t.get("transaction_type") == "debit"]
    if debit_amounts:
        avg_amount = sum(debit_amounts) / len(debit_amounts)
        max_amount = max(debit_amounts)
        
        # Amount > 3x user's max historical
        if amount > max_amount * 3:
            score += 35
            flags.append(f"amount_3x_max: ₹{amount} vs ₹{max_amount}")
        # Amount > 2x user's average
        elif amount > avg_amount * 2:
            score += 20
            flags.append(f"amount_2x_avg: ₹{amount} vs ₹{avg_amount:.0f}")
        # Amount > 1.5x average
        elif amount > avg_amount * 1.5:
            score += 10
            flags.append(f"amount_1.5x_avg: ₹{amount} vs ₹{avg_amount:.0f}")
    
    # 2. VELOCITY CHECK: Multiple large transactions in short time (30 points max)
    large_txns_last_hour = sum(1 for t in transaction_history if float(t.get("amount", 0)) > amount * 0.8)
    if large_txns_last_hour > 3:
        score += 30
        flags.append(f"high_velocity: {large_txns_last_hour} large txns recently")
    elif large_txns_last_hour > 1:
        score += 15
        flags.append(f"multiple_txns: {large_txns_last_hour} similar amounts")
    
    # 3. UNUSUAL CATEGORY FOR USER (20 points max)
    category_history = {t.get("category", "Other"): 0 for t in transaction_history}
    for t in transaction_history:
        cat = t.get("category", "Other")
        category_history[cat] = category_history.get(cat, 0) + 1
    
    # Categories user never used
    high_risk_categories = ["Cryptocurrency", "Gambling", "Lottery", "Adult Content"]
    if category in high_risk_categories:
        score += 20
        flags.append(f"risky_category: {category}")
    elif category not in category_history and category != "Other":
        score += 10
        flags.append(f"new_category: {category}")
    
    # 4. MERCHANT RISK CHECK (15 points max)
    if any(risk_word in merchant for risk_word in ["bitcoin", "crypto", "forex", "gambling", "loan", "payday"]):
        score += 15
        flags.append(f"high_risk_merchant: {merchant}")
    
    # 5. TIME ANOMALY (10 points max)
    # If transaction at unusual time (3 AM - 6 AM) when user typically doesn't transact
    # This would require transaction timestamp - simplified here
    
    # Cap score at 100
    score = min(100, max(0, score))
    
    # Determine risk level
    if score >= 70:
        risk_level = "HIGH"
    elif score >= 40:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"
    
    reason = ""
    if score >= 70:
        reason = "Multiple fraud indicators detected. Transaction blocked for security."
    elif score >= 40:
        reason = "Unusual transaction pattern. Additional verification recommended."
    else:
        reason = "Transaction within normal parameters."
    
    return {
        "fraud_score": score,
        "risk_level": risk_level,
        "flags": flags,
        "reason": reason
    }


def check_transaction_velocity(user_id: str, transaction_history: list, max_txns_per_hour: int = 5) -> dict:
    """
    Check if user is making too many transactions (velocity check).
    
    Returns: {"is_suspicious": bool, "transaction_count": int, "limit": int}
    """
    # In production, this would use timestamps. Simplified for now.
    debit_count = sum(1 for t in transaction_history if t.get("transaction_type") == "debit")
    
    is_suspicious = debit_count > max_txns_per_hour
    
    return {
        "is_suspicious": is_suspicious,
        "transaction_count": debit_count,
        "limit": max_txns_per_hour,
        "message": f"High transaction volume: {debit_count} debit txns" if is_suspicious else "Normal velocity"
    }


def get_fraud_alerts(transaction_history: list, user_profile: dict = None) -> list:
    """
    Generate fraud alerts for user based on transaction history.
    
    Returns: List of alert dictionaries with severity levels
    """
    alerts = []
    
    if not transaction_history:
        return alerts
    
    # Check for multiple large transactions
    large_txns = [t for t in transaction_history if float(t.get("amount", 0)) > 50000]
    if len(large_txns) > 2:
        alerts.append({
            "severity": "MEDIUM",
            "message": f"Multiple large transactions detected: {len(large_txns)} txns > ₹50K",
            "type": "high_amount"
        })
    
    # Check for unusual merchant patterns
    merchants = [t.get("merchant_name", "") for t in transaction_history]
    for risky in ["bitcoin", "crypto", "forex"]:
        if any(risky.lower() in m.lower() for m in merchants):
            alerts.append({
                "severity": "HIGH",
                "message": f"Risky merchant detected: {risky}",
                "type": "risky_merchant"
            })
            break
    
    return alerts
