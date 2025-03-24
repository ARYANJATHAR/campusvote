# Campus Vote

A modern college student voting platform built with Next.js, Tailwind CSS, and Supabase.

## Tech Stack

- **Frontend**: Next.js, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend**: Next.js API Routes, Supabase (Database, Auth, Storage)
- **Design**: Modern UI with custom color scheme and typography

## Features

- Gender-specific authentication and profiles
- Voting system for opposite gender profiles
- User dashboards with stats
- Gender-specific leaderboards

## Prerequisites

Before running the application, you'll need:

- Node.js 18+ installed
- Supabase project with the following environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
│   ├── auth/        # Authentication components
│   ├── voting/      # Voting interface components
│   └── dashboard/   # Dashboard and stats components
└── lib/             # Utility functions and configurations
    └── supabase/    # Supabase client and helpers
```

## Design System

- **Colors**: 
  - Gradient from `#D8B9FF` to `#B9FFF8`
  - Primary button color: `#FF6F61`
- **Typography**:
  - Primary: Poppins
  - Secondary: Roboto Mono
- **Target Audience**: College students (18-24)
