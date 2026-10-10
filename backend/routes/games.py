from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import DuplicateKeyError

from backend.database import get_database
from backend.models import GameType, MatchDocument, MatchEndRequest
from backend.security import get_current_user

router = APIRouter(prefix="/api/games", tags=["games"])
WIN_COINS = 100
LOSS_COINS = 25
DRAW_COINS = 50


@router.post("/match-end", status_code=status.HTTP_201_CREATED)
async def record_match(
    payload: MatchEndRequest,
    database: AsyncIOMotorDatabase = Depends(get_database),
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, str]:
    user_id = user["_id"]
    if payload.player2_id == str(user_id):
        raise HTTPException(status_code=422, detail="A player cannot play against themselves")
    if payload.player2_id is not None and not ObjectId.is_valid(payload.player2_id):
        raise HTTPException(status_code=422, detail="Invalid player2_id")

    opponent = None
    if payload.player2_id:
        opponent = await database.users.find_one({"_id": ObjectId(payload.player2_id)})
        if opponent is None:
            raise HTTPException(status_code=404, detail="Opponent not found")

    game_type: GameType = payload.game_type
    player1_score = payload.final_score.player1
    player2_score = payload.final_score.player2
    winner_id = (
        user_id
        if payload.winner == 1
        else opponent["_id"]
        if payload.winner == 2 and opponent is not None
        else None
    )
    ended_at = datetime.now(timezone.utc)
    match_document = MatchDocument(
        match_id=payload.match_id,
        game_type=game_type,
        player1_id=str(user_id),
        player2_id=str(opponent["_id"]) if opponent else None,
        player2_is_ai=payload.player2_is_ai,
        winner_id=str(winner_id) if winner_id else None,
        winner=payload.winner,
        final_score=payload.final_score,
        turns=payload.turns,
        ended_at=ended_at,
    ).model_dump(mode="python")
    stats_path = f"stats.{game_type.value}"
    player1_delta = {
        f"{stats_path}.played": 1,
        f"{stats_path}.score": player1_score,
        "coins": WIN_COINS if payload.winner == 1 else DRAW_COINS if payload.winner == "draw" else LOSS_COINS,
    }
    if payload.winner == 1:
        player1_delta[f"{stats_path}.won"] = 1
    elif payload.winner == 2:
        player1_delta[f"{stats_path}.lost"] = 1

    try:
        async with await database.client.start_session() as session:
            async with session.start_transaction():
                await database.matches.insert_one(match_document, session=session)
                await database.users.update_one(
                    {"_id": user_id},
                    {"$inc": player1_delta},
                    session=session,
                )
                await database.leaderboard.update_one(
                    {"game_type": game_type.value, "user_id": str(user_id)},
                    {
                        "$set": {"username": user["username"]},
                        "$inc": {
                            "wins": 1 if payload.winner == 1 else 0,
                            "points": player1_score,
                        },
                    },
                    upsert=True,
                    session=session,
                )
                if opponent is not None:
                    player2_delta = {
                        f"{stats_path}.played": 1,
                        f"{stats_path}.score": player2_score,
                        "coins": WIN_COINS if payload.winner == 2 else DRAW_COINS if payload.winner == "draw" else LOSS_COINS,
                    }
                    if payload.winner == 2:
                        player2_delta[f"{stats_path}.won"] = 1
                    elif payload.winner == 1:
                        player2_delta[f"{stats_path}.lost"] = 1
                    await database.users.update_one(
                        {"_id": opponent["_id"]},
                        {"$inc": player2_delta},
                        session=session,
                    )
                    await database.leaderboard.update_one(
                        {"game_type": game_type.value, "user_id": str(opponent["_id"])},
                        {
                            "$set": {"username": opponent["username"]},
                            "$inc": {
                                "wins": 1 if payload.winner == 2 else 0,
                                "points": player2_score,
                            },
                        },
                        upsert=True,
                        session=session,
                    )
    except DuplicateKeyError as error:
        raise HTTPException(status_code=409, detail="This match was already recorded") from error

    return {"status": "recorded", "match_id": match_document["match_id"]}
