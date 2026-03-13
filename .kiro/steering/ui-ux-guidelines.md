# UI/UX Guidelines

## Design System

### Component Library
- Use shadcn-ui components as base building blocks
- Customize via Tailwind CSS classes
- Maintain consistent spacing and typography
- Follow Radix UI accessibility patterns

### Color Scheme
- Support light/dark themes via next-themes
- Use CSS custom properties for theme colors
- Maintain sufficient contrast ratios (WCAG AA)
- Use semantic color names (primary, secondary, muted)

### Typography
- Use system font stack for performance
- Maintain consistent text hierarchy
- Use appropriate font weights and sizes
- Ensure readability across devices

## Layout Patterns

### Responsive Design
- Mobile-first approach with Tailwind breakpoints
- Flexible grid layouts for photo galleries
- Collapsible navigation for smaller screens
- Touch-friendly button sizes (min 44px)

### Component Structure
- Single-responsibility components
- Consistent prop interfaces
- Proper loading and error states
- Accessible form controls

## User Experience Principles

### Accessibility First
- Generate meaningful alt text for all images
- Provide keyboard navigation support
- Use semantic HTML elements
- Include ARIA labels where needed
- Support screen readers

### Progressive Enhancement
- Core functionality works without JavaScript
- Graceful degradation for failed features
- Clear error messages and recovery paths
- Offline-friendly where possible

### Performance
- Lazy load images and components
- Minimize bundle size with code splitting
- Use React.memo for expensive renders
- Implement proper loading states

## Interaction Patterns

### Photo Upload
- Drag-and-drop with visual feedback
- Click-to-upload fallback
- Progress indicators for uploads
- Clear file validation messages

### Alt Text Generation
- Loading spinners during AI processing
- Editable text areas for user refinement
- Copy-to-clipboard functionality
- Character count indicators

### Bluesky Integration
- Clear authentication flow
- App password guidance and security notes
- Post preview before publishing
- Success confirmation with post links

## Error Handling

### User-Friendly Messages
- Avoid technical jargon in error messages
- Provide actionable next steps
- Use toast notifications for temporary feedback
- Show persistent errors in context

### Validation
- Real-time form validation
- Clear field requirements
- Visual error indicators
- Helpful placeholder text