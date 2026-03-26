from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import smtplib
from email.mime.text import MIMEText
import requests
from twilio.rest import Client

# 1. FastAPI App Initialization
app = FastAPI()

# 2. CORS Setup (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIGURATION ---
TWILIO_SID = "AC952fa9073579419f1612be3dd4894a81" 
TWILIO_TOKEN = "46952fe30bd1c37e72033a7359b4c872"
TWILIO_PHONE = "+18392574072" 
DISPATCHER_PHONE = "+919024788743" 

SENDER_EMAIL = "abc1de3@gmail.com" 
APP_PASSWORD = "iwjp ufvq arfk ahvy" 
RECEIVER_EMAIL = "2023pietcrhemant025@poornima.org"

emergency_db = {
    "Fire": {"score": 9, "action": "Evacuate immediately. Dispatching Fire Brigade."},
    "Medical": {"score": 8, "action": "Check for pulse. Ambulance is on the way."},
    "Accident": {"score": 7, "action": "Don't move victim. Police & Ambulance notified."},
    "Crime": {"score": 6, "action": "Find a safe place. Patrol Unit alerted."},
}

# --- FUNCTIONS ---

def trigger_voice_alert(etype, location_str):
    try:
        client = Client(TWILIO_SID, TWILIO_TOKEN)
        message = f"Attention! A new {etype} emergency reported at {location_str}. Check dashboard."
        call = client.calls.create(
            twiml=f'<Response><Say voice="alice">{message}</Say></Response>',
            to=DISPATCHER_PHONE,
            from_=TWILIO_PHONE 
        )
        print(f"📞 CALL DISPATCHED: {call.sid}")
    except Exception as e:
        print(f"⚠️ Voice Alert Skipped: {e}")

def get_nearby_places(lat, lng, category):
    amenity = "hospital" if category == "Medical" else "fire_station" if category == "Fire" else "police"
    overpass_url = "http://overpass-api.de/api/interpreter"
    overpass_query = f'[out:json];node["amenity"="{amenity}"](around:5000,{lat},{lng});out body;'
    try:
        response = requests.get(overpass_url, params={'data': overpass_query}, timeout=5)
        data = response.json()
        return [{"name": e.get('tags', {}).get('name', f"Nearby {category}"), "lat": e['lat'], "lng": e['lon']} for e in data.get('elements', [])[:3]]
    except:
        return []

def send_emergency_email(etype, lat, lng, severity):
    maps_link = f"http://google.com/maps?q={lat},{lng}"
    body = f"RESUAI ALERT\nType: {etype}\nSeverity: {severity}/10\nLocation: {maps_link}"
    try:
        msg = MIMEText(body)
        msg['Subject'] = f"🚨 {etype} Emergency Alert"
        msg['From'] = SENDER_EMAIL
        msg['To'] = RECEIVER_EMAIL
        with smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=10) as server:
            server.login(SENDER_EMAIL, APP_PASSWORD)
            server.sendmail(SENDER_EMAIL, RECEIVER_EMAIL, msg.as_string())
        print("✅ Email Sent")
    except Exception as e:
        print(f"⚠️ Email Skipped: {e}")

class EmergencyQuery(BaseModel):
    user_input: str
    lat: float
    lng: float

def analyze_text(text):
    text = text.lower()
    if any(w in text for w in ['fire', 'aag', 'smoke']): return "Fire"
    if any(w in text for w in ['accident', 'crash', 'collision']): return "Accident"
    if any(w in text for w in ['chori', 'crime', 'attack', 'police']): return "Crime"
    return "Medical"

# --- ROUTES ---

@app.get("/")
def read_root():
    return {"status": "ResuAI Backend is Online"}

@app.post("/predict")
async def predict(query: EmergencyQuery):
    etype = analyze_text(query.user_input)
    details = emergency_db.get(etype)
    nearby = get_nearby_places(query.lat, query.lng, etype)
    
    # Notifications
    send_emergency_email(etype, query.lat, query.lng, details["score"])
    trigger_voice_alert(etype, f"{round(query.lat, 2)}, {round(query.lng, 2)}")
    
    return {
        "emergency_type": etype,
        "severity": details["score"],
        "instruction": details["action"],
        "location_received": {"lat": query.lat, "lng": query.lng},
        "nearby_services": nearby
    }

# CRITICAL: This line is for Vercel to find the app instance
app = app