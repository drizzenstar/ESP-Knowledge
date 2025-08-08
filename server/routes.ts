// at top of file
import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { storage } from "./storage";
import { isAuthenticated } from "./auth";

// ensure uploads dir exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({ dest: uploadDir });
app.use("/uploads", express.static(uploadDir));

// upload endpoint
app.post("/api/files/upload", isAuthenticated, upload.any(), async (req, res) => {
  const files = (req.files as Express.Multer.File[]) || [];
  // @ts-ignore (in case single('file') was used)
  if (!files.length && req.file) files.push(req.file as Express.Multer.File);

  if (!files.length) return res.status(400).json({ message: "No file uploaded" });

  const created: any[] = [];
  for (const f of files) {
    const rec = await storage.createFile({
      filename: f.filename,
      originalName: f.originalname,
      filePath: `/uploads/${f.filename}`,
      fileType: f.mimetype,
      fileSize: f.size,
      uploadedBy: req.user?.id,
    });
    created.push(rec);
  }
  res.json({ files: created });
});
