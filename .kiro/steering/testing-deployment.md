# Testing & Deployment Guidelines

## Testing Strategy

### Unit Testing
- Use Vitest for unit tests
- Test utility functions (image compression, EXIF extraction)
- Mock external API calls
- Test React hooks in isolation
- Aim for >80% code coverage on critical paths

### Component Testing
- Test component rendering and user interactions
- Mock context providers (BlueskyAuthContext)
- Test error states and loading states
- Verify accessibility attributes
- Use React Testing Library best practices

### Integration Testing
- Test complete user workflows
- Mock Supabase edge function responses
- Test image upload and processing pipeline
- Verify Bluesky authentication flow
- Test alt text generation and editing

### End-to-End Testing
- Use Playwright for E2E tests
- Test critical user journeys
- Verify cross-browser compatibility
- Test responsive design breakpoints
- Include accessibility testing

## Development Workflow

### Local Development
- Use `bun run dev` for development server
- Hot reload for rapid iteration
- Use browser dev tools for debugging
- Test with real images and EXIF data

### Environment Setup
- Copy `.env.example` to `.env`
- Configure Supabase project credentials
- Set up Lovable API key for AI service
- Test edge functions locally with Supabase CLI

### Code Quality
- Run ESLint before commits
- Use Prettier for code formatting
- Type check with TypeScript compiler
- Review bundle size with build analyzer

## Deployment

### Lovable Platform Deployment
- **Hosting**: Application is hosted on Lovable (https://lovable.dev)
- **Backend**: Uses Lovable Cloud (managed Supabase instance)
- **Automatic Deployment**: Changes are automatically deployed by Lovable
- **No Manual Deployment**: No direct access to server or deployment process
- **Environment Variables**: Managed through Lovable platform interface
- **Edge Functions**: Automatically deployed with the application

### Development Workflow
- Make changes in local development environment
- Test locally with `npm run dev`
- Use npm for all package management (Lovable uses npm internally)
- Commit changes to version control (including package-lock.json)
- Lovable handles automatic deployment to production

### Monitoring
- Use Lovable dashboard for application monitoring
- Monitor edge function performance through Lovable Cloud
- Track user analytics via Lovable platform tools
- Monitor Bluesky API status for integration health

### Limitations
- No direct server access
- No manual deployment control
- Infrastructure fully managed by Lovable
- Configuration changes through Lovable interface only

## Performance Optimization

### Frontend
- Code splitting for route-based chunks
- Lazy loading for non-critical components
- Image optimization and compression
- Service worker for offline functionality

### Backend
- Optimize edge function cold starts
- Implement request caching where appropriate
- Monitor API response times
- Use connection pooling for database calls

### Monitoring Tools
- Supabase dashboard for function metrics
- Browser dev tools for performance profiling
- Lighthouse for web vitals
- Real user monitoring for production insights