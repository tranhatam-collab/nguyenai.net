# Deployment Checklist — Founder Manual Deploy

**Date:** 2026-07-08  
**Project:** nguyenai.net  
**Purpose:** Founder manual deploy to Cloudflare (Pages, Workers, DNS)

---

## Overview

This checklist provides step-by-step instructions for deploying nguyenai.net to Cloudflare. All steps require Founder manual action with Founder credentials.

**Prerequisites:**
- ✅ External Services Setup Checklist completed
- ✅ All secrets configured in Cloudflare
- ✅ Database migrations run successfully
- ✅ Build passes locally (`pnpm run build`)

---

## Part 1: Cloudflare Pages Deployment (nguyenai.net)

### Step 1.1: Access Cloudflare Pages

- [ ] Navigate to https://dash.cloudflare.com
- [ ] Login with Founder account
- [ ] Select account: `Anhhatam@gmail.com's Account` (or appropriate account)
- [ ] Navigate to Workers & Pages > Pages

### Step 1.2: Create Pages Project

- [ ] Click "Create a project"
- [ ] Select "Connect to Git"
- [ ] Select repository: `nguyenai.net` (GitHub)
- [ ] (If not connected) Authorize Cloudflare access to GitHub

### Step 1.3: Configure Build Settings

- [ ] Project name: `nguyenai.net`
- [ ] Production branch: `main`
- [ ] Framework preset: `Astro`
- [ ] Build command: `pnpm run build`
- [ ] Build output directory: `apps/web/dist`

### Step 1.4: Configure Environment Variables

**Navigate to:** Pages > nguyenai.net > Settings > Environment Variables

- [ ] Add variable: `NODE_VERSION` = `20`
- [ ] Add variable: `PNPM_VERSION` = `9`

### Step 1.5: Deploy

- [ ] Click "Save and Deploy"
- [ ] Wait for build to complete (2-5 minutes)
- [ ] Verify: Build passes
- [ ] Verify: Preview URL works (e.g., `https://nguyenai-net.pages.dev`)

### Step 1.6: Configure Custom Domain

- [ ] Navigate to Pages > nguyenai.net > Settings > Custom domains
- [ ] Click "Set up a custom domain"
- [ ] Enter domain: `nguyenai.net`
- [ ] Click "Continue"
- [ ] Verify DNS records displayed

---

## Part 2: Auth Worker Deployment (auth.nguyenai.net)

### Step 2.1: Navigate to Auth Worker

**File:** `apps/auth`

- [ ] Verify wrangler.jsonc exists
- [ ] Verify environment variables set in Cloudflare (see External Services Checklist)
- [ ] Verify secrets set in Cloudflare

### Step 2.2: Deploy Auth Worker

- [ ] Navigate to apps/auth directory
- [ ] Run: `cd apps/auth && pnpm run deploy`
- [ ] Wait for deployment to complete (1-2 minutes)
- [ ] Verify: Worker URL works (e.g., `https://auth.nguyenai.net`)

### Step 2.3: Configure Custom Domain

- [ ] Navigate to Workers > nguyenai.net > Settings > Triggers
- [ ] Add custom domain: `auth.nguyenai.net`
- [ ] Verify DNS records displayed

### Step 2.4: Verify Auth Flow

- [ ] Navigate to: `https://auth.nguyenai.net/v1/health`
- [ ] Verify: Returns `{"status":"ok"}`
- [ ] Navigate to: `https://nguyenai.net/login`
- [ ] Click "Sign in with Google"
- [ ] Verify: OAuth redirect works correctly
- [ ] Verify: User authenticated successfully

---

## Part 3: API Worker Deployment (api.nguyenai.net)

### Step 3.1: Navigate to API Worker

**File:** `apps/api`

- [ ] Verify wrangler.jsonc exists
- [ ] Verify D1 binding configured (nai-identity)
- [ ] Verify R2 binding configured (nai-audit-archive)
- [ ] Verify environment variables set in Cloudflare
- [ ] Verify secrets set in Cloudflare

### Step 3.2: Run Database Migrations

- [ ] Navigate to root directory
- [ ] Run: `pnpm db:migrate`
- [ ] Verify: All migrations applied successfully
- [ ] Run: `pnpm db:status`
- [ ] Verify: Database status is "migrated"

### Step 3.3: Deploy API Worker

- [ ] Navigate to apps/api directory
- [ ] Run: `cd apps/api && pnpm run deploy`
- [ ] Wait for deployment to complete (1-2 minutes)
- [ ] Verify: Worker URL works (e.g., `https://api.nguyenai.net`)

### Step 3.4: Configure Custom Domain

- [ ] Navigate to Workers > nguyenai.net > Settings > Triggers
- [ ] Add custom domain: `api.nguyenai.net`
- [ ] Verify DNS records displayed

### Step 3.5: Verify API Endpoints

- [ ] Navigate to: `https://api.nguyenai.net/v1/health`
- [ ] Verify: Returns `{"status":"ok"}`
- [ ] Navigate to: `https://api.nguyenai.net/v1/models`
- [ ] Verify: Returns list of available models
- [ ] Test payment endpoint (if configured)

---

## Part 4: Edu App Deployment (edu.nguyenai.net)

### Step 4.1: Navigate to Edu App

**File:** `apps/edu`

- [ ] Verify wrangler.jsonc exists
- [ ] Verify build settings configured

### Step 4.2: Deploy Edu App

- [ ] Navigate to apps/edu directory
- [ ] Run: `cd apps/edu && pnpm run deploy`
- [ ] Wait for deployment to complete (1-2 minutes)
- [ ] Verify: Worker URL works (e.g., `https://edu.nguyenai.net`)

### Step 4.3: Configure Custom Domain

- [ ] Navigate to Workers > nguyenai.net > Settings > Triggers
- [ ] Add custom domain: `edu.nguyenai.net`
- [ ] Verify DNS records displayed

### Step 4.4: Verify Edu App

- [ ] Navigate to: `https://edu.nguyenai.net`
- [ ] Verify: Homepage loads correctly
- [ ] Verify: Scholarship page loads correctly
- [ ] Verify: Tracks page loads correctly

---

## Part 5: Console App Deployment (app.nguyenai.net)

### Step 5.1: Navigate to Console App

**File:** `apps/console`

- [ ] Verify wrangler.jsonc exists
- [ ] Verify build settings configured

### Step 5.2: Deploy Console App

- [ ] Navigate to apps/console directory
- [ ] Run: `cd apps/console && pnpm run deploy`
- [ ] Wait for deployment to complete (1-2 minutes)
- [ ] Verify: Worker URL works (e.g., `https://app.nguyenai.net`)

### Step 5.3: Configure Custom Domain

- [ ] Navigate to Workers > nguyenai.net > Settings > Triggers
- [ ] Add custom domain: `app.nguyenai.net`
- [ ] Verify DNS records displayed

### Step 5.4: Verify Console App

- [ ] Navigate to: `https://app.nguyenai.net`
- [ ] Verify: Login page loads correctly
- [ ] Verify: Auth flow works correctly
- [ ] Verify: Console UI loads correctly

---

## Part 6: DNS Configuration

### Step 6.1: Access DNS Settings

- [ ] Navigate to https://dash.cloudflare.com
- [ ] Select account: `Anhhatam@gmail.com's Account` (or appropriate account)
- [ ] Navigate to DNS > nguyenai.net

### Step 6.2: Configure DNS Records

**For nguyenai.net (Pages):**
- [ ] Type: `CNAME`
- [ ] Name: `@`
- [ ] Target: `nguyenai-net.pages.dev`
- [ ] Proxy status: `Proxied` (orange cloud)
- [ ] TTL: `Auto`

**For auth.nguyenai.net (Worker):**
- [ ] Type: `CNAME`
- [ ] Name: `auth`
- [ ] Target: `auth.nguyenai.net.workers.dev`
- [ ] Proxy status: `Proxied` (orange cloud)
- [ ] TTL: `Auto`

**For api.nguyenai.net (Worker):**
- [ ] Type: `CNAME`
- [ ] Name: `api`
- [ ] Target: `api.nguyenai.net.workers.dev`
- [ ] Proxy status: `Proxied` (orange cloud)
- [ ] TTL: `Auto`

**For edu.nguyenai.net (Worker):**
- [ ] Type: `CNAME`
- [ ] Name: `edu`
- [ ] Target: `edu.nguyenai.net.workers.dev`
- [ ] Proxy status: `Proxied` (orange cloud)
- [ ] TTL: `Auto`

**For app.nguyenai.net (Worker):**
- [ ] Type: `CNAME`
- [ ] Name: `app`
- [ ] Target: `app.nguyenai.net.workers.dev`
- [ ] Proxy status: `Proxied` (orange cloud)
- [ ] TTL: `Auto`

### Step 6.3: Verify DNS Propagation

- [ ] Wait for DNS propagation (5-15 minutes)
- [ ] Run: `dig nguyenai.net`
- [ ] Verify: CNAME points to Cloudflare
- [ ] Run: `dig auth.nguyenai.net`
- [ ] Verify: CNAME points to Cloudflare
- [ ] Run: `dig api.nguyenai.net`
- [ ] Verify: CNAME points to Cloudflare
- [ ] Run: `dig edu.nguyenai.net`
- [ ] Verify: CNAME points to Cloudflare
- [ ] Run: `dig app.nguyenai.net`
- [ ] Verify: CNAME points to Cloudflare

---

## Part 7: SSL/TLS Configuration

### Step 7.1: Enable SSL/TLS

- [ ] Navigate to SSL/TLS > nguyenai.net
- [ ] Set encryption mode: `Full (strict)`
- [ ] Enable "Always Use HTTPS"
- [ ] Enable "Automatic HTTPS Rewrites"

### Step 7.2: Verify SSL Certificate

- [ ] Navigate to SSL/TLS > Edge Certificates
- [ ] Verify: Certificate status is "Active"
- [ ] Verify: Certificate covers all subdomains

---

## Part 8: Final Verification

### Step 8.1: Verify All Services

- [ ] Navigate to: `https://nguyenai.net`
- [ ] Verify: Homepage loads correctly
- [ ] Verify: All links work correctly
- [ ] Navigate to: `https://auth.nguyenai.net/v1/health`
- [ ] Verify: Returns `{"status":"ok"}`
- [ ] Navigate to: `https://api.nguyenai.net/v1/health`
- [ ] Verify: Returns `{"status":"ok"}`
- [ ] Navigate to: `https://edu.nguyenai.net`
- [ ] Verify: Homepage loads correctly
- [ ] Navigate to: `https://app.nguyenai.net`
- [ ] Verify: Login page loads correctly

### Step 8.2: Verify Auth Flow

- [ ] Navigate to: `https://nguyenai.net/login`
- [ ] Click "Sign in with Google"
- [ ] Verify: OAuth redirect works correctly
- [ ] Verify: User authenticated successfully
- [ ] Verify: Redirect to console works correctly

### Step 8.3: Verify API Endpoints

- [ ] Test: `GET https://api.nguyenai.net/v1/models`
- [ ] Verify: Returns list of models
- [ ] Test: `POST https://api.nguyenai.net/v1/chat` (with auth token)
- [ ] Verify: Chat response works correctly

### Step 8.4: Run Full Audit

- [ ] Run: `pnpm run audit:all`
- [ ] Verify: All audits pass
- [ ] Verify: Independence audit passes
- [ ] Verify: Language purity audit passes

---

## Part 9: Monitoring Setup

### Step 9.1: Enable Cloudflare Analytics

- [ ] Navigate to Analytics & Logs > Web Analytics
- [ ] Enable Web Analytics
- [ ] Verify: Analytics dashboard works

### Step 9.2: Enable Workers Analytics

- [ ] Navigate to Analytics & Logs > Workers Analytics
- [ ] Enable Workers Analytics
- [ ] Verify: Workers dashboard works

### Step 9.3: Set Up Uptime Monitoring

- [ ] Navigate to Monitoring > Uptime
- [ ] Add monitor: `https://nguyenai.net`
- [ ] Add monitor: `https://auth.nguyenai.net/v1/health`
- [ ] Add monitor: `https://api.nguyenai.net/v1/health`
- [ ] Verify: Monitors are active

---

## Part 10: Rollback Plan

### Step 10.1: Document Rollback Steps

- [ ] Save commit hash of current deployment
- [ ] Document rollback command: `git revert <commit>`
- [ ] Document redeploy command: `pnpm run deploy`

### Step 10.2: Test Rollback (Optional)

- [ ] (Optional) Test rollback to previous commit
- [ ] Verify: Rollback works correctly
- [ ] Redeploy current version

---

## Troubleshooting

### Build Failures

**Problem:** Build fails on Cloudflare Pages
- [ ] Check build logs for errors
- [ ] Verify build command is correct
- [ ] Verify Node version is correct
- [ ] Verify environment variables are set

### Worker Deployment Failures

**Problem:** Worker deployment fails
- [ ] Check wrangler.jsonc configuration
- [ ] Verify secrets are set correctly
- [ ] Verify bindings are configured
- [ ] Check Cloudflare status page

### DNS Issues

**Problem:** DNS not propagating
- [ ] Verify DNS records are correct
- [ ] Wait for DNS propagation (up to 48 hours)
- [ ] Check DNS with `dig` command
- [ ] Verify Cloudflare proxy is enabled

### SSL Issues

**Problem:** SSL certificate not issued
- [ ] Verify DNS records are correct
- [ ] Verify domain is pointed to Cloudflare
- [ ] Check SSL/TLS settings
- [ ] Wait for certificate issuance (up to 24 hours)

---

## Security Notes

- **Enable 2FA** on Cloudflare account
- **Restrict access** to deployment scripts
- **Use different accounts** for development and production
- **Rotate secrets** regularly (every 90 days recommended)
- **Enable WAF** rules for production
- **Monitor logs** for suspicious activity

---

## Next Steps

After completing this checklist, proceed to:
1. Governance Checklist (Sprint 0 lock)
2. Go-live verification (see MASTER_PROJECT_PLAN)

---

Generated with [Devin](https://devin.ai)

Co-Authored-By: Devin <158243242+devin-ai-integration[bot]@users.noreply.github.com>
