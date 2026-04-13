# Evolve Fitness — React (Vite)

## API (Vercel + Render)

Production builds read **`frontend/react/.env.production`** and set:

- **`VITE_API_URL=https://evolve-fitness-backend.onrender.com`**

So `apiFetch()` calls the Render backend. Local dev leaves `VITE_API_URL` unset and uses the Vite proxy (`vite.config.js` → `localhost:5001`).

**API URL:** Production builds use **`src/config/apiOrigin.js`** — if `VITE_API_URL` is unset, the app falls back to **`https://evolve-fitness-backend.onrender.com`**, so forms and admin still hit Render. Set **`VITE_API_URL`** in Vercel only if you change the backend host.

**On Render (backend):** set **`CORS_ORIGIN`** to your Vercel deployment URL(s), e.g. `https://your-app.vercel.app`, so the browser is allowed to call the API.

### Owner admin (gym dashboard)

Routes: **`/admin/login`** (sign in), **`/admin`** (overview), **`/admin/members`**, **`/admin/contacts`**, **`/admin/leads`**. The footer includes a discreet **Owner login** link.

On the API, set **`ADMIN_JWT_SECRET`**. Owner **email/password** are stored in MongoDB collection **`admins`** (create with `npm run admin:create` in `backend/` — see `backend/README.md`). Without `ADMIN_JWT_SECRET`, login returns 503.

---

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
