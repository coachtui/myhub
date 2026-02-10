# Money Hub Design System Documentation

**Version:** 1.0
**Last Updated:** February 2026
**Inspired by:** brianlovin.com modern app-like aesthetic

---

## Overview

This design system creates a modern, clean, app-like experience for the Money Hub personal website. It's built with vanilla CSS using design tokens, follows mobile-first responsive principles, and includes comprehensive dark mode support.

---

## Color Palette

### Light Mode

**Backgrounds:**
```css
--color-bg-primary:    #ffffff  /* White */
--color-bg-secondary:  #f8f9fa  /* Light gray */
--color-bg-tertiary:   #f1f3f5  /* Lighter gray */
--color-bg-elevated:   #ffffff  /* Cards with shadow */
--color-bg-overlay:    rgba(0, 0, 0, 0.03)
```

**Text Hierarchy:**
```css
--color-text-primary:    #1a1a1a  /* Near black */
--color-text-secondary:  #4a4a4a  /* Dark gray */
--color-text-tertiary:   #737373  /* Medium gray */
--color-text-quaternary: #a3a3a3  /* Light gray */
```

**Brand Accent (Refined Red):**
```css
--color-accent-primary:       #dc2626  /* Modern red */
--color-accent-primary-hover: #b91c1c  /* Darker red */
--color-accent-secondary:     #f87171  /* Light red backgrounds */
--color-accent-tertiary:      #fef2f2  /* Very subtle red wash */
```

**Borders:**
```css
--color-border:        #e5e7eb
--color-border-strong: #d1d5db
```

**Semantic Colors:**
```css
--color-success:    #10b981  /* Green */
--color-success-bg: #d1fae5
--color-warning:    #f59e0b  /* Orange */
--color-warning-bg: #fef3c7
--color-info:       #3b82f6  /* Blue */
--color-info-bg:    #dbeafe
```

### Dark Mode

**Backgrounds:**
```css
--color-bg-primary:   #0a0a0a  /* True black */
--color-bg-secondary: #171717  /* Near black */
--color-bg-tertiary:  #262626  /* Dark gray */
--color-bg-elevated:  #1a1a1a  /* Slightly lighter */
--color-bg-overlay:   rgba(255, 255, 255, 0.05)
```

**Text Hierarchy:**
```css
--color-text-primary:    #fafafa  /* Near white */
--color-text-secondary:  #d4d4d4  /* Light gray */
--color-text-tertiary:   #a3a3a3  /* Medium gray */
--color-text-quaternary: #737373  /* Darker gray */
```

**Brand Accent (Softer for Dark):**
```css
--color-accent-primary:   #f87171  /* Soft red */
--color-accent-primary-hover: #fca5a5  /* Lighter red */
--color-accent-secondary: #dc2626  /* Deeper red */
--color-accent-tertiary:  #450a0a
```

**Semantic Colors (Adjusted):**
```css
--color-success:    #34d399
--color-success-bg: #064e3b
--color-warning:    #fbbf24
--color-warning-bg: #78350f
--color-info:       #60a5fa
--color-info-bg:    #1e3a8a
```

### Usage Guidelines

- **Backgrounds:** Use bg-primary for main content areas, bg-secondary for alternating sections, bg-elevated for cards
- **Text:** Primary for headings/important text, secondary for body, tertiary for captions, quaternary for disabled states
- **Accent:** Use sparingly for CTAs, links, and brand elements
- **Semantic:** Success for confirmations, warning for cautions, info for helpful tips

---

## Typography

### Font Families

```css
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
--font-display: 'Fraunces', 'Source Serif 4', Georgia, serif;
--font-mono:    'JetBrains Mono', 'Source Code Pro', Consolas, monospace;
```

**Usage:**
- **Inter (Primary):** Body text, UI elements, navigation
- **Fraunces (Display):** Headings, hero sections, emphasis
- **JetBrains Mono:** Code, disclaimers, technical content

### Type Scale (Fluid Typography)

```css
--text-xs:   clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)    /* 12-14px */
--text-sm:   clamp(0.875rem, 0.85rem + 0.2vw, 0.9375rem) /* 14-15px */
--text-base: clamp(1rem, 0.95rem + 0.3vw, 1.0625rem)     /* 16-17px */
--text-lg:   clamp(1.125rem, 1.05rem + 0.4vw, 1.25rem)   /* 18-20px */
--text-xl:   clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem)     /* 20-24px */
--text-2xl:  clamp(1.5rem, 1.3rem + 1vw, 2rem)           /* 24-32px */
--text-3xl:  clamp(1.875rem, 1.6rem + 1.4vw, 2.5rem)     /* 30-40px */
--text-4xl:  clamp(2.25rem, 1.8rem + 2vw, 3.5rem)        /* 36-56px */
--text-5xl:  clamp(3rem, 2.5rem + 2.5vw, 4.5rem)         /* 48-72px */
```

### Line Heights

```css
--leading-none:    1
--leading-tight:   1.25
--leading-snug:    1.375
--leading-normal:  1.5
--leading-relaxed: 1.625
--leading-loose:   2
```

### Font Weights

```css
--weight-normal:    400
--weight-medium:    500
--weight-semibold:  600
--weight-bold:      700
--weight-extrabold: 800
```

---

## Spacing System

Based on 8px grid for consistent vertical rhythm and horizontal spacing.

```css
--space-0:  0
--space-1:  0.25rem  /*  4px */
--space-2:  0.5rem   /*  8px */
--space-3:  0.75rem  /* 12px */
--space-4:  1rem     /* 16px */
--space-5:  1.25rem  /* 20px */
--space-6:  1.5rem   /* 24px */
--space-8:  2rem     /* 32px */
--space-10: 2.5rem   /* 40px */
--space-12: 3rem     /* 48px */
--space-16: 4rem     /* 64px */
--space-20: 5rem     /* 80px */
--space-24: 6rem     /* 96px */
--space-32: 8rem     /* 128px */
```

**Common Patterns:**
- Card padding: `var(--space-6)`
- Section spacing: `var(--space-16)` mobile, `var(--space-24)` desktop
- Paragraph margins: `var(--space-6)`
- Heading margins: `var(--space-8)` to `var(--space-12)`

---

## Border Radius

```css
--radius-sm:   0.25rem  /*  4px - subtle */
--radius-md:   0.5rem   /*  8px - cards */
--radius-lg:   0.75rem  /* 12px - elevated cards */
--radius-xl:   1rem     /* 16px - hero sections */
--radius-2xl:  1.5rem   /* 24px - large elements */
--radius-full: 9999px   /* pills, avatars */
```

---

## Shadows (Layered Elevation)

### Light Mode
```css
--shadow-sm:  0 1px 2px 0 rgb(0 0 0 / 0.05)
--shadow-md:  0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)
--shadow-lg:  0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)
--shadow-xl:  0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25)
```

### Dark Mode (Deeper shadows)
```css
--shadow-sm:  0 1px 2px 0 rgb(0 0 0 / 0.3)
--shadow-md:  0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4)
--shadow-lg:  0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.5)
--shadow-xl:  0 20px 25px -5px rgb(0 0 0 / 0.6), 0 8px 10px -6px rgb(0 0 0 / 0.6)
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.7)
```

---

## Layout System

### Max Widths

```css
--width-content-sm: 42rem   /* 672px - narrow reading */
--width-content-md: 48rem   /* 768px - standard reading */
--width-content-lg: 56rem   /* 896px - wide content */
--width-content-xl: 72rem   /* 1152px - hero sections */
```

### Breakpoints

- **Mobile:** < 768px (default, mobile-first)
- **Tablet/Desktop:** ≥ 768px
- **Large Desktop:** ≥ 1024px (optional, rarely used)

### Container

```css
.container {
  width: 100%;
  max-width: var(--width-content-xl);
  margin-left: auto;
  margin-right: auto;
  padding-left: var(--space-4);
  padding-right: var(--space-4);
}
```

### Grid System

```css
.grid--2 { grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr)); }
.grid--3 { grid-template-columns: repeat(auto-fit, minmax(min(250px, 100%), 1fr)); }
```

Automatically adjusts columns based on available space with minimum column widths.

---

## Component Library

### 1. Navigation

**Global Navigation (`.nav-global`)**
- Sticky top bar (64px mobile, 72px desktop)
- Transparent with backdrop blur
- Logo left, links center (desktop), actions right
- Shadow on scroll

**Mobile Navigation (`.nav-mobile`)**
- Full-screen overlay
- Hamburger menu toggle
- Smooth 350ms transitions
- Body scroll lock when open

**Breadcrumb (`.breadcrumb`)**
- Simple text navigation with separators
- Accessible with `aria-label="Breadcrumb"`
- Current page marked with `aria-current="page"`

### 2. Cards

**Standard Card (`.card`)**
```html
<a href="#" class="card">
  <div class="card__header">
    <div class="card__icon">💰</div>
  </div>
  <h3 class="card__title">Card Title</h3>
  <p class="card__description">Description text</p>
  <div class="card__footer">
    <span class="card__link">Read more <span class="card__arrow">→</span></span>
  </div>
</a>
```

**Hover Effects:**
- Lift: `translateY(-4px)`
- Border color changes to accent
- Shadow increases to `--shadow-xl`

**Step Card (`.card.step-card`)**
- Includes numbered badge
- Completion status indicators
- Links to step pages

### 3. Buttons

**Variants:**
- `.button--primary`: Filled with accent color
- `.button--secondary`: Outlined
- `.button--ghost`: Transparent

**Sizes:**
- `.button--sm`: Small (compact spacing)
- `.button` (base): Default size
- `.button--lg`: Large (prominent CTAs)

**Icon Support:**
```html
<a href="#" class="button button--primary">
  Get Started <span class="button__icon">→</span>
</a>
```

### 4. Callouts

**Types:**
- `.callout--info`: Blue (💡)
- `.callout--warning`: Orange (⚡)
- `.callout--success`: Green (✓)
- `.callout--disclaimer`: Gray with icon

```html
<aside class="callout callout--info">
  <div class="callout__icon">💡</div>
  <div class="callout__content">
    <h4>Callout Title</h4>
    <p>Callout content here.</p>
  </div>
</aside>
```

### 5. Hero Sections

**Primary Hero (`.hero`)**
- Two-column layout (desktop)
- Content left, image right
- Fade-in animations with stagger

**Section Hero (`.section-hero`)**
- Centered text
- Used for hub/landing pages
- Constrained width

### 6. Step Progress Indicator

**Step Progress (`.step-progress`)**
- Visual progress bar
- Clickable step circles (1-5)
- Current, completed, and pending states
- Compact labels on mobile, full labels on desktop

### 7. Footer

**Modern Footer (`.footer`)**
- Three-column layout (desktop)
- Brand section with social links
- Quick links to main sections
- Copyright and disclaimer
- Responsive stack on mobile

---

## Dark Mode Implementation

### Theme Switching

**HTML Attribute:**
```html
<html data-theme="light">
```

**JavaScript (theme.js):**
- Checks localStorage for saved preference
- Falls back to system preference (`prefers-color-scheme`)
- Applies theme before render to prevent flash
- Smooth 200ms transitions on theme change

**Toggle Button:**
```html
<button class="theme-toggle" data-theme-toggle>
  <svg class="theme-toggle__icon theme-toggle__icon--sun">...</svg>
  <svg class="theme-toggle__icon theme-toggle__icon--moon">...</svg>
</button>
```

### CSS Implementation

All color tokens are redefined under `[data-theme="dark"]` selector:

```css
:root {
  --color-bg-primary: #ffffff;
  /* ... light mode */
}

[data-theme="dark"] {
  --color-bg-primary: #0a0a0a;
  /* ... dark mode overrides */
}
```

---

## Animations & Transitions

### Timing

```css
--transition-fast:   150ms ease
--transition-base:   200ms ease
--transition-slow:   300ms ease
--transition-slower: 400ms ease
```

### Timing Functions

```css
--ease-in:     cubic-bezier(0.4, 0, 1, 1)
--ease-out:    cubic-bezier(0, 0, 0.2, 1)
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)
```

### Common Animations

**Fade In Up:**
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Card Hover:**
```css
.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}
```

**Reduced Motion:**
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Accessibility

### WCAG AA Compliance

- **Color Contrast:** All text meets 4.5:1 ratio minimum
- **Focus Indicators:** Visible on all interactive elements
- **Keyboard Navigation:** Full site accessible via keyboard
- **Screen Readers:** Proper ARIA labels, semantic HTML

### Best Practices

- Use semantic HTML (`<nav>`, `<article>`, `<aside>`)
- Provide `alt` text for all images
- Use `aria-label` for icon buttons
- Mark current page with `aria-current="page"`
- Announce dynamic content changes to screen readers

---

## File Architecture

```
/resources/css/
├── tokens.css              # Design variables
├── reset.css               # Modern CSS reset
├── base.css                # Base element styles
├── utilities.css           # Layout utilities
├── components/
│   ├── navigation.css
│   ├── card.css
│   ├── button.css
│   ├── hero.css
│   ├── callout.css
│   ├── step-progress.css
│   └── footer.css
└── style.css               # Main file (imports all)

/resources/js/
├── theme.js                # Dark mode toggle
└── navigation.js           # Mobile menu, scroll effects
```

---

## Usage Examples

### Creating a New Page

```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Title | Money Hub</title>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Fraunces:ital,wght@0,600;0,700;1,600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">

    <!-- CSS & JS -->
    <link rel="stylesheet" href="/resources/css/style.css">
    <script src="/resources/js/theme.js"></script>
</head>
<body>
    <!-- Include nav-global, nav-mobile, breadcrumb, disclaimer, content, footer -->
    <script src="/resources/js/navigation.js"></script>
</body>
</html>
```

### Adding a New Component

1. Create CSS file in `/resources/css/components/`
2. Define base styles using design tokens
3. Add responsive breakpoints with `@media (min-width: 768px)`
4. Add dark mode overrides with `[data-theme="dark"]`
5. Import in `style.css`

---

## Performance

### Optimizations

- **Fonts:** Preloaded with `rel="preconnect"`
- **CSS:** Modular imports, critical CSS inline option
- **Images:** Lazy loading below fold, WebP with fallbacks
- **JavaScript:** Defer non-critical scripts
- **Shadows & Transforms:** GPU-accelerated properties only

### Bundle Size

- **CSS:** ~35KB unminified, ~15KB gzipped
- **JavaScript:** ~5KB total (theme + navigation)
- **Fonts:** ~150KB (Inter, Fraunces, JetBrains Mono)

---

## Browser Support

- **Modern Browsers:** Chrome, Firefox, Safari, Edge (latest 2 versions)
- **CSS Features:** CSS Grid, Flexbox, Custom Properties
- **JavaScript:** ES6+ (modules, arrow functions, template literals)
- **Fallbacks:** Graceful degradation for older browsers

---

## Maintenance

### Updating Colors

1. Edit `/resources/css/tokens.css`
2. Update both `:root` and `[data-theme="dark"]`
3. Test contrast ratios with WebAIM tool
4. Verify across all pages

### Adding Breakpoints

- Keep mobile-first approach
- Use `min-width` media queries
- Common breakpoint: 768px
- Test on real devices

### Design Tokens Best Practices

- Always use variables, never hardcoded values
- Name semantically (`--color-text-primary` not `--dark-gray`)
- Keep naming consistent across light/dark modes
- Document any new additions

---

## Credits

**Design Inspiration:** brianlovin.com
**Fonts:** Inter (Rasmus Andersson), Fraunces (Flavia Zimbardi), JetBrains Mono (JetBrains)
**Icons:** Font Awesome
**Framework:** Vanilla CSS + JavaScript (no build tools)

---

## Version History

**v1.0 (February 2026)**
- Initial design system implementation
- Complete color palette (light/dark)
- Typography system with fluid scaling
- Component library (7 core components)
- Full site redesign (8 core pages + 7 secondary pages)
- Mobile-first responsive design
- Dark mode with localStorage persistence
