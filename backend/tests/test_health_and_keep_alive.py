import asyncio
import unittest
from unittest.mock import AsyncMock, MagicMock, call, patch
from urllib.error import URLError

from fastapi.responses import PlainTextResponse

from backend.keep_alive import (
    HEALTH_CHECK_URL,
    KEEP_ALIVE_INTERVAL_SECONDS,
    REQUEST_TIMEOUT_SECONDS,
    ping_health_endpoint,
    run_keep_alive,
)
from backend.main import app
from backend.routes.health import root_router


class HealthRouteTests(unittest.IsolatedAsyncioTestCase):
    async def test_root_health_route_returns_plain_text_ok(self) -> None:
        route = next(route for route in root_router.routes if route.path == "/health")

        self.assertIn("/health", app.openapi()["paths"])
        self.assertIs(route.response_class, PlainTextResponse)
        self.assertEqual(route.status_code, 200)
        self.assertEqual(await route.endpoint(), "OK")


class KeepAliveTests(unittest.IsolatedAsyncioTestCase):
    def test_ping_logs_success_status(self) -> None:
        response = MagicMock()
        response.status = 200
        response.__enter__.return_value = response

        with patch("backend.keep_alive.urlopen", return_value=response) as mocked_urlopen:
            with self.assertLogs("backend.keep_alive", level="INFO") as logs:
                status_code = ping_health_endpoint()

        mocked_urlopen.assert_called_once_with(
            HEALTH_CHECK_URL,
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
        self.assertEqual(status_code, 200)
        self.assertIn("status 200", logs.output[0])

    def test_ping_logs_network_errors(self) -> None:
        with patch("backend.keep_alive.urlopen", side_effect=URLError("offline")):
            with self.assertLogs("backend.keep_alive", level="WARNING") as logs:
                status_code = ping_health_endpoint()

        self.assertIsNone(status_code)
        self.assertIn("ping failed", logs.output[0])

    async def test_keep_alive_waits_fourteen_minutes_between_pings(self) -> None:
        sleep = AsyncMock(side_effect=[None, asyncio.CancelledError])
        to_thread = AsyncMock(return_value=200)

        with patch("backend.keep_alive.asyncio.sleep", sleep), patch(
            "backend.keep_alive.asyncio.to_thread",
            to_thread,
        ):
            with self.assertRaises(asyncio.CancelledError):
                await run_keep_alive()

        sleep.assert_has_awaits([call(KEEP_ALIVE_INTERVAL_SECONDS)] * 2)
        to_thread.assert_awaited_once_with(ping_health_endpoint)


if __name__ == "__main__":
    unittest.main()
