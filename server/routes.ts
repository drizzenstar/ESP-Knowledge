import express, { type Express, type Request, type Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import fs from "fs";
import path from "path";
import { storage } from "./storage";
import { isAuthenticated } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded files
  const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? "uploads");
  fs.mkdirSync(uploadDir, { recursive: true });
  app.use("/uploads", express.static(uploadDir));

  // Multer for multipart/form-data
  const upload = multer({ dest: uploadDir });

  // List files (adjust if your storage API differs)
  app.get("/api/files", isAuthenticated, async (_req: Request, res: Response) => {
    const files = await storage.getFiles();
    res.json(files);
  });

  // Upload files (accepts multiple, field name "files" or "file")
  app.post("/api/files/upload", isAuthenticated, upload.any(), async (req: Request, res: Response) => {
    const files = (req.files as Express.Multer.File[]) || [];
    // fallback if single('file') used somewhere
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
        // categoryId: req.body.categoryId ? Number(req.body.categoryId) : null,
      });
      created.push(rec);
    }

    res.json({ files: created });
  });

  // (Add any other non-auth API routes here)

  const server: Server = createServer(app);
  return server;
}
