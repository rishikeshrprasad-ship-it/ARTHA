import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta
import random, os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "artha_secret")
ALGORITHM = "HS256"

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))

def create_token(data: dict, expires_minutes: int = 60 * 24 * 30) -> str:
    to_encode = data.copy()
    to_encode["exp"] = datetime.utcnow() + timedelta(minutes=expires_minutes)
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

def generate_otp() -> str:
    return str(random.randint(100000, 999999))

def send_otp_sms(mobile: str, otp: str) -> bool:
    """Send real OTP via Twilio to Indian mobile number."""
    try:
        account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        from_number = os.getenv("TWILIO_PHONE_NUMBER")
        if not all([account_sid, auth_token, from_number]) or account_sid == "your_twilio_account_sid":
            print(f"[DEV MODE] OTP for +91{mobile}: {otp}")
            return True
        from twilio.rest import Client
        client = Client(account_sid, auth_token)
        client.messages.create(
            body=f"Your ARTHA verification code is: {otp}. Valid for 10 minutes. Do not share with anyone.",
            from_=from_number,
            to=f"+91{mobile}"
        )
        return True
    except Exception as e:
        print(f"SMS error: {e}")
        return False

import smtplib
from email.message import EmailMessage

def send_otp_email(email: str, otp: str) -> bool:
    """Send actual OTP via Gmail SMTP."""
    try:
        sender_email = os.getenv("SMTP_EMAIL")
        sender_password = os.getenv("SMTP_PASSWORD")
        
        if not sender_email or not sender_password or sender_email == "your_gmail_address@gmail.com":
            print("==========================================================")
            print("🚨 CRITICAL: EMAIL NOT SENT! 🚨")
            print("You must put your Gmail credentials in backend/.env to send real emails.")
            print(f"Missed OTP for {email} was: {otp}")
            print("==========================================================")
            return True # Fallback for demo purposes

        msg = EmailMessage()
        msg.set_content(f"Welcome to ARTHA!\n\nYour secure verification code is: {otp}\n\nThis code is valid for 10 minutes. Please do not share this code with anyone.\n\nBest Regards,\nARTHA Security System")
        msg["Subject"] = "ARTHA - Verification Code"
        msg["From"] = sender_email
        msg["To"] = email

        print(f"Attempting to send real email to {email}...")
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(str(sender_email), str(sender_password))
            server.send_message(msg)
            
        print(f"✅ REAL EMAIL SUCCESSFULLY SENT TO {email}!")
        return True
    except Exception as e:
        print(f"❌ Failed to send email: {e}")
        return False
