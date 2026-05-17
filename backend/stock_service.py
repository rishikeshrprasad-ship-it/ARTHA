import numpy as np
import pandas as pd
from scipy import stats as scipy_stats
import os
import random
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

UPSTOX_API_KEY = os.getenv("UPSTOX_API_KEY", "")
UPSTOX_API_SECRET = os.getenv("UPSTOX_API_SECRET", "")

# Full NIFTY 50 stock list with NSE symbols
NIFTY50_STOCKS = [
    {"symbol": "RELIANCE", "name": "Reliance Industries", "instrument_key": "NSE_EQ|INE002A01018"},
    {"symbol": "TCS", "name": "Tata Consultancy Services", "instrument_key": "NSE_EQ|INE467B01029"},
    {"symbol": "HDFCBANK", "name": "HDFC Bank", "instrument_key": "NSE_EQ|INE040A01034"},
    {"symbol": "ICICIBANK", "name": "ICICI Bank", "instrument_key": "NSE_EQ|INE090A01021"},
    {"symbol": "INFOSYS", "name": "Infosys Ltd", "instrument_key": "NSE_EQ|INE009A01021"},
    {"symbol": "HINDUNILVR", "name": "Hindustan Unilever", "instrument_key": "NSE_EQ|INE030A01027"},
    {"symbol": "SBIN", "name": "State Bank of India", "instrument_key": "NSE_EQ|INE062A01020"},
    {"symbol": "BHARTIARTL", "name": "Bharti Airtel", "instrument_key": "NSE_EQ|INE397D01024"},
    {"symbol": "BAJFINANCE", "name": "Bajaj Finance", "instrument_key": "NSE_EQ|INE296A01024"},
    {"symbol": "WIPRO", "name": "Wipro Ltd", "instrument_key": "NSE_EQ|INE075A01022"},
    {"symbol": "LT", "name": "Larsen and Toubro", "instrument_key": "NSE_EQ|INE018A01030"},
    {"symbol": "HCLTECH", "name": "HCL Technologies", "instrument_key": "NSE_EQ|INE860A01027"},
    {"symbol": "AXISBANK", "name": "Axis Bank", "instrument_key": "NSE_EQ|INE238A01034"},
    {"symbol": "ASIANPAINT", "name": "Asian Paints", "instrument_key": "NSE_EQ|INE021A01026"},
    {"symbol": "MARUTI", "name": "Maruti Suzuki", "instrument_key": "NSE_EQ|INE585B01010"},
    {"symbol": "TATAMOTORS", "name": "Tata Motors", "instrument_key": "NSE_EQ|INE155A01022"},
    {"symbol": "SUNPHARMA", "name": "Sun Pharmaceutical", "instrument_key": "NSE_EQ|INE044A01036"},
    {"symbol": "TITAN", "name": "Titan Company", "instrument_key": "NSE_EQ|INE280A01028"},
    {"symbol": "ULTRACEMCO", "name": "UltraTech Cement", "instrument_key": "NSE_EQ|INE481G01011"},
    {"symbol": "NTPC", "name": "NTPC Ltd", "instrument_key": "NSE_EQ|INE733E01010"},
    {"symbol": "POWERGRID", "name": "Power Grid Corp", "instrument_key": "NSE_EQ|INE752E01010"},
    {"symbol": "ONGC", "name": "ONGC", "instrument_key": "NSE_EQ|INE213A01029"},
    {"symbol": "MM", "name": "Mahindra and Mahindra", "instrument_key": "NSE_EQ|INE101A01026"},
    {"symbol": "KOTAKBANK", "name": "Kotak Mahindra Bank", "instrument_key": "NSE_EQ|INE237A01028"},
    {"symbol": "ADANIENT", "name": "Adani Enterprises", "instrument_key": "NSE_EQ|INE423A01024"},
    {"symbol": "TATASTEEL", "name": "Tata Steel", "instrument_key": "NSE_EQ|INE081A01012"},
    {"symbol": "JSWSTEEL", "name": "JSW Steel", "instrument_key": "NSE_EQ|INE019A01038"},
    {"symbol": "HINDALCO", "name": "Hindalco Industries", "instrument_key": "NSE_EQ|INE038A01020"},
    {"symbol": "BAJAJFINSV", "name": "Bajaj Finserv", "instrument_key": "NSE_EQ|INE918I01026"},
    {"symbol": "NESTLEIND", "name": "Nestle India", "instrument_key": "NSE_EQ|INE239A01016"},
    {"symbol": "DRREDDY", "name": "Dr Reddys Laboratories", "instrument_key": "NSE_EQ|INE088A01028"},
    {"symbol": "CIPLA", "name": "Cipla", "instrument_key": "NSE_EQ|INE059A01026"},
    {"symbol": "COALINDIA", "name": "Coal India", "instrument_key": "NSE_EQ|INE522F01014"},
    {"symbol": "HDFCLIFE", "name": "HDFC Life Insurance", "instrument_key": "NSE_EQ|INE795G01014"},
    {"symbol": "TECHM", "name": "Tech Mahindra", "instrument_key": "NSE_EQ|INE669C01036"},
    {"symbol": "EICHERMOT", "name": "Eicher Motors", "instrument_key": "NSE_EQ|INE066A01013"},
    {"symbol": "APOLLOHOSP", "name": "Apollo Hospitals", "instrument_key": "NSE_EQ|INE437A01024"},
    {"symbol": "DIVISLAB", "name": "Divis Laboratories", "instrument_key": "NSE_EQ|INE361B01024"},
    {"symbol": "BRITANNIA", "name": "Britannia Industries", "instrument_key": "NSE_EQ|INE216A01030"},
    {"symbol": "BPCL", "name": "BPCL", "instrument_key": "NSE_EQ|INE029A01011"},
    {"symbol": "GRASIM", "name": "Grasim Industries", "instrument_key": "NSE_EQ|INE047A01021"},
    {"symbol": "SBILIFE", "name": "SBI Life Insurance", "instrument_key": "NSE_EQ|INE123W01016"},
    {"symbol": "HEROMOTOCO", "name": "Hero MotoCorp", "instrument_key": "NSE_EQ|INE158A01026"},
    {"symbol": "TATACONSUM", "name": "Tata Consumer Products", "instrument_key": "NSE_EQ|INE192A01025"},
    {"symbol": "BAJAJAUTO", "name": "Bajaj Auto", "instrument_key": "NSE_EQ|INE917I01010"},
    {"symbol": "INDUSINDBK", "name": "IndusInd Bank", "instrument_key": "NSE_EQ|INE095A01012"},
    {"symbol": "ADANIPORTS", "name": "Adani Ports", "instrument_key": "NSE_EQ|INE742F01042"},
    {"symbol": "SHRIRAMFIN", "name": "Shriram Finance", "instrument_key": "NSE_EQ|INE721A01013"},
    {"symbol": "TRENT", "name": "Trent Ltd", "instrument_key": "NSE_EQ|INE849A01020"},
    {"symbol": "BEL", "name": "Bharat Electronics", "instrument_key": "NSE_EQ|INE263A01024"},
]

BASE_PRICES = {
    "RELIANCE": 2847.50, "TCS": 3456.20, "HDFCBANK": 1678.00,
    "ICICIBANK": 1089.00, "INFOSYS": 1432.00, "HINDUNILVR": 2345.60,
    "SBIN": 789.30, "BHARTIARTL": 1234.50, "BAJFINANCE": 7234.00,
    "WIPRO": 567.00, "LT": 3678.90, "HCLTECH": 1234.00,
    "AXISBANK": 1123.45, "ASIANPAINT": 2890.30, "MARUTI": 11234.00,
    "TATAMOTORS": 924.50, "SUNPHARMA": 1567.80, "TITAN": 3456.70,
    "ULTRACEMCO": 10234.00, "NTPC": 345.60, "POWERGRID": 312.40,
    "ONGC": 234.50, "MM": 2345.60, "KOTAKBANK": 1789.30,
    "ADANIENT": 2567.80, "TATASTEEL": 145.60, "JSWSTEEL": 934.50,
    "HINDALCO": 678.90, "BAJAJFINSV": 1678.90, "NESTLEIND": 24567.00,
    "DRREDDY": 5678.90, "CIPLA": 1456.70, "COALINDIA": 456.70,
    "HDFCLIFE": 678.90, "TECHM": 1567.80, "EICHERMOT": 4567.80,
    "APOLLOHOSP": 6789.00, "DIVISLAB": 3456.70, "BRITANNIA": 5678.90,
    "BPCL": 345.60, "GRASIM": 2345.60, "SBILIFE": 1567.80,
    "HEROMOTOCO": 4567.80, "TATACONSUM": 1023.40, "BAJAJAUTO": 8901.20,
    "INDUSINDBK": 1234.50, "ADANIPORTS": 1234.50, "SHRIRAMFIN": 2345.60,
    "TRENT": 5678.90, "BEL": 234.50,
}

BANK_SYMBOLS = {"HDFCBANK", "ICICIBANK", "AXISBANK", "KOTAKBANK", "SBIN", "INDUSINDBK", "BAJFINANCE", "HDFCLIFE", "SBILIFE", "SHRIRAMFIN"}


def generate_mock_candles(symbol: str, interval: str = "15m", count: int = 100) -> list:
    """Generate realistic OHLCV candle data."""
    base = BASE_PRICES.get(symbol, 1000.0)
    candles = []
    base_date = datetime(2024, 3, 1, 9, 15, 0)
    interval_minutes = {
        "1m": 1, "3m": 3, "5m": 5, "15m": 15, "30m": 30,
        "1h": 60, "2h": 120, "1D": 375, "1W": 1875, "1M": 7500
    }
    minutes = interval_minutes.get(interval, 15)
    price = base
    np.random.seed(abs(hash(symbol)) % 10000)
    for i in range(count):
        t = base_date + timedelta(minutes=i * minutes)
        open_p = price
        change = np.random.normal(-0.05, 0.8)
        close_p = max(1.0, open_p + change)
        high_p = max(open_p, close_p) + abs(np.random.normal(0, 0.3))
        low_p = min(open_p, close_p) - abs(np.random.normal(0, 0.3))
        vol = random.randint(50000, 500000)
        candles.append({
            "time": int(t.timestamp()),
            "open": round(open_p, 2),
            "high": round(high_p, 2),
            "low": round(low_p, 2),
            "close": round(close_p, 2),
            "volume": vol,
        })
        price = close_p
    return candles


def calculate_statistics(prices: list) -> dict:
    """Calculate all statistics using NumPy and SciPy."""
    if len(prices) < 2:
        return {}
    arr = np.array(prices, dtype=float)
    returns = np.diff(arr) / arr[:-1] * 100  # percentage returns

    mean = float(np.mean(returns))
    median = float(np.median(returns))
    std_dev = float(np.std(returns, ddof=1)) if len(returns) > 1 else 0.0
    variance = float(np.var(returns, ddof=1)) if len(returns) > 1 else 0.0
    skewness = float(scipy_stats.skew(returns)) if len(returns) >= 3 else 0.0
    kurtosis = float(scipy_stats.kurtosis(returns)) if len(returns) >= 4 else 0.0
    z_score = float((arr[-1] - np.mean(arr)) / np.std(arr)) if np.std(arr) > 0 else 0.0
    neg_returns = returns[returns < 0]
    semi_dev = float(np.std(neg_returns, ddof=1)) if len(neg_returns) > 1 else 0.0
    cv = float(std_dev / abs(mean) * 100) if mean != 0 else 0.0
    iqr = float(scipy_stats.iqr(returns))

    if len(returns) >= 8:
        shapiro_stat, shapiro_p = scipy_stats.shapiro(returns[:50])
    else:
        shapiro_stat, shapiro_p = 0.0, 0.0
    is_normal = bool(shapiro_p > 0.05)

    x = np.arange(len(arr))
    slope, intercept, r_value, p_value, std_err = scipy_stats.linregress(x, arr)
    r_squared = float(r_value ** 2)

    if len(arr) >= 20:
        sma20 = float(np.mean(arr[-20:]))
        bb_std = float(np.std(arr[-20:], ddof=1))
        bb_upper = sma20 + 2 * bb_std
        bb_lower = sma20 - 2 * bb_std
    else:
        sma20 = float(np.mean(arr))
        bb_upper = sma20
        bb_lower = sma20

    atr = float(np.mean(np.abs(np.diff(arr[-15:]))) * 1.5) if len(arr) >= 15 else float(std_dev)

    prob_rise = float(1 - scipy_stats.norm.cdf(0, loc=mean, scale=std_dev)) if std_dev > 0 else 0.5
    prob_fall = 1.0 - prob_rise

    z_score_pts = max(0, 25 - abs(z_score) * 8)
    vol_pts = max(0, 20 - (std_dev * 5))
    dist_pts = 15 if is_normal else 8
    trend_pts = min(20, r_squared * 20)
    prob_pts = min(15, max(prob_rise, prob_fall) * 15)
    artha_score = int(min(100, z_score_pts + vol_pts + dist_pts + trend_pts + prob_pts))

    return {
        "mean": round(mean, 4),
        "median": round(median, 4),
        "stdDev": round(std_dev, 4),
        "variance": round(variance, 4),
        "skewness": round(skewness, 4),
        "kurtosis": round(kurtosis + 3, 4),
        "zScore": round(z_score, 4),
        "semiDeviation": round(semi_dev, 4),
        "cv": round(cv, 2),
        "iqr": round(iqr, 4),
        "shapiroP": round(float(shapiro_p), 4),
        "isNormal": is_normal,
        "rSquared": round(r_squared, 4),
        "regressionSlope": round(float(slope), 6),
        "bollingerUpper": round(bb_upper, 2),
        "bollingerMiddle": round(sma20, 2),
        "bollingerLower": round(bb_lower, 2),
        "atr": round(atr, 2),
        "probRise": round(prob_rise * 100, 2),
        "probFall": round(prob_fall * 100, 2),
        "arthaScore": artha_score,
        "stopLoss": round(float(arr[-1]) - 1.5 * atr, 2),
        # Legacy compat fields
        "probability": round(prob_rise, 4),
        "volRatio": round(std_dev / 0.8, 4) if std_dev > 0 else 1.0,
    }


def run_monte_carlo(current_price: float, mean_return: float, std_return: float, days: int = 30, simulations: int = 500) -> dict:
    """Monte Carlo simulation using NumPy."""
    results = []
    for _ in range(simulations):
        prices = [current_price]
        for _ in range(days):
            ret = np.random.normal(mean_return / 100, std_return / 100)
            prices.append(prices[-1] * (1 + ret))
        results.append(prices)
    results_arr = np.array(results)
    p5 = float(np.percentile(results_arr[:, -1], 5))
    p50 = float(np.percentile(results_arr[:, -1], 50))
    p95 = float(np.percentile(results_arr[:, -1], 95))
    var_95 = float(current_price - p5)
    paths = [[float(p) for p in path] for path in results_arr[:50]]
    return {"p5": round(p5, 2), "p50": round(p50, 2), "p95": round(p95, 2),
            "var95": round(var_95, 2), "paths": paths}


def check_alert_signals(symbol: str, stats: dict, current_price: float):
    """Alert engine — fires only when 3+ conditions met."""
    signals = []
    z = stats.get("zScore", 0)
    skew = stats.get("skewness", 0)
    prob_rise = stats.get("probRise", 50)
    prob_fall = stats.get("probFall", 50)
    std_dev = stats.get("stdDev", 0)
    slope = stats.get("regressionSlope", 0)

    if abs(z) > 2.0:
        signals.append(f"Z-Score: {z:+.2f} ({'overbought' if z > 0 else 'oversold'})")

    if std_dev > 1.5:
        signals.append(f"Volatility: elevated (stddev={std_dev:.2f}%)")

    direction = None
    if skew < -0.3 or z > 2:
        direction = "FALL"
    elif skew > 0.3 or z < -2:
        direction = "RISE"

    if direction:
        signals.append(f"Skewness: {skew:+.2f} ({'bearish' if skew < 0 else 'bullish'} bias)")

    prob_key = prob_fall if direction == "FALL" else prob_rise
    if prob_key > 65:
        signals.append(f"Probability of {direction}: {prob_key:.1f}%")

    if direction and ((direction == "FALL" and slope < 0) or (direction == "RISE" and slope > 0)):
        signals.append(f"Regression slope: {'negative' if slope < 0 else 'positive'}")

    if len(signals) < 3 or direction is None:
        return None

    confidence = min(95, 55 + len(signals) * 8)
    atr = stats.get("atr", current_price * 0.01)
    if direction == "FALL":
        stop_loss = round(current_price + 1.5 * atr, 2)
        target = round(current_price - 2.5 * atr, 2)
    else:
        stop_loss = round(current_price - 1.5 * atr, 2)
        target = round(current_price + 2.5 * atr, 2)

    risk = abs(current_price - stop_loss)
    reward = abs(target - current_price)
    rr = round(reward / risk, 2) if risk > 0 else 1.0

    return {
        "symbol": symbol, "type": direction, "direction": direction,
        "confidence": confidence, "price": current_price,
        "exchange": "NSE", "timeframe": "15min",
        "zScore": round(z, 4), "skewness": round(skew, 4),
        "probability": round(prob_key / 100, 4),
        "regressionSlope": "Negative" if slope < 0 else "Positive",
        "entry": current_price, "sl": stop_loss,
        "stopLoss": stop_loss, "target": target,
        "rr": str(rr), "riskReward": f"1:{rr}",
        "signals": signals,
        "volatility": f"+{std_dev:.1f}% above avg",
        "signal": f"{abs(z):.1f}σ {'overbought' if z > 0 else 'oversold'}",
        "skewMsg": f"{'Negative' if skew < 0 else 'Positive'} ({skew:+.2f})",
    }
