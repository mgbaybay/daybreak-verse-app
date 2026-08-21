# Daybreak Verse

An always-on creative agent built for AWS's "Weekend Creative Agent Challenge." Every morning, with zero human involvement, it writes a short poem themed to the date and the day's real weather — that's the required autonomous evidence. A secondary, clearly-labeled on-demand feature lets a visitor request a one-off poem for another city, just for fun.

**Live site**: https://d12kenezsixi83.cloudfront.net _(content appears after the first successful autonomous run — see Status)_

Full design rationale: [`DESIGN.md`](./DESIGN.md).

## Status

Infrastructure is deployed and both Lambdas are wired up end-to-end. The account is a brand-new AWS account, and Amazon Bedrock applies a temporary anti-abuse throttle to on-demand model calls from new accounts — so the very first poem generation is waiting on that to clear. Everything downstream (DynamoDB write, full static rebuild, S3 upload, CloudFront serving) is built and ready to run the moment a Bedrock call succeeds.

## How it works

### Autonomous path (the required evidence)

```
EventBridge (cron, 06:00 Asia/Manila daily)
        │
        ▼
Lambda A — generator (fixed default city: Binangonan, Rizal, PH)
        │  1. fetch weather — Open-Meteo
        │  2. build a prompt (date + weather, fixed 3×4-line form)
        │  3. call Amazon Bedrock (Nova Micro) → poem text
        │  4. fetch a Pixabay photo matching the weather, store it in S3
        │  5. write the record to DynamoDB
        │  6. fully rebuild index.html + archive.html → S3
        ▼
S3 (static site) → CloudFront (HTTPS) → public live URL
```

No manual trigger is involved anywhere in this path — the schedule fires, the Lambda runs, the site updates.

### On-demand path (bonus feature — not autonomy evidence)

A visitor picks a city from a dropdown on the site. That calls a separate API Gateway → Lambda, which runs the same weather/prompt/Bedrock pipeline for that city and returns the poem directly in the response. Nothing here is written to DynamoDB or S3 — it's ephemeral, and the widget is explicitly labeled as a separate demo feature so it's never mistaken for the autonomous evidence. It's also guarded against abuse: API Gateway throttles requests, and a small DynamoDB table enforces at most one generation per city per rolling 24 hours.

## AWS services used

Lambda (×2), EventBridge, API Gateway, Amazon Bedrock (Nova Micro), DynamoDB (×2), S3, CloudFront, SSM Parameter Store, IAM — all defined as code with AWS CDK (TypeScript), single stack (`DaybreakVerseStack`), deployed to `us-east-1`.

## Repo structure

```
bin/, lib/        CDK app entry point and stack definition
lambda/shared/    Weather fetch, prompt builder, Bedrock call, HTML templates, city dataset
lambda/generator/ Lambda A — the autonomous handler
lambda/ondemand/  Lambda B — the on-demand handler
iam/              Least-privilege IAM policy + setup notes for the human deployer identity
DESIGN.md         Full design rationale and decisions
```

## Running it yourself

```bash
npm install
npx cdk bootstrap aws://<account-id>/us-east-1
npx cdk deploy
```

Requires an IAM identity with the permissions in [`iam/deploy-policy.json`](./iam/deploy-policy.json) (see [`iam/SETUP.md`](./iam/SETUP.md)) configured via `aws configure`, plus a free [Pixabay](https://pixabay.com/api/docs/) API key stored in SSM before the first deploy:

```bash
aws ssm put-parameter --name /daybreak-verse/pixabay-api-key --type String --value "<your key>" --region us-east-1
```
