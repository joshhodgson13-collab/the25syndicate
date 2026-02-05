from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import bcrypt
import jwt
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'the-2.5-syndicate-secret-key-2024')
JWT_ALGORITHM = 'HS256'

# Admin Config
ADMIN_CODE = os.environ.get('ADMIN_CODE', 'syndicate2024')

# Create the main app
app = FastAPI()

# Create routers
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============ MODELS ============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    is_vip: bool = False
    is_admin: bool = False
    subscription_status: Optional[str] = None
    created_at: str

class TokenResponse(BaseModel):
    token: str
    user: UserResponse

class BetCreate(BaseModel):
    home_team: str
    away_team: str
    league: str
    bet_type: str  # e.g., "Over 2.5", "Under 2.5", "BTTS Yes"
    odds: float
    stake: int  # 1-10 scale
    kick_off: str  # ISO datetime string
    is_vip: bool = False

class BetUpdate(BaseModel):
    status: str  # "pending", "won", "lost"
    home_score: Optional[int] = None
    away_score: Optional[int] = None

class BetResponse(BaseModel):
    id: str
    home_team: str
    away_team: str
    league: str
    bet_type: str
    odds: float
    stake: int
    kick_off: str
    is_vip: bool
    status: str  # "pending", "won", "lost"
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    created_at: str
    date: str

class AdminVerify(BaseModel):
    code: str

class CheckoutRequest(BaseModel):
    origin_url: str

class CheckoutStatusRequest(BaseModel):
    session_id: str

# Notification Models
class NotificationSubscription(BaseModel):
    endpoint: str
    keys: dict

class NotificationCreate(BaseModel):
    title: str
    body: str
    notification_type: str  # "bets_live", "results", "custom"

class NotificationResponse(BaseModel):
    id: str
    title: str
    body: str
    notification_type: str
    sent_at: str
    sent_by: str

# ============ AUTH HELPERS ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    payload = {
        'user_id': user_id,
        'exp': datetime.now(timezone.utc).timestamp() + 86400 * 30  # 30 days
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = auth_header.split(' ')[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload['user_id']}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin_user(request: Request) -> dict:
    user = await get_current_user(request)
    if not user.get('is_admin', False):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ============ AUTH ROUTES ============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": hash_password(user_data.password),
        "is_vip": False,
        "is_admin": False,
        "subscription_status": None,
        "subscription_id": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id)
    user_response = UserResponse(
        id=user_id,
        email=user_data.email,
        name=user_data.name,
        is_vip=False,
        is_admin=False,
        subscription_status=None,
        created_at=user_doc["created_at"]
    )
    
    return TokenResponse(token=token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"])
    user_response = UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        is_vip=user.get("is_vip", False),
        is_admin=user.get("is_admin", False),
        subscription_status=user.get("subscription_status"),
        created_at=user["created_at"]
    )
    
    return TokenResponse(token=token, user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        is_vip=user.get("is_vip", False),
        is_admin=user.get("is_admin", False),
        subscription_status=user.get("subscription_status"),
        created_at=user["created_at"]
    )

# ============ ADMIN ROUTES ============

@api_router.post("/admin/verify")
async def verify_admin(data: AdminVerify, user: dict = Depends(get_current_user)):
    if data.code != ADMIN_CODE:
        raise HTTPException(status_code=403, detail="Invalid admin code")
    
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"is_admin": True}}
    )
    
    return {"success": True, "message": "Admin access granted"}

@api_router.post("/admin/bets", response_model=BetResponse)
async def create_bet(bet_data: BetCreate, user: dict = Depends(get_admin_user)):
    bet_id = str(uuid.uuid4())
    kick_off_date = datetime.fromisoformat(bet_data.kick_off.replace('Z', '+00:00'))
    
    bet_doc = {
        "id": bet_id,
        "home_team": bet_data.home_team,
        "away_team": bet_data.away_team,
        "league": bet_data.league,
        "bet_type": bet_data.bet_type,
        "odds": bet_data.odds,
        "stake": bet_data.stake,
        "kick_off": bet_data.kick_off,
        "is_vip": bet_data.is_vip,
        "status": "pending",
        "home_score": None,
        "away_score": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "date": kick_off_date.strftime("%Y-%m-%d")
    }
    
    await db.bets.insert_one(bet_doc)
    
    return BetResponse(**{k: v for k, v in bet_doc.items() if k != '_id'})

@api_router.put("/admin/bets/{bet_id}", response_model=BetResponse)
async def update_bet_result(bet_id: str, update_data: BetUpdate, user: dict = Depends(get_admin_user)):
    update_fields = {"status": update_data.status}
    if update_data.home_score is not None:
        update_fields["home_score"] = update_data.home_score
    if update_data.away_score is not None:
        update_fields["away_score"] = update_data.away_score
    
    result = await db.bets.find_one_and_update(
        {"id": bet_id},
        {"$set": update_fields},
        return_document=True
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Bet not found")
    
    return BetResponse(**{k: v for k, v in result.items() if k != '_id'})

@api_router.delete("/admin/bets/{bet_id}")
async def delete_bet(bet_id: str, user: dict = Depends(get_admin_user)):
    result = await db.bets.delete_one({"id": bet_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bet not found")
    return {"success": True}

@api_router.get("/admin/bets", response_model=List[BetResponse])
async def get_all_bets(user: dict = Depends(get_admin_user)):
    bets = await db.bets.find({}, {"_id": 0}).sort("kick_off", -1).to_list(1000)
    return [BetResponse(**bet) for bet in bets]

# ============ PUBLIC BET ROUTES ============

@api_router.get("/bets/today", response_model=List[BetResponse])
async def get_today_bets():
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    bets = await db.bets.find(
        {"date": today, "is_vip": False, "status": "pending"},
        {"_id": 0}
    ).sort("kick_off", 1).to_list(100)
    return [BetResponse(**bet) for bet in bets]

@api_router.get("/bets/results", response_model=List[BetResponse])
async def get_results():
    bets = await db.bets.find(
        {"status": {"$in": ["won", "lost"]}, "is_vip": False},
        {"_id": 0}
    ).sort("kick_off", -1).to_list(100)
    return [BetResponse(**bet) for bet in bets]

@api_router.get("/bets/vip/today", response_model=List[BetResponse])
async def get_vip_today_bets(user: dict = Depends(get_current_user)):
    if not user.get("is_vip", False):
        raise HTTPException(status_code=403, detail="VIP subscription required")
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    bets = await db.bets.find(
        {"date": today, "is_vip": True, "status": "pending"},
        {"_id": 0}
    ).sort("kick_off", 1).to_list(100)
    return [BetResponse(**bet) for bet in bets]

@api_router.get("/bets/vip/results", response_model=List[BetResponse])
async def get_vip_results(user: dict = Depends(get_current_user)):
    if not user.get("is_vip", False):
        raise HTTPException(status_code=403, detail="VIP subscription required")
    
    bets = await db.bets.find(
        {"status": {"$in": ["won", "lost"]}, "is_vip": True},
        {"_id": 0}
    ).sort("kick_off", -1).to_list(100)
    return [BetResponse(**bet) for bet in bets]

# ============ STRIPE PAYMENT ROUTES ============

@api_router.post("/checkout/create")
async def create_checkout(request: Request, checkout_data: CheckoutRequest, user: dict = Depends(get_current_user)):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
    
    stripe_api_key = os.environ.get('STRIPE_API_KEY')
    if not stripe_api_key:
        raise HTTPException(status_code=500, detail="Stripe not configured")
    
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    origin = checkout_data.origin_url.rstrip('/')
    success_url = f"{origin}/account?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/vip"
    
    checkout_request = CheckoutSessionRequest(
        amount=9.99,
        currency="gbp",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": user["id"],
            "user_email": user["email"],
            "subscription_type": "vip_monthly"
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    transaction_doc = {
        "id": str(uuid.uuid4()),
        "session_id": session.session_id,
        "user_id": user["id"],
        "user_email": user["email"],
        "amount": 9.99,
        "currency": "gbp",
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payment_transactions.insert_one(transaction_doc)
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/checkout/status/{session_id}")
async def get_checkout_status(session_id: str, request: Request, user: dict = Depends(get_current_user)):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    stripe_api_key = os.environ.get('STRIPE_API_KEY')
    if not stripe_api_key:
        raise HTTPException(status_code=500, detail="Stripe not configured")
    
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    status = await stripe_checkout.get_checkout_status(session_id)
    
    # Update payment transaction
    if status.payment_status == "paid":
        # Check if already processed
        transaction = await db.payment_transactions.find_one({"session_id": session_id})
        if transaction and transaction.get("payment_status") != "paid":
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"payment_status": "paid"}}
            )
            # Grant VIP access
            await db.users.update_one(
                {"id": user["id"]},
                {"$set": {"is_vip": True, "subscription_status": "active", "subscription_id": session_id}}
            )
    
    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount_total": status.amount_total,
        "currency": status.currency
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    stripe_api_key = os.environ.get('STRIPE_API_KEY')
    if not stripe_api_key:
        raise HTTPException(status_code=500, detail="Stripe not configured")
    
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    body = await request.body()
    signature = request.headers.get("Stripe-Signature", "")
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == "paid":
            session_id = webhook_response.session_id
            metadata = webhook_response.metadata
            
            # Update transaction
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"payment_status": "paid"}}
            )
            
            # Grant VIP access
            if metadata and "user_id" in metadata:
                await db.users.update_one(
                    {"id": metadata["user_id"]},
                    {"$set": {"is_vip": True, "subscription_status": "active", "subscription_id": session_id}}
                )
        
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}

# ============ STATS ROUTES ============

@api_router.get("/stats")
async def get_stats():
    total_bets = await db.bets.count_documents({"status": {"$in": ["won", "lost"]}})
    won_bets = await db.bets.count_documents({"status": "won"})
    
    win_rate = round((won_bets / total_bets * 100), 1) if total_bets > 0 else 0
    
    return {
        "total_bets": total_bets,
        "won_bets": won_bets,
        "lost_bets": total_bets - won_bets,
        "win_rate": win_rate
    }

# ============ NOTIFICATION ROUTES ============

@api_router.post("/notifications/subscribe")
async def subscribe_to_notifications(subscription: NotificationSubscription, user: dict = Depends(get_current_user)):
    """Subscribe user to push notifications"""
    await db.notification_subscriptions.update_one(
        {"user_id": user["id"]},
        {
            "$set": {
                "user_id": user["id"],
                "endpoint": subscription.endpoint,
                "keys": subscription.keys,
                "subscribed_at": datetime.now(timezone.utc).isoformat()
            }
        },
        upsert=True
    )
    return {"success": True, "message": "Subscribed to notifications"}

@api_router.delete("/notifications/unsubscribe")
async def unsubscribe_from_notifications(user: dict = Depends(get_current_user)):
    """Unsubscribe user from push notifications"""
    await db.notification_subscriptions.delete_one({"user_id": user["id"]})
    return {"success": True, "message": "Unsubscribed from notifications"}

@api_router.get("/notifications/status")
async def get_notification_status(user: dict = Depends(get_current_user)):
    """Check if user is subscribed to notifications"""
    subscription = await db.notification_subscriptions.find_one({"user_id": user["id"]})
    return {"subscribed": subscription is not None}

@api_router.post("/admin/notifications/send", response_model=NotificationResponse)
async def send_notification(notification: NotificationCreate, user: dict = Depends(get_admin_user)):
    """Send notification to all subscribed users (admin only)"""
    notification_id = str(uuid.uuid4())
    
    # Store the notification
    notification_doc = {
        "id": notification_id,
        "title": notification.title,
        "body": notification.body,
        "notification_type": notification.notification_type,
        "sent_at": datetime.now(timezone.utc).isoformat(),
        "sent_by": user["id"]
    }
    await db.notifications.insert_one(notification_doc)
    
    # Get all subscribed users count
    subscriber_count = await db.notification_subscriptions.count_documents({})
    
    logger.info(f"Notification sent to {subscriber_count} subscribers: {notification.title}")
    
    return NotificationResponse(**{k: v for k, v in notification_doc.items() if k != '_id'})

@api_router.get("/admin/notifications", response_model=List[NotificationResponse])
async def get_sent_notifications(user: dict = Depends(get_admin_user)):
    """Get list of sent notifications (admin only)"""
    notifications = await db.notifications.find({}, {"_id": 0}).sort("sent_at", -1).to_list(50)
    return [NotificationResponse(**n) for n in notifications]

@api_router.get("/notifications/latest")
async def get_latest_notifications():
    """Get latest notifications for display"""
    notifications = await db.notifications.find({}, {"_id": 0}).sort("sent_at", -1).to_list(10)
    return notifications

@api_router.get("/admin/notifications/subscribers")
async def get_subscriber_count(user: dict = Depends(get_admin_user)):
    """Get count of notification subscribers (admin only)"""
    count = await db.notification_subscriptions.count_documents({})
    return {"subscriber_count": count}

# ============ BASIC ROUTES ============

@api_router.get("/")
async def root():
    return {"message": "The 2.5 Syndicate API"}

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
