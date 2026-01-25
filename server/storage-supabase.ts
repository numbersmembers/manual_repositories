import { 
  type User, type InsertUser,
  type Category, type InsertCategory,
  type Document, type InsertDocument
} from "@shared/schema";
import { supabase } from "./supabase";
import { IStorage } from "./storage";

export class SupabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return this.mapUser(data);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error || !data) return undefined;
    return this.mapUser(data);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert({
        email: insertUser.email,
        name: insertUser.name,
        level: insertUser.level || 1,
        is_admin: insertUser.isAdmin || 0,
        status: insertUser.status || 'active',
        avatar_url: insertUser.avatarUrl
      })
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create user: ${error.message}`);
    return this.mapUser(data);
  }

  async updateUserLevel(id: string, level: number): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .update({ level, is_admin: level === 3 ? 1 : 0 })
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) return undefined;
    return this.mapUser(data);
  }

  async updateUserStatus(id: string, status: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) return undefined;
    return this.mapUser(data);
  }

  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error || !data) return [];
    return data.map(this.mapUser);
  }

  // Category operations
  async getCategory(id: string): Promise<Category | undefined> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return this.mapCategory(data);
  }

  async getAllCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*');
    
    if (error || !data) return [];
    return data.map(this.mapCategory);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: insertCategory.name,
        parent_id: insertCategory.parentId,
        path: insertCategory.path
      })
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create category: ${error.message}`);
    return this.mapCategory(data);
  }

  async deleteCategory(id: string): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(`Failed to delete category: ${error.message}`);
  }

  // Document operations
  async getDocument(id: string): Promise<Document | undefined> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return this.mapDocument(data);
  }

  async getAllDocuments(): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error || !data) return [];
    return data.map(this.mapDocument);
  }

  async getDocumentsByCategory(categoryId: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('category_id', categoryId)
      .order('created_at', { ascending: false });
    
    if (error || !data) return [];
    return data.map(this.mapDocument);
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const { data, error } = await supabase
      .from('documents')
      .insert({
        title: insertDocument.title,
        type: insertDocument.type,
        security_level: insertDocument.securityLevel,
        category_id: insertDocument.categoryId,
        url: insertDocument.url,
        file_data: insertDocument.fileData,
        size: insertDocument.size,
        author_id: insertDocument.authorId,
        author_name: insertDocument.authorName
      })
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create document: ${error.message}`);
    return this.mapDocument(data);
  }

  async deleteDocument(id: string): Promise<void> {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(`Failed to delete document: ${error.message}`);
  }

  // Helper methods to map Supabase snake_case to camelCase
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

  private mapCategory(data: any): Category {
    return {
      id: data.id,
      name: data.name,
      parentId: data.parent_id,
      path: data.path,
      createdAt: new Date(data.created_at)
    };
  }

  private mapDocument(data: any): Document {
    return {
      id: data.id,
      title: data.title,
      type: data.type,
      securityLevel: data.security_level,
      categoryId: data.category_id,
      url: data.url,
      fileData: data.file_data,
      size: data.size,
      authorId: data.author_id,
      authorName: data.author_name,
      createdAt: new Date(data.created_at)
    };
  }
}

export const supabaseStorage = new SupabaseStorage();
