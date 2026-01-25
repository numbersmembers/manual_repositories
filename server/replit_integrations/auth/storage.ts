import { users, loginLogs, type LoginLog, type User } from "@shared/schema";
import { db } from "../../db";
import { supabase } from "../../supabase";
import { eq, desc } from "drizzle-orm";

export type { User };
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

const useSupabase = !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);

class PostgresAuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const name = [userData.firstName, userData.lastName].filter(Boolean).join(' ') || 'User';
    const email = userData.email || '';
    
    const [existingByEmail] = await db.select().from(users).where(eq(users.email, email));
    if (existingByEmail) {
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
    
    const [existingById] = await db.select().from(users).where(eq(users.id, userData.id));
    if (existingById) {
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

class SupabaseAuthStorage implements IAuthStorage {
  private mapUser(data: any): User {
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      level: data.level,
      isAdmin: data.is_admin,
      status: data.status,
      avatarUrl: data.avatar_url,
      createdAt: new Date(data.created_at)
    };
  }

  async getUser(id: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return this.mapUser(data);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const name = [userData.firstName, userData.lastName].filter(Boolean).join(' ') || 'User';
    const email = userData.email || '';
    
    const { data: existingByEmail } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (existingByEmail) {
      const { data: updated, error } = await supabase
        .from('users')
        .update({
          name: name,
          avatar_url: userData.profileImageUrl,
        })
        .eq('email', email)
        .select()
        .single();
      
      if (error) throw new Error(`Failed to update user: ${error.message}`);
      return this.mapUser(updated);
    }
    
    const { data: existingById } = await supabase
      .from('users')
      .select('*')
      .eq('id', userData.id)
      .single();
    
    if (existingById) {
      const { data: updated, error } = await supabase
        .from('users')
        .update({
          email: email,
          name: name,
          avatar_url: userData.profileImageUrl,
        })
        .eq('id', userData.id)
        .select()
        .single();
      
      if (error) throw new Error(`Failed to update user: ${error.message}`);
      return this.mapUser(updated);
    }
    
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        id: userData.id,
        email: email,
        name: name,
        avatar_url: userData.profileImageUrl,
        level: 1,
        is_admin: 0,
        status: 'active',
      })
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create user: ${error.message}`);
    return this.mapUser(user);
  }

  async createLoginLog(log: CreateLoginLog): Promise<LoginLog> {
    const { data, error } = await supabase
      .from('login_logs')
      .insert({
        user_id: log.userId,
        user_email: log.userEmail,
        user_name: log.userName,
        action: log.action,
        ip_address: log.ipAddress,
        user_agent: log.userAgent,
      })
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create login log: ${error.message}`);
    return {
      id: data.id,
      userId: data.user_id,
      userEmail: data.user_email,
      userName: data.user_name,
      action: data.action,
      ipAddress: data.ip_address,
      userAgent: data.user_agent,
      createdAt: new Date(data.created_at)
    };
  }

  async getLoginLogs(limit: number = 100): Promise<LoginLog[]> {
    const { data, error } = await supabase
      .from('login_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error || !data) return [];
    return data.map((log: any) => ({
      id: log.id,
      userId: log.user_id,
      userEmail: log.user_email,
      userName: log.user_name,
      action: log.action,
      ipAddress: log.ip_address,
      userAgent: log.user_agent,
      createdAt: new Date(log.created_at)
    }));
  }
}

function createAuthStorage(): IAuthStorage {
  if (useSupabase) {
    console.log('Auth storage: Using Supabase');
    return new SupabaseAuthStorage();
  } else {
    console.log('Auth storage: Using PostgreSQL');
    return new PostgresAuthStorage();
  }
}

export const authStorage = createAuthStorage();
