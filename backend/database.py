import asyncio
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI, Request
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING

from backend.config import get_settings
from backend.keep_alive import run_keep_alive


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    client = AsyncIOMotorClient(
        settings.mongo_uri.get_secret_value(),
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=10000,
        maxPoolSize=50,
        minPoolSize=2,
        retryWrites=True,
    )
    app.state.mongo_client = client
    app.state.database = client.get_database(settings.db_name)
    keep_alive_task: asyncio.Task[None] | None = None
    try:
        await app.state.database.command("ping")
        await app.state.database.users.create_index("username_key", unique=True)
        await app.state.database.users.create_index(
            "email_key",
            unique=True,
            partialFilterExpression={"email_key": {"$type": "string"}},
        )
        await app.state.database.matches.create_index("match_id", unique=True)
        await app.state.database.leaderboard.create_index(
            [("game_type", ASCENDING), ("wins", DESCENDING), ("points", DESCENDING)]
        )
        await app.state.database.leaderboard.create_index(
            [("game_type", ASCENDING), ("user_id", ASCENDING)],
            unique=True,
        )
        keep_alive_task = asyncio.create_task(
            run_keep_alive(),
            name="render-keep-alive",
        )
        yield
    finally:
        try:
            if keep_alive_task is not None:
                keep_alive_task.cancel()
                with suppress(asyncio.CancelledError):
                    await keep_alive_task
        finally:
            client.close()


def get_database(request: Request) -> AsyncIOMotorDatabase:
    database = getattr(request.app.state, "database", None)
    if database is None:
        raise RuntimeError("Database is unavailable outside the application lifespan")
    return database
