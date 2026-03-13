# Blutag: AI-Powered Alt Text Generation for Bluesky

## Project Purpose
Blutag is a web application that helps users generate AI-powered alternative text (alt text) for images before posting them to the Bluesky social network. The tool emphasizes accessibility, accuracy, and ease of use.

## Core Functionality
- Upload up to 4 photos (max 25MB each)
- AI-powered alt text generation using Google Gemini 2.5 Flash
- EXIF metadata extraction for context (date, GPS, camera info)
- Bluesky OAuth authentication (no passwords in app)
- Direct posting to Bluesky via AT Protocol Agent
- Client-side image compression for Bluesky compatibility
- Editable alt text with copy functionality

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite (SWC)
- **UI**: shadcn-ui components + Tailwind CSS
- **Backend**: Supabase Edge Functions (Deno)
- **AI**: Lovable AI Gateway (Google Gemini 2.5 Flash)
- **Social**: Bluesky AT Protocol integration
- **State**: React Context + TanStack React Query

## Key Features
- Privacy-focused: No server-side image storage
- Accessibility-first alt text generation
- EXIF-aware context for better descriptions
- Direct Bluesky posting with image compression
- OAuth authentication (no passwords ever enter the app)
- DPoP-bound tokens for enhanced security
- Responsive design with drag-and-drop upload

## Architecture
Single-page React application with client-side OAuth and one Supabase Edge Function:
1. `analyze-photo` - AI alt text generation via Lovable AI Gateway

Authentication and posting handled entirely client-side:
- OAuth via `@atproto/oauth-client-browser`
- Direct API calls to Bluesky PDS via AT Protocol Agent
- Tokens stored in IndexedDB (DPoP-bound)

## Hosting & Deployment
- **Hosting Platform**: Lovable (https://lovable.dev)
- **Backend**: Lovable Cloud (managed Supabase instance)
- **Deployment**: Automatic via Lovable platform
- **Server Access**: No direct server or deployment access
- **Infrastructure**: Fully managed by Lovable

## Target Users
- Content creators posting to Bluesky
- Users who want to improve accessibility of their posts
- Anyone needing quick, accurate alt text generation