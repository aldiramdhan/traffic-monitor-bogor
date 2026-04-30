# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a Next.js traffic monitoring application for Bogor city with the following key features:
- Real-time CCTV streaming using HLS.js
- Interactive maps with Leaflet
- AI-powered traffic analysis using Google Gemini API
- Modern UI/UX with Tailwind CSS
- TypeScript for type safety

## Development Guidelines

### Code Style
- Use TypeScript for all new components and utilities
- Follow React functional components with hooks pattern
- Use Tailwind CSS for styling with consistent design system
- Implement proper error boundaries and loading states
- Use modern ES6+ features and async/await for API calls

### Component Structure
- Create reusable UI components in `src/components/ui/`
- Feature-specific components in `src/components/feature-name/`
- Custom hooks in `src/hooks/`
- Utilities and helpers in `src/lib/`
- Type definitions in `src/types/`

### Styling Guidelines
- Use Tailwind CSS utility classes
- Consistent color palette: emerald for primary, slate for neutrals
- Modern rounded corners (rounded-lg, rounded-xl)
- Smooth transitions and hover effects
- Mobile-first responsive design

### Map Integration
- Use React-Leaflet for map components
- Custom markers for CCTV locations
- Popup components for video streams and AI analysis
- Proper cleanup of video streams and map instances

### Performance Considerations
- Lazy load components where appropriate
- Optimize video streaming with proper HLS.js configuration
- Implement proper error handling for network failures
- Use React.memo for expensive components
- Implement proper cleanup in useEffect hooks

### AI Integration
- Use environment variables for Gemini API key
- Implement proper error handling for API failures
- Type-safe API responses with zod validation
- Loading states for AI analysis requests
