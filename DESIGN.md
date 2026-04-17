# Design System Inspired by Node.js

## 1. Visual Theme & Atmosphere

The Node.js website embodies the spirit of the runtime itself: pragmatic, powerful, and developer-first. The design system prioritizes clarity, technical precision, and accessibility, creating an environment where code and documentation feel at home. The aesthetic is clean and structured, with a strong emphasis on readability for both prose and syntax-highlighted code blocks.

The color foundation is built around the iconic Node.js green—a confident, energetic hue that signals growth, stability, and open-source collaboration. Unlike playful or consumer-oriented palettes, Node.js greens carry a technical, "terminal-ready" weight. The background canvas alternates between pure white (`#ffffff`) for content areas and a subtle off-white (`#f6f6f6`) for section differentiation, maintaining a crisp, documentation-friendly contrast.

The typography is anchored in **Open Sans**, a humanist sans-serif optimized for screen legibility across devices. Headlines use tighter tracking and bolder weights to create hierarchy, while body text maintains generous line-height for extended reading sessions. Code blocks receive special treatment with monospaced fonts, syntax highlighting, and subtle background tints that make them feel embedded yet distinct.

**Key Characteristics:**

- **Open Sans** as primary typeface with systematic weight scale (300–800) for hierarchy
- **Node.js Green** (`#6cc24a` / `#215732`) as the singular brand accent—used strategically for CTAs, links, and interactive states
- **High-contrast text**: Near-black (`#1a1a1a`) on white for AAA accessibility compliance
- **Code-first aesthetic**: Syntax-highlighted blocks with `#f6f6f6` backgrounds, `1px solid #e0e0e0` borders, and rounded corners
- **Technical precision**: Subtle grid alignment, consistent spacing multiples, and clear visual hierarchy for documentation
- **Dark mode support**: System-aware theming with inverted color tokens for reduced eye strain
- **Component modularity**: Reusable UI primitives from `@node-core/ui-components` library

## 2. Color Palette & Roles

### Primary Brand Colors

- **Node Green Primary** (`#6cc24a` / RGB 108, 194, 74): Primary CTA, active states, success indicators, key interactive accents
- **Node Green Dark** (`#215732` / RGB 33, 87, 50): Hover states for green elements, section headers, dark-themed accents
- **Node Green Medium** (`#44883e` / RGB 68, 136, 62): Secondary interactive elements, progress indicators, muted emphasis
- **Pearl Black** (`#333333` / RGB 51, 51, 51): Primary text, headings, navigation—softer than pure black for reduced eye strain

### Neutral Foundation

- **Pure White** (`#ffffff`): Page background, card surfaces, code block containers
- **Off-White** (`#f6f6f6`): Section alternation, code block backgrounds, subtle card fills
- **Light Gray** (`#e0e0e0`): Borders, dividers, disabled states, input outlines
- **Medium Gray** (`#767676`): Secondary text, metadata, placeholder text, captions
- **Dark Gray** (`#333333`): Primary body text, navigation links, UI labels

### Semantic & Functional Colors

- **Success Green** (`#28a745`): Confirmation messages, completed tasks, positive status badges
- **Warning Yellow** (`#ffc107`): Caution indicators, pending states, attention-grabbing notices
- **Error Red** (`#dc3545`): Validation errors, destructive actions, critical alerts
- **Info Blue** (`#0d6efd`): Informational banners, documentation links, neutral interactive elements
- **Code Background** (`#f6f6f6`): Syntax-highlighted block containers, inline code tints

### Interactive States

- **Link Green** (`#6cc24a`): Primary link color with underline-on-hover behavior
- **Link Hover** (`#44883e`): Darkened green for hover/focus states on text links
- **Button Active** (`#1a472a`): Pressed state for primary green buttons
- **Focus Ring** (`#6cc24a` + `2px solid`): Visible keyboard focus indicator for accessibility
- **Disabled** (`#b0b0b0` text, `#f0f0f0` bg): Reduced opacity for inactive controls

### Shadows & Depth

- **Subtle Card** (`0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)`): Standard content cards, code blocks
- **Elevated Modal** (`0 4px 12px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)`): Modals, dropdowns, floating panels
- **Border Whisper** (`1px solid #e0e0e0`): Standard division lines, card outlines, input borders

## 3. Typography Rules

### Font Family

- **Primary**: `Open Sans`, with fallbacks: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
- **Monospace/Code**: `"Fira Code", "Source Code Pro", "JetBrains Mono", "Consolas", monospace`
- **OpenType Features**: `font-variant-numeric: tabular-nums;` for aligned numerical data in tables

### Hierarchy

| Role              | Font      | Size            | Weight | Line Height | Letter Spacing | Notes                                        |
| ----------------- | --------- | --------------- | ------ | ----------- | -------------- | -------------------------------------------- |
| Display Hero      | Open Sans | 48px (3.00rem)  | 800    | 1.10        | -0.5px         | Maximum impact, homepage headlines           |
| Section Heading   | Open Sans | 32px (2.00rem)  | 700    | 1.20        | -0.25px        | Feature sections, documentation headers      |
| Sub-heading Large | Open Sans | 24px (1.50rem)  | 600    | 1.30        | normal         | Card titles, API section headers             |
| Sub-heading       | Open Sans | 20px (1.25rem)  | 600    | 1.40        | normal         | Content subsections, feature labels          |
| Body Large        | Open Sans | 18px (1.125rem) | 400    | 1.60        | normal         | Introductions, lead paragraphs               |
| Body              | Open Sans | 16px (1.00rem)  | 400    | 1.65        | normal         | Standard documentation text, blog content    |
| Body Small        | Open Sans | 14px (0.875rem) | 400    | 1.50        | normal         | Metadata, captions, footnotes                |
| Code Inline       | Fira Code | 14px (0.875rem) | 400    | 1.40        | normal         | Inline code snippets, CLI commands           |
| Code Block        | Fira Code | 14px (0.875rem) | 400    | 1.50        | normal         | Multi-line code examples, terminal output    |
| Navigation        | Open Sans | 15px (0.94rem)  | 500    | 1.33        | normal         | Header nav, sidebar links, breadcrumbs       |
| Button Text       | Open Sans | 16px (1.00rem)  | 600    | 1.25        | normal         | CTA buttons, form submissions                |
| Badge / Tag       | Open Sans | 12px (0.75rem)  | 600    | 1.33        | 0.5px          | Version badges, status labels, category tags |

### Principles

- **Readability-first scaling**: Line height increases as size decreases (1.10 at 48px → 1.65 at 16px) to maintain comfortable reading rhythm for documentation
- **Weight-based hierarchy**: 800 (hero), 700 (headings), 600 (subheads/buttons), 500 (nav/UI), 400 (body)—creating clear visual priority without relying solely on size
- **Code typography parity**: Monospace fonts match body text size (14px) but use tighter line-height (1.40–1.50) for dense code readability
- **Tabular numerals**: `font-variant-numeric: tabular-nums` ensures aligned version numbers, timestamps, and metrics in tables
- **Mobile-responsive scaling**: Headlines scale down proportionally (48px → 32px → 24px) while maintaining weight hierarchy

## 4. Component Stylings

### Buttons

**Primary Green**

- Background: `#6cc24a` (Node Green Primary)
- Text: `#ffffff`
- Padding: `12px 24px`
- Radius: `4px` (subtle, technical feel)
- Border: `1px solid transparent`
- Hover: background darkens to `#44883e`, slight scale(1.02)
- Active: background `#1a472a`, scale(0.98)
- Focus: `2px solid #6cc24a` outline + subtle shadow
- Use: Primary CTAs ("Download", "Get Started", "View Docs")

**Secondary / Outline**

- Background: `transparent`
- Text: `#6cc24a`
- Border: `1px solid #6cc24a`
- Padding: `12px 24px`
- Radius: `4px`
- Hover: background `rgba(108, 194, 74, 0.08)`, text `#44883e`
- Use: Secondary actions, "Learn More", navigation within docs

**Ghost / Text Button**

- Background: `transparent`
- Text: `#333333`
- Decoration: underline on hover
- Padding: `8px 0`
- Use: Inline links, tertiary actions, documentation cross-references

**Code Action Button**

- Background: `#f6f6f6`
- Text: `#333333`
- Border: `1px solid #e0e0e0`
- Padding: `6px 12px`
- Radius: `4px`
- Hover: background `#eeeeee`
- Use: "Copy to clipboard", "Run in terminal", code block actions

### Cards & Containers

- Background: `#ffffff`
- Border: `1px solid #e0e0e0`
- Radius: `8px`
- Shadow: `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)`
- Hover: subtle shadow intensification, border color shift to `#6cc24a`
- Code cards: `#f6f6f6` background, monospace font, syntax highlighting

### Code Blocks

- Background: `#f6f6f6`
- Border: `1px solid #e0e0e0`
- Radius: `8px`
- Padding: `16px`
- Font: `Fira Code`, 14px, tabular-nums
- Syntax highlighting: Custom token colors (keywords `#215732`, strings `#c41a16`, comments `#767676`)
- Line numbers: `#767676`, right-aligned, `user-select: none`
- Copy button: Top-right corner, `#6cc24a` icon on hover

### Inputs & Forms

- Background: `#ffffff`
- Text: `#333333`
- Border: `1px solid #e0e0e0`
- Padding: `10px 12px`
- Radius: `4px`
- Focus: `2px solid #6cc24a` outline, border color shift
- Placeholder: `#767676`
- Error state: Border `#dc3545`, helper text in error red

### Navigation

- Header: White background, `1px solid #e0e0e0` bottom border
- Logo: Hexagon icon + wordmark, left-aligned
- Links: Open Sans 15px weight 500, `#333333` text
- Hover: Color shift to `#6cc24a`, subtle underline
- Active: `#215732` text, bottom border indicator
- CTA: Green pill button ("Download") right-aligned
- Mobile: Hamburger menu with slide-in panel, green accent on active items

### Badges & Tags

- Background: `#f0f9f0` (tinted green)
- Text: `#215732`
- Padding: `4px 8px`
- Radius: `9999px` (full pill)
- Font: 12px weight 600, slight positive letter-spacing
- Use: Version indicators ("v20.x"), status labels ("LTS", "Current"), category tags

### Documentation-Specific Components

- **Version Selector**: Dropdown with current/LTS badges, green accent on active
- **API Parameter Table**: Alternating row backgrounds, monospace for parameter names
- **Code Tab Switcher**: Horizontal tabs with green underline indicator
- **Search Results**: Highlighted matches in `#fff9c4` (soft yellow), green title links
- **Breadcrumbs**: Small text, `#767676`, chevron separators, green final item

## 5. Layout Principles

### Spacing System

- Base unit: `4px`
- Scale: `4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px, 96px`
- Documentation rhythm: `24px` vertical between paragraphs, `48px` between sections
- Code block padding: `16px` internal, `24px` external margin

### Grid & Container

- Max content width: `1200px` centered
- Documentation layout: Two-column (sidebar + content) on desktop, stacked on mobile
- Hero section: Full-width with centered content, generous top padding (`64–96px`)
- Feature grids: 3-column on desktop → 2-column tablet → 1-column mobile
- Code examples: Contained within `100%` width card with consistent border treatment

### Whitespace Philosophy

- **Content density balance**: Generous margins around text blocks (`24px`) but compact line-height for scannable documentation
- **Section alternation**: White (`#ffffff`) content sections alternate with off-white (`#f6f6f6`) for visual rhythm without harsh dividers
- **Code isolation**: Code blocks receive extra vertical margin (`32px`) to visually separate from prose
- **Mobile-first padding**: Horizontal padding scales from `16px` (mobile) to `24px` (desktop) for comfortable thumb zones

### Border Radius Scale

- Micro (`2px`): Input fields, small interactive elements
- Subtle (`4px`): Buttons, cards, code blocks—technical, precise feel
- Comfortable (`8px`): Featured cards, modal containers, image wrappers
- Full Pill (`9999px`): Badges, tags, status indicators
- Circle (`100%`): User avatars, notification dots

## 6. Depth & Elevation

| Level                 | Treatment                                                 | Use                                                        |
| --------------------- | --------------------------------------------------------- | ---------------------------------------------------------- |
| Flat (Level 0)        | No shadow, no border                                      | Page background, text blocks, inline elements              |
| Subtle (Level 1)      | `1px solid #e0e0e0`                                       | Standard borders, card outlines, input fields, code blocks |
| Card (Level 2)        | `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)`  | Content cards, feature blocks, code examples               |
| Elevated (Level 3)    | `0 4px 12px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)` | Modals, dropdowns, floating action buttons, search results |
| Focus (Accessibility) | `2px solid #6cc24a` outline + subtle shadow               | Keyboard focus on all interactive elements                 |

**Shadow Philosophy**: Node.js shadows prioritize subtlety and performance. Multi-layer stacks use low-opacity values (`0.04–0.12`) to create natural depth without visual noise. The two-layer card shadow spans 1–3px blur for a "lifted paper" effect, while the three-layer elevated shadow extends to 12px blur for modal distinction. All shadows use `rgba(0,0,0,...)` for theme compatibility in dark mode.

### Decorative Elements

- **Hexagon motif**: Subtle background pattern using the Node.js hex logo at 5–10% opacity for section headers
- **Code-inspired graphics**: Terminal cursor animations, syntax token highlights as decorative accents
- **Gradient accents**: Very subtle green-to-transparent gradients on hover states for interactive feedback
- **No decorative illustrations**: Visual interest comes from code samples, diagrams, and intentional whitespace

## 7. Responsive Behavior

### Breakpoints

| Name          | Width         | Key Changes                                                     |
| ------------- | ------------- | --------------------------------------------------------------- |
| Mobile Small  | `<480px`      | Tight single column, minimal padding, stacked navigation        |
| Mobile        | `480–768px`   | Standard mobile layout, hamburger menu, touch-optimized targets |
| Tablet        | `768–1024px`  | Two-column documentation layout begins, expanded card grids     |
| Desktop Small | `1024–1280px` | Full three-column feature grids, sidebar navigation visible     |
| Desktop       | `1280–1440px` | Standard desktop layout, max content width `1200px`             |
| Large Desktop | `>1440px`     | Centered content with generous margins, enhanced whitespace     |

### Touch Targets

- Buttons: Minimum `44px` height, `16px` horizontal padding for comfortable tap zones
- Navigation links: `15px` text with `12px` vertical padding for touch accuracy
- Code copy buttons: `32px` minimum tap target, clear visual feedback on press
- Form inputs: `40px` height minimum, clear focus indicators for keyboard/touch users

### Collapsing Strategy

- **Hero headline**: 48px → 32px → 24px, maintaining weight hierarchy (800→700→600)
- **Navigation**: Horizontal links + download CTA → hamburger menu with slide-in panel
- **Documentation sidebar**: Persistent left column → collapsible drawer on mobile
- **Code blocks**: Full-width with horizontal scroll on small screens, syntax highlighting preserved
- **Feature cards**: 3-column grid → 2-column → single stacked column
- **Footer**: Multi-column link groups → stacked single column with section headers

### Image & Code Behavior

- Product screenshots: Maintain aspect ratio with `max-width: 100%`, whisper border at all sizes
- Code blocks: Horizontal scroll on mobile, syntax highlighting and line numbers preserved
- Diagrams/illustrations: Responsive SVG with `max-width: 100%`, fallback PNG for complex graphics
- Logo treatments: Hexagon icon scales independently from wordmark for flexible header layouts

## 8. Accessibility & States

### Focus System

- All interactive elements receive visible `2px solid #6cc24a` focus outline
- Focus outline offset: `2px` for visual separation from element border
- Skip-to-content link: Visible on keyboard focus, positioned at top of viewport
- Reduced motion: `@media (prefers-reduced-motion: reduce)` disables hover animations and scroll effects

### Interactive States

- **Default**: Standard appearance with subtle borders and neutral text
- **Hover**: Color shift to green accent (`#6cc24a` → `#44883e`), subtle scale(1.02) on buttons, underline on links
- **Active/Pressed**: Darker green background (`#1a472a`), scale(0.98) transform for tactile feedback
- **Focus**: Green outline ring + subtle shadow for keyboard navigation clarity
- **Disabled**: `#b0b0b0` text, `#f0f0f0` background, `cursor: not-allowed`, reduced opacity

### Color Contrast Compliance

- Primary text (`#333333`) on white: ~12.6:1 ratio (exceeds WCAG AAA)
- Secondary text (`#767676`) on white: ~4.5:1 ratio (meets WCAG AA for normal text)
- Green CTA (`#6cc24a`) on white: ~3.8:1 ratio (meets WCAG AA for large text/buttons)
- White text on green (`#ffffff` on `#6cc24a`): ~3.8:1 ratio (WCAG AA compliant for buttons)
- Code text (`#333333`) on code bg (`#f6f6f6`): ~10.2:1 ratio (excellent readability)

### Dark Mode Support

- **Background**: `#1a1a1a` (near-black) for page, `#252525` for cards/code blocks
- **Text**: `#f0f0f0` primary, `#b0b0b0` secondary
- **Borders**: `#404040` for subtle division
- **Green accents**: Lightened to `#88d66e` for sufficient contrast on dark backgrounds
- **Code syntax**: Adjusted token colors for dark background legibility
- **System detection**: `@media (prefers-color-scheme: dark)` with manual toggle override

## 9. Agent Prompt Guide

### Quick Color Reference

- Primary CTA / Accent: Node Green Primary (`#6cc24a`)
- Page Background: Pure White (`#ffffff`) / Dark Mode: Near-Black (`#1a1a1a`)
- Section Background: Off-White (`#f6f6f6`) / Dark Mode: Dark Gray (`#252525`)
- Primary Text: Pearl Black (`#333333`) / Dark Mode: Off-White (`#f0f0f0`)
- Secondary Text: Medium Gray (`#767676`) / Dark Mode: Light Gray (`#b0b0b0`)
- Borders: Light Gray (`#e0e0e0`) / Dark Mode: Dark Border (`#404040`)
- Links: Node Green Primary (`#6cc24a`) with underline-on-hover
- Focus Ring: `2px solid #6cc24a`
- Code Background: `#f6f6f6` / Dark Mode: `#252525`

### Example Component Prompts

- **Hero Section**: "Create a hero section on white background. Headline at 48px Open Sans weight 800, line-height 1.10, letter-spacing -0.5px, color #333333. Subtitle at 20px weight 400, line-height 1.60, color #767676. Primary CTA button (#6cc24a bg, white text, 4px radius, 12px 24px padding) and secondary outline button (transparent bg, #6cc24a border/text, same padding)."

- **Documentation Card**: "Design a documentation card: white background, 1px solid #e0e0e0 border, 8px radius. Shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04). Title at 20px Open Sans weight 600, color #333333. Body at 16px weight 400, color #333333, line-height 1.65. Green accent border-left: 3px solid #6cc24a for category indication."

- **Code Block**: "Build a code block: #f6f6f6 background, 1px solid #e0e0e0 border, 8px radius, 16px padding. Font: Fira Code 14px, tabular-nums. Syntax highlighting: keywords #215732, strings #c41a16, comments #767676. Copy button top-right: #6cc24a icon on hover, 32px tap target."

- **Navigation Header**: "Create header navigation: white background, 1px solid #e0e0e0 bottom border. Logo: hexagon icon + wordmark left-aligned. Links: Open Sans 15px weight 500, #333333 text, hover to #6cc24a with underline. Primary CTA 'Download' right-aligned: #6cc24a bg, white text, 4px radius, 12px 24px padding."

- **Version Badge**: "Design a version badge: #f0f9f0 background, #215732 text, 9999px radius, 4px 8px padding, 12px Open Sans weight 600, letter-spacing 0.5px. Use for 'LTS', 'Current', or version numbers like 'v20.x'."

### Iteration Guide

1. **Green is strategic**: Use `#6cc24a` only for primary actions, active states, and key accents—never as background filler
2. **Typography hierarchy**: Weight drives priority (800→400) more than size; maintain 1.60+ line-height for body readability
3. **Code is content**: Treat code blocks as first-class citizens with dedicated spacing, syntax highlighting, and copy actions
4. **Borders are functional**: `1px solid #e0e0e0` creates structure without visual weight; avoid heavier borders unless indicating state
5. **Shadows are subtle**: Two-layer max for cards, three-layer for modals; opacity never exceeds 0.12 for natural depth
6. **Dark mode parity**: All tokens must have dark mode equivalents; test contrast ratios in both themes
7. **Accessibility first**: Focus indicators, color contrast, and reduced motion support are non-negotiable requirements
8. **Developer empathy**: Prioritize scannability, copy-paste friendliness, and terminal-like aesthetics in code-related components

### Philosophy Summary

> _"The Node.js design system exists to serve developers. Every visual decision—from the precise green accent to the monospace code font—should reduce cognitive load, enhance readability, and feel like a natural extension of the terminal. Clarity over cleverness. Function over flourish. Code first."_

This system draws inspiration from the official Node.js brand guidelines, the technical aesthetic of the nodejs.org website, and the pragmatic values of the open-source community. It is designed to scale across documentation, marketing, and application interfaces while maintaining a cohesive, developer-centric identity.
