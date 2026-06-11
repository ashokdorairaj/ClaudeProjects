# testaiapp

## Project Overview

This is a simple web app built with HTML, CSS, and vanilla JavaScript. No frameworks, no build tools — just clean, modern frontend code delivered directly in the browser.

## Tech Stack

- **HTML** — semantic markup
- **CSS** — plain CSS, no preprocessors
- **JavaScript** — vanilla JS, no libraries or frameworks

## Styling Rules

All UI components **must** follow these design principles:

- **Cards** — use modern CSS cards with rounded corners (`border-radius: 12px` or larger)
- **Padding** — generous, clean padding inside cards (`padding: 1.5rem` or more)
- **Dark mode aesthetic** — dark backgrounds (`#0f0f0f`, `#1a1a1a`, `#111827`, or similar), light text, and subtle borders or shadows for depth
- **Accent colors** — use a single accent color (e.g. indigo, violet, or cyan) for interactive elements and highlights
- **Typography** — clean sans-serif fonts, good line height, clear visual hierarchy
- **Shadows** — soft `box-shadow` on cards to lift them off the background

### Example card baseline

```css
.card {
  background: #1e1e2e;
  border: 1px solid #2a2a3d;
  border-radius: 16px;
  padding: 1.5rem 2rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
  color: #e2e8f0;
}
```

Every new component or page section should follow or extend this baseline.
