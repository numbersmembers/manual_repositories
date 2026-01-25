import { users, loginLogs, type LoginLog } from "@shared/schema";
import { db } from "../../db";
import { eq, desc } from "drizzle-orm";

export type User = typeof users.$inferSelect;
export type UpsertUser = {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
};

export type CreateLoginLog = {
  userId: string;
  userEmail: string;
  userName: string;
  action: 'login' | 'logout';
  ipAddress?: string | null;
  userAgent?: string | null;
};

export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createLoginLog(log: CreateLoginLog): Promise<LoginLog>;
  getLoginLogs(limit?: number): Promise<LoginLog[]>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const name = [userData.firstName, userData.lastName].filter(Boolean).join(' ') || 'User';
    const email = userData.email || '';
    
    // First check if user exists by email (since email is unique)
    const [existingByEmail] = await db.select().from(users).where(eq(users.email, email));
    if (existingByEmail) {
      // Update existing user and return
      const [updated] = await db
        .update(users)
        .set({
          name: name,
          avatarUrl: userData.profileImageUrl,
        })
        .where(eq(users.email, email))
        .returning();
      return updated;
    }
    
    // Check if user exists by ID
    const [existingById] = await db.select().from(users).where(eq(users.id, userData.id));
    if (existingById) {
      // Update existing user by ID
      const [updated] = await db
        .update(users)
        .set({
          email: email,
          name: name,
          avatarUrl: userData.profileImageUrl,
        })
        .where(eq(users.id, userData.id))
        .returning();
      return updated;
    }
    
    // Insert new user
    const [user] = await db
      .insert(users)
      .values({
        id: userData.id,
        email: email,
        name: name,
        avatarUrl: userData.profileImageUrl,
        level: 1,
        isAdmin: 0,
        status: 'active',
      })
      .returning();
    return user;
  }

  async createLoginLog(log: CreateLoginLog): Promise<LoginLog> {
    const [loginLog] = await db
      .insert(loginLogs)
      .values({
        userId: log.userId,
        userEmail: log.userEmail,
        userName: log.userName,
        action: log.action,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
      })
      .returning();
    return loginLog;
  }

  async getLoginLogs(limit: number = 100): Promise<LoginLog[]> {
    return await db
      .select()
      .from(loginLogs)
      .orderBy(desc(loginLogs.createdAt))
      .limit(limit);
  }
}

export const authStorage = new AuthStorage();
