import fs from "fs";
import path from "path";
import multer from "multer";

const uploadDir = path.resolve(process.env.UPLOAD_DIR || "uploads");
fs.mkdirSync(uploadDir, { recursive: true });           // auto-create if missing

const upload = multer({ dest: uploadDir });

// serve files back from /uploads/...
app.use("/uploads", express.static(uploadDir));

// upload endpoint (this is the URL you POST to; NOT a folder)
app.post("/api/files/upload", upload.any(), async (req, res) => {
  const files = (req.files as Express.Multer.File[]) || [];
  if (!files.length) return res.status(400).json({ message: "No file uploaded" });

  // save DB records with a web path you can open in the browser:
  // e.g. /uploads/<filename>
  // ...
  res.json({ files: /* created records */ });
});
