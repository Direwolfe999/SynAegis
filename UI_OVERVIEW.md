# SynAegis Dashboard UI Overview

This document outlines the high-level user interface and component layout of the SynAegis Control Plane (`frontend/app/page.tsx`).

## Global Layout & Theming
- **Framework:** Next.js with React (App Router).
- **Styling:** Tailwind CSS combined with Framer Motion for animations.
- **Theme:** Cyberpunk / futuristic DevSecOps aesthetic.
  - Background: Extreme dark gray/black (`bg-[#050505]`) with light slate/cyan glowing text.
  - Elements have deep blurs (`backdrop-blur`), borders with low opacity (`border-white/10`), and neon box-shadows.
- **Global View State:**
  - A React `useState` controls flipping between two views: `"dashboard"` (the landing page) and `"warroom"` (the live command interface).

## Core Dashboard Components

### 1. Background Layers
- **Radial Gradient:** A huge, soft cyan radial overlay placed at the top-center to simulate a glowing light source.
- **Grid Lines:** CSS gradient used to draw faint grid patterns over the dashboard.
- **Hidden Watermark/Motif (`/logos/full.png`):** The primary SynAegis glowing sigil is fixed to the dead center of the screen at a massive 800x800 pixel span, but set to just `5%` opacity, grayscale, and blurred. It provides subtle texture without breaking readability.

### 2. Main Branding Logotype
- The text logo (`/logos/wording.png`) sits purely inside a Flexbox container at the very top of the layout DOM. 
- It uses native `flex justify-center` alongside generous padding to automatically scale and center itself directly above the primary content headers, avoiding rigid coordinate overlapping bugs.

### 3. Hero Section (Header)
- This is a two-column Flex layout (`lg:flex`):
  - **Left Side (Text & Call-to-Action):**
    - A pulsing "status beacon" ("SynAegis Control Plane Active").
    - The massive Gradient Title ("DevSecOps, Automated.").
    - The context paragraph explaining the capabilities (voice commands, vulnerabilities, cloud footprints).
    - The critical **CTA Button**: A `framer-motion` elevated button ("Enter Live War Room Feed") that triggers the view state to load the `<WarRoom />` component.
  - **Right Side (Orbital Visualization):**
    - A custom built "Core Orbit" graphic built using basic DOM shapes. 
    - Consists of two dashed orbital lines rotating in opposite directions at different speeds via Framer Motion.
    - Inside sits a glowing "CORE" sphere with orbital payload dots mimicking automated tasks executing.

### 4. Subsystem Modules Grid
- A `2x2` grid showcasing the four fundamental "Agents" that make up SynAegis:
  1. **Autonomous CI/CD Agent** (Blue Theme)
  2. **Cloud & Telemetry AI** (Purple Theme)
  3. **Green IT & Sustainability** (Emerald Theme)
  4. **War Room Operations** (Orange/Red Theme)
- Each card is a glassmorphism container that brightens with a colored background gradient on hover (`group-hover:opacity-100`).
- They list specific features with custom mapped list icons.

### 5. Live Neural Event Flow (Activity Feed)
- The bottom section of the dashboard simulates a real-time terminal or log output pane.
- **Left Side:** A static, hard-coded terminal window mapping out timestamped logs (Gitlab hooks received, agents scanning, green impact calculations).
- **Right Side:** A purely decorative bar chart built out of 8 individual `motion` columns that animate scaling upwards from 0 to various heights.

## WarRoom View
- When the `"warroom"` view is engaged, the screen swaps out the entire layout tree.
- A "Back to Dashboard" button floats in the absolute top-left.
- The `../components/WarRoom` component is loaded directly into the DOM tree taking up full width/height space.
