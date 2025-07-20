# Whack-a-Mole Game

## Overview

This project features a Whack-a-Mole game available in two versions:
1. **Vanilla HTML/CSS/JS Version**: Pure web technologies (index.html, style.css, app.js) - ready to run in any browser
2. **React Version**: Full-stack application with React frontend and Express.js backend

The vanilla version maintains all original features while using only standard web technologies - no frameworks, no build tools, no dependencies.

## User Preferences

Preferred communication style: Simple, everyday language.
Game settings: Average mole speed with smooth animations.
Home screen options: Normal size (not oversized)
Code quality: Error-free with no console logs
Animation preference: Smooth mole animations without timing glitches

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side navigation
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: React hooks with TanStack Query for server state
- **Build Tool**: Vite with hot module replacement

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Management**: PostgreSQL session store
- **Development**: tsx for TypeScript execution

### Build and Deployment Strategy
- **Development**: Vite dev server with Express backend
- **Production Build**: Vite builds frontend, esbuild bundles backend
- **Static Assets**: Served from dist/public directory
- **Environment**: Supports both development and production modes

## Key Components

### Game Logic
- **Whack-a-Mole Game**: Complete implementation with scoring, timer, and high score tracking
- **Sound Effects**: Web Audio API for hit sounds
- **Local Storage**: Persistent high score storage
- **Responsive Design**: Mobile-friendly game interface

### UI Components
- **Component Library**: Comprehensive shadcn/ui component set
- **Theming**: Light/dark mode support with CSS custom properties
- **Typography**: Consistent styling with Tailwind utility classes
- **Interactive Elements**: Buttons, cards, dialogs, and form components

### Database Schema
- **Users Table**: Basic user management with username/password
- **Drizzle ORM**: Type-safe database operations with PostgreSQL dialect
- **Migrations**: Database schema versioning in ./migrations directory

## Data Flow

### Game State Management
1. Game state stored in React component state
2. High scores persisted to localStorage
3. Real-time updates during gameplay
4. Timer and score synchronization

### Database Operations
1. Drizzle ORM provides type-safe database queries
2. Connection pooling through Neon serverless driver
3. Session management with PostgreSQL store
4. Environment-based configuration

### API Structure
- **REST Endpoints**: Express routes prefixed with /api
- **Request Logging**: Middleware for API request tracking
- **Error Handling**: Centralized error middleware
- **CORS**: Configured for development and production

## External Dependencies

### Core Dependencies
- **React Ecosystem**: React, React DOM, React Router (Wouter)
- **UI Framework**: Radix UI primitives, class-variance-authority
- **Styling**: Tailwind CSS, clsx for conditional classes
- **Database**: Drizzle ORM, Neon Database driver
- **Build Tools**: Vite, esbuild, TypeScript

### Development Tools
- **Replit Integration**: Vite plugins for Replit environment
- **Hot Reload**: Vite HMR for development experience
- **TypeScript**: Strict type checking and modern ES features
- **PostCSS**: CSS processing with Tailwind and Autoprefixer

### UI Component Libraries
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library for consistent iconography
- **Embla Carousel**: Carousel/slider functionality
- **TanStack Query**: Server state management and caching

## Deployment Strategy

### Development Environment
- Uses tsx for TypeScript execution without compilation
- Vite dev server with Express middleware integration
- Hot module replacement for rapid development
- Replit-specific plugins for cloud development

### Production Build
1. **Frontend Build**: Vite compiles React app to static assets
2. **Backend Build**: esbuild bundles Express server as ESM
3. **Asset Serving**: Express serves static files from dist/public
4. **Environment Variables**: DATABASE_URL for PostgreSQL connection

### Database Setup
- PostgreSQL database required (configured for Neon)
- Drizzle migrations in ./migrations directory
- Schema defined in shared/schema.ts
- Connection string via DATABASE_URL environment variable

### Session Management
- PostgreSQL session store for user sessions
- Cookie-based session handling
- Configurable session duration and security settings

## Recent Changes

### January 20, 2025
- ✓ Successfully migrated project from Replit Agent to Replit environment
- ✓ Fixed home screen UI to use normal-sized buttons instead of oversized ones
- ✓ Removed all console.log statements to eliminate errors and improve performance
- ✓ Optimized mole animations with average speed settings and smooth cubic-bezier transitions
- ✓ Improved level configurations for balanced gameplay:
  - Easy: 1.5s interval, 2.5s visibility
  - Medium: 1.0s interval, 2.0s visibility 
  - Hard: 0.7s interval, 1.5s visibility
- ✓ Enhanced animation timing with smoother 0.5s transitions
- ✓ Completed full migration to standard Replit environment with all features working
- ✓ Verified security practices: client/server separation, proper dependency management
- ✓ Successfully converted React app to pure HTML, CSS, and JavaScript
- ✓ Created vanilla version with all original features:
  - Complete game logic in vanilla JavaScript
  - Responsive CSS design with animations
  - Web Audio API for sound effects
  - Local storage for high scores
  - Multiple difficulty levels
  - Modern UI with floating animations