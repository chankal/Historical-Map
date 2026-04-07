# South-View Cemetery Historical Map — Technical & Instructional Guide

**Handoff documentation for non-technical partners.**  
This guide covers everything you need to use, update, and maintain the project without contacting the original developers.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Live URLs](#3-live-urls)
4. [Account Credentials & Platform Information](#4-account-credentials--platform-information)
5. [Environment Variables & Configuration](#5-environment-variables--configuration)
6. [How to Use the Admin Panel (No Coding Required)](#6-how-to-use-the-admin-panel-no-coding-required)
7. [API Endpoints & Descriptions](#7-api-endpoints--descriptions)
8. [Codebase Structure](#8-codebase-structure)
9. [Data Model](#9-data-model)
10. [How the App Works End-to-End](#10-how-the-app-works-end-to-end)
11. [Running the Project Locally (Developer Reference)](#11-running-the-project-locally-developer-reference)
12. [Deploying Updates to Render](#12-deploying-updates-to-render)
13. [Integrating with the SVC Original Website](#13-integrating-with-the-svc-original-website)
14. [Fallback Data (Offline Mode)](#14-fallback-data-offline-mode)
15. [Troubleshooting](#15-troubleshooting)

---

## 1. Project Overview

This is an interactive web application for South-View Cemetery that lets visitors explore a historical tour of notable figures buried at the cemetery. Each person has their own page with a photo, biographical description, address, and an optional link to their obituary. A map with numbered pins shows where each stop on the tour is located. Users can get directions to any stop directly from the app.

The site is fully managed through an admin panel — no coding is required to add, edit, or remove entries.

---

## 2. Tech Stack

### React (Frontend)
The user-facing website is built with **React 19**, a JavaScript framework for building interactive web pages. It handles everything the visitor sees: the tour list, the map, individual entry pages, and the admin panel. The frontend is hosted on Render and served as a static site.

- **React Router** manages navigation between pages (e.g., `/tours`, `/entry/john-lewis`, `/admin/dashboard`).
- **Leaflet.js** renders the interactive map with numbered pins.
- **Google Maps API** is used for Street View embeds on entry pages (requires an API key).

### Django (Backend)
The backend is built with **Django 5** and **Django REST Framework**. It is the "brain" of the application — it stores data, handles login, processes image uploads, and auto-geocodes addresses into map coordinates.

- Runs as a separate service on Render.
- Exposes a REST API that the React frontend calls to fetch and modify data.
- Handles all admin authentication via secure, time-limited tokens.

### Supabase (PostgreSQL Database + Image Storage)
**Supabase** provides two services:
1. **PostgreSQL database** — stores all historical entry data (names, descriptions, addresses, image URLs, coordinates).
2. **Object Storage** — stores uploaded images. When you upload a photo through the admin panel, it is saved to the `historical-images` bucket in Supabase and a public URL is stored in the database.

### Render (Hosting)
**Render** hosts both the frontend and the backend as separate web services. Render automatically redeploys both services whenever new code is pushed to the connected GitHub repository. It also holds the secret environment variables (passwords, API keys) so they are never hard-coded in the source code.

### OpenStreetMap / Nominatim (Map Pins & Geocoding)
**OpenStreetMap** tile layers power the visual map on the All Entries page. When a new entry is saved with an address, the backend automatically calls the **Nominatim** geocoding API (a free, no-key-required service) to convert that address into latitude/longitude coordinates, which are stored in the database and used to place pins on the map.

### Google Maps API (Street View)
A **Google Maps API key** is used to display the Street View embed on individual entry pages. This requires a valid, active API key from the Google Cloud Console. See [Section 5](#5-environment-variables--configuration) for where to put it.

---

## 3. Live URLs

| Page | URL |
|---|---|
| Main / Tours Landing Page | https://southview-map-app.onrender.com/ |
| All Entries & Map | https://southview-map-app.onrender.com/all-entries |
| Individual Entry (example) | https://southview-map-app.onrender.com/entry/john-lewis |
| Admin Login | https://southview-map-app.onrender.com/admin |
| Admin Dashboard | https://southview-map-app.onrender.com/admin/dashboard |
| Backend API (base) | https://southview-map-api.onrender.com/api/ |

> **Note:** Render's free tier spins down services after 15 minutes of inactivity. The first visit after a period of inactivity may take 30–60 seconds to load. This is normal — it is not broken.

---

## 4. Account Credentials & Platform Information

### Render (Hosting)
- **URL:** https://render.com
- **Services:** `southview-map-app` (frontend), `southview-map-api` (backend)
- *(Log in with the account that was used when the project was created — contact the original developers for the login email/password.)*

### Supabase (Database & Storage)
- **URL:** https://supabase.com
- **Project reference ID:** `hwsjlnwkagkcpczypulz`
- **Dashboard URL:** https://supabase.com/dashboard/project/hwsjlnwkagkcpczypulz
- *(Log in with the account used when the project was created.)*
- **Storage bucket (images):** `historical-images` — all uploaded entry photos are stored here.

### Admin Panel (In-App)
- **Login URL:** https://southview-map-app.onrender.com/admin
- **Password:** `SouthViewCemetery1886!`
- The admin session lasts **24 hours**. After that, you will be redirected to the login page automatically.

### Google Cloud (Google Maps API Key)
- **URL:** https://console.cloud.google.com
- The API key is stored as an environment variable `REACT_APP_GOOGLE_MAPS_API_KEY` on Render. See [Section 5](#5-environment-variables--configuration).

---

## 5. Environment Variables & Configuration

Environment variables are secret configuration values that the app reads at runtime. **They are never stored in the codebase** — they are configured directly on Render's dashboard and in local `.env` files for development.

### Frontend Environment Variables

Set these in Render under the `southview-map-app` service → **Environment**.

```
REACT_APP_API_URL=https://southview-map-api.onrender.com/api
REACT_APP_GOOGLE_MAPS_API_KEY=<your Google Maps API key here>
REACT_APP_TOUR_VIDEO_URL=https://hwsjlnwkagkcpczypulz.supabase.co/storage/v1/object/public/aerial-view-video/20624152-hd_1920_1080_30fps.mp4
```

For **local development**, create a file called `.env` inside `frontend/my-app/` with the same contents. The file must start with `REACT_APP_` for React to pick up the variables.

### Backend Environment Variables

Set these in Render under the `southview-map-api` service → **Environment**.

```
ADMIN_PASSWORD=SouthViewCemetery1886!
DATABASE_URL=postgresql://postgres.hwsjlnwkagkcpczypulz:SouthviewCemetary1886!@aws-1-us-east-2.pooler.supabase.com:5432/postgres
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3c2psbndrYWdrY3BjenlwdWx6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjkwNTM2OSwiZXhwIjoyMDg4NDgxMzY5fQ.d9BjwbNjtnxbeN4vQ-AjIG19TuSBV1tUGMC-vva_eNw
SUPABASE_URL=https://hwsjlnwkagkcpczypulz.supabase.co
```

For **local development**, create a file called `.env` inside `backend/` with the same contents.

> **Important:** If you ever rotate (change) the Supabase keys or the admin password, update them in both Render's environment settings AND your local `.env` files.

---

## 6. How to Use the Admin Panel (No Coding Required)

The admin panel is the primary way to manage tour content. You do **not** need to know how to code to use it.

### Step 1 — Log In
1. Go to https://southview-map-app.onrender.com/admin
2. Type the admin password: `SouthViewCemetery1886!`
3. Click **Sign In**. You will be redirected to the dashboard.

> If the page takes a long time to respond, wait up to 60 seconds — the free Render tier may be "waking up."

### Step 2 — View All Entries
Once logged in, you will see a table listing every entry in the database with its name, address, image thumbnail, and action buttons.

---

### Adding a New Entry

1. Click the **+ Add Entry** button in the top right.
2. Fill out the form:
   - **Name** *(required)* — Full name of the person (e.g., `Hank Aaron`)
   - **Blurb** *(required)* — A short subtitle line (e.g., `Hall of Fame Athlete & Executive`)
   - **Description** — The full biographical text. Use tab characters or blank lines to format paragraphs.
   - **Address** — The street address of the commemorative site or associated location (e.g., `755 Hank Aaron Dr SE, Atlanta, GA 30315`). **This is used to automatically place the map pin.** If an address is provided, the system will geocode it automatically — you do not need to enter coordinates manually.
   - **Obituary URL** — Optional. A full URL link (starting with `https://`) to an obituary or memorial page that will open when a visitor clicks "Memories" on the entry page.
3. Click **Choose file** under the image field and select a photo from your computer. Common formats (JPG, PNG, WEBP) are all supported.
4. Click **Save**. The entry will appear on the live site immediately.

---

### Editing an Existing Entry

1. Find the entry in the dashboard table.
2. Click the **Edit** button on that row.
3. Update any fields in the form. To replace the image, upload a new file — if you leave the image field blank, the existing image is kept.
4. Click **Save**.

---

### Deleting an Entry

1. Find the entry in the dashboard table.
2. Click the **Delete** button on that row.
3. A confirmation dialog will appear — click **Delete** again to confirm. This action **cannot be undone**.

---

### Logging Out
Click the **Log Out** button in the top right of the dashboard. Your session is also automatically invalidated after 24 hours.

---

## 7. API Endpoints & Descriptions

The backend exposes the following API endpoints, all under the base URL `https://southview-map-api.onrender.com/api/`.

| Method | Endpoint | Auth Required | Description |
|--------|----------|--------------|-------------|
| `GET` | `/api/all/` | No | Returns a list of all historical entries with full details (name, slug, details JSON, image URL). Used by the All Entries page and the Entry page. |
| `GET` | `/api/entry/<slug>/` | No | Returns a single entry looked up by its URL slug (e.g., `/api/entry/john-lewis/`). Used by individual entry pages. |
| `GET` | `/api/entries/` | No | Standard REST list endpoint — returns all entries. |
| `GET` | `/api/entries/<id>/` | No | Returns a single entry by its numeric database ID. |
| `POST` | `/api/entries/` | **Yes** | Creates a new entry. Expects a `multipart/form-data` body with `name`, `details` (JSON string), and optionally `image_upload` (file). |
| `PATCH` | `/api/entries/<id>/` | **Yes** | Partially updates an existing entry. Same body format as POST. |
| `DELETE` | `/api/entries/<id>/` | **Yes** | Deletes an entry by ID. |
| `POST` | `/api/admin-auth/login/` | No | Accepts `{"password": "..."}` and returns `{"token": "..."}` on success. The token must be stored and sent as `Authorization: Bearer <token>` in all write requests. |
| `GET` | `/api/admin-auth/verify/` | **Yes** | Verifies that a stored token is still valid. Returns `{"valid": true}` or `401 Unauthorized`. |

**Auth Required** means the request must include an `Authorization: Bearer <token>` header, where the token was obtained from the `/admin-auth/login/` endpoint. Tokens are valid for **24 hours**.

#### Details JSON Structure
When creating or editing an entry, the `details` field is a JSON object with these keys:

```json
{
  "blurb": "Short subtitle line",
  "description": "Full biographical description text",
  "address": "Full street address for geocoding and directions",
  "obituary": "https://link-to-obituary.com",
  "lat": 33.745,
  "lng": -84.39
}
```

`lat` and `lng` are populated automatically by the backend when a valid address is provided. You can also supply them manually to override geocoding results.

---

## 8. Codebase Structure

```
Historical-Map/
├── backend/                   # Django REST API
│   ├── manage.py              # Django management script
│   ├── requirements.txt       # Python dependencies
│   ├── .env                   # Secret config (NOT in git)
│   ├── api/
│   │   ├── models.py          # HistoricalEntry database model
│   │   ├── serializers.py     # Converts model data to/from JSON; handles geocoding & image upload
│   │   ├── views.py           # API logic: login, CRUD endpoints, token auth
│   │   ├── urls.py            # URL routing for the API
│   │   ├── storage_utils.py   # Uploads images to Supabase Storage
│   │   └── migrations/        # Database schema version history
│   └── config/
│       ├── settings.py        # Django project settings (DB, CORS, installed apps)
│       └── urls.py            # Root URL config (mounts /api/ and /admin/)
│
└── frontend/my-app/           # React application
    ├── package.json           # Node.js dependencies
    ├── .env                   # Secret config for local dev (NOT in git)
    ├── public/
    │   └── _redirects         # Netlify/Render redirect rule for React Router
    └── src/
        ├── App.js             # Route definitions (all pages wired here)
        ├── contexts/
        │   └── GoogleMapsAPIContext.js   # Shares Google Maps API key across the app
        ├── data/
        │   └── fallbackData.js           # Hardcoded backup data used if API is down
        ├── images/                        # Static images bundled with the app
        ├── components/
        │   ├── Navbar.js/css             # Top navigation bar with logo & links
        │   ├── TourCard.js/css           # Reusable two-panel card layout
        │   ├── EntryCard.js/css          # Entry detail view (photo, bio, action buttons)
        │   └── MapWithPins.js/css        # Interactive Leaflet map with numbered pins
        └── pages/
            ├── SitesPage.js/css          # Landing page showing tour options
            ├── AllEntries.js/css         # Tour list + map side-by-side
            ├── EntryPage.js              # Individual person page (fetches by slug)
            ├── AdminLogin.js/css         # Password login for admin
            ├── AdminDashboard.js/css     # CRUD management table + modal forms
            └── UploadEntry.js/css        # (Legacy) standalone upload form
```

---

## 9. Data Model

There is a single database table: `HistoricalEntry`.

| Column | Type | Description |
|--------|------|-------------|
| `id` | Integer (auto) | Unique numeric identifier, assigned by the database |
| `name` | Text | Full name of the historical figure |
| `slug` | Text (unique) | URL-safe version of the name, auto-generated (e.g., `john-lewis`) |
| `details` | JSON | All other data: blurb, description, address, obituary URL, lat, lng |
| `image` | URL text | Public URL to the image stored in Supabase Storage |

The `details` JSON field is flexible — you can store additional key/value pairs inside it without changing the database schema.

---

## 10. How the App Works End-to-End

Understanding the data flow helps when troubleshooting.

### Public Visitor Flow
1. Visitor opens `https://southview-map-app.onrender.com/`
2. React loads the **SitesPage**, which shows a tour card with an aerial video flyover.
3. Clicking **Browse All Entries** navigates to `/all-entries`.
4. The **AllEntries** page fetches `GET /api/all/` from the backend and renders a list of stops on the left and an **OpenStreetMap** interactive map on the right with a numbered pin for each entry.
5. Clicking a pin or a stop in the list navigates to `/entry/<slug>`.
6. The **EntryPage** fetches `GET /api/entry/<slug>/` and displays the photo, name, blurb, full description, and two action buttons:
   - **Get Directions** — opens Google Maps in a new tab with directions to the entry's address.
   - **Memories** — opens the obituary URL in a new tab (if one is stored).
7. If the API is unreachable, the app automatically falls back to the hardcoded data in `fallbackData.js` and shows a warning banner.

### Admin Flow
1. Admin visits `/admin` and enters the password.
2. A request is sent to `POST /api/admin-auth/login/` with the password.
3. The backend compares the password against the `ADMIN_PASSWORD` environment variable using a constant-time comparison (prevents timing attacks).
4. On success, a signed **JWT-like token** is returned. The browser saves it in `localStorage`.
5. Every write request (create/edit/delete) sends this token in the `Authorization` header.
6. The backend verifies the token on every write. Tokens expire after **24 hours**.

### Image Upload Flow
1. Admin selects a photo in the add/edit form.
2. The frontend packages it as `multipart/form-data` and sends it to the backend.
3. The backend reads the image bytes and calls `upload_image_to_supabase()`.
4. The image is stored in the `historical-images` bucket in Supabase with a UUID filename.
5. The backend saves the **public URL** of that image in the `image` column of the database.
6. The frontend displays the image by loading that URL directly from Supabase.

### Geocoding Flow
1. When an entry is saved with an address, the backend serializer calls `_geocode_details()`.
2. It queries the **Nominatim API** (OpenStreetMap's free geocoder) with the address string.
3. The returned latitude and longitude are saved into the `details` JSON field.
4. The frontend reads `details.lat` and `details.lng` to place the map pin. No geocoding happens in the browser.

---

## 11. Running the Project Locally (Developer Reference)

This section is for developers who need to run the project on their own computer.

### Prerequisites
- **Python 3.10+** — https://www.python.org/downloads/
- **Node.js 18+** — https://nodejs.org/
- A copy of the `.env` files from Section 5

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
python manage.py migrate       # Creates database tables (first run only)
python manage.py runserver     # Starts API at http://127.0.0.1:8000
```

### Frontend Setup
```bash
cd frontend/my-app
npm install                    # Install dependencies (first run only)
npm start                      # Starts React at http://localhost:3000
```

### Local URLs
| Page | URL |
|------|-----|
| Tours page | http://localhost:3000/tours |
| All entries + map | http://localhost:3000/all-entries |
| Individual entry | http://localhost:3000/entry/john-lewis |
| Admin login | http://localhost:3000/admin |
| Admin dashboard | http://localhost:3000/admin/dashboard |
| API (backend) | http://127.0.0.1:8000/api/ |

> The local backend does **not** use Supabase for the database — it uses the `db.sqlite3` file in the `backend/` folder by default unless `DATABASE_URL` is set in `.env`.

---

## 12. Deploying Updates to Render

Render is connected to the GitHub repository and deploys automatically on every push to the main branch. To deploy a change:

1. Make and test your changes locally.
2. Commit them: `git add . && git commit -m "your message"`
3. Push: `git push origin main`
4. Render will detect the push and automatically rebuild and redeploy both the frontend and backend. This typically takes 2–5 minutes.

### Adding or Changing Environment Variables on Render
1. Log in to https://render.com
2. Click on the service (e.g., `southview-map-api`)
3. Click **Environment** in the left sidebar
4. Click **Add Environment Variable** or edit an existing one
5. Click **Save Changes** — Render will automatically redeploy the service with the new value

### Rebuilding the Frontend Manually
If the frontend needs to be rebuilt (e.g., after a `.env` change on Render):
1. Go to `southview-map-app` on Render
2. Click **Manual Deploy → Deploy latest commit**

---

## 13. Integrating with the SVC Original Website

The navigation bar in the app already contains two links to the South-View Cemetery website:
- **SOUTH-VIEW CEMETERY WEBSITE** → `https://southviewcemetery.com/`
- **CONTACT US** → `https://southviewcemetery.com/contact-us/`

### Embedding or Linking the App from the SVC Website
The simplest integration is to add a link from the SVC website to the tour app. For example:

```html
<a href="https://southview-map-app.onrender.com/" target="_blank">
  Explore Our Historical Tours
</a>
```

### Embedding as an iFrame
The app can also be embedded directly into a page on the SVC website using an `<iframe>`:

```html
<iframe
  src="https://southview-map-app.onrender.com/"
  width="100%"
  height="700px"
  style="border: none;"
  title="South-View Historical Tour"
></iframe>
```

> Note: Some website builders (like Squarespace or Wix) may restrict iFrame embedding from external domains. If embedding does not work, a simple link is the most reliable option.

---

## 14. Fallback Data (Offline Mode)

If the backend API is unreachable (e.g., Render's free tier is scaling down, or there is a server error), the frontend automatically displays data from a local file: `frontend/my-app/src/data/fallbackData.js`.

This file contains hardcoded information for the **10 original entries**:
John Wesley Dobbs, John Lewis, Alonzo Herndon, Charles L. Harper, Hank Aaron, Grace Towns Hamilton, Bazoline Estelle Usher, Herman J. Russell, Samuel H. Archer, and Jean Childs Young.

When fallback data is active, a **orange warning banner** appears at the top of the All Entries page: *"Live data is currently unavailable. Please contact an admin if this persists."*

**Important:** If you add new entries through the admin panel, they will **not** appear in offline/fallback mode. The fallback file must be updated manually by a developer if you want new entries to be available offline. The fallback file only serves as a safety net.

---

## 15. Troubleshooting

### The site loads very slowly or shows a blank screen
**Cause:** Render's free tier spins down services after inactivity.  
**Fix:** Wait up to 60 seconds and refresh. If it still doesn't load after 2 minutes, check the Render dashboard for any deploy errors.

---

### The map pins are not showing up for some entries
**Cause:** The entry's address could not be geocoded, or no address was entered.  
**Fix:** Go to the admin dashboard, edit the entry, and verify the address is a complete, valid street address (e.g., `755 Hank Aaron Dr SE, Atlanta, GA 30315`). Save the entry — the backend will attempt geocoding again. If the address is correct but geocoding still fails, you can contact a developer to manually set `lat` and `lng` in the `details` field.

---

### The admin panel says "Invalid password"
**Cause:** The password was entered incorrectly, or the `ADMIN_PASSWORD` environment variable on Render was changed.  
**Fix:** Double-check the password: `SouthViewCemetery1886!`. If it was changed, find the current value in Render's environment settings for `southview-map-api`.

---

### Images are not appearing for an entry
**Cause:** The image URL stored in the database may be broken, or the Supabase bucket policy changed.  
**Fix:**
1. Log in to https://supabase.com and navigate to **Storage → historical-images**.
2. Check that the image file exists and is publicly accessible.
3. If the bucket is not set to public, go to **Storage Policies** and enable public read access for `historical-images`.
4. If the file is missing, re-upload the image through the admin panel.

---

### A new entry was added but doesn't appear on the site
**Cause:** Browser cache, or the entry may not have saved correctly.  
**Fix:** Hard-refresh the page (`Ctrl+Shift+R` on Windows / `Cmd+Shift+R` on Mac). If still missing, check the admin dashboard — if the entry appears in the table, there may be a display delay. Contact a developer if the issue persists.

---

### The "Memories" button on an entry page says "No obituary link available"
**Cause:** No obituary URL was entered for that entry.  
**Fix:** Edit the entry in the admin dashboard and enter a full URL (starting with `https://`) in the **Obituary URL** field.

---

### The Google Maps Street View panel is blank or shows an error
**Cause:** The `REACT_APP_GOOGLE_MAPS_API_KEY` environment variable is missing or the API key has expired/been restricted.  
**Fix:**
1. Go to https://console.cloud.google.com
2. Navigate to **APIs & Services → Credentials**
3. Verify the API key is active and has **Maps JavaScript API** and **Street View Static API** enabled
4. Copy the key and update it in Render's environment variables for `southview-map-app`
5. Redeploy the frontend

---

### The backend crashes with "DATABASE_URL environment variable is required"
**Cause:** The `DATABASE_URL` environment variable is not set.  
**Fix:** Add it to Render's environment settings for `southview-map-api` (see [Section 5](#5-environment-variables--configuration)).

---

### How to change the admin password
1. Log in to Render and go to the `southview-map-api` service → **Environment**
2. Find `ADMIN_PASSWORD` and update it to the new password
3. Save and let Render redeploy
4. Also update your local `backend/.env` file if running locally
5. The new password will be active immediately after the redeployment finishes

---

*Last updated: March 2026 — LMC 3403 Project Team, Georgia Tech*
