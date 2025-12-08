# NexaraDesk CSS Variables - Quick Reference Guide

## How to Use in Your Components

### 1. Colors

```css
/* Primary Accent - Use for active states, primary buttons, links */
color: var(--nexara-primary);           /* #0ea5e9 Cyan */
color: var(--nexara-accent);            /* #06b6d4 Teal */

/* Text Colors */
color: var(--nexara-text-primary);      /* #f0f4f8 - Main text */
color: var(--nexara-text-secondary);    /* #cbd5e1 - Secondary text */
color: var(--nexara-text-tertiary);     /* #64748b - Hint text */
color: var(--nexara-text-disabled);     /* #475569 - Disabled text */

/* Semantic Colors */
color: var(--nexara-success);           /* #22c55e Green */
color: var(--nexara-warning);           /* #eab308 Amber */
color: var(--nexara-error);             /* #ef4444 Red */
color: var(--nexara-info);              /* #3b82f6 Blue */
```

### 2. Glass Effects

```css
/* Frosted Glass Container */
background: rgba(255, 255, 255, 0.08);
border: 1px solid var(--nexara-glass-border);
backdrop-filter: blur(var(--nexara-blur-md));
-webkit-backdrop-filter: blur(var(--nexara-blur-md));
border-radius: var(--nexara-radius-lg);

/* On Hover - Glass Lift */
background: var(--nexara-glass-hover);
border-color: rgba(14, 165, 233, 0.3);
transform: translateY(-4px);
```

### 3. Spacing

```css
/* Use consistent spacing scale */
margin: var(--nexara-spacing-lg);       /* 16px */
padding: var(--nexara-spacing-xl);      /* 24px */
gap: var(--nexara-spacing-md);          /* 12px */

/* Scale: xs(4px) → sm(8px) → md(12px) → lg(16px) → xl(24px) → 2xl(32px) */
```

### 4. Border Radius

```css
border-radius: var(--nexara-radius-sm);  /* 8px - Small elements */
border-radius: var(--nexara-radius-md);  /* 12px - Buttons, inputs */
border-radius: var(--nexara-radius-lg);  /* 16px - Cards, containers */
border-radius: var(--nexara-radius-xl);  /* 20px - Large panels */
border-radius: var(--nexara-radius-full);/* 9999px - Pills, avatars */
```

### 5. Transitions

```css
/* Use standard transition timing */
transition: all var(--nexara-transition-normal);
transition: color var(--nexara-transition-fast);
transition: opacity var(--nexara-transition-slow);
```

### 6. Shadows

```css
box-shadow: var(--nexara-shadow-sm);    /* Subtle shadow */
box-shadow: var(--nexara-shadow-md);    /* Medium shadow */
box-shadow: var(--nexara-shadow-lg);    /* Large shadow */
box-shadow: var(--nexara-shadow-glow);  /* Cyan glow */

/* Combine for layered effect */
box-shadow: var(--nexara-shadow-md), 0 0 20px rgba(14, 165, 233, 0.15);
```

### 7. Blur Effects

```css
backdrop-filter: blur(var(--nexara-blur-sm));   /* 8px */
backdrop-filter: blur(var(--nexara-blur-md));   /* 16px */
backdrop-filter: blur(var(--nexara-blur-lg));   /* 24px */
```

## Common Patterns

### Active Navigation Item
```css
.nav-item.active {
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.2) 0%, rgba(6, 182, 212, 0.1) 100%);
  color: var(--nexara-primary);
  border: 1px solid rgba(14, 165, 233, 0.3);
  box-shadow: inset 0 0 10px rgba(14, 165, 233, 0.1);
}
```

### Hover Lift Effect
```css
.card:hover {
  background: var(--nexara-glass-hover);
  border-color: rgba(14, 165, 233, 0.3);
  transform: translateY(-4px);
  box-shadow: 0 0 20px rgba(14, 165, 233, 0.15);
}
```

### Primary Button
```css
.btn-primary {
  background: linear-gradient(135deg, var(--nexara-primary) 0%, var(--nexara-accent) 100%);
  border: 1px solid var(--nexara-primary);
  color: white;
  box-shadow: 0 0 20px rgba(14, 165, 233, 0.3);
}

.btn-primary:hover {
  box-shadow: 0 0 30px rgba(14, 165, 233, 0.5);
}
```

### Glass Input
```css
input {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--nexara-glass-border);
  border-radius: var(--nexara-radius-md);
  color: var(--nexara-text-primary);
}

input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--nexara-primary);
  box-shadow: 0 0 15px rgba(14, 165, 233, 0.2);
}
```

### Glass Card
```css
.card {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--nexara-glass-border);
  backdrop-filter: blur(var(--nexara-blur-md));
  -webkit-backdrop-filter: blur(var(--nexara-blur-md));
  border-radius: var(--nexara-radius-lg);
  padding: var(--nexara-spacing-lg);
}
```

## Responsive Design Notes

- All spacing variables are fixed and work across all devices
- Adjust grid columns based on breakpoints, not spacing
- Use media queries for layout changes, not color changes
- Glass effects work on all modern browsers

## Accessibility Considerations

1. **Color Contrast**: All text colors have 4.5:1+ contrast with glass backgrounds
2. **Focus States**: Use `outline: 2px solid var(--nexara-primary)` for focus
3. **Motion**: Test with `prefers-reduced-motion` media query if needed
4. **Dark Mode**: Already optimized for dark theme

## Performance Tips

1. Use `transform: translateY()` for smooth animations
2. Use `opacity` for fade effects
3. Avoid animated `backdrop-filter` (use opacity instead)
4. Cache backdrop-filter calculations with will-change (use sparingly)

## Browser Support

| Feature | Chrome | Safari | Firefox | Edge |
|---------|--------|--------|---------|------|
| Backdrop Filter | 76+ | 15+ | 103+ | 79+ |
| CSS Variables | 49+ | 9.1+ | 31+ | 15+ |
| Linear Gradient | All | All | All | All |
| Transform | All | All | All | All |

## Extending the Theme

To add a new color variant:
```css
:root {
  --nexara-status-pending: #fbbf24;
  --nexara-status-active: #22c55e;
  --nexara-status-inactive: #64748b;
}
```

To add a new size:
```css
:root {
  --nexara-spacing-3xl: 48px;
  --nexara-radius-2xl: 28px;
}
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Blur not showing | Add `-webkit-backdrop-filter` for Safari |
| Text not readable | Increase background opacity or use darker text |
| Animation stuttering | Use `transform` instead of position changes |
| Border not visible | Ensure border color has sufficient opacity |
| Focus not visible | Use minimum 2px outline with sufficient contrast |

---

**Last Updated**: December 2, 2025
**Version**: NexaraDesk v1.0
**Status**: Production Ready ✅
