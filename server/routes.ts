import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { 
  insertUserSchema, 
  insertCategorySchema, 
  insertArticleSchema, 
  insertPermissionSchema,
  insertFileSchema 
} from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Admin middleware
async function requireAdmin(req: any, res: any, next: any) {
  try {
    const userId = req.user.id;
    const user = await storage.getUser(userId);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    next();
  } catch (error) {
    console.error("Error checking admin access:", error);
    res.status(500).json({ message: "Failed to verify admin access" });
  }
}

export function registerRoutes(app: Express): Server {
  // Auth setup
  setupAuth(app);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // Authentication endpoints
  app.get('/api/auth/me', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return password
      const { passwordHash, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User management endpoints (Admin only)
  app.get('/api/users', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const users = await storage.getUsers();
      // Remove passwords from response
      const usersWithoutPasswords = users.map(({ passwordHash, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/users', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      
      // Don't return password
      const { passwordHash, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put('/api/users/:id', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const userData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(req.params.id, userData);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return password
      const { passwordHash, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete('/api/users/:id', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const deleted = await storage.deleteUser(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Category endpoints
  app.get('/api/categories', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let categories;
      if (user.role === 'admin') {
        categories = await storage.getCategories();
      } else {
        categories = await storage.getCategoriesByUser(userId);
      }

      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post('/api/categories', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.put('/api/categories/:id', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const categoryData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(req.params.id, categoryData);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete('/api/categories/:id', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const deleted = await storage.deleteCategory(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Article endpoints
  app.get('/api/articles', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { categoryId, search } = req.query;

      let articles;
      if (search) {
        articles = await storage.searchArticles(search as string);
      } else if (categoryId) {
        articles = await storage.getArticlesByCategory(categoryId as string);
      } else {
        articles = user.role === 'admin' 
          ? await storage.getArticles() 
          : await storage.getPublishedArticles();
      }

      // Filter articles based on category permissions for non-admin users
      if (user.role !== 'admin') {
        const userPermissions = await storage.getUserPermissions(userId);
        const allowedCategoryIds = userPermissions
          .filter(p => p.permissionType !== 'none')
          .map(p => p.categoryId);
        articles = articles.filter(article => allowedCategoryIds.includes(article.categoryId));
      }

      res.json(articles);
    } catch (error) {
      console.error("Error fetching articles:", error);
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  });

  app.get('/api/articles/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const article = await storage.getArticle(req.params.id);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      // Check permissions for non-admin users
      if (user.role !== 'admin') {
        const permission = await storage.getUserCategoryPermission(userId, article.categoryId);
        if (!permission || permission.permissionType === 'none') {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      res.json(article);
    } catch (error) {
      console.error("Error fetching article:", error);
      res.status(500).json({ message: "Failed to fetch article" });
    }
  });

  app.post('/api/articles', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check write permissions for the category
      if (user.role !== 'admin') {
        const permission = await storage.getUserCategoryPermission(userId, req.body.categoryId);
        if (!permission || permission.permissionType !== 'write') {
          return res.status(403).json({ message: "Write access required" });
        }
      }

      const articleData = insertArticleSchema.parse({
        ...req.body,
        authorId: userId,
      });

      const article = await storage.createArticle(articleData);
      
      // Create initial version
      await storage.createArticleVersion(article.id, userId);
      
      res.status(201).json(article);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid article data", errors: error.errors });
      }
      console.error("Error creating article:", error);
      res.status(500).json({ message: "Failed to create article" });
    }
  });

  app.put('/api/articles/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const existingArticle = await storage.getArticle(req.params.id);
      if (!existingArticle) {
        return res.status(404).json({ message: "Article not found" });
      }

      // Check permissions
      const canEdit = user.role === 'admin' || 
        existingArticle.authorId === userId ||
        (await storage.getUserCategoryPermission(userId, existingArticle.categoryId))?.permissionType === 'write';

      if (!canEdit) {
        return res.status(403).json({ message: "Edit access denied" });
      }

      const articleData = insertArticleSchema.partial().parse(req.body);
      
      // Create version if content is being updated
      if (articleData.content && articleData.content !== existingArticle.content) {
        await storage.createArticleVersion(req.params.id, userId);
      }
      
      const article = await storage.updateArticle(req.params.id, articleData);
      res.json(article);
    } catch (error) {
      console.error("Error updating article:", error);
      res.status(500).json({ message: "Failed to update article" });
    }
  });

  app.delete('/api/articles/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const existingArticle = await storage.getArticle(req.params.id);
      if (!existingArticle) {
        return res.status(404).json({ message: "Article not found" });
      }

      // Only admin or author can delete
      const canDelete = user.role === 'admin' || existingArticle.authorId === userId;

      if (!canDelete) {
        return res.status(403).json({ message: "Delete access denied" });
      }

      const deleted = await storage.deleteArticle(req.params.id);
      if (deleted) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Article not found" });
      }
    } catch (error) {
      console.error("Error deleting article:", error);
      res.status(500).json({ message: "Failed to delete article" });
    }
  });

  // Article versions
  app.get('/api/articles/:id/versions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const article = await storage.getArticle(req.params.id);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      // Check permissions
      if (user.role !== 'admin') {
        const permission = await storage.getUserCategoryPermission(userId, article.categoryId);
        if (!permission || permission.permissionType === 'none') {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      const versions = await storage.getArticleVersions(req.params.id);
      res.json(versions);
    } catch (error) {
      console.error("Error fetching article versions:", error);
      res.status(500).json({ message: "Failed to fetch versions" });
    }
  });

  // Search endpoint
  app.get('/api/search', isAuthenticated, async (req: any, res) => {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({ message: "Search query is required" });
      }

      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let articles = await storage.searchArticles(q as string);

      // Filter by permissions for non-admin users
      if (user.role !== 'admin') {
        const userPermissions = await storage.getUserPermissions(userId);
        const allowedCategoryIds = userPermissions
          .filter(p => p.permissionType !== 'none')
          .map(p => p.categoryId);
        articles = articles.filter(article => allowedCategoryIds.includes(article.categoryId));
      }

      res.json(articles);
    } catch (error) {
      console.error("Error searching articles:", error);
      res.status(500).json({ message: "Failed to search articles" });
    }
  });

  // Permissions endpoints (Admin only)
  app.get('/api/permissions', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { userId: targetUserId, categoryId } = req.query;

      let permissions;
      if (targetUserId) {
        permissions = await storage.getUserPermissions(targetUserId as string);
      } else if (categoryId) {
        permissions = await storage.getCategoryPermissions(categoryId as string);
      } else {
        permissions = await storage.getAllPermissions();
      }

      res.json(permissions);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      res.status(500).json({ message: "Failed to fetch permissions" });
    }
  });

  app.post('/api/permissions', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const permissionData = insertPermissionSchema.parse(req.body);
      const permission = await storage.setUserPermission(permissionData);
      res.status(201).json(permission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid permission data", errors: error.errors });
      }
      console.error("Error creating permission:", error);
      res.status(500).json({ message: "Failed to create permission" });
    }
  });

  app.put('/api/permissions/:id', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const permissionData = insertPermissionSchema.partial().parse(req.body);
      
      const updatedPermission = await storage.updatePermission(req.params.id, permissionData);
      if (updatedPermission) {
        res.json(updatedPermission);
      } else {
        res.status(404).json({ message: "Permission not found" });
      }
    } catch (error) {
      console.error("Error updating permission:", error);
      res.status(500).json({ message: "Failed to update permission" });
    }
  });

  // File endpoints
  app.get('/api/files', isAuthenticated, async (req: any, res) => {
    try {
      const { categoryId, articleId } = req.query;
      
      let files;
      if (articleId) {
        files = await storage.getFilesByArticle(articleId as string);
      } else if (categoryId) {
        files = await storage.getFilesByCategory(categoryId as string);
      } else {
        files = await storage.getFiles();
      }

      res.json(files);
    } catch (error) {
      console.error("Error fetching files:", error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  app.get('/api/files/:id', isAuthenticated, async (req: any, res) => {
    try {
      const file = await storage.getFile(req.params.id);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      // Check permissions
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user && user.role !== 'admin' && file.categoryId) {
        const permission = await storage.getUserCategoryPermission(userId, file.categoryId);
        if (!permission || permission.permissionType === 'none') {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      res.json(file);
    } catch (error) {
      console.error("Error fetching file:", error);
      res.status(500).json({ message: "Failed to fetch file" });
    }
  });

  app.post('/api/files/upload', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.user.id;
      const { articleId, categoryId } = req.body;

      // Check permissions if uploading to a specific category
      if (categoryId) {
        const user = await storage.getUser(userId);
        if (user && user.role !== 'admin') {
          const permission = await storage.getUserCategoryPermission(userId, categoryId);
          if (!permission || permission.permissionType === 'none') {
            return res.status(403).json({ message: "Upload access denied" });
          }
        }
      }

      const fileData = {
        filename: req.file.originalname,
        originalName: req.file.originalname,
        filePath: req.file.path,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        uploadedBy: userId,
        articleId: articleId || null,
        categoryId: categoryId || null,
      };

      const file = await storage.createFile(fileData);
      res.status(201).json(file);
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  app.delete('/api/files/:id', isAuthenticated, async (req: any, res) => {
    try {
      const file = await storage.getFile(req.params.id);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      // Check delete permissions
      const canDelete = user && (
        user.role === 'admin' || 
        file.uploadedBy === userId ||
        (file.categoryId && (await storage.getUserCategoryPermission(userId, file.categoryId))?.permissionType === 'write')
      );

      if (!canDelete) {
        return res.status(403).json({ message: "Delete access denied" });
      }

      const deleted = await storage.deleteFile(req.params.id);
      if (deleted) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "File not found" });
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  // Object storage routes
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });

  // Redirect GET requests to /api/login back to the frontend auth page
  app.get('/api/login', (req, res) => {
    res.redirect('/auth');
  });

  // Microsoft Teams Integration endpoints
  app.post('/api/teams/webhook', async (req, res) => {
    try {
      // Handle Teams webhook events
      const { type, activity, channelData } = req.body;
      
      // Log the webhook event for debugging
      console.log('Teams webhook received:', { type, activity: activity?.type, channelData });
      
      // In a real implementation, process different activity types:
      // - message: new message in Teams
      // - conversationUpdate: user added/removed from conversation
      // - invoke: adaptive card action invoked
      
      res.status(200).json({ status: 'received' });
    } catch (error) {
      console.error("Error processing Teams webhook:", error);
      res.status(500).json({ message: "Failed to process webhook" });
    }
  });

  app.get('/api/teams/auth', async (req, res) => {
    try {
      // Teams authentication endpoint
      // In a real implementation, this would handle Teams SSO flow
      const { code, state } = req.query;
      
      if (!code) {
        return res.status(400).json({ message: "Authorization code required" });
      }
      
      // Exchange code for tokens and integrate with Teams
      // For demo purposes, return mock success
      res.json({ 
        status: 'authenticated',
        message: 'Teams integration configured successfully' 
      });
    } catch (error) {
      console.error("Error with Teams auth:", error);
      res.status(500).json({ message: "Teams authentication failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}