"""AI Agents for SBI Financial Co-Pilot powered by Gemini 3 Flash."""
import os
import json
import re
import logging
from typing import List, Dict, Any
from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger(__name__)
MODEL_PROVIDER = "gemini"
MODEL_NAME = "gemini-2.5-flash"


def _get_key() -> str:
    return os.environ.get("EMERGENT_LLM_KEY", "")


def _extract_json(text: str) -> Any:
    """Extract JSON object/array from LLM response."""
    text = text.strip()
    # Strip code fences
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    # Find first {..} or [..]
    m = re.search(r"(\{.*\}|\[.*\])", text, re.DOTALL)
    if m:
        text = m.group(1)
    try:
        return json.loads(text)
    except Exception as e:
        logger.error(f"JSON parse failed: {e}; raw: {text[:200]}")
        return None


async def _call_agent(session_id: str, system_msg: str, user_msg: str) -> str:
    chat = LlmChat(
        api_key=_get_key(),
        session_id=session_id,
        system_message=system_msg,
    ).with_model(MODEL_PROVIDER, MODEL_NAME)
    reply = await chat.send_message(UserMessage(text=user_msg))
    return reply if isinstance(reply, str) else str(reply)


# =====================================================================
# AGENT 1: Expense Detective
# =====================================================================
async def expense_detective(transactions: List[Dict[str, Any]], user_id: str) -> Dict[str, Any]:
    """Detect overspending categories, subscriptions, and monthly leaks."""
    if not transactions:
        return {"overspending_categories": [], "subscriptions": [], "monthly_leaks": 0}

    # Pre-compute aggregates
    by_cat: Dict[str, float] = {}
    merchant_counts: Dict[str, int] = {}
    merchant_amounts: Dict[str, float] = {}
    for t in transactions:
        if t.get("transaction_type") != "debit":
            continue
        cat = t.get("category", "Other")
        amt = float(t.get("amount", 0))
        by_cat[cat] = by_cat.get(cat, 0) + amt
        m = (t.get("merchant_name") or "").lower().strip()
        if m:
            merchant_counts[m] = merchant_counts.get(m, 0) + 1
            merchant_amounts[m] = merchant_amounts.get(m, 0) + amt

    system = (
        "You are Expense Detective for an Indian banking app. Analyze the user's spending data "
        "and return STRICT JSON only (no prose) with shape: "
        '{"overspending_categories":[{"category":"","monthly_amount":0,"reason":""}],'
        '"subscriptions":[{"service":"","monthly_cost":0}],"monthly_leaks":0}. '
        "monthly_leaks is the total ₹ that could be saved per month. Use Indian context."
    )
    user_payload = {
        "category_totals": by_cat,
        "recurring_merchants": {k: {"count": v, "total": merchant_amounts[k]} for k, v in merchant_counts.items() if v >= 2},
        "currency": "INR",
    }
    try:
        out = await _call_agent(f"expense-{user_id}", system, json.dumps(user_payload))
        parsed = _extract_json(out)
        if parsed:
            return parsed
    except Exception as e:
        logger.error(f"expense_detective error: {e}")

    # Fallback heuristic
    top = sorted(by_cat.items(), key=lambda x: -x[1])[:3]
    subs = [{"service": m.title(), "monthly_cost": round(merchant_amounts[m] / max(merchant_counts[m], 1), 2)}
            for m in merchant_counts if merchant_counts[m] >= 2][:5]
    return {
        "overspending_categories": [{"category": c, "monthly_amount": a, "reason": "High spend"} for c, a in top],
        "subscriptions": subs,
        "monthly_leaks": round(sum(s["monthly_cost"] for s in subs) * 0.3, 2),
    }


# =====================================================================
# AGENT 2: Cost-Cutting Advisor
# =====================================================================
async def cost_cutting_advisor(transactions: List[Dict[str, Any]], monthly_income: float, user_id: str) -> List[Dict[str, Any]]:
    """Generate actionable savings recommendations."""
    by_cat: Dict[str, float] = {}
    for t in transactions:
        if t.get("transaction_type") == "debit":
            by_cat[t.get("category", "Other")] = by_cat.get(t.get("category", "Other"), 0) + float(t.get("amount", 0))

    system = (
        "You are an Indian personal finance coach. Given a user's monthly category spending and income, "
        "generate 4 actionable cost-cutting recommendations. Return STRICT JSON array only: "
        '[{"title":"","description":"","potential_saving":0}]. Use ₹ INR. Keep titles under 8 words.'
    )
    payload = {"monthly_income": monthly_income, "category_spend": by_cat}
    try:
        out = await _call_agent(f"costcut-{user_id}", system, json.dumps(payload))
        parsed = _extract_json(out)
        if isinstance(parsed, list) and parsed:
            return parsed[:6]
    except Exception as e:
        logger.error(f"cost_cutting error: {e}")

    return [
        {"title": "Reduce dining out", "description": "Cook at home 3 more days/week", "potential_saving": 2500},
        {"title": "Cancel unused subscriptions", "description": "Audit OTT and apps", "potential_saving": 800},
        {"title": "Switch to UPI cashback", "description": "Use SBI YONO cashback offers", "potential_saving": 600},
    ]


# =====================================================================
# AGENT 3: SBI Product Recommender
# =====================================================================
async def sbi_product_recommender(profile: Dict[str, Any], user_id: str) -> List[Dict[str, Any]]:
    """Recommend SBI products based on user profile."""
    system = (
        "You are an SBI product advisor. Based on age, income, risk tolerance, and financial goal, "
        "recommend 3 SBI products from this catalog: SBI Fixed Deposit, SBI Recurring Deposit, "
        "SBI Mutual Fund (Equity / Hybrid / Debt), SBI Life Smart Wealth Builder, SBI PPF, "
        "SBI Emergency Fund (Savings+), SBI Magnum Tax Gain (ELSS), SBI Gold ETF. "
        'Return STRICT JSON array: [{"product_name":"","product_type":"FD|RD|MF|Insurance|PPF|ELSS","reason":"","expected_return":"","risk_level":"Low|Medium|High"}]'
    )
    try:
        out = await _call_agent(f"sbi-{user_id}", system, json.dumps(profile))
        parsed = _extract_json(out)
        if isinstance(parsed, list) and parsed:
            return parsed[:5]
    except Exception as e:
        logger.error(f"sbi_recommender error: {e}")

    age = profile.get("age", 30)
    risk = (profile.get("risk_tolerance") or "medium").lower()
    fallback = [
        {"product_name": "SBI Fixed Deposit", "product_type": "FD", "reason": "Safe guaranteed returns", "expected_return": "6.8% p.a.", "risk_level": "Low"},
        {"product_name": "SBI Recurring Deposit", "product_type": "RD", "reason": "Build saving habit", "expected_return": "6.5% p.a.", "risk_level": "Low"},
    ]
    if risk in ("medium", "high") and age < 50:
        fallback.append({"product_name": "SBI Equity Hybrid Fund", "product_type": "MF", "reason": "Growth potential with balanced risk", "expected_return": "10-12% p.a.", "risk_level": "Medium"})
    return fallback


# =====================================================================
# AGENT 4: Financial Health Score
# =====================================================================
def financial_health_score(transactions: List[Dict[str, Any]], monthly_income: float, savings_balance: float) -> Dict[str, Any]:
    """Calculate 0-100 financial health score deterministically."""
    debits = [t for t in transactions if t.get("transaction_type") == "debit"]
    credits = [t for t in transactions if t.get("transaction_type") == "credit"]

    total_expense = sum(float(t.get("amount", 0)) for t in debits)
    total_income = sum(float(t.get("amount", 0)) for t in credits) or monthly_income or 1

    # Savings Rate (30%)
    savings_rate = max(0, (total_income - total_expense) / total_income) if total_income else 0
    savings_score = min(30, round(savings_rate * 100 * 0.6))  # 50% saving = 30 pts

    # Expense Stability (20%) - based on category variance
    by_cat: Dict[str, float] = {}
    for t in debits:
        by_cat[t.get("category", "Other")] = by_cat.get(t.get("category", "Other"), 0) + float(t.get("amount", 0))
    if by_cat:
        vals = list(by_cat.values())
        avg = sum(vals) / len(vals)
        variance = sum((v - avg) ** 2 for v in vals) / len(vals)
        cv = (variance ** 0.5) / avg if avg else 1
        expense_score = max(0, min(20, round(20 - cv * 10)))
    else:
        expense_score = 10

    # Emergency Fund (25%) - balance vs 6 months expense
    target_emergency = total_expense * 6 if total_expense else monthly_income * 6
    emergency_ratio = savings_balance / target_emergency if target_emergency else 0
    emergency_score = min(25, round(emergency_ratio * 25))

    # Investment Activity (15%) - if any "Investment" category
    invest_total = by_cat.get("Investment", 0) + by_cat.get("Mutual Fund", 0) + by_cat.get("SIP", 0)
    invest_ratio = invest_total / total_income if total_income else 0
    investment_score = min(15, round(invest_ratio * 100))

    # Debt Ratio (10%) - lower debt = higher score
    debt_total = by_cat.get("EMI", 0) + by_cat.get("Loan", 0) + by_cat.get("Credit Card", 0)
    debt_ratio = debt_total / total_income if total_income else 0
    debt_score = max(0, min(10, round((1 - min(debt_ratio, 1)) * 10)))

    overall = savings_score + expense_score + emergency_score + investment_score + debt_score

    return {
        "score": min(100, max(0, overall)),
        "breakdown": {
            "savings_rate": savings_score,
            "expense_stability": expense_score,
            "emergency_fund": emergency_score,
            "investment_activity": investment_score,
            "debt_ratio": debt_score,
        },
    }


# =====================================================================
# AGENT 5: Wealth Projection
# =====================================================================
def wealth_projection(monthly_investment: float, years: int, expected_return: float) -> Dict[str, Any]:
    """SIP future value: FV = P × [((1 + r)^n - 1) / r] × (1 + r)."""
    monthly_rate = (expected_return / 100) / 12
    n = years * 12
    if monthly_rate == 0:
        fv = monthly_investment * n
    else:
        fv = monthly_investment * (((1 + monthly_rate) ** n - 1) / monthly_rate) * (1 + monthly_rate)
    invested = monthly_investment * n

    # Year-wise breakdown
    yearly: List[Dict[str, Any]] = []
    for y in range(1, years + 1):
        months = y * 12
        if monthly_rate == 0:
            val = monthly_investment * months
        else:
            val = monthly_investment * (((1 + monthly_rate) ** months - 1) / monthly_rate) * (1 + monthly_rate)
        yearly.append({
            "year": y,
            "invested": round(monthly_investment * months, 2),
            "projected_value": round(val, 2),
            "gain": round(val - monthly_investment * months, 2),
        })

    milestones = []
    for tag, yr in [("1Y", 1), ("3Y", 3), ("5Y", 5), ("10Y", 10)]:
        if yr <= years:
            row = next((r for r in yearly if r["year"] == yr), None)
            if row:
                milestones.append({"label": tag, **row})

    return {
        "projected_value": round(fv, 2),
        "total_invested": round(invested, 2),
        "total_gain": round(fv - invested, 2),
        "yearly_breakdown": yearly,
        "milestones": milestones,
    }


# =====================================================================
# AI CHAT
# =====================================================================
async def ai_chat(question: str, user_context: Dict[str, Any], user_id: str) -> str:
    system = (
        "You are SBI Co-Pilot, a friendly Indian banking AI assistant. Answer questions about the user's "
        "finances using their transaction context. Be concise (under 150 words), use ₹ INR, give actionable advice. "
        "If asked something outside finance, politely redirect."
    )
    context_str = (
        f"User context: monthly_income=₹{user_context.get('monthly_income', 'N/A')}, "
        f"monthly_expenses=₹{user_context.get('monthly_expenses', 'N/A')}, "
        f"health_score={user_context.get('health_score', 'N/A')}/100, "
        f"top_categories={user_context.get('top_categories', {})}, "
        f"age={user_context.get('age', 'N/A')}, goal={user_context.get('goal', 'N/A')}.\n\n"
        f"User question: {question}"
    )
    try:
        return await _call_agent(f"chat-{user_id}", system, context_str)
    except Exception as e:
        logger.error(f"ai_chat error: {e}")
        return "I'm having trouble connecting right now. Please try again in a moment."
