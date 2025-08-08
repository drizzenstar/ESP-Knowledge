# Knowledge Base Application

## Overview

This is a comprehensive enterprise knowledge base application built with React, Express.js, and PostgreSQL. The system provides role-based content management capabilities with file upload support, category-based organization, and a modern web interface. The application is designed for team collaboration with admin controls for user management and content organization.

The system features a full-stack TypeScript implementation with a React frontend using shadcn/ui components, an Express.js API backend, and PostgreSQL database with Drizzle ORM. It includes authentication via Replit Auth, file storage with Google Cloud Storage integration, and comprehensive permission controls.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite build system
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **File Upload**: Uppy with AWS S3 integration for direct-to-cloud uploads

### Backend Architecture
- **Framework**: Express.js with TypeScript in ESM mode
- **Database ORM**: Drizzle ORM with PostgreSQL adapter
- **Authentication**: Replit Auth with OpenID Connect integration
- **Session Management**: express-session with PostgreSQL session store
- **API Design**: RESTful endpoints with consistent error handling
- **File Processing**: Multer for multipart form handling

### Database Design
- **Primary Database**: PostgreSQL via Neon serverless
- **Schema Management**: Drizzle Kit for migrations and schema generation
- **Key Tables**: 
  - Users with role-based access (admin/user)
  - Categories with hierarchical organization
  - Articles with versioning and rich content
  - Files with metadata and article associations
  - Permissions for fine-grained access control
- **Relationships**: Foreign key constraints with proper cascading

### Authentication & Authorization
- **Provider**: Replit Auth with OIDC integration
- **Session Storage**: Secure HTTP-only cookies with PostgreSQL backing
- **Role System**: Two-tier system (admin/user) with category-level permissions
- **Permission Types**: Read, write, and none access levels per category
- **User Management**: Admin-controlled user creation and role assignment

### File Storage & Management
- **Primary Storage**: Google Cloud Storage via Replit Object Storage
- **Upload Strategy**: Direct-to-cloud uploads with presigned URLs
- **File Types**: Support for documents (PDF, DOC, DOCX), images, and videos
- **Access Control**: Custom ACL policies with group-based permissions
- **Metadata**: Full file tracking with size limits and type validation

## External Dependencies

### Core Runtime Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: TypeScript ORM with schema validation
- **express**: Web application framework
- **@tanstack/react-query**: Server state management
- **zod**: Schema validation and type safety

### Authentication & Security
- **openid-client**: OIDC authentication flows
- **passport**: Authentication middleware
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session storage

### File Upload & Storage
- **@google-cloud/storage**: Google Cloud Storage client
- **@uppy/core**: File upload handling
- **@uppy/aws-s3**: S3-compatible uploads
- **multer**: Multipart form data processing

### UI & Styling
- **@radix-ui/react-***: Accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **wouter**: Lightweight routing solution

### Development Tools
- **vite**: Frontend build tooling with HMR
- **tsx**: TypeScript execution for development
- **esbuild**: Production bundling for server code
- **drizzle-kit**: Database schema management