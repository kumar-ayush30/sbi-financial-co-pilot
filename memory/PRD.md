# SBI Financial Co-Pilot — PRD

## Original problem statement
Build a complete fintech app: FastAPI backend + React frontend + DB. AI-powered personal banking co-pilot that analyzes transactions, categorizes expenses, detects waste, recommends SBI products, calculates a Financial Health Score, simulates wealth growth, and supports multi-agent AI. Originally requested PostgreSQL, adapted to MongoDB per user choice.

## User personas
- Indian salaried professional, 25-40 yrs, wanting to understand spending and grow wealth via SBI.

## User-confirmed choices (Iteration 1)
- Database: MongoDB
- LLM: Gemini (using gemini-2.5-flash via Emergent Universal Key — fallback because gemini-3-flash-preview was rejected by litellm proxy)
- Auth: Email+Password (JWT) + Phone OTP (mocked, returns code in response; 123456 always works) + KYC fields (PAN, Aadhaar last 4, SBI account last 4)
- Design: Hybrid — uploaded Figma + SBI banking aesthetic (navy #1C3F8E + magenta #7A2C8E)
- Scope: All features end-to-end in one pass

## Architecture
- **Backend** (`/app/backend/`):
  - `server.py` — FastAPI app with all routes prefixed `/api`
  - `auth_utils.py` — bcrypt, JWT (15min access / 7day refresh), OTP, rate-limit
  - `ai_agents.py` — 5 agents: Expense Detective, Cost-Cutting Advisor, SBI Recommender, Financial Health (deterministic), Wealth Projection (deterministic), AI Chat
  - `seed_data.py` — auto-seeds ~70-90 Indian banking transactions on registration
  - MongoDB collections: users, financial_profiles, transactions, subscriptions, financial_health_scores, recommendations, wealth_projections, sbi_product_recommendations, ai_insights, otps, uploaded_statements, audit_logs
- **Frontend** (`/app/frontend/src/`):
  - Routes: `/`, `/login`, `/register`, `/dashboard`, `/transactions`, `/health`, `/ai-chat`, `/wealth`, `/recommendations`, `/analytics`
  - Tailwind + shadcn/ui + Recharts + lucide-react
  - Fonts: Outfit (headings), IBM Plex Sans (body), IBM Plex Mono (numbers)
  - JWT auto-refresh interceptor in `lib/api.js`

## Implemented (2026-02)
- ✅ JWT register/login/refresh + KYC fields + phone OTP mock
- ✅ Auto-seeded transactions per new user (3 months realistic Indian data)
- ✅ Dashboard summary (balance, income, expense, savings, health score)
- ✅ Transactions CRUD + CSV upload + PDF upload (acknowledged only)
- ✅ Financial Health Score with 5-dimension breakdown (deterministic)
- ✅ AI Chat using Gemini 2.5 Flash personalized with user context
- ✅ Recommendations: Expense Detective + Cost-Cutting + SBI Product Recommender
- ✅ Wealth Simulator with SIP compound calc + yearly + 1Y/3Y/5Y/10Y milestones
- ✅ Analytics: monthly spending, category breakdown, savings trend
- ✅ Audit logs, rate limiting on auth endpoints
- ✅ Landing page + protected routes + responsive sidebar layout

## Test credentials
See `/app/memory/test_credentials.md`.

## Backlog (P1/P2)
- P1: Real PDF statement extraction (pdfplumber + Gemini structured extract)
- P1: Real SMS OTP via Twilio/MSG91
- P1: Argon2 instead of bcrypt + password breach check (haveibeenpwned)
- P1: 2FA TOTP / Authenticator app
- P2: Admin security dashboard (suspicious accounts, failed logins)
- P2: Subscription auto-cancel deep links
- P2: Multi-currency, multi-bank account linking
- P2: Encryption at rest for PII (Aadhaar, account numbers)

## Known limitations / mocks
- Phone OTP: returned in API response (not SMS) — 123456 always accepted
- PDF upload: acknowledged + stored metadata, full parsing not implemented (CSV upload works fully)
- Balance is a derived heuristic (no live bank linking)
