// server/routes.ts
import express, { type Express, type Request, type Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import fs from "fs";
import path from "path";
import { storage } from "./storage";
import { isAuthenticated } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Ensure uploads dir exists and is served statically
  const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? "uploads");
  fs.mkdirSync(uploadDir, { recursive: true });
  app.use("/uploads", express.static(uploadDir));

  // Multer for multipart form-data uploads
  const upload = multer({ dest: uploadDir });

  // (Optional) List files API – tweak if your storage signature differs
  app.get("/api/files", isAuthenticated, async (_req: Request, res: Response) => {
    const files = await storage.getFiles();
    res.json(files);
  });

  // Upload endpoint: accepts multiple files under field name "files" (or "file")
  app.post("/api/files/upload", isAuthenticated, upload.any(), async (req: Request, res: Response) => {
    const files = (req.files as Express.Multer.File[]) || [];
    // Fallback if single('file') is used somewhere
    // @ts-expect-error
    if (!files.length && (req as any).file) files.push((req as any).file as Express.Multer.File);

    if (!files.length) return res.status(400).json({ message: "No file uploaded" });

    const created: any[] = [];
    for (const f of files) {
      const rec = await storage.createFile({
        filename: f.filename,
        originalName: f.originalname,
        filePath: `/uploads/${f.filename}`, // web path the browser can GET
        fileType: f.mimetype,
        fileSize: f.size,
        uploadedBy: (req.user as any)?.id ?? null,
        // categoryId: req.body.categoryId ? Number(req.body.categoryId) : null, // if you support it
      });
      created.push(rec);
    }

    res.json({ files: created });
  });

  // If you have OTHER routes in this file, move them ABOVE this line too.

  const server: Server = createServer(app);
  return server;
}
