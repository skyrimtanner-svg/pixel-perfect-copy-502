# ÆTH Observatory — Next-Gen

> **See Why the Future Changes.**
> A premium deep-space command center for tracking and forecasting technological milestones.

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://pixel-perfect-copy-502.lovable.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## 🌌 Vision

ÆTH Observatory is a Bayesian forecasting interface designed for high-stakes technological monitoring. It replaces "gut feel" with **log-odds evidence accumulation**, visualizing how every news item, paper, and breakthrough shifts the probability of future milestones like AGI, Fusion Power, and Longevity.

It is built to feel like a $15k/year Bloomberg Terminal for the future — precise, dense, beautiful, and strictly typed.

## 🛠 Tech Stack

- **Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: [TypeScript 5.x](https://www.typescriptlang.org/) (Strict Mode)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Framer Motion](https://www.framer.com/motion/) (Animations)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) (Radix Primitives)
- **Data Fetching**: [TanStack Query](https://tanstack.com/query/latest)
- **Backend**: [Supabase](https://supabase.com/) (Auth, Database, Edge Functions, Realtime)
- **Visualization**: [Recharts](https://recharts.org/) + Custom D3-like SVG Rings

## 🏗 Architecture

### Data Flow
1.  **Supabase Realtime**: Subscribes to `evidence` and `milestones` tables for sub-second updates.
2.  **Bayesian Engine**: `useMilestoneAPI` hook calculates posteriors on the fly or fetches cached snapshots.
3.  **Trust Ledger**: Every significant forecast update is hashed (SHA-256) and stored in an immutable ledger for auditability.

### Key Components
-   **`InteractiveWaterfall`**: Visualizes log-odds shifts from evidence. Supports "What-If" sandbox simulations.
-   **`ProbabilityRing`**: Custom SVG component with spring physics, gold/red states, and particle effects.
-   **`MilestoneModal`**: The core detail view with deep-linking, tabs, and Socratic discussion.

## 🚀 Getting Started

### Prerequisites
-   Node.js 18+
-   npm or bun

### Installation

```bash
# Clone the repo (replace with your actual repository URL)
git clone https://github.com/<your-org>/aeth-observatory.git
cd aeth-observatory

# Copy environment template and fill in your values
cp .env.example .env

# Install dependencies
npm install

# Start development server
npm run dev
```

> **Note:** Never commit `.env` to version control. The `.env.example` file contains the template.

### Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```env
VITE_SUPABASE_PROJECT_ID=your-project-id
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_URL=https://your-project-id.supabase.co
```

## 📦 Deployment

### Lovable / Vercel
This project is optimized for deployment on Vercel or Lovable Cloud.
1.  Connect your GitHub repo.
2.  Set the environment variables.
3.  Deploy.

## ♿ Accessibility & Performance

-   **Strict TypeScript**: Full type safety for all data models.
-   **Performance**: 
    -   Lazy-loaded routes.
    -   GPU-accelerated animations.
    -   `will-change` optimizations for heavy elements.
    -   Memoized heavy chart components.
-   **Accessibility**:
    -   ARIA labels on interactive rings and charts.
    -   High-contrast text support (Analyst mode).
    -   Keyboard navigation support.
    -   `prefers-reduced-motion` compliance.

## 🔮 Roadmap

-   [x] Phase 1: Core Triage & Evidence Waterfall
-   [x] Phase 2: Socratic Lens & AI Integration
-   [x] Phase 3: "What-If" Simulation Sandbox
-   [ ] Phase 4: Prediction Markets Integration (Polyglot)
-   [ ] Phase 5: Mobile Native App

---

*Built with precision by [Lovable](https://lovable.dev).*
