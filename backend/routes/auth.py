from typing import Any

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import DuplicateKeyError

from backend.database import get_database
from backend.models import (
    AuthResponse,
    GuestRequest,
    LoginRequest,
    OnboardRequest,
    PublicUser,
    RegisterRequest,
    UserStats,
)
from backend.security import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


def public_user(document: dict[str, Any]) -> PublicUser:
    return PublicUser(
        id=str(document["_id"]),
        username=document["username"],
        email=document.get("email"),
        is_guest=document.get("is_guest", False),
        age=document.get("age"),
        avatar=document.get("avatar"),
        coins=document.get("coins", 1000),
        stats=UserStats.model_validate(document.get("stats", {})),
    )


def auth_response(document: dict[str, Any]) -> AuthResponse:
    return AuthResponse(access_token=create_access_token(str(document["_id"])), user=public_user(document))


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterRequest,
    database: AsyncIOMotorDatabase = Depends(get_database),
) -> AuthResponse:
    username = payload.username.strip()
    if len(username) < 3:
        raise HTTPException(status_code=422, detail="Username must contain at least 3 characters")
    username_key = username.casefold()
    email = str(payload.email).strip().lower() if payload.email else None
    document = {
        "username": username,
        "username_key": username_key,
        "email": email,
        "email_key": email,
        "hashed_password": hash_password(payload.password),
        "is_guest": False,
        "age": None,
        "avatar": None,
        "coins": 1000,
        "stats": UserStats().model_dump(),
    }
    try:
        result = await database.users.insert_one(document)
    except DuplicateKeyError as error:
        raise HTTPException(status_code=409, detail="Username or email is already registered") from error
    document["_id"] = result.inserted_id
    return auth_response(document)


@router.post("/login", response_model=AuthResponse)
async def login(
    payload: LoginRequest,
    database: AsyncIOMotorDatabase = Depends(get_database),
) -> AuthResponse:
    login_key = payload.username_or_email.strip().casefold()
    document = await database.users.find_one(
        {"$or": [{"username_key": login_key}, {"email_key": login_key}]}
    )
    if (
        document is None
        or document.get("hashed_password") is None
        or not verify_password(payload.password, document["hashed_password"])
    ):
        raise HTTPException(status_code=401, detail="Invalid username/email or password")
    return auth_response(document)


@router.post("/guest", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def create_guest(
    payload: GuestRequest,
    database: AsyncIOMotorDatabase = Depends(get_database),
) -> AuthResponse:
    return await create_guest_profile(payload.username, None, database, max_name_length=32)


@router.post("/onboard", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def onboard(
    payload: OnboardRequest,
    database: AsyncIOMotorDatabase = Depends(get_database),
) -> AuthResponse:
    return await create_guest_profile(payload.username, payload.age, database, max_name_length=30)


async def create_guest_profile(
    requested_name: str,
    age: int | None,
    database: AsyncIOMotorDatabase,
    *,
    max_name_length: int,
) -> AuthResponse:
    base_name = requested_name.strip()
    username = base_name
    username_key = username.casefold()
    suffix = 1
    while await database.users.find_one({"username_key": username_key}, {"_id": 1}):
        suffix += 1
        suffix_text = f" ({suffix})"
        username = f"{base_name[:max_name_length - len(suffix_text)]}{suffix_text}"
        username_key = username.casefold()

    document = {
        "username": username,
        "username_key": username_key,
        "email": None,
        "email_key": None,
        "hashed_password": None,
        "is_guest": True,
        "age": age,
        "avatar": None,
        "coins": 1000,
        "stats": UserStats().model_dump(),
    }
    try:
        result = await database.users.insert_one(document)
    except DuplicateKeyError as error:
        raise HTTPException(status_code=409, detail="Unable to create guest profile; retry") from error
    document["_id"] = result.inserted_id
    return auth_response(document)


@router.get("/me", response_model=PublicUser)
async def current_profile(user: dict[str, Any] = Depends(get_current_user)) -> PublicUser:
    return public_user(user)
