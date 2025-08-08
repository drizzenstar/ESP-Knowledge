import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import fs from "fs";
import path from "path";
import { storage } from "./storage";
import { isAuthenticated } from "./auth";

// ?? direct DB access for categories/permissions
import { db } from "./db";
import { categories, permissions, articles } from "@shared/schema";
import { eq, or } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // ---------- Static uploads ----------
  const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? "uploads");
  fs.mkdirSync(uploadDir, { recursive: true });
  app.use("/uploads", express.static(uploadDir));

  // ---------- Multer for multipart/form-data ----------
  const upload = multer({ dest: uploadDir });

  // ---------- Files ----------
  app.get("/api/files", isAuthenticated, async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const files = await storage.getFiles();
      res.json(files);
    } catch (e) {
      next(e);
    }
  });

  // Accepts multiple files (field name "files") or a single file ("file")
  app.post(
    "/api/files/upload",
    isAuthenticated,
    upload.any(),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const files = (req.files as Express.Multer.File[]) || [];
        // fallback if single('file') was used
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
      } catch (e) {
        next(e);
      }
    },
  );

  // ---------- Categories ----------

  // LIST: admin ? all; user ? created_by = user OR has permission
  app.get("/api/categories", isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as any;

      if (user?.role === "admin") {
        const rows = await db.select().from(categories).orderBy(categories.id);
        return res.json(rows);
      }

      // left join permissions so we include categories the user was granted access to
      const rows = await db
        .select()
        .from(categories)
        .leftJoin(permissions, eq(permissions.categoryId, categories.id))
        .where(or(eq(categories.createdBy, user.id), eq(permissions.userId, user.id)))
        .orderBy(categories.id);

      // leftJoin returns { categories, permissions } — flatten to the category row
      const flattened = rows.map((r: any) => r.categories ?? r);
      res.json(flattened);
    } catch (e) {
      next(e);
    }
  });

  // CREATE: records created_by and grants the creator write permission
  app.post("/api/categories", isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, description, parentId } = req.body;
      const userId = (req.user as any)?.id ?? null;

      const [cat] = await db
        .insert(categories)
        .values({
          name,
          description: description ?? null,
          parentId: parentId ? Number(parentId) : null,
          createdBy: userId, // ? make sure creator is set
        })
        .returning();

      // Make sure the creator can see/edit it on subsequent logins
      if (userId) {
        await db
          .insert(permissions)
          .values({
            userId,
            categoryId: cat.id,
            permissionType: "write",
          })
          .onConflictDoUpdate({
            target: [permissions.userId, permissions.categoryId],
            set: { permissionType: "write" },
          });
      }

      res.status(201).json(cat);
    } catch (e) {
      next(e);
    }
  });

  // (add PUT/DELETE categories if needed later)
// ---------- Articles ----------

// LIST: admin ? all; user ? authored OR has permission via category
app.get("/api/articles", isAuthenticated, async (req, res, next) => {
  try {
    const user = req.user as any;

    if (user?.role === "admin") {
      const rows = await db.select().from(articles).orderBy(articles.id);
      return res.json(rows);
    }

    const rows = await db
      .select()
      .from(articles)
      .leftJoin(permissions, eq(permissions.categoryId, articles.categoryId))
      .where(or(eq(articles.authorId, user.id), eq(permissions.userId, user.id)))
      .orderBy(articles.id);

    // leftJoin returns { articles, permissions } ? flatten to the article row
    const flattened = rows.map((r: any) => r.articles ?? r);
    res.json(flattened);
  } catch (e) {
    next(e);
  }
});

// CREATE: set authorId to the current user
app.post("/api/articles", isAuthenticated, async (req, res, next) => {
  try {
    const { title, content, categoryId } = req.body;
    const userId = (req.user as any)?.id ?? null;

    const [art] = await db
      .insert(articles)
      .values({
        title,
        content,
        categoryId: categoryId ? Number(categoryId) : null,
        authorId: userId, // ? important so it shows for the creator
      })
      .returning();

    res.status(201).json(art);
  } catch (e) {
    next(e);
  }
});
// ---- Article by-id: read, update, delete ----

function canEditArticle(user: any, row: any) {
  return user?.role === "admin" || row?.authorId === user?.id;
}

// GET one article
app.get("/api/articles/:id", isAuthenticated, async (req, res, next) => {
  try {
    const user = req.user as any;
    const id = Number(req.params.id);

    const [row] = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
    if (!row) return res.status(404).json({ message: "Not found" });

    // (Optional) gate read by permissions if you want
    return res.json(row);
  } catch (e) {
    next(e);
  }
});

// UPDATE
app.put("/api/articles/:id", isAuthenticated, async (req, res, next) => {
  try {
    const user = req.user as any;
    const id = Number(req.params.id);
    const { title, content, categoryId } = req.body;

    const [current] = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
    if (!current) return res.status(404).json({ message: "Not found" });
    if (!canEditArticle(user, current)) return res.status(403).json({ message: "Forbidden" });

    const [updated] = await db
      .update(articles)
      .set({
        title,
        content,
        categoryId: categoryId ? Number(categoryId) : null,
      })
      .where(eq(articles.id, id))
      .returning();

    res.json(updated);
  } catch (e) {
    next(e);
  }
});

// DELETE
app.delete("/api/articles/:id", isAuthenticated, async (req, res, next) => {
  try {
    const user = req.user as any;
    const id = Number(req.params.id);

    const [current] = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
    if (!current) return res.status(404).json({ message: "Not found" });
    if (!canEditArticle(user, current)) return res.status(403).json({ message: "Forbidden" });

    await db.delete(articles).where(eq(articles.id, id));
    res.sendStatus(204);
  } catch (e) {
    next(e);
  }
});
// after your categories join
const flattenedCats = rows.map((r: any) => r.categories ?? r);
const seenCats = new Set<number>();
const uniqueCats = flattenedCats.filter((c: any) => !seenCats.has(c.id) && seenCats.add(c.id));
res.json(uniqueCats);

// after your articles join
const flattenedArts = rows.map((r: any) => r.articles ?? r);
const seenArts = new Set<number>();
const uniqueArts = flattenedArts.filter((a: any) => !seenArts.has(a.id) && seenArts.add(a.id));
res.json(uniqueArts);


  // ---------- Create HTTP server ----------
  const server: Server = createServer(app);
  return server;
}
