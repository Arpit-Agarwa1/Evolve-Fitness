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
| POST   | `/api/membership/leads`  | Membership lead (`email` required; optional `name`, `phone`, `plan`, `notes`). `plan`: `essential` \| `premium` \| `elite` \| `unknown` |
| POST   | `/api/members/register` | Member signup: `fullName`, `email`, `phone`, `password`, optional `confirmPassword`, `plan`, `dateOfBirth`, `city`. Password min 8 chars. |

## Frontend

With the Vite dev server, `/api` is proxied to `http://localhost:5001`. Run **both** backend and `npm run dev` in `frontend/react` so the Contact form can save to MongoDB.

For production, set `VITE_API_URL` to your deployed API origin (no trailing slash).
