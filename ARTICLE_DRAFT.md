<!--
  Publishing notes (delete this comment before pasting into dev.to):
  - Set the article TITLE field to exactly: Weekend Creative Agent Challenge: Daybreak Verse
  - Add the tag: agents
  - Everything below the "---" is the article body.
  - Before publishing, fill in the two [TODO] spots (screenshot + demo video embed)
    once the site is confirmed live and the video is recorded.
-->

---

# Weekend Creative Agent Challenge: Daybreak Verse

## Vision & What It Does

**Daybreak Verse** is a small, always-on creative agent that writes a short poem every morning — themed to the date and that day's real weather — with no human involved in producing it. That's the core idea behind this build: an agent that actually runs on its own schedule, not one that only produces something when a person clicks a button.

Every day at 06:00 (Asia/Manila time), the agent wakes up, checks the weather for a fixed default location, writes a 12-line poem about that day, and publishes it to a public site. Past days accumulate into a scrollable archive, so the evidence of unattended, ongoing generation isn't just "trust me" — it's a growing list of dated entries a judge (or anyone) can scroll through.

Because "let people pick their own city" is a genuinely fun feature, the site also has a secondary **on-demand** widget: pick a city from a dropdown, get a one-off poem for it right now. But that output is explicitly *not* part of the autonomous evidence — it's never saved anywhere, and it's labeled on the page as a separate demo feature. Keeping those two things visually and architecturally separate was one of the first real decisions in this build, and it shaped almost everything downstream.

## How You Built It

The whole thing is a single AWS CDK (TypeScript) stack, deployed to `us-east-1`, with two Lambda functions sharing the same core logic:

- **Weather** comes from Open-Meteo (no API key, no signup) — if that call fails, the poem falls back to date-only theming instead of blocking generation.
- **The prompt** enforces a fixed form: exactly 3 stanzas of 4 lines each, warm and observational in tone, and explicitly instructed *not* to restate weather as literal numbers (no "14mph winds" in a poem, please). Small models like Nova Micro do best with tightly constrained prompts, and this was the single biggest lever for consistent output quality.
- **Amazon Bedrock's Nova Micro** generates the actual text. It's an Amazon-owned model, so there's no manual "request model access" approval step to wait on — a meaningful advantage under a hard deadline.
- **Lambda A** (the autonomous path) writes the day's result to DynamoDB, then does a *full rebuild* of both `index.html` and `archive.html` — querying every archived record and regenerating the whole static site via template literals, no client-side fetching or partial updates. At the small scale this runs at, that's simpler and more robust than trying to patch pages incrementally.
- **Lambda B** (the on-demand path) shares the weather/prompt/Bedrock code but has a narrower IAM role — it can't touch S3 at all, only a small rate-limit table that caps generation to once per city per rolling 24 hours. API Gateway throttling sits in front of it as a second layer of abuse protection.
- The static site itself is deliberately plain HTML/CSS and vanilla JS — no framework, no build step. The on-demand widget is one `fetch()` call and one DOM update.

Everything is provisioned through CDK — DynamoDB tables, the S3 bucket, a CloudFront distribution in front of it (with Origin Access Control, no public bucket access), both Lambdas with least-privilege IAM roles, an EventBridge scheduled rule, and the API Gateway HTTP API — so the entire environment is reproducible and easy to tear down later with `cdk destroy`.

## AWS Services Used / Architecture Overview

**Lambda (×2)**, **EventBridge** (scheduled rule), **API Gateway** (HTTP API, throttled), **Amazon Bedrock** (Nova Micro), **DynamoDB** (×2 tables — archive + rate limit), **S3** (static site), **CloudFront** (HTTPS distribution), **IAM** (two separate least-privilege execution roles, one per Lambda).

```
EventBridge (cron) → Lambda A → Open-Meteo → Bedrock → DynamoDB → full rebuild → S3 → CloudFront → public URL
Visitor picks city → API Gateway → Lambda B → (same weather/prompt/Bedrock) → ephemeral JSON response
```

The two paths share generation logic but never share output storage — Lambda B's IAM role has no S3 permissions at all, by design, so there's no code path where an on-demand request could accidentally land in the autonomous archive.

## What You Learned

The most unexpected lesson had nothing to do with poems or prompts: a **brand-new AWS account gets throttled on Bedrock on-demand model calls almost immediately**, independent of the published Service Quotas value. After the smoke test and the very first real invocation, Bedrock started returning `ThrottlingException: Too many tokens per day` — despite the account's listed quota sitting at millions of tokens. That's an anti-abuse mechanism for unverified/new accounts, not a real capacity limit, and it isn't something you can request an increase for through Service Quotas — it just has to clear on its own as the account establishes history.

That turned into a useful design validation: because the failure path (Bedrock throws → Lambda A skips the day silently, Lambda B returns a clean JSON error instead of a placeholder poem) was already built in from the start, hitting this in production was a non-event architecturally. It confirmed the "no placeholder poem" decision was the right call — a broken-looking fallback would have looked far worse in a judged submission than an honest gap.

The other reinforced lesson: separating the autonomous and on-demand paths at the IAM level (not just in the UI copy) made the whole system easier to reason about under time pressure. When something goes wrong, "which role could have caused this" has exactly one answer per resource.

## Link to App or Repo

- **Live site**: https://d12kenezsixi83.cloudfront.net
- **Source**: https://github.com/mgbaybay/daybreak-verse-app

[TODO: screenshot of the live site once content is up]

[TODO: embed the demo video once recorded]
