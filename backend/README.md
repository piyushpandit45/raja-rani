# Backend setup

Requires Python 3.10+ and a MongoDB Atlas URI with a database name.

From the repository root:

```powershell
py -3 -m venv backend\.venv
backend\.venv\Scripts\python -m pip install -r backend\requirements.txt
Copy-Item backend\.env.example backend\.env
```

Set `MONGO_URI`, `DB_NAME`, and a strong random `SECRET_KEY` in `backend\.env`.
The root `.env` is also loaded, with `backend\.env` taking precedence. Do not
commit credentials to source control; rotate credentials that have been shared
outside your secret store.

Run from the repository root:

```powershell
backend\.venv\Scripts\python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

For local Expo development, the app derives the API host from Expo's Metro host
and uses port `8000`. The backend must listen on `0.0.0.0` so an Android device
or emulator can reach it. If Metro and the API are on different hosts, set
`EXPO_PUBLIC_API_URL` to the API's reachable base URL (for example,
`http://192.168.1.20:8000`) and restart Expo. Use a LAN address for a physical
device; `localhost` on the device refers to the device itself.

The service exposes `GET /health` as a plain-text process health check and
retains `GET /api/health` for a database connectivity check. The MongoDB client
is created once per serverless instance and reused across warm invocations; the
connection pool is capped to limit connections when Vercel scales out.

## Vercel deployment

Deploy from the repository root so Vercel can load `vercel.json`, the root
`main.py` handler, and `requirements.txt`. Configure `MONGO_URI`, `DB_NAME`, and
a unique random `SECRET_KEY` as Vercel environment variables. The other backend
settings are optional and use their documented defaults.

Set `EXPO_PUBLIC_API_URL` to the deployed Vercel base URL in the EAS
`production` environment (and in the root `.env` for local Expo builds). The
production EAS profile reads this environment instead of embedding a
provider-specific URL in source control.
