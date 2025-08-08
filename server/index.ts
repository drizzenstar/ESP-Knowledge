import express, { type Request, Response, NextFunction } from "express";
import { setupAuth } from "./auth";           // ← named import
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();                        // ← create app FIRST
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

(async () => {
  console.log("calling setupAuth with app:", !!app);
  setupAuth(app);                             // ← pass app
  const server = await registerRoutes(app);   // ← pass app

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "development") await setupVite(app, server);
  else serveStatic(app);

  const port = parseInt(process.env.PORT || "5000", 10);
  const listenOpts: any = { port, host: "0.0.0.0" };
  if (process.platform !== "win32") listenOpts.reusePort = true;

  server.listen(listenOpts, () => log(`serving on port ${port}`));
})();
