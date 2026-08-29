# PTCOS

```
██████╗ ████████╗ ██████╗ ██████╗  ██████╗
██╔══██╗╚══██╔══╝██╔════╝██╔═══██╗██╔════╝
██████╔╝   ██║   ██║     ██║   ██║███████╗
██╔═══╝    ██║   ██║     ██║   ██║╚════██║
██║        ██║   ╚██████╗╚██████╔╝██████╔╝
╚═╝   ╚═╝ ╚═════╝ ╚═════╝ ╚═════╝
```

---

## ◆ PULSE

A quality improvement plan lives or dies in the follow-up. PTCOS tracks
the Pharmacy and Therapeutics Committee's 12 critical actions across 3
improvement proposals - status, progress, owners, fiscal-year
timeline - in a clinical dark interface built for the committee room
and the morning huddle. Every update lands in every open dashboard
within a second, blocked and delayed tasks rise to the top on their
own, and the Gantt chart keeps the fiscal year honest. No servers to
run: Postgres, RLS, and Realtime on the Supabase free tier.

| 12 actions ▣ | Live sync ▣ | Gantt ▣ | Alerting ▣ |
|---|---|---|---|

*The committee loop - track, sync, highlight, report - is sealed.*

> Built with Vue 3 + TypeScript + Pinia, styled by Tailwind 4, backed
> by Supabase Postgres with RLS - anon key in the browser, `service_role`
> nowhere.
>
> **suradet-ps**, artifact keeper

---

## ◆ IGNITION

One runtime, one database, four commands.

```
⟫ git clone https://github.com/suradet-ps/ptcos.git
⟫ cd ptcos
⟫ bun install
⟫ cp .env.example .env
⟫ bun run dev
```

<details>
<summary>Supabase setup</summary>

1. Create a project at [supabase.com](https://supabase.com/) (region:
   Singapore or closest).
2. SQL Editor: run `supabase/schema.sql` - all `ptc_*` tables, the
   `ptc_v_actions_full` view, triggers, and 44 seed rows.
3. SQL Editor: run `supabase/rls.sql` - Row Level Security and the
   access policies.
4. Copy the Project URL and anon key into `.env`:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

</details>

Deploy on Vercel (Framework Preset: Vite) with the same two
environment variables. Gates: `bun run check` (Biome) and
`bun run type-check`.

---

## ◆ ANATOMY

One dashboard, one truth, a sync that never sleeps.

- **Tracks** - 12 actions under 3 recommendations, each with its
  timeline, KPIs, owners, and HA reference; progress rows carry the
  runtime status (`ptc_action_progress`) while the master data stays
  clean (`ptc_actions`).
- **Syncs** - every dashboard subscribes to `postgres_changes` on
  progress; one pharmacist's update is every screen's update within a
  second - the committee sees the same board, at the same time.
- **Updates** - optimistic UI answers instantly and rolls back if the
  remote write fails - the interface never waits to be told the truth.
- **Alerts** - blocked and delayed tasks are filtered and highlighted
  for the manager's glance; the status catalog drives the colors from
  one configuration.
- **Visualizes** - an automated Gantt chart across fiscal months and
  sparklines over progress histories - the trajectory is drawn, not
  imagined.
- **Gates** - every row answers to RLS; the `anon` key is safe by
  design, the `service_role` key is never shipped.

---

## ◆ RITUALS

**The core ceremony** - the morning huddle:

1. Open the dashboard. The summary answers first: what moved, what
   blocked, what delayed.
2. Update an action. The status flips instantly; every other open
   dashboard sees it within a second.
3. Read the Gantt: the fiscal year's plan against its progress, month
   by month.
4. Escalate by glance - blocked and delayed tasks already sit at the
   top, highlighted for the room.

**The ceremony of the live board** - the committee room and the ward
screen show the same rows at the same moment. A meeting that argues
about status is a meeting that did not open PTCOS.

**The ceremony of the rollback** - an optimistic update that fails
reverts with the truth intact. The interface may be optimistic; the
database is the referee.

---

## ◆ ECHOES

**Where this artifact is heading**

```
track    ▸ 12 actions, 3 proposals, owners and KPIs ────────────────── ▸ sealed
sync     ▸ postgres_changes live updates ───────────────────────────── ▸ sealed
alert    ▸ blocked/delayed highlighting ────────────────────────────── ▸ sealed
plan     ▸ fiscal-year Gantt, sparklines ────────────────────────────── ▸ sealed
govern   ▸ RLS-gated access, service_role never shipped ────────────── ▸ sealed
```

**Raising the artifact** - the full schema and access model live in
`supabase/README.md`; the design language in `DESIGN.md`; contribution
rules in `CONTRIBUTING.md`; the security posture in `SECURITY.md`.
Open an issue first to discuss a change.

**Status** - CI gates every push with Biome and type-checking.
[Watch the gates](.github/workflows).

> Originally developed for internal process management at the Sa Bot
> Hospital Pharmacy Department. The authors accept no liability for
> data loss, breaches, or operational failures resulting from misuse.

---

```
  ─────────────────────────────────────────
   A committee meeting that argues
   about status has already lost it.
  ─────────────────────────────────────────
```

Source code under the [MIT License](LICENSE).