

# Production Planning AI Copilot Dashboard

A premium SaaS-style dashboard with 5 interactive feature cards, rich animations, and responsive layout.

## Layout & Design
- Responsive CSS Grid: 3 columns (desktop) → 2 (tablet) → 1 (mobile)
- Mesh-gradient background with subtle blue/green/purple radials on #f5f7f9
- Inter font, 24px rounded cards, soft shadows, hover lift animations
- Top header with title, subtitle, and status pills

## Cards

1. **Realistic Capacity Predictor** — Shuffling pill cards (Line Capacity, Downtime Impact, Scrap Loss) cycling every 3s with spring-bounce transitions + shimmering forecast band

2. **Plan Feasibility Validator** — Typewriter effect cycling production targets, status pill toggling Feasible/Not Feasible with shake/glow animations, avatar group, export button

3. **Bottleneck Detection** — Ranked constraint list with animated progress bars, mock cursor that clicks rows to expand detail drawers with insights

4. **What-If Simulation Dashboard** (spans 2 columns) — Auto-scrolling scenario carousel with fade edges, typewriter input bar, animated "Run" button with cursor interaction, toast notifications

5. **AI Recommendations & Sequencing** — Highlight animation on key text, floating toolbar popup with action buttons, animated cursor interaction

## Interactions & Animation
- Card hover: 4px lift with enhanced shadow (cubic-bezier transition)
- All icons as inline SVGs (stroke style)
- Animated mock cursors on cards 3, 4, 5
- Typewriter effects on cards 2 and 4
- `prefers-reduced-motion` support for accessibility
- Subtle background gradient drift animation

