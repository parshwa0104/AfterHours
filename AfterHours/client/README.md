# AfterHours Client

AfterHours is a calm, post-work productivity app designed around low-pressure momentum.

This client is built with React + Vite and currently includes:

- **Dashboard** with energy-based task filtering and 15-minute task cards
- **Focus Zone** with a 25-minute session timer and integrated brown-noise activation
- **Skill Sanctuary** that fetches collaboration offers from the server API
- **Garden** page that visualizes streak growth and local progress history
- **Offline-friendly local persistence** via IndexedDB (`taskTreeCache`)

## Tech stack

- React 19
- React Router
- Vite
- ESLint

## Project structure

- `src/App.jsx` — app shell, top header, bottom navigation, routes
- `src/pages/Dashboard.jsx` — main task flow
- `src/pages/ZonePage.jsx` — deep-work timer controls
- `src/pages/SanctuaryPage.jsx` — collaboration offer feed
- `src/pages/GardenPage.jsx` — streak + completed task recap
- `src/hooks/useAudioEngine.js` — Web Audio brown noise generation
- `src/hooks/useHeadphones.js` — headphone device-change detection
- `src/lib/taskTreeCache.js` — IndexedDB persistence layer

## Environment variables

The app reads this variable in the client:

- `VITE_API_BASE_URL` (default: `http://localhost:5000`)

Set it in the workspace `.env` file at the repo root.

Server also requires:

- `JWT_SECRET` (long random string for signing auth tokens)

## Local development

1. Install dependencies in both `client` and `server`.
2. Start the server (default `:5000`).
3. Start the client (default `:5173`).

Once both are running, the **Sanctuary** tab auto-loads data from `/api/offers`.

## How to check localhost (quick verification)

After starting both apps:

- Client UI: `http://localhost:5173`
- Server health: `http://localhost:5000/health` (should return `{ "ok": true }`)
- API data: `http://localhost:5000/api/offers` (JSON array; may be empty)

What to test in browser:

1. Open `http://localhost:5173` and verify the app renders.
2. Switch to **Sanctuary** tab and confirm:
	- If server is running, offers load or empty-state appears.
	- If server is off, you see the graceful fallback error message.
3. Switch to **Zone** tab and start a session to verify timer + progress bar.
4. Switch to **Garden** tab and confirm streak/recap render from local cache.

## How to add a Dream and Tasks (right now)

In the **Dashboard** page:

1. Use **Dream title** input to set your current dream.
2. In **New micro-task**, enter task title.
3. Optionally set category, difficulty, and offline toggle.
4. Click **+ Add task**.

This saves locally in IndexedDB, so refresh keeps your data.

## Make it multi-user (use with friends)

The backend now includes Dream/Task APIs for collaboration.

### Recommended local flow

1. Create users (`POST /api/users`) for you and your friends.
2. Create a dream (`POST /api/dreams`) with your user id as owner.
3. Invite friends (`POST /api/dreams/:dreamId/members`) using their user ids.
4. Create tasks in that dream (`POST /api/dreams/:dreamId/tasks`).
5. Fetch shared dreams for each person (`GET /api/dreams?userId=...`).
6. Update task status/assignment (`PATCH /api/tasks/:taskId`).

### API summary

- `GET /api/dreams?userId=<userId>`
- `POST /api/dreams`
- `POST /api/dreams/:dreamId/members`
- `GET /api/dreams/:dreamId/tasks`
- `POST /api/dreams/:dreamId/tasks`
- `PATCH /api/tasks/:taskId`

## JWT auth (now enabled)

Use these auth routes:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (requires bearer token)

The client header now has a login/register panel. After signing in:

- the app stores JWT in localStorage,
- Dashboard syncs dream/tasks from protected APIs,
- task completion updates are written back to server.

### Auth request format

For protected endpoints, send:

- `Authorization: Bearer <jwt_token>`

## Host backend on Render (free tier)

This is the recommended order so your mobile/web clients can talk to a stable URL.

### 1) Push backend code to GitHub

Render deploys from a Git repository, so make sure `AfterHours/server` is committed and pushed.

### 2) Create a new **Web Service** in Render

In Render dashboard:

1. **New +** → **Web Service**
2. Connect your GitHub repo
3. Configure:
	- **Root Directory**: `AfterHours/server`
	- **Runtime**: Node
	- **Build Command**: `npm install`
	- **Start Command**: `npm start`

### 3) Add environment variables in Render

Set these in Render service settings:

- `MONGODB_URI` = your MongoDB Atlas connection string
- `JWT_SECRET` = long random secret (at least 32 chars)
- `CLIENT_ORIGIN` = your frontend URL (for local testing: `http://localhost:5173`)

Notes:

- Do **not** set `PORT` manually on Render unless needed; Render injects it.
- Keep `JWT_SECRET` private and rotate if leaked.

### 4) Deploy and verify

After first deploy, open:

- `https://<your-render-service>.onrender.com/health`

Expected response:

- `{ "ok": true }`

If health works, your backend is live.

### 5) Point client to Render backend

Set your frontend env var to the deployed backend URL:

- `VITE_API_BASE_URL=https://<your-render-service>.onrender.com`

Then rebuild/resync client before APK generation.

## Keep backend active on free tier (important reality check)

Free tiers often sleep after inactivity. You can reduce cold starts (not guarantee 24/7 uptime) by pinging health endpoint on a schedule.

### Warm-up options

- UptimeRobot (monitor every ~10–14 minutes)
- cron-job.org
- GitHub Actions scheduled workflow

Ping URL:

- `https://<your-render-service>.onrender.com/health`

### Make cold starts user-friendly

In the client UI:

- Show “Waking server…” message on first request
- Retry failed request once after 2–3 seconds
- Keep timeout/error copy friendly

## Scripts

- `npm run dev` — start Vite dev server
- `npm run build` — production build
- `npm run lint` — run ESLint checks
- `npm run preview` — preview production build locally
- `npm run mobile:sync` — build web + sync Android project
- `npm run mobile:open` — open Android project in Android Studio
- `npm run mobile:run` — sync and run Android target

## Build Android APK (download-ready app)

This project is now configured with Capacitor for Android packaging.

### 1) Prerequisites

- Node.js + npm
- Android Studio (with SDK + platform tools)
- Java 17+ (usually bundled with Android Studio)

### 2) First-time setup

From `client/`:

1. Run `npm install`
2. Run `npm run mobile:sync`
3. Run `npm run mobile:open`

Android Studio opens the native project.

### 3) Build debug APK

In Android Studio:

- **Build → Build Bundle(s) / APK(s) → Build APK(s)**

APK output path is shown in the Android Studio notification (usually under `android/app/build/outputs/apk/debug/`).

### 4) Build release APK

In Android Studio:

- **Build → Generate Signed Bundle / APK**
- Choose **APK**
- Create/select keystore
- Choose release variant

This generates an installable signed APK for sharing.

### 5) Install on phone

- Copy APK to phone
- Enable “Install unknown apps” for your file manager/browser
- Tap APK and install

## Current status

Implemented in this iteration:

- Replaced route placeholders with functional pages
- Connected Sanctuary tab to the backend offers API
- Added Zone timer controls for explicit session start/stop
- Added Garden recap page with reset capability
- Added JWT auth endpoints + client login/register panel
- Added multi-user protected Dream/Task APIs
- Added Android Capacitor setup for APK packaging
- Replaced template README with real product documentation

## Suggested next improvements

- Add create-offer form in the Sanctuary tab (POST `/api/offers`)
- Add optimistic UI + retry behavior for API failures
- Add automated tests for timer logic and IndexedDB hydration
- Add invite links + email-based teammate onboarding
