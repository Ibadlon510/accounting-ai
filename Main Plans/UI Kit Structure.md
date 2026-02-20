# UI Kit Structure

Purpose: Scalable component system for accounting SaaS dashboard  
Design Principles: Calm, precise, structured, enterprise-grade clarity

---

# 1. Foundations

## 1.1 Design Tokens

### Colors
- color.background.canvas
- color.background.surface
- color.background.glass
- color.text.primary
- color.text.secondary
- color.semantic.success
- color.semantic.error
- color.border.subtle
- color.accent.primary

### Spacing
- space.1 → 4px
- space.2 → 8px
- space.3 → 16px
- space.4 → 24px
- space.5 → 32px
- space.6 → 48px
- space.7 → 64px

### Radius
- radius.sm → 12px
- radius.md → 20px
- radius.lg → 24px

### Shadow
- shadow.card
- shadow.overlay
- shadow.focus

### Typography Tokens
- font.family.primary
- font.size.display
- font.size.metric
- font.size.title
- font.size.body
- font.size.meta

---

# 2. Layout Components

## App Shell
- AppContainer
- PageContainer
- SectionContainer
- Grid12
- Stack
- Inline

## Navigation
- TopNav
- Breadcrumbs
- WorkspaceSwitcher
- ProfileMenu
- ActionBar

---

# 3. Surface Components

## Card System
- Card
- CardHeader
- CardBody
- CardFooter
- GlassCard
- MetricCard
- InsightCard

## Elevation Layers
- SurfaceBase
- SurfaceRaised
- SurfaceFloating

---

# 4. Data Display Components

## Metrics
- MetricDisplay
- KPIIndicator
- TrendBadge
- StatusDot

## Tables
- DataTable
- TableHeader
- TableRow
- TableCell
- EmptyState

## Charts
- LineChart
- BarChart
- ForecastChart
- ChartContainer
- ChartLegend

---

# 5. Input Components

## Form Controls
- TextInput
- SearchInput
- NumberInput
- Select
- MultiSelect
- DatePicker

## Actions
- PrimaryButton
- SecondaryButton
- GhostButton
- IconButton
- ToggleSwitch

---

# 6. AI Assistant Components

## Assistant UI
- AssistantPanel
- AssistantInputBar
- SuggestionChip
- MessageBubble
- ActionShortcut
- AiAvatar (xs/sm/md/lg/xl/2xl sizes, ring + glow variants)
- AiAvatarAnimated (pulse glow for loading/thinking states)

Design Rule:
AI elements use glass surface and floating elevation.
AI character avatar appears in: panel header, input bar, chat bubbles, onboarding, error states.

---

# 7. Feedback & Status

## Indicators
- Badge
- NotificationDot
- ProgressBar
- LoadingSpinner

## System Feedback
- Toast
- Alert
- InlineMessage
- ConfirmationDialog

---

# 8. Identity Components

## User Representation
- Avatar
- AvatarStack
- UserLabel

## Organization
- WorkspaceTag
- RoleBadge

---

# 9. Interaction Patterns

## Overlays
- Dropdown
- Popover
- Modal
- SlidePanel
- EntityPanel (two-panel overlay: main content + settings sidebar)

## Navigation Patterns
- Tabs
- SegmentedControl
- Pagination

---

# 10. Composition Patterns

## Dashboard Patterns
- AnalyticsHeroPanel
- SideInsightPanel
- DualMetricRow
- ForecastSection
- FloatingAssistantLayout

## Entity Management Patterns
- EntityPanel (reusable two-panel overlay for add/edit any entity)
- EntityPanelBody (Main + Sidebar row wrapper)
- EntityPanelMain (scrollable left content: avatar, field groups, links)
- EntityPanelSidebar (right settings: checkboxes, radios, sections)
- EntityPanelFieldGroup (bordered card with icon + label + value rows)
- EntityPanelFooter (Cancel + Save spanning full width)

## Content Patterns
- SectionHeader
- FilterBar
- ActionToolbar

---

# 11. Naming Convention

Component naming follows structure:

Category → Component → Variant

Examples:
- Card / Metric / Default
- Button / Primary / Default
- Input / Search / WithIcon
- Chart / Line / Revenue

---

# 12. Assets

## AI Character Assets
Directory: `/public/assets/ai-character/`

| Asset | File | Purpose |
|-------|------|---------|
| Default avatar | avatar.png | Primary circular avatar (512×512 transparent PNG) |
| Placeholder | avatar-placeholder.svg | SVG fallback while final art is pending |
| Thinking | avatar-thinking.png | Loading/processing states |
| Happy | avatar-happy.png | Success confirmations |
| Sorry | avatar-sorry.png | Error/apologetic states |
| Hero | hero.png | Onboarding & landing (1024×1400 transparent PNG) |

Design Rule:
Character uses brand green (#22C55E) accent (tie, eyes). Style: clean modern anime, professional suit, warm pastel palette.

---

# 13. File Structure (React Example)
/components
/layout
/navigation
/surfaces
/data-display
/inputs
/ai
/feedback
/identity
/overlays
/patterns

---

# 14. Usage Principles

- Always compose from primitives
- Never create one-off components
- Use spacing tokens only
- Use semantic colors only
- Maintain consistent elevation hierarchy

---
