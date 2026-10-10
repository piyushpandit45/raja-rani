from datetime import datetime, timezone
from enum import Enum
from typing import Literal

from bson import ObjectId
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_serializer, field_validator


class GameType(str, Enum):
    SHOLO_GUTI = "sholo_guti"
    DOTS_BOXES = "dots_boxes"
    SOS = "sos"


class GameStats(BaseModel):
    played: int = 0
    won: int = 0
    lost: int = 0
    score: int = 0


class UserStats(BaseModel):
    sholo_guti: GameStats = Field(default_factory=GameStats)
    dots_boxes: GameStats = Field(default_factory=GameStats)
    sos: GameStats = Field(default_factory=GameStats)


class UserDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

    id: ObjectId | None = Field(default=None, alias="_id")
    username: str
    username_key: str
    email: EmailStr | None = None
    email_key: str | None = None
    hashed_password: str | None = None
    is_guest: bool = False
    age: int | None = None
    avatar: str | None = None
    coins: int = 1000
    stats: UserStats = Field(default_factory=UserStats)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @field_serializer("id")
    def serialize_object_id(self, value: ObjectId | None) -> str | None:
        return str(value) if value is not None else None


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=32, pattern=r"^[A-Za-z0-9_.-]+$")
    email: EmailStr | None = None
    password: str = Field(min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def enforce_bcrypt_byte_limit(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password must be at most 72 UTF-8 bytes")
        return value


class LoginRequest(BaseModel):
    username_or_email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("password")
    @classmethod
    def enforce_bcrypt_byte_limit(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password must be at most 72 UTF-8 bytes")
        return value


class GuestRequest(BaseModel):
    username: str = Field(min_length=1, max_length=32)

    @field_validator("username")
    @classmethod
    def clean_username(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Username must not be empty")
        return value


class OnboardRequest(BaseModel):
    username: str = Field(min_length=2, max_length=30)
    age: int = Field(ge=4, le=120)

    @field_validator("username")
    @classmethod
    def clean_username(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 2:
            raise ValueError("Name must contain at least 2 characters")
        return value


class PublicUser(BaseModel):
    id: str
    username: str
    email: EmailStr | None
    is_guest: bool
    age: int | None = None
    avatar: str | None
    coins: int
    stats: UserStats


class AuthResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    user: PublicUser


class FinalScore(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    player1: int = Field(ge=0, le=1_000_000, alias="p1")
    player2: int = Field(ge=0, le=1_000_000, alias="p2")


class MatchEndRequest(BaseModel):
    match_id: str = Field(min_length=1, max_length=80)
    game_type: GameType
    player2_id: str | None = None
    player2_is_ai: bool = False
    winner: Literal[1, 2, "draw"]
    final_score: FinalScore
    turns: int = Field(ge=0, le=10000)


class MatchDocument(BaseModel):
    match_id: str
    game_type: GameType
    player1_id: str
    player2_id: str | None
    player2_is_ai: bool
    winner_id: str | None
    winner: Literal[1, 2, "draw"]
    final_score: FinalScore
    turns: int = Field(ge=0, le=10000)
    ended_at: datetime


class LeaderboardDocument(BaseModel):
    user_id: str
    username: str
    game_type: GameType
    wins: int = Field(ge=0)
    points: int = Field(ge=0)


class LeaderboardEntry(BaseModel):
    username: str
    game_type: GameType
    wins: int
    points: int
    crowns: int
