import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
  index,
  uniqueIndex,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  serial,
  bigint,
  integer,
  primaryKey,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/* ------------------- Sessions ------------------- */

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

/* ------------------- Users ------------------- */

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  // new column used by app
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  // keep legacy columns so Drizzle doesn't try to drop data
  username: varchar("username", { length: 255 }),
  password: varchar("password", { length: 255 }),
  role: varchar("role", { length: 50 }).default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/* ------------------- Categories ------------------- */

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  parentId: integer("parent_id").references(() => categories.id),
  // FK should be integer, not serial
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  // keep updated_at to avoid drop
  updatedAt: timestamp("updated_at").defaultNow(),
});

/* ------------------- Articles ------------------- */

export const articleTags = pgTable(
  "article_tags",
  {
    articleId: integer("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.articleId, table.tagId] }),
  }),
);

/* ------------------- Permissions ------------------- */

export const permissions = pgTable(
  "permissions",
  {
    id: serial("id").primaryKey(),
    // FKs must be integer
    userId: integer("user_id").references(() => users.id),
    categoryId: integer("category_id").references(() => categories.id),
    permissionType: varchar("permission_type", { length: 50 }).notNull(), // 'read' | 'write' | 'admin'
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    userCategoryUnique: uniqueIndex("user_category_unique").on(
      table.userId,
      table.categoryId,
    ),
  }),
);

/* ------------------- Files ------------------- */

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  filename: varchar("filename", { length: 255 }).notNull(),
  filePath: varchar("file_path", { length: 500 }).notNull(),
  fileType: varchar("file_type", { length: 100 }).notNull(),
  fileSize: bigint("file_size", { mode: "number" }),
  // FKs must be integer
  uploadedBy: integer("uploaded_by").references(() => users.id),
  articleId: integer("article_id").references(() => articles.id),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

/* ------------------- Tags ------------------- */

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  // keep 255 to avoid shrink warning
  name: varchar("name", { length: 255 }).notNull(),
  // keep optional legacy color so it isn’t dropped
  color: varchar("color", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
});

/* --------------- Article ? Tag (Many-to-Many) --------------- */

export const articleTags = pgTable(
  "article_tags",
  {
    articleId: integer("article_id").references(() => articles.id),
    tagId: integer("tag_id").references(() => tags.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.articleId, table.tagId] }),
  }),
);

/* ------------------- Relations ------------------- */

export const usersRelations = relations(users, ({ many }) => ({
  createdCategories: many(categories),
  articles: many(articles),
  permissions: many(permissions),
  files: many(files),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
  }),
  children: many(categories),
  createdBy: one(users, {
    fields: [categories.createdBy],
    references: [users.id],
  }),
  articles: many(articles),
  permissions: many(permissions),
}));

export const articlesRelations = relations(articles, ({ one, many }) => ({
  category: one(categories, {
    fields: [articles.categoryId],
    references: [categories.id],
  }),
  author: one(users, {
    fields: [articles.authorId],
    references: [users.id],
  }),
  files: many(files),
  articleTags: many(articleTags),
}));

export const permissionsRelations = relations(permissions, ({ one }) => ({
  user: one(users, {
    fields: [permissions.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [permissions.categoryId],
    references: [categories.id],
  }),
}));

export const filesRelations = relations(files, ({ one }) => ({
  uploadedBy: one(users, {
    fields: [files.uploadedBy],
    references: [users.id],
  }),
  article: one(articles, {
    fields: [files.articleId],
    references: [articles.id],
  }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  articleTags: many(articleTags),
}));

export const articleTagsRelations = relations(articleTags, ({ one }) => ({
  article: one(articles, {
    fields: [articleTags.articleId],
    references: [articles.id],
  }),
  tag: one(tags, {
    fields: [articleTags.tagId],
    references: [tags.id],
  }),
}));

/* ------------------- Insert Schemas ------------------- */

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  // passwordHash: true, // keep required at API layer
  createdAt: true,
  updatedAt: true,
});

export const loginUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const registerUserSchema = insertUserSchema.extend({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertArticleSchema = createInsertSchema(articles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPermissionSchema = createInsertSchema(permissions).omit({
  id: true,
  createdAt: true,
});

export const insertFileSchema = createInsertSchema(files).omit({
  id: true,
  uploadedAt: true,
});

export const insertTagSchema = createInsertSchema(tags).omit({
  id: true,
  createdAt: true,
});

export const insertArticleTagSchema = createInsertSchema(articleTags);

/* ------------------- Types ------------------- */

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Article = typeof articles.$inferSelect;
export type InsertPermission = z.infer<typeof insertPermissionSchema>;
export type Permission = typeof permissions.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;
export type InsertTag = z.infer<typeof insertTagSchema>;
export type Tag = typeof tags.$inferSelect;
export type InsertArticleTag = z.infer<typeof insertArticleTagSchema>;
export type ArticleTag = typeof articleTags.$inferSelect;
