import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDocumentSchema, insertCategorySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  const requireAdmin = async (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.level !== 3) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    next();
  };

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Create new user with level 1 for demo purposes
        const newUser = await storage.createUser({
          email,
          name: email.split('@')[0],
          level: 1,
          isAdmin: 0,
          status: 'active',
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
        });
        req.session.userId = newUser.id;
        return res.json(newUser);
      }

      if (user.status === 'banned') {
        return res.status(403).json({ message: "Account has been banned" });
      }

      req.session.userId = user.id;
      res.json(user);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        req.session.destroy(() => {});
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // User management routes (admin only)
  app.get("/api/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  app.patch("/api/users/:id/level", requireAdmin, async (req, res) => {
    try {
      const { level } = req.body;
      if (typeof level !== 'number' || level < 1 || level > 3) {
        return res.status(400).json({ message: "Level must be 1, 2, or 3" });
      }

      const user = await storage.updateUserLevel(req.params.id, level);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Update user level error:", error);
      res.status(500).json({ message: "Failed to update user level" });
    }
  });

  app.patch("/api/users/:id/status", requireAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      if (!['active', 'banned'].includes(status)) {
        return res.status(400).json({ message: "Status must be 'active' or 'banned'" });
      }

      const user = await storage.updateUserStatus(req.params.id, status);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Update user status error:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  // Category routes
  app.get("/api/categories", requireAuth, async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error("Get categories error:", error);
      res.status(500).json({ message: "Failed to get categories" });
    }
  });

  app.post("/api/categories", requireAdmin, async (req, res) => {
    try {
      const parsed = insertCategorySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid category data", errors: parsed.error });
      }

      const category = await storage.createCategory(parsed.data);
      res.status(201).json(category);
    } catch (error) {
      console.error("Create category error:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.delete("/api/categories/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteCategory(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete category error:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Document routes
  app.get("/api/documents", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const allDocuments = await storage.getAllDocuments();
      
      // Filter based on user level
      const accessibleDocuments = allDocuments.filter(doc => {
        if (user.level === 3) return true; // Admin sees all
        if (user.level === 2) return doc.securityLevel !== 'secret'; // Staff sees Important + General
        return doc.securityLevel === 'general'; // General sees General only
      });

      res.json(accessibleDocuments);
    } catch (error) {
      console.error("Get documents error:", error);
      res.status(500).json({ message: "Failed to get documents" });
    }
  });

  app.get("/api/documents/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Check access level
      if (user.level === 1 && document.securityLevel !== 'general') {
        return res.status(403).json({ message: "Access denied" });
      }
      if (user.level === 2 && document.securityLevel === 'secret') {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(document);
    } catch (error) {
      console.error("Get document error:", error);
      res.status(500).json({ message: "Failed to get document" });
    }
  });

  app.post("/api/documents", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const parsed = insertDocumentSchema.safeParse({
        ...req.body,
        authorId: user.id,
        authorName: user.name
      });

      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid document data", errors: parsed.error });
      }

      const document = await storage.createDocument(parsed.data);
      res.status(201).json(document);
    } catch (error) {
      console.error("Create document error:", error);
      res.status(500).json({ message: "Failed to create document" });
    }
  });

  app.delete("/api/documents/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Only admin or author can delete
      if (user.level !== 3 && document.authorId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteDocument(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete document error:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  return httpServer;
}
