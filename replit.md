# Bloter/Numbers 업무 매뉴얼

## Overview

A document management system for Bloter/Numbers company, designed to organize and control access to internal manuals and documents. The system implements role-based access control with three user levels (General, Staff, Admin) and supports document categorization with hierarchical folder structures. Documents can be classified by security level (secret, important, general) with access restrictions based on user permissions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state, React Context for auth state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS v4 with CSS variables for theming (light/dark mode support)
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Framework**: Express.js 5 running on Node.js
- **API Pattern**: RESTful API endpoints under `/api/*` prefix
- **Session Management**: express-session with PostgreSQL session store (connect-pg-simple)
- **Authentication**: Google OAuth 2.0 via Passport.js (passport-google-oauth20)

### Data Storage
- **Primary Database**: Supabase (PostgreSQL) when SUPABASE_URL is configured
- **Fallback Database**: Replit PostgreSQL via DATABASE_URL
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Tables**: 
  - `users` - User accounts with level-based permissions (1-3)
  - `categories` - Hierarchical document categories with path tracking
  - `documents` - Document metadata with security levels and file references
  - `login_logs` - Authentication activity logs (login/logout events)
  - `comments` - Document comments for collaboration

### Authentication & Authorization
- **OAuth Provider**: Google OAuth 2.0
- **User Levels**: 
  - Level 1 (General): Access to general documents only
  - Level 2 (Staff): Access to general and important documents
  - Level 3 (Admin): Full access including secret documents and admin panel
- **Middleware**: `requireAuth` and `requireAdmin` Express middleware for route protection
- **Session**: Cookie-based sessions with 7-day expiration, stored in PostgreSQL
- **Login Logging**: All login/logout events recorded with IP address and user agent

### Key Design Patterns
- **Shared Schema**: Database types and validation schemas shared between client and server via `@shared/*` alias
- **API Layer**: Centralized API functions in `client/src/lib/api.ts` for consistent request handling
- **Component Structure**: Layout wrapper with sidebar navigation, theme provider, and toast notifications

## External Dependencies

### Database
- PostgreSQL (connection via `DATABASE_URL` environment variable)
- Drizzle ORM for type-safe database queries
- drizzle-zod for automatic Zod schema generation from database tables

### UI Libraries
- Radix UI primitives for accessible component foundations
- Lucide React for icons
- class-variance-authority for component variants
- embla-carousel-react for carousel functionality

### External Services
- DiceBear API for generating user avatars (`https://api.dicebear.com/7.x/avataaars/svg`)
- Google Fonts for Inter, Noto Sans KR, and JetBrains Mono typefaces

### Development Tools
- Vite with React plugin and Tailwind CSS integration
- esbuild for production server bundling
- TypeScript with strict mode enabled