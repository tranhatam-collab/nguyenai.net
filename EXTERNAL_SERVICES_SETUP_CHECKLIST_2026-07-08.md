# External Services Setup Checklist — Founder Manual Setup

**Date:** 2026-07-08  
**Project:** nguyenai.net  
**Purpose:** Founder manual setup for external services (Neon PostgreSQL, Cloudflare secrets, VNPAY, Google OAuth)

---

## Overview

This checklist provides step-by-step instructions for setting up all external services required for nguyenai.net deployment. All steps require Founder manual action with Founder credentials.

**Prerequisites:**
- Founder account with access to:
  - Neon.tech (PostgreSQL)
  - Cloudflare (Workers, Pages, DNS)
  - VNPAY Sandbox (payment gateway)
  - Google Cloud Console (OAuth)

---

## Part 1: Neon PostgreSQL Setup

### Step 1.1: Create Neon Account

- [ ] Navigate to https://neon.tech
- [ ] Sign up / login with Founder email
- [ ] Verify email address
- [ ] Complete account setup

### Step 1.2: Create Project

- [ ] Click "Create a project"
- [ ] Project name: `nguyenai-net`
- [ ] Region: `us-east-1` (or preferred region)
- [ ] PostgreSQL version: `16` (default)
- [ ] Click "Create project"

### Step 1.3: Create Database

- [ ] In the project, click "Create database"
- [ ] Database name: `nai-identity`
- [ ] Click "Create database"

### Step 1.4: Get Connection String

- [ ] Navigate to project dashboard
- [ ] Click on `nai-identity` database
- [ ] Click "Connection string"
- [ ] Copy connection string (format: `postgresql://user:pass@host/db?sslmode=require`)
- [ ] **SAVE SECURELY** (use password manager)

### Step 1.5: Enable Connection Pooling

- [ ] Navigate to project settings
- [ ] Enable "Connection pooling"
- [ ] Set pool size: `20` (default)
- [ **SAVE** connection string with pooling (format: `postgresql://user:pass@host/db?sslmode=require&pgbouncer=true`)

---

## Part 2: Cloudflare Secrets Setup

### Step 2.1: Access Cloudflare Dashboard

- [ ] Navigate to https://dash.cloudflare.com
- [ ] Login with Founder account
- [ ] Select account: `Anhhatam@gmail.com's Account` (or appropriate account)

### Step 2.2: Select nguyenai.net Project

- [ ] Navigate to Workers & Pages
- [ ] Select project: `nguyenai.net`

### Step 2.3: Set Auth Worker Secrets

**Navigate to:** Workers > nguyenai.net > Settings > Environment Variables

- [ ] **AUTH_ISSUER**: `https://auth.nguyenai.net`
- [ ] **DEFAULT_AUDIENCE**: `app.nguyenai.net`
- [ ] **SESSION_MAX_AGE**: `3600`
- [ ] **GOOGLE_REDIRECT_URI**: `https://auth.nguyenai.net/v1/auth/oauth/callback`
- [ ] **GOOGLE_CLIENT_ID**: *(from Google OAuth setup, see Part 4)*
- [ ] **GOOGLE_CLIENT_SECRET**: *(from Google OAuth setup, see Part 4)*

### Step 2.4: Set API Worker Secrets

**Navigate to:** Workers > nguyenai.net > Settings > Environment Variables

- [ ] **DB**: *(Neon PostgreSQL database binding, see below)*
- [ ] **AUDIT_ARCHIVE**: *(R2 bucket binding, see below)*
- [ ] **ENVIRONMENT**: `development` (or `production` for prod)
- [ ] **AUTH_ISSUER**: `https://auth.nguyenai.net`
- [ ] **VNPAY_PAY_URL**: `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html` (or prod URL)
- [ ] **VNPAY_RETURN_URL**: `https://api.nguyenai.net/v1/payment/vnpay/callback`
- [ ] **LLM_PROVIDER_MODE**: `auto` (or `direct` for specific provider)
- [ ] **OPENAI_API_KEY**: *(if using OpenAI directly)*
- [ ] **ANTHROPIC_API_KEY**: *(if using Anthropic directly)*
- [ ] **GOOGLE_API_KEY**: *(if using Google AI directly)*

### Step 2.5: Create D1 Database Binding (nai-identity)

**Navigate to:** Workers > nguyenai.net > Settings > D1 Databases

- [ ] Click "Create database"
- [ ] Database name: `nai-identity`
- [ ] Click "Create database"
- [ ] Wait for database creation (1-2 minutes)
- [ ] **SAVE** Database ID for wrangler.jsonc

### Step 2.6: Create R2 Bucket Binding (nai-audit-archive)

**Navigate to:** Workers > nguyenai.net > Settings > R2

- [ ] Click "Create bucket"
- [ ] Bucket name: `nai-audit-archive`
- [ ] Click "Create bucket"
- [ ] **SAVE** Bucket ID for wrangler.jsonc

### Step 2.7: Update wrangler.jsonc

**File:** `apps/api/wrangler.jsonc`

- [ ] Add D1 binding:
```toml
[[d1_databases]]
binding = "DB"
database_name = "nai-identity"
database_id = "<DATABASE_ID_FROM_STEP_2.5>"
```

- [ ] Add R2 binding:
```toml
[[r2_buckets]]
binding = "AUDIT_ARCHIVE"
bucket_name = "nai-audit-archive"
```

- [ ] Add environment variables:
```toml
[vars]
ENVIRONMENT = "development"
AUTH_ISSUER = "https://auth.nguyenai.net"
DEFAULT_AUDIENCE = "app.nguyenai.net"
SESSION_MAX_AGE = "3600"
GOOGLE_REDIRECT_URI = "https://auth.nguyenai.net/v1/auth/oauth/callback"
VNPAY_PAY_URL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
VNPAY_RETURN_URL = "https://api.nguyenai.net/v1/payment/vnpay/callback"
LLM_PROVIDER_MODE = "auto"
```

- [ ] **DEPLOY** to verify configuration

---

## Part 3: VNPAY Payment Gateway Setup

### Step 3.1: Access VNPAY Sandbox

- [ ] Navigate to https://sandbox.vnpayment.vn
- [ ] Login with merchant credentials
- [ ] (If no account) Register for sandbox access

### Step 3.2: Get Merchant Credentials

- [ ] Navigate to Merchant settings
- [ ] Copy Merchant ID (tmn_code)
- [ ] Copy Secret Key (tmn_checksum)
- [ ] Copy Hash Secret (tmn_hashsecret)
- [ ] **SAVE SECURELY** (use password manager)

### Step 3.3: Update Cloudflare Secrets

**Navigate to:** Workers > nguyenai.net > Settings > Environment Variables

- [ ] **VNPAY_TMN_CODE**: *(Merchant ID from Step 3.2)*
- [ ] **VNPAY_TMN_CHECKSUM**: *(Secret Key from Step 3.2)*
- [ ] **VNPAY_TMN_HASHSECRET**: *(Hash Secret from Step 3.2)*

### Step 3.4: Update wrangler.jsonc

- [ ] Add VNPAY variables:
```toml
[vars]
VNPAY_TMN_CODE = "<TMN_CODE>"
VNPAY_TMN_CHECKSUM = "<TMN_CHECKSUM>"
VNPAY_TMN_HASHSECRET = "<TMN_HASHSECRET>"
```

- [ ] **DEPLOY** to verify configuration

---

## Part 4: Google OAuth Setup

### Step 4.1: Access Google Cloud Console

- [ ] Navigate to https://console.cloud.google.com
- [ ] Login with Founder Google account

### Step 4.2: Create OAuth 2.0 Credentials

- [ ] Navigate to APIs & Services > Credentials
- [ ] Click "Create credentials"
- [ ] Select "OAuth client ID"
- [ ] Application type: "Web application"
- [ ] Name: `nguyenai.net-auth`
- [ ] Authorized redirect URIs:
  - `https://auth.nguyenai.net/v1/auth/oauth/callback`
  - `http://localhost:4321/v1/auth/oauth/callback` (for local dev)
- [ ] Click "Create"

### Step 4.3: Get OAuth Credentials

- [ ] Copy Client ID
- [ ] Click "Edit OAuth client"
- [ ] Create Client Secret (if not auto-generated)
- [ ] Copy Client Secret
- [ ] **SAVE SECURELY** (use password manager)

### Step 4.4: Update Cloudflare Secrets

**Navigate to:** Workers > nguyenai.net > Settings > Environment Variables

- [ ] **GOOGLE_CLIENT_ID**: *(from Step 4.3)*
- [ ] **GOOGLE_CLIENT_SECRET**: *(from Step 4.3)*

### Step 4.5: Update wrangler.jsonc

- [ ] Add Google OAuth variables:
```toml
[vars]
GOOGLE_CLIENT_ID = "<CLIENT_ID>"
GOOGLE_CLIENT_SECRET = "<CLIENT_SECRET>"
```

- [ ] **DEPLOY** to verify configuration

---

## Part 5: Verification

### Step 5.1: Verify Database Connection

- [ ] Run: `pnpm db:migrate`
- [ ] Run: `pnpm db:status`
- [ ] Verify: tables created successfully

### Step 5.2: Verify Secrets

- [ ] Run: `pnpm run build`
- [ ] Verify: build passes without secrets errors
- [ ] Check: all environment variables loaded correctly

### Step 5.3: Verify OAuth

- [ ] Test OAuth flow locally: `npm run dev`
- [ ] Navigate to: `http://localhost:4321/login`
- [ ] Click "Sign in with Google"
- [ ] Verify: OAuth redirect works correctly
- [ ] Verify: user authenticated successfully

### Step 5.4: Verify Payment

- [ ] Test payment flow locally
- [ ] Verify: VNPAY integration works
- [ ] Verify: payment callback works

---

## Part 6: Production Setup (Optional)

### Step 6.1: Production Database

- [ ] Create separate Neon project for production
- [ ] Database name: `nai-identity-prod`
- [ ] Update wrangler.jsonc with production database ID
- [ ] Update ENVIRONMENT to `production`

### Step 6.2: Production VNPAY

- [ ] Access VNPAY production environment
- [ ] Update production credentials
- [ ] Update wrangler.jsonc with production URLs

### Step 6.3: Production OAuth

- [ ] Create production OAuth credentials
- [ ] Update production redirect URIs
- [ ] Update wrangler.jsonc with production credentials

---

## Troubleshooting

### Neon Issues

**Problem:** Connection string not working
- [ ] Verify SSL mode is enabled (`sslmode=require`)
- [ ] Verify connection pooling is enabled
- [ ] Check Neon status page for outages

### Cloudflare Secrets Issues

**Problem:** Secrets not loading
- [ ] Verify secrets are set in correct project (nguyenai.net)
- [ ] Verify wrangler.jsonc has correct variable names
- [ ] Run `pnpm run build` to verify

### OAuth Issues

**Problem:** OAuth redirect failing
- [ ] Verify redirect URI matches exactly (including trailing slash)
- [ ] Verify Client Secret is correct
- [ ] Check Google Console for errors

### VNPAY Issues

**Problem:** Payment callback failing
- [ ] Verify return URL matches exactly
- [ ] Verify checksum calculation
- [ ] Check VNPAY sandbox status

---

## Security Notes

- **NEVER commit secrets to git** (use Cloudflare secrets or password manager)
- **Use different credentials** for development and production
- **Rotate secrets** regularly (every 90 days recommended)
- **Enable 2FA** on all external service accounts
- **Limit access** to minimum required permissions

---

## Next Steps

After completing this checklist, proceed to:
1. Deployment Checklist (deploy to Cloudflare)
2. Governance Checklist (Sprint 0 lock)

---

Generated with [Devin](https://devin.ai)

Co-Authored-By: Devin <158243242+devin-ai-integration[bot]@users.noreply.github.com>
