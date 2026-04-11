import express from "express";
import cors from "cors";
import apiRoutes from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

/** CORS: allow Vite dev server by default */
const corsOrigin = process.env.CORS_ORIGIN;
app.use(
  cors({
    origin: corsOrigin
      ? corsOrigin.split(",").map((o) => o.trim())
      : true,
    credentials: true,
  })
);

app.use(express.json({ limit: "64kb" }));

app.use("/api", apiRoutes);

app.use(errorHandler);

export default app;
