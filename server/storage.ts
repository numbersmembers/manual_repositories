import { 
  type User, type InsertUser,
  type Category, type InsertCategory,
  type Document, type InsertDocument,
  users, categories, documents
} from "@shared/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { eq, and, or, sql, desc } from "drizzle-orm";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLevel(id: string, level: number): Promise<User | undefined>;
  updateUserStatus(id: string, status: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Category operations
  getCategory(id: string): Promise<Category | undefined>;
  getAllCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  deleteCategory(id: string): Promise<void>;
  
  // Document operations
  getDocument(id: string): Promise<Document | undefined>;
  getAllDocuments(): Promise<Document[]>;
  getDocumentsByCategory(categoryId: string): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  deleteDocument(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserLevel(id: string, level: number): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ level, isAdmin: level === 3 ? 1 : 0 })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserStatus(id: string, status: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ status })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Category operations
  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    return category;
  }

  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(insertCategory).returning();
    return category;
  }

  async deleteCategory(id: string): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Document operations
  async getDocument(id: string): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
    return document;
  }

  async getAllDocuments(): Promise<Document[]> {
    return await db.select().from(documents).orderBy(desc(documents.createdAt));
  }

  async getDocumentsByCategory(categoryId: string): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.categoryId, categoryId)).orderBy(desc(documents.createdAt));
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [document] = await db.insert(documents).values(insertDocument).returning();
    return document;
  }

  async deleteDocument(id: string): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }
}

export const storage = new DatabaseStorage();
