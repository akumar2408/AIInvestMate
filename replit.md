# Overview

This is a comprehensive AI-powered financial management application called "AI Investmate" that helps users track their finances, manage budgets and goals, monitor investments, and receive AI-driven insights. The application features a modern React frontend with a Node.js/Express backend, PostgreSQL database with Drizzle ORM, and integrates with external services like Stripe for payments and Plaid for bank connections.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development and building
- **UI Library**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Dark theme with emerald accent colors using CSS variables and Tailwind CSS
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

## Backend Architecture
- **Runtime**: Node.js with Express.js framework using ES modules
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Replit's OAuth system with session-based authentication using express-session
- **API Design**: RESTful API with structured error handling and request/response logging
- **Build System**: ESBuild for production bundling with platform-specific optimizations

## Database Design
- **ORM**: Drizzle with PostgreSQL dialect
- **Schema Location**: Shared schema definitions in `/shared/schema.ts`
- **Key Tables**: Users, subscriptions, user profiles, transactions, budgets, goals, investments, reports
- **Session Storage**: PostgreSQL-backed session store for authentication persistence
- **Migration Strategy**: Drizzle Kit for schema migrations with output to `/migrations` directory

## Authentication & Authorization
- **Provider**: Replit OAuth with Google integration
- **Session Management**: Express-session with PostgreSQL store
- **User Data**: Comprehensive user profiles with subscription tiers (free, pro, premium)
- **Security**: HTTPS-only cookies, secure session configuration, and role-based feature access

## AI Integration
- **Provider**: OpenAI GPT-4o for AI-powered features
- **Fallback Strategy**: Rule-based systems when AI services are unavailable
- **Use Cases**: Transaction categorization, financial insights, report generation, and chatbot assistance
- **Feature Gating**: AI features restricted to Pro/Premium subscription tiers

## Payment Processing
- **Provider**: Stripe for subscription management and billing
- **Plans**: Three-tier subscription model (Free, Pro, Premium)
- **Features**: Checkout sessions, webhook handling, and subscription status tracking
- **Integration**: Stripe Customer Portal for self-service billing management

# External Dependencies

## Core Infrastructure
- **Database**: Neon Serverless PostgreSQL with connection pooling
- **Authentication**: Replit OAuth system with Google provider integration
- **Hosting**: Designed for Replit deployment with development mode detection

## Payment & Billing
- **Stripe**: Payment processing, subscription management, customer portal, and webhook handling
- **Plans**: Tiered subscription system with feature gating based on plan level

## AI Services
- **OpenAI**: GPT-4o model for natural language processing, transaction categorization, and financial insights
- **Fallback Logic**: Local rule-based systems for core functionality when AI is unavailable

## Banking Integration (Planned)
- **Plaid**: Bank account connection and transaction sync (configured but not fully implemented)
- **Sandbox Mode**: Development environment setup for testing banking features

## Development Tools
- **Vite**: Frontend build tool with React plugin and development server
- **TypeScript**: Type safety across frontend, backend, and shared code
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **React Query**: Server state management with caching and synchronization

## UI Component System
- **Radix UI**: Accessible, unstyled UI primitives for complex components
- **Shadcn/ui**: Pre-built component library with consistent styling
- **Recharts**: Data visualization library for financial charts and graphs
- **Lucide Icons**: Consistent icon system throughout the application