import unittest

from fastapi.responses import PlainTextResponse

from backend.main import app, handler
from backend.routes.health import root_router
from mangum import Mangum


class HealthRouteTests(unittest.IsolatedAsyncioTestCase):
    def test_serverless_handler_wraps_fastapi_app(self) -> None:
        self.assertIsInstance(handler, Mangum)

    async def test_root_health_route_returns_plain_text_ok(self) -> None:
        route = next(route for route in root_router.routes if route.path == "/health")

        self.assertIn("/health", app.openapi()["paths"])
        self.assertIs(route.response_class, PlainTextResponse)
        self.assertEqual(route.status_code, 200)
        self.assertEqual(await route.endpoint(), "OK")


if __name__ == "__main__":
    unittest.main()
