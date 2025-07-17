import express, { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API request logger
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  const originalJson = res.json;
  let responseBody: any;

  res.json = function (body: any, ...args: any[]) {
    responseBody = body;
    return originalJson.call(this, body, ...args);
  };

  res.on("finish", () => {
    if (!path.startsWith("/api")) return;

    const duration = Date.now() - start;
    let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;

    if (responseBody) {
      const preview = JSON.stringify(responseBody);
      logLine += ` :: ${preview.length > 200 ? preview.slice(0, 197) + "…" : preview}`;
    }

    log(logLine);
  });

  next();
});

// Async server bootstrap
(async () => {
  const server = await registerRoutes(app);

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || 500;
    const message = err.message || "Internal Server Error";

    log(`[ERROR] ${status} :: ${message}`);
    res.status(status).json({ message });
  });

  // Vite or static assets based on environment
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Always use process.env.PORT
  const port = parseInt(process.env.PORT || "5000", 10);

  server.listen(port, "0.0.0.0", () => {
    log(`🚀 Server running on http://0.0.0.0:${port} (${app.get("env")})`);
  });
})();
