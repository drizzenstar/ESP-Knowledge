// server/db.ts
import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // If you ever connect to a remote DB with a self-signed cert, use:
  // ssl: { rejectUnauthorized: false }
  // For your local postgres on 127.0.0.1, SSL is not needed.
});

export const db = drizzle(pool, { schema });
