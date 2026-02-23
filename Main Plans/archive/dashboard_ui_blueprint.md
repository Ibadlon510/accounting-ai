# Enterprise Dashboard UI --- Frontend Blueprint

Author: Ian Badlon\
Purpose: Reverse-engineered frontend architecture for a modern SaaS
analytics dashboard.

------------------------------------------------------------------------

## 1. Layout Architecture

### App Shell Structure

-   Top Navigation Bar
-   Main Content Grid (12-column system)
-   Floating AI Assistant Layer

### Grid System

-   Max width: 1280--1440px
-   Side padding: 32px
-   Columns: 12
-   Column gap: 24px

### Layout Rows

1.  Header
2.  Primary Analytics Panel (8 columns)
3.  Insight Side Panel (4 columns)
4.  Secondary Analytics Row (6 + 6)
5.  Floating Assistant Overlay

------------------------------------------------------------------------

## 2. Component Checklist

### Layout

-   AppShell
-   TopNav
-   Sidebar (collapsed)
-   Breadcrumbs
-   ProfileActions

### Data Components

-   MetricCard
-   ChartCard
-   InsightCard
-   ForecastCard
-   KPIIndicator

### AI Module

-   AssistantPanel
-   SuggestionChips
-   InputBar

### UI Primitives

-   Card
-   Button
-   IconButton
-   AvatarStack
-   Badge
-   Divider

------------------------------------------------------------------------

## 3. Spacing & Sizing System

### Spacing Scale (8pt System)

  Token   Value   Usage
  ------- ------- ------------------
  xs      4px     micro spacing
  sm      8px     icon padding
  md      16px    standard padding
  lg      24px    card padding
  xl      32px    section spacing
  2xl     48px    major separation
  3xl     64px    hero spacing

### Card Anatomy

-   Border radius: 20--24px
-   Padding: 24px
-   Internal gap: 16px
-   Shadow: large blur, low opacity

### Typography Scale

  Role             Size
  ---------------- ----------
  Page Title       32--36px
  Primary Metric   40--56px
  Card Title       16px
  Body             14px
  Meta             12px

### Icon System

-   Icon size: 20px
-   Action button container: 36--40px

------------------------------------------------------------------------

## 4. Visual Design System

### Background

-   Soft pastel gradient
-   Low contrast environment

### Cards

-   Light border
-   Elevated shadow
-   Glass effect on overlays

### Color Semantics

-   Green → positive trend
-   Red → negative trend
-   Neutral → structure

### Visual Rhythm

Dense → Space → Dense → Space

------------------------------------------------------------------------

## 5. Frontend Architecture

### Recommended Stack

-   React + Next.js
-   TailwindCSS
-   Recharts or Chart.js
-   Framer Motion

### Folder Structure

    /components
      /layout
        AppShell
        TopNav
      /cards
        MetricCard
        ChartCard
        InsightCard
      /charts
        IncomeChart
        ForecastChart
      /ai
        AssistantPanel
      /ui
        Button
        Card
        AvatarStack
        Badge

------------------------------------------------------------------------

## 6. Professional Design Workflow

### Step 1 --- Wireframe Layout

Draw only structure and card placement.

### Step 2 --- Define Spacing Tokens

Lock spacing before styling.

### Step 3 --- Build Card System

Create reusable container component.

### Step 4 --- Apply Typography Hierarchy

### Step 5 --- Integrate Data Visualization

### Step 6 --- Apply Gradient Environment

### Step 7 --- Add Floating Assistant Layer

------------------------------------------------------------------------

## 7. Hidden UX Principles

### Asymmetrical Balance

Primary panel heavier than side panel.

### Visual Anchors

Large metrics guide attention first.

### Interaction Density Gradient

Navigation → Insight → Interaction

### Micro-Contrast Strategy

Contrast through spacing and size, not color.

------------------------------------------------------------------------

## 8. Implementation Roadmap

1.  Create 12-column layout container
2.  Build reusable Card component
3.  Implement typography scale
4.  Integrate chart components
5.  Add gradient background
6.  Implement AI assistant overlay

------------------------------------------------------------------------

End of Blueprint
