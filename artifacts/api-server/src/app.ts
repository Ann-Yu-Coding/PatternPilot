import { requireAdmin } from "./middleware/admin-auth";
import { QuestionDatabaseError } from "./services/question-repository";
import { QuestionValidationError } from "./services/question-validation";
import path from "node:path";
import express, { type Express, type ErrorRequestHandler } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use("/api/admin", requireAdmin);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Production: serve the built website from the same origin as the API.
const staticDir = process.env["STATIC_DIR"];
if (staticDir) {
  const root = path.resolve(staticDir);
  app.use("/assets", express.static(path.join(root, "assets"), { immutable: true, maxAge: "1y" }));
  app.use(express.static(root, { index: false }));
  app.get(/^(?!\/api(?:\/|$)).*/, (_req, res) => {
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile("index.html", { root });
  });
}

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof QuestionDatabaseError) {
    res.status(503).json({ error: "Question database unavailable" }); return;
  }
  if (error instanceof QuestionValidationError || error?.name === "ZodError" || error?.type === "entity.parse.failed") {
    res.status(400).json({ error: "Invalid request" }); return;
  }
  res.status(500).json({ error: "Internal server error" });
};
app.use(errorHandler);
export default app;
