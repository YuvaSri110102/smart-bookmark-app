Smart Bookmark App

A minimal real-time bookmark manager built with Next.js App Router and Supabase.

Users authenticate via Google OAuth, manage private bookmarks, and see real-time updates across multiple tabs without refreshing the page.

Live Demo:
https://smart-bookmark-app-delta-beige.vercel.app/

Tech Stack

Next.js (App Router)

Supabase (Auth, Postgres, Realtime)

Tailwind CSS

Vercel (Deployment)

Features

Google OAuth login (no email/password)

Private bookmarks per user

Row-Level Security (RLS) enforced at database level

Real-time updates across multiple tabs

Bookmark add & delete functionality

Responsive UI with Tailwind CSS

Architecture Overview
Authentication

Authentication is handled using Supabase Google OAuth.

The app relies on:

supabase.auth.onAuthStateChange() for session lifecycle

Secure session management across tabs

Clean logout handling

Only authenticated users can access the dashboard.

Data Privacy (Row-Level Security)

Row-Level Security (RLS) is enabled on the bookmarks table.

Policy:

auth.uid() = user_id


This ensures:

Users can only read their own bookmarks

Users can only insert bookmarks tied to their user_id

Users can only delete their own data

Data isolation is enforced at the database level, not just the frontend.

Database Schema
bookmarks (
  id uuid primary key,
  user_id uuid references auth.users,
  title text,
  url text,
  created_at timestamp default now()
)

Real-Time Updates

Realtime updates are implemented using Supabase Realtime.

Replication enabled for the bookmarks table

Subscribed to postgres_changes

On change events, bookmarks are re-fetched to ensure deterministic UI state

Cross-tab synchronization supported

Challenges Faced
1. OAuth + Realtime Race Condition

After OAuth login, the realtime WebSocket subscription occasionally failed with CHANNEL_ERROR.

Root Cause:

The auth session was not fully hydrated before realtime attempted to subscribe.

Solution:

Re-structured authentication flow to rely on onAuthStateChange

Ensured realtime subscription is created only after session is confirmed

2. Cross-Tab Session Sync Issues

Logout in one tab did not always reflect immediately in another.

Solution:

Centralized auth handling using onAuthStateChange

Managed realtime channel lifecycle properly

Cleared channels on logout to prevent duplicate subscriptions

3. JWT Clock Skew Issue

Encountered an issue where Supabase reported:

Session was issued in the future


Root Cause:

Local system clock drift

Solution:

Resynchronized system clock

Restarted dev server and cleared cache

4. Tailwind v4 Configuration Differences

Initial Tailwind configuration used v3 syntax while the project installed v4.

Solution:

Updated globals.css to use @import "tailwindcss"

Adjusted PostCSS configuration accordingly

Deployment

The application is deployed on Vercel.

Production configuration required:

Updating Google OAuth Authorized Origins

Updating Supabase Site URL

Configuring environment variables in Vercel

Environment Variables

Create a .env.local file:

NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
