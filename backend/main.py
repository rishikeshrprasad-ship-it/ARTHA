from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timedelta
from database import get_db, User, UserWatchlist, AlertHistory
from auth_service import (hash_password, verify_password, create_token,
                          decode_token, generate_otp, send_otp_sms, send_otp_email)
from stock_service import (NIFTY50_STOCKS, BASE_PRICES, BANK_SYMBOLS,
                            generate_mock_candles, calculate_statistics,
                            run_monte_carlo, check_alert_signals)
import random
import numpy as np

app = FastAPI(title="ARTHA API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer(auto_error=False)


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = decode_token(credentials.credentials)
        user = db.query(User).filter(User.email == payload.get("sub")).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


# ── AUTH MODELS ──────────────────────────────────────────────────────────────

class SignUpRequest(BaseModel):
    full_name: str
    email: str
    mobile: str
    password: str

class SignInRequest(BaseModel):
    email: str
    password: str

class OTPVerifyRequest(BaseModel):
    email: str
    otp: str

class ResetPasswordRequest(BaseModel):
    email: str
    otp: str
    new_password: str


# ── AUTH ENDPOINTS ────────────────────────────────────────────────────────────

@app.post("/api/auth/signup")
async def signup(req: SignUpRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(400, "Email already registered")
    otp = generate_otp()
    expires = datetime.utcnow() + timedelta(minutes=10)
    user = User(
        full_name=req.full_name, email=req.email, mobile=req.mobile,
        hashed_password=hash_password(req.password),
        otp_code=otp, otp_expires_at=expires, is_verified=False
    )
    db.add(user)
    db.commit()
    background_tasks.add_task(send_otp_email, req.email, otp)
    return {"message": "Account created. OTP sent to your email.", "email": req.email, "dev_otp": otp}


@app.post("/api/auth/verify-otp")
async def verify_otp(req: OTPVerifyRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(404, "User not found")
    if not user.otp_code or user.otp_code != req.otp:
        raise HTTPException(400, "Invalid OTP")
    if user.otp_expires_at and datetime.utcnow() > user.otp_expires_at:
        raise HTTPException(400, "OTP expired. Please request a new one.")
    user.is_verified = True
    user.otp_code = None
    db.commit()
    token = create_token({"sub": user.email})
    return {"message": "Verified successfully", "token": token,
            "user": {"name": user.full_name, "email": user.email, "capital": user.capital}}


@app.post("/api/auth/resend-otp")
async def resend_otp(email: str = Query(...), background_tasks: BackgroundTasks = BackgroundTasks(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(404, "User not found")
    if user.otp_resend_count >= 3:
        raise HTTPException(429, "Maximum OTP resend attempts reached")
    otp = generate_otp()
    user.otp_code = otp
    user.otp_expires_at = datetime.utcnow() + timedelta(minutes=10)
    user.otp_resend_count += 1
    db.commit()
    background_tasks.add_task(send_otp_email, email, otp)
    return {"message": "New OTP sent to email"}


@app.post("/api/auth/signin")
async def signin(req: SignInRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(401, "Email not found")
    if user.locked_until and datetime.utcnow() < user.locked_until:
        remaining = int((user.locked_until - datetime.utcnow()).total_seconds() / 60)
        raise HTTPException(423, f"Account locked. Try again in {remaining} minutes.")
    if not verify_password(req.password, user.hashed_password):
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= 5:
            user.locked_until = datetime.utcnow() + timedelta(minutes=15)
        db.commit()
        remaining = max(0, 5 - user.failed_login_attempts)
        raise HTTPException(401, f"Wrong password. {remaining} attempts remaining.")
    if not user.is_verified:
        raise HTTPException(403, "Please verify your mobile number first")
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()
    token = create_token({"sub": user.email})
    return {"token": token, "user": {"name": user.full_name, "email": user.email, "capital": user.capital}}


@app.post("/api/auth/forgot-password")
async def forgot_password(email: str = Query(...), background_tasks: BackgroundTasks = BackgroundTasks(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(404, "Email not found")
    otp = generate_otp()
    user.otp_code = otp
    user.otp_expires_at = datetime.utcnow() + timedelta(minutes=15)
    db.commit()
    background_tasks.add_task(send_otp_email, email, otp)
    background_tasks.add_task(send_otp_sms, user.mobile, otp)
    return {"message": "Reset OTP sent to your mobile and email", "dev_otp": otp}


@app.post("/api/auth/reset-password")
async def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or user.otp_code != req.otp:
        raise HTTPException(400, "Invalid OTP")
    if user.otp_expires_at and datetime.utcnow() > user.otp_expires_at:
        raise HTTPException(400, "OTP expired")
    user.hashed_password = hash_password(req.new_password)
    user.otp_code = None
    db.commit()
    return {"message": "Password reset successfully"}


# ── STOCK ENDPOINTS ───────────────────────────────────────────────────────────

@app.get("/api/stocks/list")
async def get_stock_list():
    return {"stocks": NIFTY50_STOCKS}


@app.get("/api/stocks/mock-quotes")
async def get_mock_quotes():
    quotes = []
    for stock in NIFTY50_STOCKS:
        base = BASE_PRICES.get(stock["symbol"], 1000)
        change_pct = random.uniform(-2.5, 2.5)
        price = round(base * (1 + change_pct / 100), 2)
        change = round(price - base, 2)
        quotes.append({
            "symbol": stock["symbol"], "name": stock["name"],
            "price": price, "change": change, "changePercent": round(change_pct, 2),
            "changePct": round(change_pct, 2),
            "volume": random.randint(100000, 10000000),
            "high": round(price * 1.015, 2), "low": round(price * 0.985, 2),
            "open": base, "prevClose": base,
        })
    return {"quotes": quotes}


@app.get("/api/stocks/search")
async def search_stocks(q: str = Query(...)):
    query = q.upper()
    results = [s for s in NIFTY50_STOCKS
               if query in s["symbol"] or query in s["name"].upper()]
    return {"results": results[:20]}


@app.get("/api/stocks/{symbol}/candles")
async def get_candles(symbol: str, interval: str = Query(default="15m")):
    candles = generate_mock_candles(symbol, interval, 100)
    return {"symbol": symbol, "interval": interval, "candles": candles}


@app.get("/api/stocks/{symbol}/statistics")
async def get_statistics(symbol: str, interval: str = Query(default="15m")):
    candles = generate_mock_candles(symbol, interval, 100)
    prices = [c["close"] for c in candles]
    if not prices:
        raise HTTPException(404, "No price data")
    stats = calculate_statistics(prices)
    alert = check_alert_signals(symbol, stats, prices[-1])
    if alert:
        alert["id"] = f"{symbol}_{int(datetime.now().timestamp())}"
        alert["timestamp"] = datetime.now().isoformat()
    return {"symbol": symbol, "stats": stats, "alert": alert, "currentPrice": prices[-1]}


@app.get("/api/stocks/{symbol}/monte-carlo")
async def get_monte_carlo(symbol: str, days: int = 30):
    candles = generate_mock_candles(symbol, "15m", 100)
    prices = [c["close"] for c in candles]
    if len(prices) < 5:
        raise HTTPException(400, "Not enough data")
    arr = np.array(prices, dtype=float)
    returns = np.diff(arr) / arr[:-1] * 100
    result = run_monte_carlo(prices[-1], float(np.mean(returns)), float(np.std(returns)), days)
    return result


@app.get("/api/alerts/live")
async def get_live_alerts():
    alerts = []
    symbols_to_check = ["TATAMOTORS", "RELIANCE", "HDFCBANK", "BAJFINANCE", "WIPRO", "INFOSYS",
                         "ICICIBANK", "AXISBANK", "SBIN", "TCS"]
    for symbol in symbols_to_check:
        try:
            candles = generate_mock_candles(symbol, "15m", 100)
            prices = [c["close"] for c in candles]
            stats = calculate_statistics(prices)
            alert = check_alert_signals(symbol, stats, prices[-1])
            if alert:
                alert["id"] = f"{symbol}_{int(datetime.now().timestamp())}"
                alert["timestamp"] = datetime.now().isoformat()
                alerts.append(alert)
        except Exception as e:
            print(f"Error checking {symbol}: {e}")
    return {"alerts": alerts}


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "2.0.0", "message": "ARTHA Backend Running"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
