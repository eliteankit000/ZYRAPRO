# Overview

Zyra is an AI-powered Shopify SaaS application designed to help e-commerce merchants boost sales, optimize product listings, recover abandoned carts, and automate growth through intelligent automation. The application provides AI-generated product descriptions, SEO optimization tools, email marketing automation, and analytics dashboard to enhance store performance.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client-side is built with React 18 and TypeScript, using Vite as the build tool. The UI leverages shadcn/ui components with Radix UI primitives for accessibility and consistent design patterns. The application uses Wouter for lightweight routing and TanStack Query for server state management. Styling is implemented with Tailwind CSS using a dark theme with gradient accents (midnight blue to light azure color palette).

The frontend follows a component-based architecture with:
- **Pages**: Landing, authentication, dashboard, and 404 pages
- **Dashboard Components**: Modular sections for AI generation, SEO tools, analytics, and sidebar navigation
- **UI Components**: Reusable shadcn/ui components for forms, cards, buttons, and layout elements

## Backend Architecture
The server runs on Express.js with TypeScript, providing RESTful API endpoints. Authentication is handled through express-session with Passport.js using local strategy and bcrypt for password hashing. The application supports both development (Vite middleware) and production (static file serving) environments.

Key backend features include:
- **Session-based Authentication**: Secure user sessions with Redis-compatible storage
- **API Route Structure**: Organized routes for user management, product operations, and AI services
- **Middleware Pipeline**: Request logging, JSON parsing, and error handling

## Database Design
The application uses PostgreSQL with Drizzle ORM for type-safe database operations. The schema includes:
- **Users Table**: Authentication, subscription plans (trial/starter/pro/growth), and Stripe integration
- **Products Table**: Product information, optimization status, and Shopify integration
- **SEO Meta Table**: SEO titles, descriptions, keywords, and optimization scores
- **Campaigns Table**: Email/SMS marketing campaigns and analytics
- **Analytics Table**: Performance tracking and metrics storage

Database migrations are managed through Drizzle Kit with environment-specific configurations.

## AI Integration
OpenAI GPT-4 integration provides core AI functionality for:
- **Product Description Generation**: Multiple brand voice styles (sales, SEO, casual)
- **SEO Optimization**: Automated title and meta description generation with keyword analysis
- **Content Analysis**: Image alt-text generation and accessibility improvements

## Authentication & Authorization
User authentication implements session-based security with:
- **Local Strategy**: Email/password authentication with bcrypt hashing
- **Session Management**: Express-session with secure cookie configuration
- **User Roles**: Basic role-based access control with plan-based feature restrictions
- **Trial System**: 7-day trial with automatic expiration handling

## State Management
Client-side state management uses:
- **TanStack Query**: Server state caching, background updates, and optimistic updates
- **React Hook Form**: Form state management with Zod validation
- **React Context**: Authentication state and global UI state

# External Dependencies

## Database & Hosting
- **Neon Database**: Serverless PostgreSQL with connection pooling
- **Drizzle ORM**: Type-safe database queries and migrations
- **Vercel/Replit Deployment**: Frontend hosting with serverless functions

## AI & Machine Learning
- **OpenAI API**: GPT-4 for text generation and content optimization
- **AI Content Services**: Product descriptions, SEO optimization, and image analysis

## Payment Processing
- **Stripe Integration**: Subscription management, customer billing, and payment processing
- **Plan Management**: Trial, Starter ($15/month), Pro ($25/month), and Growth ($49/month) tiers

## Email & SMS Services
- **SendGrid**: Transactional emails, marketing campaigns, and deliverability
- **Twilio**: SMS notifications and cart recovery campaigns (configured but not fully implemented)

## Development Tools
- **TypeScript**: Full-stack type safety with strict configuration
- **Vite**: Fast development server with HMR and build optimization
- **Tailwind CSS**: Utility-first styling with custom design system
- **ESBuild**: Production bundling for serverless deployment

## Third-party Integrations
- **Shopify API**: Product sync, inventory management, and order processing (planned)
- **Analytics Services**: Custom analytics tracking with potential Google Analytics integration
- **Font Services**: Google Fonts integration for typography