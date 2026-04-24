# Supabase Auth (Google / Apple) setup

This app uses **Supabase Auth** for social sign-in on mobile (`ovi-frontend`) and **FastAPI** verifies Supabase JWTs (JWKS) while keeping optional **legacy email/password** tokens.

## 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. **Authentication → Providers**: enable **Google** and **Apple** (Apple requires Apple Developer Program: Services ID, Team ID, Key ID, private key).
3. **Authentication → URL configuration** → **Redirect URLs**: add every URL your Expo app can return to after OAuth. Include at least:
   - `ovi://auth/callback` (custom scheme from [`app.json`](../ovi-frontend/app.json) `scheme`)
   - Expo dev client / Expo Go patterns, e.g. `exp://127.0.0.1:8081/--/auth/callback` (run `npx expo start` and log `AuthSession.makeRedirectUri` output to capture yours)
   - Any **EAS** / production redirect URIs you use for builds

The client uses `AuthSession.makeRedirectUri({ scheme: 'ovi', path: 'auth/callback' })`. On React Native, the Supabase client uses **`flowType: 'implicit'`** because Hermes often lacks `crypto.subtle`, which otherwise forces weak PKCE (`plain`) and can cause a **blank OAuth web view**. The callback may contain `#access_token=...` (implicit) or `?code=...` (PKCE); both are handled in `app/services/supabaseOAuth.ts`.

Entry loads **`react-native-get-random-values`** and **`react-native-url-polyfill`** first (see `index.ts`), which Supabase recommends for React Native.

### Blank white screen on Android (Chrome Custom Tab)

Supabase’s authorize endpoint can return an empty body with a restrictive CSP before redirecting to Google. Some Android Custom Tabs stay on that blank page. The app uses **`openSupabaseOAuthBrowser`** ([`app/services/oauthBrowser.ts`](../ovi-frontend/app/services/oauthBrowser.ts)) to resolve the first redirect with `fetch(..., { redirect: 'manual' })` and open **Google/Apple** directly, plus `createTask: false` for the auth session.

### Android emulator checklist

1. **`EXPO_PUBLIC_SUPABASE_URL`** must be `https://<project-ref>.supabase.co` (no `db.` prefix).
2. **Supabase → Auth → Redirect URLs**: in dev, Metro logs `[OAuth] redirectUri (must be allowlisted in Supabase): …` — paste that **exact** value here (it may differ slightly from `ovi://auth/callback` depending on the build).
3. **Backend after Google**: the app calls your API (`/users/me`). On the emulator, `localhost` means the emulator itself. The app uses **`http://10.0.2.2:8000`** when it detects an emulator; if sign-in works in the browser but the app then errors, set **`EXPO_PUBLIC_API_URL=http://10.0.2.2:8000`** in `.env` and ensure **uvicorn** listens on `0.0.0.0` (e.g. `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`) so the emulator can reach the host.
4. **Google Cloud (Web client)**: **Authorized redirect URI** must include `https://<project-ref>.supabase.co/auth/v1/callback`.

## 2. Frontend (`ovi-frontend`)

Use the **anon** public key only (never commit the **service_role** key).

Create `ovi-frontend/.env` (see [`.env.example`](../ovi-frontend/.env.example)):

```bash
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

You can also set `expo.extra.supabaseUrl` / `expo.extra.supabaseAnonKey` in `app.json` for local convenience (keep secrets out of git).

## 3. Backend (`backend`)

Required:

- `SUPABASE_URL` – project URL  
- `SUPABASE_KEY` – service or anon key (used elsewhere if needed; **JWT verification uses JWKS**, not this secret)

Optional overrides (defaults are derived from `SUPABASE_URL`):

- `SUPABASE_JWKS_URL` – default `{SUPABASE_URL}/auth/v1/keys`
- `SUPABASE_JWT_ISSUER` – default `{SUPABASE_URL}/auth/v1`
- `SUPABASE_JWT_AUDIENCE` – default `authenticated`

After changing the User model, run:

```bash
cd backend && alembic upgrade head
```

## 4. How tokens work

- **Legacy login**: `POST /auth/login` returns your API’s JWT; store as today.
- **Supabase OAuth**: Supabase `access_token` is stored in the same `auth_token` key; `auth_provider` is set to `supabase`. The axios interceptor refreshes via `supabase.auth.refreshSession` when `auth_provider === 'supabase'`.

## 5. Account linking

If a user has an email/password account and later signs in with Google/Apple, use `POST /auth/link-supabase` with a valid Supabase access token while authenticated with a legacy JWT (see OpenAPI `/docs`).

## 6. Security notes

- Rotate any **service_role** key that was ever committed to a repository.
- Only the **anon** key belongs in the mobile app.
- Backend must validate Supabase JWTs with **JWKS** (signature + `iss` + `aud` + expiry) — implemented in `backend/app/core/supabase_jwt.py`.
