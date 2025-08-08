import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import connectPg from "connect-pg-simple";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

/* ───────── Password helpers ───────── */

export async function hashPassword(password: string): Promise<string> {
  // default format: scrypt hex.salt
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Supports bcrypt ($2*), scrypt (hex.salt), and (only if it ever existed) legacy plaintext
export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  if (!stored) return false;

  // bcrypt
  if (stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$")) {
    try {
      return await bcrypt.compare(supplied, stored);
    } catch {
      return false;
    }
  }

  // scrypt hex.salt
  if (stored.includes(".")) {
    const [hashed, salt] = stored.split(".");
    if (!hashed || !salt) return false;
    try {
      const hashedBuf = Buffer.from(hashed, "hex");
      const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
      if (hashedBuf.length !== suppliedBuf.length) return false;
      return timingSafeEqual(hashedBuf, suppliedBuf);
    } catch {
      return false;
    }
  }

  // (only if a legacy plaintext value somehow remains)
  return supplied === stored;
}

/* ───────── Seed default users ───────── */

async function createDefaultUsers() {
  // ← move the guard here (no top-level return!)
  if (process.env.SEED_DEFAULT_USERS !== "true") return;

  try {
    const adminUser = await storage.getUserByEmail("admin@example.com");
    if (!adminUser) {
      const hashedPassword = await hashPassword("admin123");
      await storage.createUser({
        email: "admin@example.com",
        passwordHash: hashedPassword,
        role: "admin",
      });
      console.log("✓ Created default admin user (email: admin@example.com, password: admin123)");
    }

    const regularUser = await storage.getUserByEmail("user@example.com");
    if (!regularUser) {
      const hashedPassword = await hashPassword("user123");
      await storage.createUser({
        email: "user@example.com",
        passwordHash: hashedPassword,
        role: "user",
      });
      console.log("✓ Created default user (email: user@example.com, password: user123)");
    }
  } catch (error) {
    console.error("Error creating default users:", error);
  }
}

/* ───────── Auth wiring ───────── */

export function setupAuth(app: Express) {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "development-secret-key",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: false, // set true behind HTTPS in prod
      maxAge: sessionTtl,
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Local strategy: supports bcrypt & scrypt; upgrades bcrypt→scrypt after successful login
  passport.use(
    new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user) return done(null, false, { message: "Invalid email or password" });

        const stored = user.passwordHash;
        const isBcrypt = stored?.startsWith("$2a$") || stored?.startsWith("$2b$") || stored?.startsWith("$2y$");

        let ok = await comparePasswords(password, stored);

        // If login succeeded with bcrypt, upgrade to scrypt for consistency
        if (ok && isBcrypt) {
          const newHash = await hashPassword(password);
          await storage.updateUser(user.id, { passwordHash: newHash });
        }

        if (!ok) return done(null, false, { message: "Invalid email or password" });
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, (user as any).id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) return done(null, false);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  /* ───────── Routes ───────── */

  app.post("/api/register", async (req, res, next) => {
    try {
      const { email, password, role } = req.body;
      const existing = await storage.getUserByEmail(email);
      if (existing) return res.status(400).json({ message: "Email already exists" });

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        email,
        passwordHash: hashedPassword,
        role: role || "user",
      });

      const { passwordHash: _ph, ...userResponse } = user as any;
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(userResponse);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    const { passwordHash, ...userResponse } = req.user as SelectUser;
    res.status(200).json(userResponse);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const { passwordHash, ...userResponse } = req.user as SelectUser;
    res.json(userResponse);
  });

  // Call seeding (it will no-op unless SEED_DEFAULT_USERS=true)
  createDefaultUsers();
}

export function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: "Unauthorized" });
}
app.get("/api/logout", (req, res, next) => {
  req.logout((err) => (err ? next(err) : res.sendStatus(200)));
});
