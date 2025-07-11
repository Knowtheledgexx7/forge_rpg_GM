# Galaxy of Consequence - Star Wars RPG Application

## Overview

This is a full-stack Star Wars role-playing game (RPG) application built with modern web technologies. The application provides an immersive Star Wars experience with character creation, AI-powered game mastering, real-time market simulation, and forum-style location interactions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with custom Star Wars theme variables
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Authentication**: Replit OAuth integration with OpenID Connect
- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple
- **WebSockets**: Native WebSocket support for real-time features

### Key Components

#### Authentication System
- **Provider**: Replit OAuth with OpenID Connect
- **Session Storage**: PostgreSQL sessions table
- **User Management**: Automatic user creation and profile sync
- **Security**: HTTP-only cookies, secure session handling

#### Database Schema
- **Users**: Profile data synced from Replit OAuth
- **Characters**: Player character data with RPG stats
- **Factions**: Reputation system with various Star Wars factions
- **Corporations**: Stock market entities with real-time pricing
- **Locations**: Forum-style areas with threaded discussions
- **Events**: AI-generated dynamic story events
- **Messages**: Real-time messaging system

#### AI Game Master
- **Provider**: OpenAI GPT-4o for dynamic content generation
- **Features**: Personal events, story generation, character interactions
- **Integration**: Event system with player choices and consequences

#### Market Simulation
- **Real-time Updates**: WebSocket-based price feeds
- **Corporate Stocks**: Simulated trading with volume and volatility
- **Portfolio Management**: Player stock holdings and trading history

#### Forum System
- **Location-based**: Threaded discussions tied to in-game locations
- **Character Interactions**: In-character and out-of-character posting
- **Real-time Updates**: Live post feeds via WebSocket

### Data Flow

1. **Authentication Flow**: User authenticates via Replit OAuth → Session created → User data synced
2. **Character Management**: Character creation/updates → Database persistence → Real-time updates
3. **AI Events**: Background generation → Player choices → Consequence application → Character updates
4. **Market Updates**: Periodic price simulation → WebSocket broadcast → Client state updates
5. **Forum Interactions**: Post creation → Database storage → Real-time distribution

### External Dependencies

#### Core Dependencies
- **Neon Database**: Serverless PostgreSQL hosting
- **Replit Auth**: OAuth provider and user management
- **OpenAI**: AI content generation for game master features

#### Development Tools
- **Drizzle Kit**: Database migrations and schema management
- **ESBuild**: Server-side bundling for production
- **Vite**: Frontend development and building
- **TypeScript**: Type safety across the entire stack

#### UI Libraries
- **Radix UI**: Headless component primitives
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon library
- **TanStack Query**: Server state management

### Deployment Strategy

#### Development Environment
- **Replit Integration**: Optimized for Replit development environment
- **Hot Reload**: Vite HMR for frontend, tsx watch mode for backend
- **Database**: Neon database with connection pooling
- **Environment Variables**: DATABASE_URL, OPENAI_API_KEY, Replit OAuth config

#### Production Build
- **Frontend**: Vite build to static assets
- **Backend**: ESBuild bundle for Node.js deployment
- **Database**: Drizzle migrations for schema deployment
- **Assets**: Served from Express static middleware

#### Key Configuration Files
- `drizzle.config.ts`: Database configuration and migrations
- `vite.config.ts`: Frontend build configuration with Replit optimizations
- `tsconfig.json`: TypeScript configuration for monorepo structure
- `tailwind.config.ts`: Custom Star Wars theme and component styling

The application follows a monorepo structure with shared TypeScript types and schema definitions, enabling type safety across the entire stack while maintaining clear separation between client and server code.