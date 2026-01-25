import { users } from "@shared/schema";
import { db } from "../../db";
import { eq } from "drizzle-orm";

export type User = typeof users.$inferSelect;
export type UpsertUser = {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
};

export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const name = [userData.firstName, userData.lastName].filter(Boolean).join(' ') || 'User';
    
    const [user] = await db
      .insert(users)
      .values({
        id: userData.id,
        email: userData.email || '',
        name: name,
        avatarUrl: userData.profileImageUrl,
        level: 1,
        isAdmin: 0,
        status: 'active',
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email || '',
          name: name,
          avatarUrl: userData.profileImageUrl,
        },
      })
      .returning();
    return user;
  }
}

export const authStorage = new AuthStorage();
