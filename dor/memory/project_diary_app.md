---
name: project-diary-app
description: Migraine/headache tracking PWA for Willian Soares — Supabase backend, Bootstrap 5.3 dark, jsPDF reports
metadata:
  type: project
---

Personal PWA app for migraine/headache tracking hosted at williansoares.net.br/diario.

**Stack:** Bootstrap 5.3, Supabase (project wedtehhfjvykwyrxgtmj), jsPDF, Chart.js, Service Worker cache-first
**Auth:** Username-based (NOT Supabase auth.uid()), stored in localStorage key `diario_enxaqueca_user_session_v1`
**Files:** index.html, js/app.js, js/medical-tracking.js, css/style.css, sw.js

**Why:** Personal medical tracking tool for neurologist appointments (Dra. Karin Corrêa).

**Current state (v2 - post Oct 2026 session):**
- SW cache version: v5
- Multiple medications per crisis (JSON array in `medication` TEXT column, backward compat)
- Multiple medications per prescription (one DB row per medication, grouped by doctor_id + prescription_date as natural key)
- Elastic date range filter on dashboard + PDF (preset buttons 30d/60d/90d/6m/1ano + manual date inputs)
- Brain+circuit SVG logo on login screen
- Cache clear on every login (clears SW caches, reloads)
- Badge visibility fixed with inline `color:#ffffff !important` styles

**v2 improvements implemented:**
1. Medication × efficacy correlation chart in dashboard (progress bars, color-coded)
2. Sleep hours (2-12h range) + stress level (0-5 scale) fields in wizard Step 1 — needs SQL migration:
   `ALTER TABLE crises ADD COLUMN IF NOT EXISTS sleep_hours NUMERIC(4,1);`
   `ALTER TABLE crises ADD COLUMN IF NOT EXISTS stress_level SMALLINT;`
   Migration file: sql_migration_v2.sql
3. Next appointment banner at top of app (reads appointments table, shows days until next scheduled)
4. Period comparison on KPIs (current vs previous same-length period, ↑↓ deltas)
5. History tab filter controls (min intensity slider, medication filter, trigger dropdown)
6. PDF report now includes section "3. Medicamentos Atuais" with active prescriptions
7. Prescription expiry tags on medication rows (red if expired, amber if ≤15 days)
8. Smart trigger suggestions in wizard Step 3 (top 4 most-used triggers shown as quick-click buttons)

**Key globals in app.js:** `lastLoadedCrises` (date-filtered crises, used by history filter)

**How to apply:** When working on this project, read all 4 main files. The `#crisis-cards-container` is in the history tab (not dashboard). Dashboard KPIs/charts are calculated from date-filtered crises; history cards are rendered from the same set and can be further filtered by history controls.
