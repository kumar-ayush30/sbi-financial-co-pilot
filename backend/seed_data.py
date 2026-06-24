"""Seed data: create realistic Indian banking transactions for demo users."""
import random
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any

CATEGORIES_DEBIT = [
    ("Groceries", ["BigBasket", "Reliance Fresh", "DMart", "Blinkit", "Zepto"]),
    ("Dining", ["Swiggy", "Zomato", "McDonald's", "Domino's", "Cafe Coffee Day"]),
    ("Transport", ["Uber", "Ola", "Rapido", "IRCTC", "BMTC"]),
    ("Shopping", ["Amazon", "Flipkart", "Myntra", "Ajio", "Nykaa"]),
    ("Entertainment", ["Netflix", "Spotify", "Hotstar", "PVR Cinemas", "BookMyShow"]),
    ("Utilities", ["Tata Power", "BESCOM", "Airtel", "Jio", "Adani Gas"]),
    ("Healthcare", ["Apollo Pharmacy", "1mg", "Practo", "Manipal Hospitals"]),
    ("EMI", ["HDFC Bank EMI", "Bajaj Finserv EMI"]),
    ("Investment", ["SBI Mutual Fund SIP", "Zerodha", "Groww"]),
    ("Education", ["Coursera", "Udemy", "BYJU'S"]),
    ("Fuel", ["Indian Oil", "HP Petrol", "Bharat Petroleum"]),
]

CATEGORIES_CREDIT = [
    ("Salary", ["Acme Corp Salary", "Tech Solutions Inc Salary"]),
    ("Refund", ["Amazon Refund", "Flipkart Refund"]),
    ("Interest", ["SBI Savings Interest"]),
]


def generate_sample_transactions(user_id: str, monthly_income: float = 65000, months_back: int = 3) -> List[Dict[str, Any]]:
    """Generate ~120-150 transactions over the past N months."""
    txns: List[Dict[str, Any]] = []
    now = datetime.now(timezone.utc)

    for m in range(months_back):
        month_start = now - timedelta(days=30 * (m + 1))

        # Salary credit (1st of month)
        txns.append({
            "user_id": user_id,
            "transaction_date": (month_start + timedelta(days=1)).date().isoformat(),
            "amount": monthly_income,
            "merchant_name": "Acme Corp Salary",
            "category": "Salary",
            "transaction_type": "credit",
            "description": "Monthly salary credit",
            "payment_method": "NEFT",
        })

        # 22-30 debits per month for realistic spending
        num_debits = random.randint(22, 30)
        for _ in range(num_debits):
            cat, merchants = random.choice(CATEGORIES_DEBIT)
            merchant = random.choice(merchants)
            if cat == "EMI":
                amt = random.choice([5500, 8200, 12000])
            elif cat == "Investment":
                amt = random.choice([2000, 5000, 10000])
            elif cat == "Utilities":
                amt = random.randint(500, 2500)
            elif cat == "Shopping":
                amt = random.randint(300, 5000)
            elif cat == "Dining":
                amt = random.randint(150, 1200)
            elif cat == "Groceries":
                amt = random.randint(400, 3500)
            elif cat == "Entertainment":
                amt = random.choice([149, 199, 299, 499, 799])
            elif cat == "Transport":
                amt = random.randint(80, 600)
            elif cat == "Fuel":
                amt = random.randint(800, 3000)
            else:
                amt = random.randint(200, 2000)

            day_offset = random.randint(1, 28)
            txns.append({
                "user_id": user_id,
                "transaction_date": (month_start + timedelta(days=day_offset)).date().isoformat(),
                "amount": float(amt),
                "merchant_name": merchant,
                "category": cat,
                "transaction_type": "debit",
                "description": f"Payment to {merchant}",
                "payment_method": random.choice(["UPI", "Debit Card", "Net Banking", "UPI", "UPI"]),
            })

    # Sort by date desc
    txns.sort(key=lambda x: x["transaction_date"], reverse=True)
    return txns
