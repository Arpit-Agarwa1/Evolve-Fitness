# Evolve Fitness API

Express REST API using **MVC** (Models, Views as JSON formatters, Controllers) and **MongoDB** via Mongoose.

## Layout

| Layer        | Path                         | Role                                      |
| ------------ | ---------------------------- | ----------------------------------------- |
| **Models**   | `src/models/`                | Mongoose schemas                          |
| **Views**    | `src/views/jsonResponse.js`  | Consistent JSON response shape            |
| **Controllers** | `src/controllers/`       | Request handling + model calls            |
| **Routes**   | `src/routes/`                | Maps HTTP paths to controllers            |
| **Config**   | `src/config/database.js`     | MongoDB connection                        |
| **Middleware** | `src/middleware/`        | Global error handling                     |

## Connect MongoDB (step by step)

Your app stores data in a database named **`evolve_fitness_data`**. MongoDB **does not allow spaces** in database names, so we use this identifier (you can still call it “Evolve Fitness Data” in the product). In connection URLs, use that name as-is after the host: **`/evolve_fitness_data`**

### “I don’t see any folders / collections in MongoDB”

MongoDB Atlas does not use the word **folders**. You have:

1. **Cluster** (e.g. Cluster0)  
2. **Database** — ours is named **`evolve_fitness_data`**  
3. **Collections** (like tables) — e.g. **`members`**, **`contactmessages`**, **`membershipleads`**, **`admins`**

**Important:** A database or collection often **does not appear until the first document is inserted**. If nobody has registered, contacted, or created an admin yet, **`evolve_fitness_data` may be empty or missing** in the UI.

**Check from your computer** (with `backend/.env` and a valid `MONGODB_URI`):

```bash
cd backend && npm run db:list
```

This prints the **exact database name** and **collection names** your API uses. If the list is empty, nothing has been written yet.

**In Atlas:** **Database** → your cluster → **Browse Collections** → open the database **`evolve_fitness_data`** — not only `admin` / `local` / `config`. If you still see nothing, submit one test **Contact** or **Register** from the site (with the API and `VITE_API_URL` working), then refresh Atlas.

Pick **one** path: **Atlas (cloud)** is easiest if you do not want to install MongoDB on your computer.

---

### Option A — MongoDB Atlas (recommended)

1. **Create an account**  
   Go to [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas) and sign up (free tier is enough).

2. **Create a cluster**  
   Choose a provider/region, keep the **free M0** template, create the cluster (it may take a few minutes).

3. **Create a database user**  
   In Atlas: **Database Access** → **Add New Database User** → choose **Password** → save the **username** and **password** (you will need them in the URI).

4. **Allow your IP to connect**  
   **Network Access** → **Add IP Address** → for local development you can use **`0.0.0.0/0`** (allows any IP; tighten this later for production).

5. **Get the connection string**  
   **Database** → **Connect** → **Drivers** → copy the **Node.js** connection string. It looks like:  
   `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`

6. **Insert your database name**  
   Put **`evolve_fitness_data`** **between** the host and the `?`:

   ```text
   mongodb+srv://YOUR_USER:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/evolve_fitness_data?retryWrites=true&w=majority
   ```

   - Replace **`YOUR_USER`** and **`YOUR_PASSWORD`** with your database user (if the password has special characters, [URL-encode](https://developer.mozilla.org/en-US/docs/Glossary/Percent-encoding) them, e.g. `@` → `%40`).

7. **Put it in `.env`**  
   In the `backend` folder:

   ```bash
   cp .env.example .env
   ```

   Open **`.env`** and set:

   ```env
   MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/evolve_fitness_data?retryWrites=true&w=majority
   MONGODB_DB_NAME=evolve_fitness_data
   ```

8. **Install and run the API**

   ```bash
   cd backend
   npm install
   npm run dev
   ```

   You should see **`MongoDB connected`** in the terminal.

9. **Verify**  
   In a browser open: [http://localhost:5001/api/health](http://localhost:5001/api/health)  
   If **`database`** is **`connected`**, MongoDB is linked correctly. In Atlas **Browse Collections**, open database **`evolve_fitness_data`** — collections such as **`members`**, **`contactmessages`**, and **`membershipleads`** appear **after the first successful write** (e.g. Contact form or Register).

---

### Option B — MongoDB on your computer (local)

1. **Install MongoDB Community**  
   From [MongoDB Download Center](https://www.mongodb.com/try/download/community), install for your OS.

2. **Start the server**  
   Ensure the `mongod` process is running (often as a service, or run `mongod` from a terminal depending on your install).

3. **Set `.env`** in `backend`:

   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/evolve_fitness_data
   ```

4. **Run the API**

   ```bash
   cd backend
   npm install
   npm run dev
   ```

5. **Verify**  
   Same as step 9 above: [http://localhost:5001/api/health](http://localhost:5001/api/health).

---

## Setup (quick)

1. **Dependencies:** `cd backend && npm install`
2. **Environment:** A **`.env`** file is included for local dev with **`MONGODB_URI`** pointing at `127.0.0.1` and database **`evolve_fitness_data`**. For Atlas, replace **`MONGODB_URI`** in **`.env`** with your cloud string (see Option A above).
3. **MongoDB running:** Either start **Docker** (`npm run db:up` in `backend`) or use **Atlas** and update **`.env`**.
4. **Run:** `npm run dev` → default port **5001** (5000 is often used by macOS AirPlay).

### One-command local database (Docker)

If you have [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed:

```bash
cd backend
npm run db:up
npm run dev
```

This starts MongoDB on port **27017**; the API **`.env`** already matches. Stop the DB with `npm run db:down` (data stays in the Docker volume until you remove it).

## Endpoints

| Method | Path                     | Description                |
| ------ | ------------------------ | -------------------------- |
| GET    | `/api/health`            | Health + DB connection     |
| POST   | `/api/contact`           | Contact form (`name`, `email`, `message`) |
| POST   | `/api/membership/leads`  | Membership lead (`email` required; optional `name`, `phone`, `plan`, `notes`). `plan`: `1month` \| `3months` \| `6months` \| `1year` \| legacy `essential` \| `premium` \| `elite` \| `unknown` |
| POST   | `/api/members/register` | Member signup: `fullName`, `email`, `phone`, `password`, optional `confirmPassword`, `plan`, `dateOfBirth`, `city`. Password min 8 chars. |
| POST   | `/api/admin/login`     | Owner sign-in: `email`, `password`. Checks MongoDB `admins` collection first; optional env fallback. Requires `ADMIN_JWT_SECRET`. |
| GET    | `/api/admin/dashboard`  | JWT — counts for members, contacts, leads. |
| GET    | `/api/admin/members`    | JWT — paginated members (`limit`, `skip`). |
| GET    | `/api/admin/contacts`   | JWT — contact messages. |
| GET    | `/api/admin/leads`      | JWT — membership leads. |

## Frontend

With the Vite dev server, `/api` is proxied to `http://localhost:5001`. Run **both** backend and `npm run dev` in `frontend/react` so the Contact form can save to MongoDB.

For production, set `VITE_API_URL` to your deployed API origin (no trailing slash). This repo’s frontend uses **`https://evolve-fitness-backend.onrender.com`** via `frontend/react/.env.production`.

**CORS:** On Render, set **`CORS_ORIGIN`** to your **Vercel** site URL (e.g. `https://your-app.vercel.app`). Without it, `cors` may still allow requests in some setups, but locking this down is recommended for production.

## Deploy on Render

1. **Use the API folder as the app root:** set **Root Directory** to `backend`, or deploy using the repo-root [`render.yaml`](../render.yaml) Blueprint (it already sets `rootDir: backend`).
2. **Build command:** `npm install`
3. **Start command:** `npm start` (runs `node server.js`)
4. **Environment variables (required):**
   - **`MONGODB_URI`** — full Atlas connection string (include `/evolve_fitness_data` before `?`, or end with `...mongodb.net/` and set `MONGODB_DB_NAME`).
   - **`MONGODB_DB_NAME`** — optional; defaults to `evolve_fitness_data`.
5. **Atlas:** under **Network Access**, allow **`0.0.0.0/0`** (or your region’s egress rules) so Render can reach the cluster.
6. Render sets **`PORT`** automatically; the server reads it. The API listens on **`0.0.0.0`** so the platform health checks work.

If the deploy exits with status **1**, open the service **Logs** — startup prints each failed Mongo attempt and a short checklist. Almost always **`MONGODB_URI` is missing** or Atlas is blocking Render’s IP range.

### Owner admin API

**Required on the server:** `ADMIN_JWT_SECRET` (e.g. `openssl rand -hex 32`). JWTs are signed with this; it is not stored in MongoDB.

**Owner email and password** live in MongoDB, database **`evolve_fitness_data`**, collection **`admins`**, each document has:

- `email` (string, lowercase)
- `passwordHash` (string, bcrypt — **never** store plain text)

**Create an admin (recommended):** from the `backend` folder with your `.env` pointing at Atlas (or local Mongo):

```bash
npm run admin:create -- owner@yourgym.com "YourSecurePassword"
```

**Or insert manually in Atlas:** generate a bcrypt hash, then add a document with `email` and `passwordHash`:

```bash
cd backend && node -e "import('bcryptjs').then(async (m) => console.log(await m.default.hash('YourPasswordHere', 10)))"
```

Paste the hash into the `passwordHash` field in **Data Explorer → Insert Document**.

**Optional legacy fallback:** if no row in `admins` matches, login can still use `ADMIN_EMAIL` + `ADMIN_PASSWORD_BCRYPT` in environment (same as before).

| Variable | Purpose |
| -------- | ------- |
| `ADMIN_JWT_SECRET` | **Required** — signs session tokens. |
| `ADMIN_JWT_EXPIRES` | Optional, default `12h`. |
| `ADMIN_EMAIL` | Optional fallback — only if not using MongoDB admin. |
| `ADMIN_PASSWORD_BCRYPT` | Optional fallback — bcrypt hash. |

**Admin JWT secret on Render:** Avoid `$`, `#`, and `!` in `ADMIN_JWT_SECRET` — some platforms treat `$` as variable interpolation, so sign-in can succeed but the dashboard returns **401 / Invalid session** (token signed with a different string than verify). Use a **hex-only** secret:

```bash
openssl rand -hex 32
```

Paste the output into Render → Environment → `ADMIN_JWT_SECRET` → **Save** → **Manual Deploy**. Check Render logs for `[Admin] ADMIN_JWT_SECRET is set (length …)` after deploy.

The **Owner login** page (`/admin/login`) calls `POST /api/admin/login`; other `/api/admin/*` routes require `Authorization: Bearer <token>`.
