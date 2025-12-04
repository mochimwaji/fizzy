# Design Guide

This document outlines the UI/UX design guidelines and patterns for Fizzy. Follow these principles to maintain consistency across the application.

## Design Philosophy

Fizzy follows a **simple, focused, and fast** design approach:

1. **Clarity over cleverness** - UI should be immediately understandable
2. **Speed matters** - Interactions should feel instant
3. **Progressive disclosure** - Show only what's needed, reveal more on demand
4. **Keyboard-first** - Support power users with shortcuts
5. **Responsive by default** - Works on all screen sizes

## Visual Language

### Color System

Fizzy uses OKLCH color space for perceptually uniform colors. Colors are defined in `_global.css`.

#### Semantic Colors

| Purpose | Light Mode | Usage |
|---------|------------|-------|
| Canvas | White | Page background |
| Ink | Dark gray scale | Text, icons |
| Link | Blue | Interactive elements |
| Positive | Green | Success, completion |
| Negative | Red | Errors, warnings, overdue |
| Highlight | Yellow | Focus, attention |
| Golden | Gold/Blue | Special "gilded" cards |

#### Status Colors (Due Dates)

| Status | Color | CSS Variable |
|--------|-------|--------------|
| Overdue | Red | `--color-negative` |
| Due Today | Orange | `--lch-uncolor-dark` |
| Due Soon (7 days) | Yellow | `--lch-yellow-dark` |
| Due Later | Green | `--color-positive` |

#### Card/Column Colors

Eight theme colors for columns: ink, uncolor, yellow, lime, aqua, violet, purple, pink.

```css
--color-card-1 through --color-card-8
```

### Typography

```css
--font-sans: system-ui;           /* Primary text */
--font-serif: ui-serif, serif;    /* Rarely used */
--font-mono: ui-monospace;        /* Code, technical */
```

#### Text Sizes

| Size | Desktop | Mobile | Usage |
|------|---------|--------|-------|
| `--text-xx-small` | 0.55rem | 0.65rem | Badges, hints |
| `--text-x-small` | 0.75rem | 0.85rem | Metadata, timestamps |
| `--text-small` | 0.85rem | 0.95rem | Secondary text |
| `--text-normal` | 1rem | 1.1rem | Body text |
| `--text-medium` | 1.1rem | 1.2rem | Emphasis |
| `--text-large` | 1.5rem | 1.5rem | Headings |
| `--text-x-large` | 1.8rem | 1.8rem | Page titles |

### Spacing

Use CSS custom properties for consistent spacing:

```css
--inline-space: 1ch;              /* Horizontal rhythm */
--block-space: 1rem;              /* Vertical rhythm */
--size-xs, --size-s, --size-m, --size-l, --size-xl
```

### Shadows

Single shadow variable for elevated elements:

```css
--shadow: /* Multi-layer soft shadow */
```

### Border Radius

```css
--rounded-s                       /* Small elements */
--rounded                         /* Standard corners */
```

## Components

### Buttons

#### Primary Actions
```html
<button class="btn">Action</button>
```

#### Plain/Ghost Buttons
```html
<button class="btn btn--plain">Secondary</button>
```

#### Icon Buttons
```html
<button class="btn btn--plain">
  <%= icon_tag "icon-name" %>
  <span class="for-screen-reader">Label</span>
</button>
```

### Cards

Cards are the primary content unit. Structure:

```html
<article class="card">
  <header class="card__header">
    <!-- Board, tags, metadata -->
  </header>
  <div class="card__body">
    <h3 class="card__title">Title</h3>
  </div>
  <footer class="card__footer">
    <!-- Assignees, due date, actions -->
  </footer>
</article>
```

#### Card States
- Default: Standard appearance
- Overdue: Red tint on due date
- Golden: Special glow effect
- Closed: Muted colors
- Not Now: Reduced opacity

### Popups/Dialogs

Use the popup pattern for contextual UI:

```html
<div class="popup popup--animated panel">
  <header class="popup__header">Title</header>
  <div class="popup__body">Content</div>
  <footer class="popup__footer">Actions</footer>
</div>
```

Trigger with Stimulus `dialog` controller.

### Forms

#### Text Inputs
```html
<input type="text" class="input" />
```

#### Select Inputs
```html
<select class="input input--select">
  <option>Option</option>
</select>
```

#### Checkbox/Toggle Groups
```html
<label class="flex align-center gap-half">
  <input type="checkbox" />
  <span>Label</span>
</label>
```

### Icons

Use the `icon_tag` helper:

```erb
<%= icon_tag "calendar" %>
<%= icon_tag "close", class: "translucent" %>
```

Icons are defined in `icons.css` using CSS masks.

### Navigation

#### Main Menu (Jump Menu)
- Triggered by pressing `J`
- Shows boards, filters, quick actions
- Keyboard navigable with arrows

#### Hotkey Links
```erb
<%= filter_hotkey_link "Label", path, number, "icon-name" %>
```

### Flash Messages

```erb
<% flash.each do |type, message| %>
  <div class="flash flash--<%= type %>"><%= message %></div>
<% end %>
```

Types: `notice`, `alert`

## Layout Patterns

### Page Structure

```html
<header class="header">
  <!-- Navigation, title, actions -->
</header>
<main id="main">
  <!-- Page content -->
</main>
<footer id="footer">
  <!-- Bar, trays, floating UI -->
</footer>
```

### Grid Layouts

Cards use CSS Grid:

```css
.cards--grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--size-m);
}
```

### Calendar Grid

7-column grid for weekly calendar:

```css
.calendar__body {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}
```

## Interactions

### Turbo Frames

Use frames for partial page updates:

```erb
<%= turbo_frame_tag "cards_container" do %>
  <!-- Replaceable content -->
<% end %>
```

### Turbo Streams

For multi-element updates:

```erb
<%= turbo_stream.replace dom_id(@card) do %>
  <%= render @card %>
<% end %>
```

### Stimulus Controllers

Common controllers:

| Controller | Purpose |
|------------|---------|
| `dialog` | Open/close dialogs |
| `popup` | Position floating elements |
| `hotkey` | Keyboard shortcuts |
| `filter` | Filter lists |
| `navigable-list` | Keyboard navigation |
| `drag-and-drop` | Sortable items |

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `J` | Open jump menu |
| `K` | Focus search |
| `1` | Go to Home |
| `2` | Go to Calendar |
| `3` | Go to Assigned to me |
| `4` | Go to Added by me |
| `Esc` | Close dialogs |

## Responsive Design

### Breakpoints

```css
@media (max-width: 639px) { /* Mobile */ }
@media (max-width: 799px) { /* Tablet */ }
@media (max-width: 1024px) { /* Small desktop */ }
```

### Mobile Considerations

- Touch targets: minimum 44x44px
- Stack horizontal layouts vertically
- Hide keyboard shortcut hints (`.hide-on-touch`)
- Collapse navigation to hamburger menu
- Increase font sizes slightly

## Dark Mode

Fizzy automatically adapts to system preference:

```css
@media (prefers-color-scheme: dark) {
  /* Dark mode overrides */
}
```

All colors invert appropriately using OKLCH.

## Accessibility

### Focus States

All interactive elements must have visible focus:

```css
:focus-visible {
  outline: var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}
```

### Screen Reader Support

- Use `.for-screen-reader` class for visually hidden labels
- Provide `aria-label` on icon-only buttons
- Use semantic HTML (`<button>`, `<nav>`, `<main>`)
- Maintain logical focus order

### Color Contrast

- Text on backgrounds: minimum 4.5:1 ratio
- Large text/icons: minimum 3:1 ratio
- Don't rely solely on color for meaning

## Animation

### Principles

- Animations should be subtle and purposeful
- Duration: 150ms for micro-interactions
- Easing: `--ease-out-expo` for natural feel

```css
--dialog-duration: 150ms;
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
```

### Respect User Preferences

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Adding New Features

When adding new UI features:

1. **Check existing patterns** - Look for similar UI in the codebase
2. **Use design tokens** - CSS variables from `_global.css`
3. **Follow BEM naming** - `.block__element--modifier`
4. **Add responsive styles** - Mobile-first approach
5. **Support keyboard** - Add hotkeys where appropriate
6. **Test dark mode** - Verify colors adapt correctly
7. **Consider accessibility** - Screen readers, focus, contrast

## File Organization

```
app/assets/stylesheets/
├── _global.css          # Design tokens, variables
├── base.css             # Element defaults
├── buttons.css          # Button components
├── cards.css            # Card components
├── calendar.css         # Calendar view
├── dialog.css           # Dialog/modal styles
├── popup.css            # Popup positioning
├── icons.css            # Icon definitions
├── utilities.css        # Helper classes
└── [feature].css        # Feature-specific styles
```

New feature styles go in their own file, following existing patterns.
