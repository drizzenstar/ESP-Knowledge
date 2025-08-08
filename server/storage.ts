import {
  users,
  categories,
  articles,
  permissions,
  files,
  tags,
  articleTags,
  type User,
  type InsertUser,
  type Category,
  type InsertCategory,
  type Article,
  type InsertArticle,
  type Permission,
  type InsertPermission,
  type File,
  type InsertFile,
  type Tag,
  type InsertTag,
  type ArticleTag,
  type InsertArticleTag,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, ilike, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (required for custom Auth)
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  getCategoriesHierarchy(): Promise<Category[]>;
  getCategoriesByUser(userId: number): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  
  // Article operations
  getArticles(): Promise<Article[]>;
  getPublishedArticles(): Promise<Article[]>;
  getArticlesByCategory(categoryId: number): Promise<Article[]>;
  getArticlesByUser(userId: number): Promise<Article[]>;
  getArticle(id: number): Promise<Article | undefined>;
  searchArticles(query: string): Promise<Article[]>;
  createArticle(article: InsertArticle): Promise<Article>;
  updateArticle(id: number, article: Partial<InsertArticle>): Promise<Article | undefined>;
  deleteArticle(id: number): Promise<boolean>;
  createArticleVersion(articleId: number, userId: number): Promise<void>;
  getArticleVersions(articleId: number): Promise<any[]>;
  
  // Tag operations
  getTags(): Promise<Tag[]>;
  getTag(id: number): Promise<Tag | undefined>;
  createTag(tag: InsertTag): Promise<Tag>;
  deleteTag(id: number): Promise<boolean>;
  
  // Article-tag operations
  getArticleTags(articleId: number): Promise<Tag[]>;
  addTagToArticle(articleId: number, tagId: number): Promise<void>;
  removeTagFromArticle(articleId: number, tagId: number): Promise<void>;
  
  // Permission operations
  getUserPermissions(userId: number): Promise<Permission[]>;
  getAllPermissions(): Promise<Permission[]>;
  getCategoryPermissions(categoryId: number): Promise<Permission[]>;
  getUserCategoryPermission(userId: number, categoryId: number): Promise<Permission | undefined>;
  setUserPermission(permission: InsertPermission): Promise<Permission>;
  updatePermission(id: number, permission: Partial<InsertPermission>): Promise<Permission | undefined>;
  removeUserPermission(userId: number, categoryId: number): Promise<boolean>;
  
  // File operations
  getFiles(): Promise<File[]>;
  getFilesByArticle(articleId: number): Promise<File[]>;
  getFilesByCategory(categoryId: number): Promise<File[]>;
  getFile(id: number): Promise<File | undefined>;
  createFile(file: InsertFile): Promise<File>;
  deleteFile(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.createdAt);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.name);
  }

  async getCategoriesHierarchy(): Promise<Category[]> {
    // Get all categories and organize them hierarchically
    const allCategories = await db.select().from(categories).orderBy(categories.name);
    return allCategories;
  }

  async getCategoriesByUser(userId: number): Promise<Category[]> {
    return await db
      .select({
        id: categories.id,
        name: categories.name,
        description: categories.description,
        createdBy: categories.createdBy,
        createdAt: categories.createdAt,
      })
      .from(categories)
      .innerJoin(permissions, eq(categories.id, permissions.categoryId))
      .where(and(
        eq(permissions.userId, userId),
        or(
          eq(permissions.permissionType, 'read'),
          eq(permissions.permissionType, 'write'),
          eq(permissions.permissionType, 'admin')
        )
      ))
      .orderBy(categories.name);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(categoryData: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(categoryData)
      .returning();
    return category;
  }

  async updateCategory(id: number, categoryData: Partial<InsertCategory>): Promise<Category | undefined> {
    const [category] = await db
      .update(categories)
      .set(categoryData)
      .where(eq(categories.id, id))
      .returning();
    return category;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return result.rowCount > 0;
  }

  // Article operations
  async getArticles(): Promise<Article[]> {
    return await db.select().from(articles).orderBy(desc(articles.createdAt));
  }

  async getArticlesByCategory(categoryId: number): Promise<Article[]> {
    return await db
      .select()
      .from(articles)
      .where(eq(articles.categoryId, categoryId))
      .orderBy(desc(articles.createdAt));
  }

  async getArticlesByUser(userId: number): Promise<Article[]> {
    return await db
      .select()
      .from(articles)
      .where(eq(articles.authorId, userId))
      .orderBy(desc(articles.createdAt));
  }

  async getArticle(id: number): Promise<Article | undefined> {
    const [article] = await db.select().from(articles).where(eq(articles.id, id));
    return article;
  }

  async searchArticles(query: string): Promise<Article[]> {
    return await db
      .select()
      .from(articles)
      .where(or(
        ilike(articles.title, `%${query}%`),
        ilike(articles.content, `%${query}%`)
      ))
      .orderBy(desc(articles.createdAt));
  }

  async createArticle(articleData: InsertArticle): Promise<Article> {
    const [article] = await db
      .insert(articles)
      .values(articleData)
      .returning();
    return article;
  }

  async updateArticle(id: number, articleData: Partial<InsertArticle>): Promise<Article | undefined> {
    const [article] = await db
      .update(articles)
      .set({ ...articleData, updatedAt: new Date() })
      .where(eq(articles.id, id))
      .returning();
    return article;
  }

  async deleteArticle(id: number): Promise<boolean> {
    const result = await db.delete(articles).where(eq(articles.id, id));
    return result.rowCount > 0;
  }

  async getPublishedArticles(): Promise<Article[]> {
  return await db
    .select()
    .from(articles)
    .where(eq(articles.isPublished, true))   // ? was status === 'published'
    .orderBy(desc(articles.createdAt));
}


  async createArticleVersion(articleId: number, userId: number): Promise<void> {
    // In a real application, this would create a version snapshot in an article_versions table
    // For now, we'll just track the update in the articles table with updatedAt
    await db
      .update(articles)
      .set({ 
        updatedAt: new Date(),
        // Could add a version number field if needed
      })
      .where(eq(articles.id, articleId));
  }

  async getArticleVersions(articleId: number): Promise<any[]> {
    // In a real application, this would return versions from an article_versions table
    // For now, we'll return the current article as a single "version"
    const article = await this.getArticle(articleId);
    if (!article) return [];
    
    return [{
      id: 1,
      articleId: article.id,
      version: 1,
      title: article.title,
      content: article.content,
      createdAt: article.updatedAt || article.createdAt,
      createdBy: article.authorId,
    }];
  }

  // Tag operations
  async getTags(): Promise<Tag[]> {
    return await db.select().from(tags).orderBy(tags.name);
  }

  async getTag(id: number): Promise<Tag | undefined> {
    const [tag] = await db.select().from(tags).where(eq(tags.id, id));
    return tag;
  }

  async createTag(tagData: InsertTag): Promise<Tag> {
    const [tag] = await db
      .insert(tags)
      .values(tagData)
      .returning();
    return tag;
  }

  async deleteTag(id: number): Promise<boolean> {
    const result = await db.delete(tags).where(eq(tags.id, id));
    return result.rowCount > 0;
  }

  // Article-tag operations
  async getArticleTags(articleId: number): Promise<Tag[]> {
    return await db
      .select({
        id: tags.id,
        name: tags.name,
        createdAt: tags.createdAt,
      })
      .from(tags)
      .innerJoin(articleTags, eq(tags.id, articleTags.tagId))
      .where(eq(articleTags.articleId, articleId))
      .orderBy(tags.name);
  }

  async addTagToArticle(articleId: number, tagId: number): Promise<void> {
    await db
      .insert(articleTags)
      .values({ articleId, tagId })
      .onConflictDoNothing();
  }

  async removeTagFromArticle(articleId: number, tagId: number): Promise<void> {
    await db
      .delete(articleTags)
      .where(and(
        eq(articleTags.articleId, articleId),
        eq(articleTags.tagId, tagId)
      ));
  }

  // Permission operations
  async getUserPermissions(userId: number): Promise<Permission[]> {
    return await db
      .select()
      .from(permissions)
      .where(eq(permissions.userId, userId));
  }

  async getAllPermissions(): Promise<Permission[]> {
    return await db.select().from(permissions);
  }

  async getCategoryPermissions(categoryId: number): Promise<Permission[]> {
    return await db
      .select()
      .from(permissions)
      .where(eq(permissions.categoryId, categoryId));
  }

  async getUserCategoryPermission(userId: number, categoryId: number): Promise<Permission | undefined> {
    const [permission] = await db
      .select()
      .from(permissions)
      .where(and(
        eq(permissions.userId, userId),
        eq(permissions.categoryId, categoryId)
      ));
    return permission;
  }

  async setUserPermission(permissionData: InsertPermission): Promise<Permission> {
    const [permission] = await db
      .insert(permissions)
      .values(permissionData)
      .onConflictDoUpdate({
        target: [permissions.userId, permissions.categoryId],
        set: { permissionType: permissionData.permissionType }
      })
      .returning();
    return permission;
  }

  async updatePermission(id: number, permissionData: Partial<InsertPermission>): Promise<Permission | undefined> {
    const [permission] = await db
      .update(permissions)
      .set(permissionData)
      .where(eq(permissions.id, id))
      .returning();
    return permission;
  }

  async removeUserPermission(userId: number, categoryId: number): Promise<boolean> {
    const result = await db
      .delete(permissions)
      .where(and(
        eq(permissions.userId, userId),
        eq(permissions.categoryId, categoryId)
      ));
    return result.rowCount > 0;
  }

  // File operations
  async getFiles(): Promise<File[]> {
    return await db.select().from(files).orderBy(desc(files.uploadedAt));
  }

  async getFilesByArticle(articleId: number): Promise<File[]> {
    return await db
      .select()
      .from(files)
      .where(eq(files.articleId, articleId))
      .orderBy(desc(files.uploadedAt));
  }

  async getFilesByCategory(categoryId: number): Promise<File[]> {
    return await db
      .select()
      .from(files)
      .innerJoin(articles, eq(files.articleId, articles.id))
      .where(eq(articles.categoryId, categoryId))
      .orderBy(desc(files.uploadedAt));
  }

  async getFile(id: number): Promise<File | undefined> {
    const [file] = await db.select().from(files).where(eq(files.id, id));
    return file;
  }

  async createFile(fileData: InsertFile): Promise<File> {
    const [file] = await db
      .insert(files)
      .values(fileData)
      .returning();
    return file;
  }

  async deleteFile(id: number): Promise<boolean> {
    const result = await db.delete(files).where(eq(files.id, id));
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();