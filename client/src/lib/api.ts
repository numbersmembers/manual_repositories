import type { User, Category, Document } from './types';

const API_BASE = '/api';

// Helper for API requests
async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  // Handle 204 No Content responses
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// User API
export const userApi = {
  async getAll(): Promise<User[]> {
    const users = await apiRequest<any[]>('/users');
    return users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      level: u.level,
      status: u.status,
      isAdmin: u.isAdmin === 1,
      avatarUrl: u.avatarUrl
    }));
  },

  async updateLevel(userId: string, level: number): Promise<User> {
    const user = await apiRequest<any>(`/users/${userId}/level`, {
      method: 'PATCH',
      body: JSON.stringify({ level }),
    });
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      level: user.level,
      status: user.status,
      isAdmin: user.isAdmin === 1,
      avatarUrl: user.avatarUrl
    };
  },

  async updateStatus(userId: string, status: string): Promise<User> {
    const user = await apiRequest<any>(`/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      level: user.level,
      status: user.status,
      isAdmin: user.isAdmin === 1,
      avatarUrl: user.avatarUrl
    };
  },
};

// Category API
export const categoryApi = {
  async getAll(): Promise<Category[]> {
    const categories = await apiRequest<any[]>('/categories');
    return categories.map(c => ({
      id: c.id,
      name: c.name,
      parentId: c.parentId ?? null,
      path: c.path
    }));
  },

  async create(category: Omit<Category, 'id'>): Promise<Category> {
    const created = await apiRequest<any>('/categories', {
      method: 'POST',
      body: JSON.stringify({
        name: category.name,
        parentId: category.parentId ?? null,
        path: category.path
      }),
    });
    return {
      id: created.id,
      name: created.name,
      parentId: created.parentId ?? null,
      path: created.path
    };
  },

  async delete(categoryId: string): Promise<void> {
    await apiRequest(`/categories/${categoryId}`, {
      method: 'DELETE',
    });
  },
};

// Document API
export const documentApi = {
  async getAll(): Promise<Document[]> {
    const docs = await apiRequest<any[]>('/documents');
    return docs.map(d => ({
      id: d.id,
      title: d.title,
      type: d.type as any,
      securityLevel: d.securityLevel as any,
      categoryId: d.categoryId,
      url: d.url,
      authorId: d.authorId,
      authorName: d.authorName,
      createdAt: d.createdAt,
      size: d.size
    }));
  },

  async getById(documentId: string): Promise<Document> {
    const d = await apiRequest<any>(`/documents/${documentId}`);
    return {
      id: d.id,
      title: d.title,
      type: d.type as any,
      securityLevel: d.securityLevel as any,
      categoryId: d.categoryId,
      url: d.url,
      authorId: d.authorId,
      authorName: d.authorName,
      createdAt: d.createdAt,
      size: d.size
    };
  },

  async create(document: {
    title: string;
    type: string;
    securityLevel: string;
    categoryId: string;
    url?: string;
    size?: string;
  }): Promise<Document> {
    const created = await apiRequest<any>('/documents', {
      method: 'POST',
      body: JSON.stringify(document),
    });
    return {
      id: created.id,
      title: created.title,
      type: created.type as any,
      securityLevel: created.securityLevel as any,
      categoryId: created.categoryId,
      url: created.url,
      authorId: created.authorId,
      authorName: created.authorName,
      createdAt: created.createdAt,
      size: created.size
    };
  },

  async delete(documentId: string): Promise<void> {
    await apiRequest(`/documents/${documentId}`, {
      method: 'DELETE',
    });
  },
};
