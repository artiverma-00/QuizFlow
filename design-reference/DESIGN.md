---
name: QuizFlow Cognitive Engine
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#464555'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#712ae2'
  on-secondary: '#ffffff'
  secondary-container: '#8a4cfc'
  on-secondary-container: '#fffbff'
  tertiary: '#7e3000'
  on-tertiary: '#ffffff'
  tertiary-container: '#a44100'
  on-tertiary-container: '#ffd2be'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#eaddff'
  secondary-fixed-dim: '#d2bbff'
  on-secondary-fixed: '#25005a'
  on-secondary-fixed-variant: '#5a00c6'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb695'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7b2f00'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.005em
  title-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 26px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-tabular:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  margin: 2rem
  margin-sm: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style
The design system embodies a modern, cognitive-focused aesthetic built specifically for high-stakes testing, academic certifications, and interactive evaluations. It balances institutional authority with frictionless digital engagement, projecting an ethos of absolute reliability, precision, and calm clarity under time constraints.

### Target Audience & Psychology
- **Test-Takers (Students, Candidates, Professionals):** Require an anxiety-reducing, distraction-free environment with high typographic legibility, clear visual pacing, and unmistakable affordances.
- **Educators & Administrators:** Require data-dense monitoring, rigorous reporting, intuitive authoring flows, and immediate feedback loops.
- **Emotional Intent:** Foster confident focus, perceived fairness, low cognitive friction, and rigorous academic credibility.

### Design Movement
**Modern Systematic SaaS with Precision Utility:** The visual execution relies on structured whitespace, crisp low-contrast delineations, and targeted accent colors. Chromatic saturation is strictly reserved for actionable triggers, active test states, and immediate feedback (e.g., success confirmations, urgent timer thresholds). Form factors remain strictly modular, functional, and balanced.

## Colors
The color architecture enforces a high-trust hierarchy engineered for WCAG AAA/AA visual compliance across varying ambient lighting conditions.

### Palette Architecture
- **Primary Indigo (`#4F46E5` / Hover `#4338CA`):** Anchors core actions, test progress bars, active step indicators, and primary navigational paths.
- **Secondary Violet (`#7C3AED`):** Designates advanced actions, analytical metrics, student progress insights, and rich contextual tags.
- **Surface & Canvas:**
  - **App Canvas (`#F8FAFC`):** Slate-tinted neutral background, softening optical strain during prolonged testing sessions.
  - **Surface Container (`#FFFFFF`):** Base canvas for exam cards, item modules, and configuration panels.
  - **Structural Borders (`#E2E8F0`):** Precise bounding lines providing structure without visual clutter.
- **Text & Hierarchy:**
  - **Primary Ink (`#0F172A`):** Ultra-dark slate for question stems, headers, and core inputs.
  - **Muted Ink (`#64748B`):** Supporting instructional cues, metadata, timestamps, and placeholder states.
- **Status & Diagnostic System:**
  - **Success (`#16A34A`):** Correct choices, submitted tests, passing outcomes.
  - **Warning (`#D97706`):** Approaching timer thresholds (< 5 minutes), unflagged questions, pending reviews.
  - **Error (`#DC2626`):** Overdue timers, missing mandatory answers, validation failures, low score alerts.
  - **Info (`#0284C7`):** Proctored status notifications, platform tips, and neutral instructions.

## Typography
Typographic clarity directly impacts assessment comprehension and fairness. The type hierarchy relies on **Inter** with tailored OpenType feature settings:
- Active feature flag: `font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11'` for enhanced letterform differentiation (e.g., lowercase l vs. numeral 1).
- **Tabular Figures:** All numeric displays (countdown timers, index bullets, point allocations, student grades) must explicitly enable `font-variant-numeric: tabular-nums;` to prevent visual jitter during countdowns and data alignment shifts.
- **Reading Comfort:** Assessment question stems utilize `body-lg` at 18px / 28px leading to optimize line-scan performance across diverse reading proficiencies.

## Layout & Spacing
The layout leverages an **8-point grid rhythm** configured to reduce visual complexity during cognitive tasks.

### Canvas & Grids
- **Exam Stage (Candidate View):** Fixed max-width container (`840px`) centered horizontally on the viewport. Eliminates peripheral distractions and maintains optimal line length (55–75 characters per line).
- **Admin/Analytics Dashboard:** Fluid 12-column grid using standard gutters (`space-lg`: 24px) and margins (`space-xl`: 32px), collapsing to 4 columns on mobile viewports.
- **Breakpoint Rules:**
  - **Desktop (≥1024px):** Dual-zone split (fixed navigation / question index sidebar at 280px width alongside the primary assessment canvas).
  - **Tablet (768px - 1023px):** Collapsible off-canvas drawer for question jumping; sticky top evaluation timer.
  - **Mobile (<768px):** Single-column vertical stream. Gutter reduces to `gutter-sm` (16px), inner margin drops to `margin-sm` (16px). Action trays anchor to the bottom viewport.

## Elevation & Depth
Elevation is maintained through low-intensity structural layering rather than heavy drop shadows, reinforcing a clean, distraction-free atmosphere.

### Depth Hierarchy
- **Level 0 (Flat Ground):** Canvas background `#F8FAFC`.
- **Level 1 (Card Baseline):** `#FFFFFF` paired with a crisp `1px` structural outline in `#E2E8F0` and subtle grounding: `box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.02)`.
- **Level 2 (Interactive Floating Elements):** Active question cards, popovers, select dropdown menus: `box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`.
- **Level 3 (Modals, Overlays, Urgent Alerts):** Submission confirmation dialogs, proctor alerts: `box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.06)`.
- **Active Selection Depth:** When an answer option or item is chosen, avoid shadow growth; transition the border directly to `#4F46E5` with an internal tint fill of `rgba(79, 70, 229, 0.04)`.

## Shapes
A roundedness factor of **2** sets a 0.5rem (8px) baseline radius, providing balanced, modern contours that soften technical rigor without appearing playful.

### Corner Radius System
- **Small Controls (`rounded-sm` / 4px):** Badges, tabular chips, inline tags, small indicator pills.
- **Interactive Surfaces (`rounded-md` / 8px):** Input fields, answer selection cards, buttons, dropdown items.
- **Structural Containers (`rounded-lg` / 16px):** Assessment question cards, analytical chart enclosures, summary modals.
- **Status Pills (`rounded-full` / 9999px):** Timers, live-proctor recording status dots, category pills.

## Components

### Buttons
- **Primary:** Filled `#4F46E5`, text `#FFFFFF`, hover `#4338CA`, active `#3730A3`. Height 44px (touch-compliant), padding 0 20px, font `label-lg`.
- **Secondary:** Surface `#FFFFFF`, border `1px solid #E2E8F0`, text `#0F172A`, hover `#F8FAFC`.
- **Destructive/Urgent:** Surface `#DC2626`, hover `#B91C1C`, text `#FFFFFF`.
- **Ghost/Tertiary:** No border, transparent background, text `#64748B`, hover text `#0F172A`, hover background `rgba(226, 232, 240, 0.4)`.

### Answer Selection Cards (Radio / Checkbox Modules)
- **Base State:** Flex row container, border `1px solid #E2E8F0`, background `#FFFFFF`, min-height 56px, padding `16px 20px`, `rounded-md`.
- **Key Indicators:** Left-aligned 28px index glyph (e.g., "A", "B", "C") in light slate pill (`#F1F5F9`, text `#64748B`).
- **Selected State:** Border `2px solid #4F46E5`, background `rgba(79, 70, 229, 0.03)`, index glyph switches to `#4F46E5` with `#FFFFFF` text.
- **Keyboard Focus:** Outline `2px solid #4F46E5`, offset 2px.

### Timer & Assessment Header
- **Countdown Display:** High-contrast pill featuring tabular numbers (`font-variant-numeric: tabular-nums; font-weight: 600; font-size: 16px;`).
- **Normal State:** Neutral slate background `#F1F5F9`, text `#0F172A`, clock icon `#64748B`.
- **Warning State (<5 min):** Surface `#FEF3C7`, text `#D97706`, pulsing micro-indicator dot.
- **Critical State (<1 min):** Surface `#FEE2E2`, text `#DC2626`.

### Badges & Status Chips
- Height 24px, padding 2px 8px, font `label-md`, border-radius 4px.
- **Flagged for Review:** `#FEF3C7` background, `#D97706` text with flag icon.
- **Answered:** `#DCFCE7` background, `#16A34A` text.
- **Unvisited:** `#F1F5F9` background, `#64748B` text.

### Inputs & Text Areas
- Border `1px solid #E2E8F0`, background `#FFFFFF`, text `#0F172A`, placeholder `#94A3B8`.
- Focus state: Border `#4F46E5`, shadow ring `0 0 0 3px rgba(79, 70, 229, 0.15)`.

### Question Matrix Navigation (Sidebar Drawer)
- Compact grid of 36px × 36px squared buttons representing test items.
- Provides immediate visual status: answered (filled border), flagged (corner triangle tag in `#D97706`), active (solid `#4F46E5` ring).