# Daybreak Verse — Design Reference

Settled design decisions for the "Weekend Creative Agent Challenge" submission. First captured via grilling on 2026-08-21, then revised via a second grilling pass the same day that added city selection and an on-demand generation path. This is the reference doc for implementation — nothing here should be silently re-decided; if reality forces a change, update this file and note why.

## Core compliance decision: autonomous path vs. on-demand path

The challenge requires the creative output to be produced **autonomously, with no manual trigger**. Adding "let the user pick a city" created a real conflict with that: if picking a city is what generates the poem, the output isn't autonomous.

**Resolution**: two clearly separated paths.

1. **Autonomous path** (the thing that satisfies the challenge requirement): EventBridge cron, one fixed default city, zero human involvement, results persisted to the archive. This is the evidence judges look at.
2. **On-demand path** (bonus interactive feature, explicitly *not* evidence of autonomy): a public "try another city" widget on the site. Its output is ephemeral — returned directly in the API response, never written to the archive — and visually/copy-wise labeled as a separate demo feature, so there's no ambiguity for a judge about which output is the required autonomous evidence.

## Product decisions

| Decision | Answer | Why |
|---|---|---|
| Relation to existing app | Brand-new standalone project | No existing "creative app" found on this machine; nothing to extend |
| Project name | **Daybreak Verse** | Used consistently: repo slug `daybreak-verse`, article title, site branding |
| Creative medium | Text — a daily poem | Cheapest/most reliable to generate well within Free Tier; fastest to demo |
| Theme/hook | Poem themed to the date + real weather | Concrete, easy to prove day-over-day autonomy, matches prompt's "themes to day/weather" idea |
| Poem form | Fixed: 3 stanzas × 4 lines (12 lines total), warm/observational tone, instructed against literally restating raw weather values (e.g. "14mph winds") | Unconstrained prompts to a small model (Nova Micro) are the most common cause of inconsistent/embarrassing output in a judged submission |
| Weather data source | **Open-Meteo** (no API key required) | No signup, generous limits, no credential to manage |
| Weather location — autonomous path | Fixed default: **Binangonan, Rizal, Philippines** (hardcoded lat/lon, no runtime geocoding) | The autonomous evidence trail needs one stable default city |
| Weather location — on-demand path | Visitor picks from a curated list of ~40–50 major cities (hardcoded lat/lon each, incl. Binangonan), plain `<select>`, no geolocation | Fastest/most reliable within a 3-day deadline — no permission prompts, no IP-lookup dependency, no runtime geocoding call/failure mode |
| Schedule | Daily via **EventBridge Scheduled Rule**: `cron(0 22 * * ? *)` = 22:00 UTC = **06:00 Asia/Manila** (no DST, stable year-round) | Chosen to land at early local morning ("ready when you return"), not arbitrary 06:00 UTC |
| "Today" / date computed as | Local calendar date in **Asia/Manila** (UTC+8), not UTC | Schedule already runs after local midnight, so this is always correct with no off-by-one risk |
| On-demand generation | Separate public endpoint (API Gateway → Lambda), city selected from curated dropdown, output **ephemeral** — returned directly in the API response, never written to DynamoDB or S3 | Keeps the on-demand feature cleanly separable from the autonomous evidence trail (Q11); avoids a per-city DynamoDB schema and per-city static-page rebuild logic under deadline pressure |
| On-demand abuse/cost guardrail | API Gateway (HTTP API) usage-plan throttling (e.g. 5 req/s, burst 10) **+** app-level cap: max 1 generation per city per rolling 24h, claimed via an atomic conditional DynamoDB write *before* calling Bedrock | Bounds worst-case daily Bedrock spend to at most (curated city count) calls, regardless of request volume, including under a concurrent burst (a plain get-then-put would let concurrent requests race past the check together); also thematically sensible — "today's poem" for a city shouldn't regenerate on every click |
| On-demand UI framing | Explicitly separated section, labeled e.g. "Try it yourself (on-demand demo — not part of the autonomous archive)" | Removes any ambiguity for a judge about which output is the required autonomous evidence |
| Text generation backend | **Amazon Bedrock, Amazon Nova Micro** | Amazon-owned model — no access-request step (AWS auto-enables serverless Amazon models since Oct 2025), instant on-demand inference in us-east-1; keeps the whole stack AWS-native for judging. Confirmed low deadline risk via research. |
| Presentation | Static site: **S3 + CloudFront**, showing today's poem + scrollable archive (autonomous path only), plus the on-demand widget | Archive of past days is the strongest evidence of unattended, ongoing generation |
| Frontend tech | Plain static HTML/CSS + vanilla JS (no framework, no build step) | The on-demand widget is one `fetch()` call + one DOM update; a framework buys nothing here and adds a second build pipeline to the CDK deploy for no benefit |
| Static site rebuild strategy | **Full rebuild every autonomous run**: Lambda queries all DynamoDB records, regenerates `index.html` (today) + `archive.html` (full list) via template literals (no templating engine), overwrites both in S3 | At most ~180 records before teardown — trivially cheap to regenerate fully every time; avoids client-side fetch/merge logic or partial-render bugs |
| CloudFront cache/update strategy | Short `Cache-Control` (e.g. `max-age=300`) on `index.html`/`archive.html` at S3-write time; **no** `CreateInvalidation` calls | Avoids granting `cloudfront:CreateInvalidation` IAM permission and an extra API call/failure point; 5-minute staleness is a non-issue for a once-a-day update |
| Archive/metadata storage | DynamoDB (poem text, date, weather, city) — **autonomous path only**, single fixed city so schema stays a simple date-keyed table | Always-Free tier (25GB), simple key-value fit; on-demand path writes nothing here (ephemeral) |
| Failure handling — Bedrock call fails | Rely on Lambda's default async-retry (EventBridge→Lambda invokes async, retries twice with delay); if still failing, skip that day — no placeholder poem, no alert | A placeholder in a "creative agent" demo reads worse than an honest gap; notifications were already ruled out |
| Failure handling — Open-Meteo call fails | Fall back to date-only theming (no weather) for that day's poem | Smaller, more recoverable failure — shouldn't block poem generation entirely |
| Notifications | None (no email/SNS) | Website + archive alone is sufficient evidence; keeps scope tight for the deadline |
| Accompanying image (autonomous path only) | **Pixabay** photo search, queried by the day's weather condition category (not a separate mood-analysis pass); image bytes downloaded once and stored in the site's own S3 bucket under `images/{date}.*`, never hotlinked | Free tier is more than sufficient at once-a-day volume; storing the bytes ourselves keeps the archive permanently browsable instead of depending on a third-party URL staying valid |
| Credential storage (API keys etc.) | Reintroduced for the Pixabay key only: an SSM `String` parameter (`/daybreak-verse/pixabay-api-key`), injected into Lambda A's environment via a CloudFormation dynamic parameter (`AWS::SSM::Parameter::Value<String>`) resolved at deploy time. Everything else still needs no secret — Open-Meteo needs no key, Bedrock/DynamoDB/S3 access is via IAM role | The original "no secret to store" finding held until this feature needed one. Using CloudFormation's SSM parameter type (rather than `valueFromLookup`) keeps the plaintext key out of the repo and out of `cdk.context.json` at synth time. It does **not** hide the key from the deploy user themselves — `lambda:GetFunctionConfiguration` and `cloudformation:DescribeStacks` (both already granted, for unrelated reasons) can both read it back in plaintext. That's an accepted gap for a free-tier, easily-revocable key owned by the same person who holds the deploy credentials; it would matter for a higher-value secret |
| IAM scoping — autonomous Lambda | `bedrock:InvokeModel` scoped to the Nova Micro model ARN only (not `bedrock:*`); DynamoDB/S3 actions scoped to the specific table/bucket ARNs; no CloudFront permissions | Least privilege; a bug can't invoke an expensive model or touch unrelated resources |
| IAM scoping — on-demand Lambda | `bedrock:InvokeModel` scoped to the Nova Micro model ARN only; DynamoDB access scoped only to the small per-city rate-limit table (not the archive table); **no S3 permissions at all** | Ephemeral output means this function never needs to touch the site bucket |
| Budget stance | Always-Free services for the core (Lambda, EventBridge, S3, DynamoDB, API Gateway); accept small pay-per-use cost for Bedrock model calls; no formal AWS Budgets alert | Per-poem cost is fractions of a cent, guardrails above already bound worst case, and the account is torn down within months — a formal budget alarm isn't worth the setup time under deadline pressure |
| IaC tool | **AWS CDK (TypeScript)**, single stack | Reproducible, easy `cdk destroy` for cleanup (project will be torn down within 2–6 months) |
| AWS account | Newly created; no credentials configured in this dev environment yet | User will run `aws configure` / create a scoped IAM user themselves using commands provided during build — no long-lived keys pasted into chat |
| AWS region | `us-east-1` | Broadest service/Free-Tier availability, incl. Bedrock model access |
| Repo location | `~/daybreak-verse` (this directory), new public GitHub repo under the user's personal account | Separate from `xibo-cms-v5`; unrelated project |

## Architecture overview (for the article's AWS Services section)

```
AUTONOMOUS PATH (the required evidence)

EventBridge (cron(0 22 * * ? *) = 06:00 Asia/Manila daily)
        │
        ▼
   Lambda A — generator (default city: Binangonan, Rizal)
        │  1. fetch weather — Open-Meteo (hardcoded lat/lon)
        │     on failure → fall back to date-only theming
        │  2. build prompt (Asia/Manila local date + weather; fixed
        │     form: 3 stanzas × 4 lines, warm tone, no literal weather stats)
        │  3. call Bedrock — Amazon Nova Micro → poem text
        │     on failure after retries → skip this day, no placeholder
        │  4. look up + download a Pixabay photo matching the weather
        │     condition → store it in S3 (on failure → no image, not a
        │     blocker for the poem itself)
        │  5. write record — DynamoDB (date, weather, poem, city, image)
        │  6. full rebuild — index.html + archive.html → S3
        │     (short Cache-Control, no CloudFront invalidation)
        ▼
      S3 (static site bucket)
        │
        ▼
   CloudFront (HTTPS distribution, default domain)
        │
        ▼
     Public live URL  ←──  visited any time, no manual trigger involved


ON-DEMAND PATH (secondary feature, explicitly labeled, not evidence)

Visitor picks a city from curated dropdown (~40-50 cities, hardcoded lat/lon)
        │
        ▼
API Gateway (HTTP API, usage-plan throttled ~5 req/s / burst 10)
        │
        ▼
   Lambda B — on-demand handler (shares weather/prompt/Bedrock code with Lambda A)
        │  - atomically claim the city's 24h slot (conditional DynamoDB write)
        │    on failure to claim → skip straight to a 429, no Bedrock call
        │  - fetch weather (or date-only fallback) → build prompt → call Bedrock
        │  - returns poem text directly in the API response
        │  - writes nothing to DynamoDB or S3 (ephemeral)
        ▼
   Displayed in the "Try it yourself" widget on the static site
```

AWS services used: **Lambda (×2), EventBridge, API Gateway, Bedrock (Nova Micro), DynamoDB, S3, CloudFront, SSM Parameter Store, IAM**.
