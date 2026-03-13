# Accessibility & Alt Text Best Practices

## Alt Text Generation Principles

### Accuracy First
- Describe only what is clearly visible in the image
- Avoid speculation or inference about unclear elements
- Use EXIF metadata as ground truth when available
- Don't guess seasons, moods, or ambiguous details

### Conciseness Guidelines
- Focus on main subject and primary action
- Skip minor background details and incidental elements
- Write 1-2 sentences for simple images, max 3 for complex scenes
- Maximum 2000 characters (Bluesky limit)
- Don't start with "A photo of" or "An image of"

### Context Awareness
- Include EXIF context (date, GPS availability) when relevant
- Mention time of day or weather only if visually dominant
- Don't include raw metadata values (coordinates, timestamps)
- Avoid precise location information (street names, addresses)

### Accessibility Standards
- Write naturally, as if briefly telling someone what they'd see
- Use plain language, avoid jargon or overly descriptive prose
- For people, describe actions and context, not assumptions about identity
- Describe atmosphere only when it's a defining feature
- Note prominent readable text, signs, or logos

## AI Prompt Engineering

### System Prompt Structure
- Emphasize accuracy, conciseness, and accessibility
- Provide clear guidelines on what to include/exclude
- Set character limits and formatting expectations
- Include examples of good vs. poor alt text

### Deterministic Output
- Use `temperature: 0` in AI requests to ensure the same image always produces the same alt text
- This prevents confusing variation when users re-analyze the same photo

### Context Integration
- Use EXIF data to enhance descriptions when available
- Provide separate prompts for images with/without metadata
- Include camera information only when relevant to image understanding
- Balance technical context with user-friendly descriptions

### Quality Assurance
- Review generated alt text for accuracy
- Ensure descriptions are helpful for screen reader users
- Verify compliance with accessibility guidelines
- Test with actual screen reader software when possible

## User Experience for Accessibility

### Alt Text Editing
- Provide editable text areas for user refinement
- Show character count with visual indicators
- Allow copy-to-clipboard functionality
- Preserve user edits during session

### Visual Design
- Ensure sufficient color contrast (WCAG AA)
- Use semantic HTML elements
- Provide keyboard navigation support
- Include ARIA labels where needed

### Error Handling
- Provide clear feedback when alt text generation fails
- Offer manual input as fallback
- Explain character limits and formatting requirements
- Guide users on writing effective alt text

## Bluesky Integration Considerations

### Platform Limits
- Respect 2000 character alt text limit
- Ensure alt text is properly embedded with images
- Test alt text display in Bluesky interface
- Verify screen reader compatibility on platform

### Post Composition
- Allow users to review alt text before posting
- Show preview of how post will appear
- Provide option to edit alt text after generation
- Include alt text in post metadata correctly

## Testing Accessibility

### Screen Reader Testing
- Test with NVDA, JAWS, and VoiceOver
- Verify alt text is read correctly
- Check navigation flow and focus management
- Test keyboard-only interaction

### Automated Testing
- Use axe-core for accessibility auditing
- Include accessibility tests in CI/CD pipeline
- Check color contrast ratios
- Validate semantic HTML structure

### User Testing
- Include users with visual impairments in testing
- Gather feedback on alt text quality and usefulness
- Test with various assistive technologies
- Iterate based on real user needs