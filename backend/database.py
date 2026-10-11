from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING

from backend.config import get_settings

settings = get_settings()
mongo_client = AsyncIOMotorClient(
    settings.mongo_uri.get_secret_value(),
    serverSelectionTimeoutMS=5000,
    connectTimeoutMS=10000,
    maxPoolSize=10,
    minPoolSize=0,
    retryWrites=True,
)
database = mongo_client.get_database(settings.db_name)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    app.state.mongo_client = mongo_client
    app.state.database = database
    await database.command("ping")
    await database.users.create_index("username_key", unique=True)
    await database.users.create_index(
        "email_key",
        unique=True,
        partialFilterExpression={"email_key": {"$type": "string"}},
    )
    await database.matches.create_index("match_id", unique=True)
    await database.leaderboard.create_index(
        [("game_type", ASCENDING), ("wins", DESCENDING), ("points", DESCENDING)]
    )
    await database.leaderboard.create_index(
        [("game_type", ASCENDING), ("user_id", ASCENDING)],
        unique=True,
    )
    yield


def get_database(request: Request) -> AsyncIOMotorDatabase:
    database = getattr(request.app.state, "database", None)
    if database is None:
        raise RuntimeError("Database is unavailable outside the application lifespan")
    return database
