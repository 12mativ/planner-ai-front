# Planner AI Landing Page - Design Plan

## Overview
Create a simple, modern hero section landing page for "Planner AI" service with a clean design, clear call-to-action, and responsive layout.

## Current State Analysis

### Existing Structure
- **Framework**: Next.js with App Router
- **Styling**: Tailwind CSS with custom theme variables
- **Fonts**: Geist Sans and Geist Mono from Google Fonts
- **Dark Mode**: Supported via `prefers-color-scheme`
- **Current Page**: Generic Next.js starter template

### Design System Available
- Custom CSS variables for background and foreground colors
- Dark mode support built-in
- Tailwind CSS utility classes
- Geist font family for modern typography

## Proposed Hero Section Design

### Layout Structure

```
┌─────────────────────────────────────────┐
│           Navigation (Optional)          │
├─────────────────────────────────────────┤
│                                          │
│              Hero Section                │
│                                          │
│         ┌─────────────────┐             │
│         │   Planner AI    │             │
│         │   (Main Title)  │             │
│         └─────────────────┘             │
│                                          │
│         ┌─────────────────┐             │
│         │   Tagline/      │             │
│         │   Description   │             │
│         └─────────────────┘             │
│                                          │
│         ┌─────────────────┐             │
│         │   CTA Button    │             │
│         └─────────────────┘             │
│                                          │
└─────────────────────────────────────────┘
```

### Component Breakdown

#### 1. **Hero Container**
- Full viewport height (`min-h-screen`)
- Centered content (flexbox)
- Responsive padding
- Background: Light/dark mode adaptive

#### 2. **Main Title - "Planner AI"**
- Large, bold typography (text-5xl to text-7xl)
- Gradient text effect (optional for modern look)
- Centered alignment
- High contrast for readability

#### 3. **Description/Tagline**
- Concise value proposition
- Medium size typography (text-lg to text-xl)
- Muted color for hierarchy
- Max-width for readability

#### 4. **Call-to-Action Button**
- Primary action button
- Clear label (e.g., "Get Started", "Try Now", "Start Planning")
- Hover effects
- Rounded corners for modern feel
- High contrast colors

### Design Specifications

#### Typography
- **Main Title**:
  - Font: Geist Sans (already configured)
  - Size: `text-6xl` (mobile) to `text-7xl` (desktop)
  - Weight: `font-bold`
  - Color: Foreground color with potential gradient

- **Description**:
  - Font: Geist Sans
  - Size: `text-lg` to `text-xl`
  - Weight: `font-normal`
  - Color: Muted foreground (`text-zinc-600 dark:text-zinc-400`)

- **CTA Button**:
  - Font: Geist Sans
  - Size: `text-base` to `text-lg`
  - Weight: `font-medium`

#### Color Scheme
- **Light Mode**:
  - Background: `#ffffff` (white)
  - Foreground: `#171717` (near black)
  - Accent: Can use blue/purple gradient for modern AI feel

- **Dark Mode**:
  - Background: `#0a0a0a` (near black)
  - Foreground: `#ededed` (light gray)
  - Accent: Lighter gradient variants

#### Spacing
- Container padding: `px-6` (mobile) to `px-8` (desktop)
- Vertical spacing: `py-20` to `py-32`
- Gap between elements: `gap-6` to `gap-8`

### Responsive Behavior
- **Mobile (< 640px)**:
  - Single column layout
  - Smaller text sizes
  - Full-width button
  - Reduced padding

- **Tablet (640px - 1024px)**:
  - Increased text sizes
  - More generous spacing

- **Desktop (> 1024px)**:
  - Maximum text sizes
  - Optimal line lengths
  - Larger button with fixed width

## Implementation Steps

### Step 1: Update Metadata in layout.tsx
Update the metadata to reflect Planner AI branding:
- Title: "Planner AI - Smart Planning Assistant"
- Description: "AI-powered planning tool to organize your tasks and boost productivity"

### Step 2: Create Hero Section in page.tsx
Replace the current content with:
- Remove Next.js logo and default content
- Add centered hero container
- Implement title with "Planner AI"
- Add compelling tagline/description
- Include primary CTA button

### Step 3: Styling Enhancements
- Ensure proper contrast ratios
- Add smooth transitions for interactive elements
- Implement hover states for CTA
- Test dark mode appearance

### Step 4: Optional Enhancements (Future)
- Add subtle animations (fade-in, slide-up)
- Include icon or logo for Planner AI
- Add secondary CTA or link
- Implement gradient text effect for title

## Suggested Content

### Title
"Planner AI"

### Tagline Options
1. "Your AI-Powered Planning Assistant"
2. "Smart Planning, Simplified"
3. "Plan Smarter with AI"
4. "Organize Your Life with Artificial Intelligence"

### CTA Button Text Options
1. "Get Started"
2. "Start Planning"
3. "Try for Free"
4. "Begin Your Journey"

## Technical Considerations

### Dependencies
- No additional dependencies needed
- Uses existing Tailwind CSS setup
- Leverages Next.js Image component (if logo added later)

### Performance
- Minimal JavaScript (static page)
- Fast initial load
- Optimized fonts already configured

### Accessibility
- Semantic HTML structure
- Proper heading hierarchy
- Sufficient color contrast
- Keyboard navigation support
- ARIA labels where needed

## Next Steps

After approval of this plan:
1. Switch to Code mode to implement the changes
2. Update [`layout.tsx`](app/layout.tsx:1) metadata
3. Rewrite [`page.tsx`](app/page.tsx:1) with new hero section
4. Test in browser for both light and dark modes
5. Verify responsive behavior across breakpoints
