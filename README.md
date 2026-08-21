# Daybreak Verse

An always-on creative agent for the AWS "Weekend Creative Agent Challenge." Every morning it writes a short poem themed to the date and the day's weather, with zero human involvement — the required autonomous evidence trail. A secondary, clearly-labeled on-demand feature lets a visitor request a one-off poem for another city.

Full design rationale: [`DESIGN.md`](./DESIGN.md). Build backlog: [`TASKS.md`](./TASKS.md).

## Status

Work in progress — infrastructure and agent code are written; first deploy is in progress. This section will be replaced with setup instructions, architecture, a screenshot, and the live URL once the site is up.

## Architecture (summary)

- **Autonomous path** (the required evidence): EventBridge cron → Lambda (Node.js/TypeScript) → Open-Meteo weather → Amazon Bedrock (Nova Micro) → DynamoDB archive → full static rebuild → S3 → CloudFront.
- **On-demand path** (bonus, not autonomy evidence): visitor picks a city → API Gateway → Lambda → same generation logic → ephemeral response only, never persisted.
- Infrastructure defined as code with AWS CDK (TypeScript), single stack (`DaybreakVerseStack`), `us-east-1`.

See [`DESIGN.md`](./DESIGN.md) for the full set of decisions and why they were made.
