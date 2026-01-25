-- Supabase Schema for Bloter/Numbers Manual System
-- Run this SQL in Supabase SQL Editor to create the tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  is_admin INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  security_level TEXT NOT NULL DEFAULT 'general',
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  url TEXT,
  file_data TEXT,
  size TEXT,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category_id);
CREATE INDEX IF NOT EXISTS idx_documents_author ON documents(author_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);

-- Row Level Security (RLS) - Optional but recommended
-- Enable RLS on tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Policy to allow all operations (for simplicity - customize as needed)
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations on categories" ON categories FOR ALL USING (true);
CREATE POLICY "Allow all operations on documents" ON documents FOR ALL USING (true);

-- Sample seed data (optional - run separately if needed)
/*
-- Insert admin user
INSERT INTO users (email, name, level, is_admin, status, avatar_url)
VALUES ('mrmoon@numbers.co.kr', '문병선', 3, 1, 'active', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Moon');

-- Insert staff user
INSERT INTO users (email, name, level, is_admin, status, avatar_url)
VALUES ('staff@numbers.co.kr', '김스탭', 2, 0, 'active', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Staff');

-- Insert general user
INSERT INTO users (email, name, level, is_admin, status, avatar_url)
VALUES ('user@numbers.co.kr', '이일반', 1, 0, 'active', 'https://api.dicebear.com/7.x/avataaars/svg?seed=User');

-- Insert categories
INSERT INTO categories (name, parent_id, path) VALUES ('경제', NULL, '경제');
INSERT INTO categories (name, parent_id, path) VALUES ('IT', NULL, 'IT');
INSERT INTO categories (name, parent_id, path) VALUES ('인사/총무', NULL, '인사/총무');
*/
