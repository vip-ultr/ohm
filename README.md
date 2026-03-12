# Ω Ohm Markets

**Ohm Markets** is a professional, real-time Solana token analytics terminal. It aggregates on-chain data from Helius, market data from DexScreener, and launchpad data from Bags.fm into a single dark, sharp-edged trading interface.

---

## Table of Contents

1. [Live Demo & Repo](#live-demo--repo)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Architecture Overview](#architecture-overview)
5. [Data Flow](#data-flow)
6. [Directory Structure](#directory-structure)
7. [API Routes](#api-routes)
8. [Database Schema](#database-schema)
9. [Authentication](#authentication)
10. [Design System](#design-system)
11. [Environment Variables](#environment-variables)
12. [Local Setup](#local-setup)
13. [Deployment (Vercel)](#deployment-vercel)

---

## Live Demo & Repo

| | |
|---|---|
| **GitHub** | https://github.com/vip-ultr/ohm |
| **Stack** | Next.js 14 · TypeScript · Tailwind CSS · Supabase · Privy |

---

## Features

### Token Discovery
- Live token list sourced from **Bags.fm** launchpad pools
- Tabs: **Trending** (by 24h volume) · **New** (by age) · **Watchlist**
- Sortable by price, market cap, 24h volume, 24h change
- 1H / 24H / 7D / 30D timeframe filters
- Star any token to add to your personal watchlist

### Smart Search
- Paste any **Solana address** → auto-detects token vs wallet via DexScreener
  - Token mint → `/token/[address]`
  - Wallet address → `/wallet/[address]`
- Type a **name or ticker** → live DexScreener results with logo, price, and TOKEN badge
- Keyboard navigation (↑↓ arrows, Enter, Escape)

### Token Analytics Page (`/token/[address]`)
- Token header: logo · name · contract address (copy) · socials
- Key stats: Price + 24h change · Holders · 24h Volume
- Meta table: Supply · Liquidity · Market Cap · FDV
- **Buy on Bags** button → direct link to Bags.fm trading page
- OHLCV price chart (lightweight-charts v5, SSR-safe)
- Tabs: **History** (recent trades) · **Holders** (top 10) · **Whales** (transactions >10 SOL)
- X/Twitter mention count (15-min cached)

### Wallet Pages
- `/profile` — your own connected wallet (requires auth)
- `/wallet/[address]` — any Solana wallet, read-only, no auth required
- Both show: SOL balance · token holdings · estimated USD value · transaction history

### Authentication (Privy)
- Connect via: **Phantom** · **OKX Wallet** · **Coinbase Wallet** · **Email** · **Google** · **Twitter/X**
- Solana-only scope (`walletChainType: 'solana-only'`)
- Embedded wallet auto-created for email/social users
- Export embedded wallet private key from Settings

### Settings Dropdown
- Dark / Light / System theme toggle
- Export private key (embedded wallet users only)
- Disconnect wallet

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS + custom CSS design system |
| **Auth** | Privy `@privy-io/react-auth` v3 |
| **Database** | Supabase (PostgreSQL + RLS) |
| **Data fetching** | TanStack React Query v5 |
| **Charts** | `lightweight-charts` v5 |
| **Icons** | `lucide-react` + `react-icons/fa6` |
| **Theme** | `next-themes` (class strategy, dark default) |
| **Fonts** | Inter (UI) + JetBrains Mono (numbers/addresses) |

### External APIs

| API | Purpose | Auth |
|---|---|---|
| **Helius** | Solana RPC, DAS metadata, holders, transactions, OHLCV | API key (server only) |
| **Bags.fm** | Launchpad pool list (token source) | API key (server only) |
| **DexScreener** | Price, volume, liquidity, token search, address resolution | No key required |
| **X API v2** | Token mention counts | Bearer token (server only) |

---

## Architecture Overview

```
Browser (React / Next.js client components)
        │
        │  fetch()
        ▼
┌─────────────────────────────────────────┐
│         Next.js API Routes              │  ← server-only, all secrets live here
│  /api/tokens          token list        │
│  /api/tokens/search   DexScreener search│
│  /api/token/[addr]    full analytics    │
│  /api/token/[addr]/trades               │
│  /api/token/[addr]/holders              │
│  /api/token/[addr]/whales               │
│  /api/token/[addr]/ohlcv                │
│  /api/wallet/[addr]   portfolio         │
│  /api/resolve/[addr]  token vs wallet   │
│  /api/social/[token]  X mentions        │
│  /api/watchlist       GET / POST        │
└───────────┬─────────────────────────────┘
            │
    ┌───────┼──────────────┐
    ▼       ▼              ▼
 Helius  Bags.fm +      Supabase
  RPC    DexScreener    (watchlist,
  DAS                    users,
                         cache)
```

### Client Boundary

`components/Providers.tsx` is the **single `"use client"` barrier**:

```
PrivyProvider
  └── QueryClientProvider
        └── ThemeProvider
              └── {children}   ← all app pages
```

All pages and most components are React Server Component-compatible by default. Only components that use Privy hooks, React Query, or browser APIs are client components.

---

## Data Flow

### Token List (homepage)

```
1. GET /api/tokens
2. fetchBagsPools()        → Bags.fm API    → list of token mints
3. fetchDexScreenerBatch() → DexScreener    → price / volume / liquidity
4. fetchHeliusAssets()     → Helius DAS     → name / symbol / logo / supply
5. buildToken()            → merge all three into unified Token object
6. Sort by volume (trending) or age (new)
7. Cache: s-maxage=30, stale-while-revalidate=60
```

### Token Analytics (`/token/[address]`)

```
1. GET /api/token/[address]
2. Parallel:
   ├── Bags.fm      → pool config (dbcPoolKey, dammV2PoolKey)
   ├── DexScreener  → market data
   └── Helius DAS   → asset metadata
3. GET /api/token/[address]/holders  → Helius RPC getTokenLargestAccounts
4. GET /api/token/[address]/trades   → Helius getSignaturesForAddress + parsed txns
5. GET /api/token/[address]/ohlcv    → Helius price history
6. GET /api/social/[ticker]          → X API v2 recent mentions (15-min in-memory cache)
```

### Wallet Portfolio (`/profile` or `/wallet/[address]`)

```
1. GET /api/wallet/[address]
2. Helius getBalances    → SOL + SPL token balances
3. DexScreener batch     → USD prices for held tokens
4. Helius getSignatures  → recent transaction history
5. Returns: { totalUsdValue, solBalance, tokenCount, holdings[], history[] }
```

### Address Resolution (smart search)

```
1. User pastes 32–44 char base58 string
2. GET /api/resolve/[address]
3. DexScreener /tokens/v1/solana/{address}
   ├── Returns pairs with this as baseToken → TYPE: token → /token/[address]
   └── No pairs found                       → TYPE: wallet → /wallet/[address]
```

### Authentication + Watchlist

```
User connects wallet / social login
  → Privy issues a JWT (stored in browser)
  → On first profile load, user record upserted to Supabase users table
  → Watchlist reads/writes go through /api/watchlist
    → Route handler reads Privy session, gets user.id (Privy DID)
    → Supabase service role key used server-side (bypasses RLS safely)
```

---

## Directory Structure

```
ohm/
├── app/
│   ├── layout.tsx              Root layout (font + Providers)
│   ├── page.tsx                Homepage (token list)
│   ├── globals.css             Full design system (CSS vars, animations, components)
│   ├── profile/
│   │   └── page.tsx            Authenticated wallet page
│   ├── token/
│   │   └── [address]/
│   │       └── page.tsx        Token analytics page
│   ├── wallet/
│   │   └── [address]/
│   │       └── page.tsx        Any wallet, read-only
│   └── api/
│       ├── tokens/
│       │   ├── route.ts        GET token list
│       │   ├── search/route.ts GET token search (DexScreener)
│       │   └── overview/route.ts GET market stats
│       ├── token/[address]/
│       │   ├── route.ts        Full token analytics
│       │   ├── trades/         Trade history
│       │   ├── holders/        Top holders
│       │   ├── whales/         Large transactions
│       │   └── ohlcv/          Price chart data
│       ├── wallet/[address]/
│       │   └── route.ts        Wallet portfolio
│       ├── resolve/[address]/
│       │   └── route.ts        Token vs wallet detection
│       ├── social/[token]/
│       │   └── route.ts        X mention count
│       └── watchlist/
│           └── route.ts        GET/POST watchlist
│
├── components/
│   ├── Providers.tsx           Client boundary (Privy + Query + Theme)
│   ├── layout/
│   │   ├── Navbar.tsx          Sticky top nav (logo, smart search, connect)
│   │   └── Footer.tsx          Horizontal footer
│   ├── dashboard/
│   │   ├── TokenTable.tsx      Main token list table with tabs
│   │   ├── TimeframeFilter.tsx 1H/24H/7D/30D selector
│   │   └── OverviewStats.tsx   Market summary strip
│   ├── token/
│   │   ├── TokenHeader.tsx     Token logo/name/CA/socials + meta + Buy on Bags
│   │   ├── TokenDetails.tsx    3 stat boxes (price, holders, volume)
│   │   ├── DataTabs.tsx        History/Holders/Whales tab bar
│   │   ├── TradesTab.tsx       Recent transactions table
│   │   ├── TopHoldersTab.tsx   Top 10 holders table
│   │   └── WhalesTab.tsx       Large transaction table
│   ├── profile/
│   │   ├── BalanceCards.tsx    3 connected balance boxes
│   │   ├── WalletInfo.tsx      Address display + disconnect
│   │   ├── HoldingsTab.tsx     Token holdings table
│   │   └── HistoryTab.tsx      Transaction history table
│   └── ui/
│       ├── NavSearch.tsx       Smart search with live dropdown + auto-detection
│       ├── SearchBar.tsx       Generic search input
│       ├── TokenAvatar.tsx     Circular token logo / letter fallback
│       ├── CopyButton.tsx      Copy-to-clipboard with checkmark feedback
│       ├── Skeleton.tsx        Loading placeholder shimmer
│       ├── SettingsDropdown.tsx Theme + export key + disconnect
│       └── ThemeToggle.tsx     Sun/Moon toggle
│
├── hooks/
│   ├── useWallet.ts            Resolves Solana address from Privy (embedded + external)
│   ├── useTokenData.ts         React Query hooks for token/analytics/mentions
│   ├── useWatchlist.ts         Watchlist CRUD via /api/watchlist
│   ├── useCopy.ts              Clipboard copy with timeout feedback
│   └── useTheme.ts             next-themes wrapper
│
├── lib/
│   ├── helius.ts               Helius RPC/DAS helpers (metadata, txns, holders, OHLCV)
│   ├── bags.ts                 Bags.fm + DexScreener + Helius merged token layer
│   ├── twitter.ts              X API v2 mention fetch (15-min in-memory cache)
│   ├── supabase.ts             createServerSupabaseClient() + getSupabaseBrowser()
│   └── utils.ts                cn() Tailwind merge utility
│
├── types/
│   └── index.ts                All shared TypeScript interfaces (Token, Trade, Holder…)
│
├── supabase-schema.sql         Run once in Supabase SQL Editor
├── .env.local.example          Template for all required environment variables
└── next.config.mjs             Image domains whitelist
```

---

## API Routes

| Method | Route | Description | Cache |
|---|---|---|---|
| GET | `/api/tokens` | Token list from Bags.fm + DexScreener + Helius | 30s |
| GET | `/api/tokens/search?q=` | Live token search via DexScreener | 15s |
| GET | `/api/tokens/overview` | Market overview stats | 60s |
| GET | `/api/token/[address]` | Full token analytics (merged 3 sources) | 30s |
| GET | `/api/token/[address]/trades` | Recent trade history | 15s |
| GET | `/api/token/[address]/holders` | Top 10 holders + percentage | 60s |
| GET | `/api/token/[address]/whales` | Transactions over 10 SOL | 30s |
| GET | `/api/token/[address]/ohlcv` | OHLCV price history for chart | 60s |
| GET | `/api/wallet/[address]` | Portfolio: balances + holdings + history | 30s |
| GET | `/api/resolve/[address]` | Detect if address is a token or wallet | 30s |
| GET | `/api/social/[token]` | X mentions count (15-min in-memory cache) | — |
| GET | `/api/watchlist` | Get user's watchlist (auth required) | — |
| POST | `/api/watchlist` | Add/remove token from watchlist (auth required) | — |

---

## Database Schema

Three tables in Supabase. Run `supabase-schema.sql` in the **SQL Editor** once before first use.

```sql
-- Privy user sync (DID as primary key)
users (
  id             TEXT PRIMARY KEY,   -- Privy DID e.g. "did:privy:abc123"
  wallet_address TEXT,
  email          TEXT,
  login_type     TEXT,               -- 'wallet' | 'email' | 'google' | 'twitter'
  preferences    JSONB DEFAULT '{}',
  created_at     TIMESTAMPTZ,
  updated_at     TIMESTAMPTZ
)

-- Per-user token favourites
watchlist (
  id            UUID PRIMARY KEY,
  user_id       TEXT → users.id,
  token_address TEXT,
  created_at    TIMESTAMPTZ,
  UNIQUE (user_id, token_address)
)
RLS: users can only access their own rows

-- Analytics cache (reduces redundant external API calls)
token_analytics (
  token_address    TEXT PRIMARY KEY,
  price            NUMERIC,
  volume_24h       NUMERIC,
  liquidity        NUMERIC,
  holders          INTEGER,
  market_cap       NUMERIC,
  price_change_24h NUMERIC,
  raw_data         JSONB,
  updated_at       TIMESTAMPTZ
)
```

Row Level Security is enabled on `watchlist`. Route handlers use the **service role key** server-side to bypass RLS safely.

---

## Authentication

Ohm uses **Privy** (`@privy-io/react-auth` v3) for all authentication.

### Supported login methods
- `wallet` — Phantom, OKX Wallet, Coinbase Wallet (Solana-only modal)
- `email` — passwordless magic link
- `google` — OAuth (enable in Privy dashboard)
- `twitter` — OAuth (enable in Privy dashboard)

### Embedded wallets
Users who sign in via email/Google/Twitter automatically receive a **Privy-managed embedded Solana wallet**. They can export the private key at any time from **Settings → Export Private Key**. Privy handles the secure display — the key is never exposed to the app code.

### Wallet address resolution
`hooks/useWallet.ts` tries both wallet sources in priority order:

```ts
1. useSolanaWallets()   → embedded Solana wallet (email/social login users)
2. useWallets()         → external wallets (Phantom, OKX, Coinbase)
3. Returns undefined if neither connected
```

This ensures the correct Solana address is always resolved regardless of how the user logged in.

### Privy Dashboard configuration
Go to [dashboard.privy.io](https://dashboard.privy.io) and configure your app:

- **Login methods** tab → enable Email, Google, Twitter
- **Embedded wallets** tab → enable Solana embedded wallets
- **Allowed origins** → add your production URL + `http://localhost:3000`

---

## Design System

### Colour palette
```
--green:   #00d15e   primary accent (buttons, badges, borders)
--bg:      #000000   page background
--bg2:     #0a0a0a   card backgrounds
--bg3:     #111111   input backgrounds, hover states
--bg4:     #181818   subtle fills
--border:  #1a1a1a   subtle dividers
--border2: #252525   visible borders (all table cells, card outlines)
--text:    #e0e0e0   primary text
--text2:   #aaaaaa   secondary text
--text3:   #666666   labels, placeholders, muted
--red:     #e05c5c   negative values, sell indicators
```

### Typography
| Use | Font |
|---|---|
| All UI text, labels, buttons | **Inter** (300–800) |
| Prices, numbers, addresses, hashes | **JetBrains Mono** (400–700) |

### Key design principles
- **Zero border-radius** on every card, table, section, input, dropdown, and button (only `50%` kept for circular token logos and live-indicator dots)
- **2px grid borders** on all table cells — both horizontal (row) and vertical (column) lines visible
- **ALL CAPS** for section labels and table column headers (`font-size: 11px`, `letter-spacing: 0.8px`)
- Sharp, industrial terminal aesthetic consistent throughout

### Animation system

| Animation | Trigger | Effect |
|---|---|---|
| `rowShake` | Table row hover | Dampening translateX shake (8 steps) |
| `numberPop` | Stat value mount | Spring scale + translateY pop |
| `rowIn` | Table rows on load | Staggered left-slide entrance |
| `fadeIn` / `slideInLeft` | Page / card mount | Smooth opacity + translate entry |
| `scaleIn` | Dropdowns, badges | Scale from 0.94 → 1 |
| `greenPulse` | Price-up badge | Glow box-shadow loop |
| `shimmer` | Skeleton loaders | Horizontal light sweep |
| Left accent bar | Row hover | `::before` width 0 → 2px green sweep |
| Buy button shimmer | Button hover | Light sweep via `::after` |
| Stat box lift | Box hover | `translateY(-2px)` + border brighten |

---

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in all values before running locally.

```bash
# ─── PUBLIC (safe to expose to browser) ───────────────────────────
NEXT_PUBLIC_PRIVY_APP_ID=        # from dashboard.privy.io → Settings
NEXT_PUBLIC_SUPABASE_URL=        # from Supabase → Project Settings → API

# ─── SERVER ONLY (never expose to client) ─────────────────────────
SUPABASE_ANON_KEY=               # Supabase anon/public key (no NEXT_PUBLIC_ prefix)
SUPABASE_SERVICE_ROLE_KEY=       # Supabase service role key — bypasses RLS

# Helius — Solana RPC + Digital Asset Standard
HELIUS_API_KEY=                  # from dev.helius.xyz
HELIUS_BASE_URL=https://api.helius.xyz/v0
HELIUS_RPC_URL=https://mainnet.helius-rpc.com

# Bags.fm — launchpad token pool list
BAGSFM_API_KEY=                  # from dev.bags.fm (app uses mock data if unset)
BAGSFM_BASE_URL=https://public-api-v2.bags.fm/api/v1

# DexScreener — no key required (free, 60 req/min)
DEXSCREENER_BASE_URL=https://api.dexscreener.com

# X / Twitter — mention counts
TWITTER_BEARER_TOKEN=            # from developer.twitter.com → app keys
```

> `SUPABASE_ANON_KEY` intentionally has **no** `NEXT_PUBLIC_` prefix. All Supabase calls go through server-side route handlers using `createServerSupabaseClient()`. There is no Supabase client initialised in the browser.

---

## Local Setup

```bash
# 1. Clone the repo
git clone https://github.com/vip-ultr/ohm.git
cd ohm

# 2. Install dependencies
# --legacy-peer-deps is required for @solana-program/memo peer dep
npm install --legacy-peer-deps

# 3. Configure environment
cp .env.local.example .env.local
# Fill in all values in .env.local

# 4. Set up Supabase database (one-time)
# → Supabase dashboard → SQL Editor → paste supabase-schema.sql → Run

# 5. Start the dev server
npm run dev
# → open http://localhost:3000
```

### Requirements
| Requirement | Where to get it |
|---|---|
| Node.js 18+ | https://nodejs.org |
| Privy app | https://dashboard.privy.io |
| Supabase project | https://supabase.com |
| Helius API key | https://dev.helius.xyz |
| Bags.fm API key | https://dev.bags.fm *(optional — mock fallback)* |
| X Developer account | https://developer.twitter.com *(optional)* |

---

## Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Link to your Vercel project
vercel link

# Add every environment variable
vercel env add NEXT_PUBLIC_PRIVY_APP_ID
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add HELIUS_API_KEY
vercel env add HELIUS_RPC_URL
vercel env add HELIUS_BASE_URL
vercel env add BAGSFM_API_KEY
vercel env add BAGSFM_BASE_URL
vercel env add DEXSCREENER_BASE_URL
vercel env add TWITTER_BEARER_TOKEN

# Deploy to production
vercel --prod
```

After your first deploy, add the production URL to:
- **Privy dashboard** → Allowed origins
- **Supabase** → Authentication → URL Configuration (Site URL + Redirect URLs)

### Useful Vercel CLI commands

```bash
vercel env ls               # list all environment variables
vercel env rm VARIABLE_NAME # remove a variable
vercel env pull .env.local  # sync remote variables to local .env.local
vercel logs --follow        # tail live production logs
```

---

## Known Issues & Notes

- **`BAGSFM_API_KEY` is optional.** `lib/bags.ts` falls back to 5 mock tokens (SOL, USDC, BONK, POPCAT, OHM) so the UI is always functional during development
- **`lightweight-charts` v5 is SSR-incompatible.** The chart component is wrapped in `dynamic(() => import(...), { ssr: false })` to prevent server-side rendering crashes
- **`@solana-program/memo`** must be explicitly installed as a peer dependency of `@privy-io/react-auth/solana`. It is not auto-installed: `npm install @solana-program/memo --legacy-peer-deps`
- **X mention counts** are cached in memory for 15 minutes per ticker symbol to stay within the X API free tier rate limits
- **Google and Twitter OAuth** require those login methods to be explicitly enabled in your Privy dashboard before they will appear in the connect modal
