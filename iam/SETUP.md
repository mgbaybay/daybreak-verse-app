# AWS credential setup (AWS-1)

One-time setup, done by you in the AWS Console — I have no credentials in this environment to do this part myself.

## 1. Create the IAM user

1. Sign in to the AWS Console (root or an existing admin identity — whatever you already have).
2. Go to **IAM → Users → Create user**.
3. Name: `daybreak-verse-deployer` (or anything you like).
4. **Do not** select "Provide user access to the AWS Management Console" — this user only needs programmatic (CLI) access.
5. Skip the permissions step for now (or choose "Attach policies directly" and continue — we'll attach the custom policy next).

## 2. Attach the scoped policy

1. Go to **IAM → Policies → Create policy → JSON** tab.
2. Paste the contents of [`deploy-policy.json`](./deploy-policy.json) in this same folder.
3. Name it `daybreak-verse-deploy-policy`, create it.
4. Go back to the `daybreak-verse-deployer` user → **Permissions → Add permissions → Attach policies directly** → select `daybreak-verse-deploy-policy`.

## 3. Create an access key

1. On the user's page → **Security credentials** tab → **Access keys → Create access key**.
2. Use case: **Command Line Interface (CLI)** → acknowledge the recommendation notice → Create.
3. Copy the **Access key ID** and **Secret access key** — the secret is shown only once.

## 4. Configure it in this environment

Run this yourself — either in your own terminal, or by typing `!aws configure` right in this chat (the `!` prefix runs it in this session without ever putting the secret key into the conversation text):

```
aws configure
```

It will prompt for:
- **AWS Access Key ID**: (paste it)
- **AWS Secret Access Key**: (paste it)
- **Default region name**: `us-east-1`
- **Default output format**: `json`

## 5. Confirm

Once done, let me know — I'll run `aws sts get-caller-identity` to confirm the identity resolves to `daybreak-verse-deployer` (not root), and then move on to `AWS-2` (Bedrock smoke test) and `INFRA-1` (CDK bootstrap).

## Notes on the policy's scope

[`deploy-policy.json`](./deploy-policy.json) grants only what this project's CDK stack needs to create/update/delete, scoped by resource-name prefix wherever the AWS API supports it:

- **CloudFormation**: only the `DaybreakVerseStack` and `CDKToolkit` (bootstrap) stacks.
- **IAM**: only roles named `daybreak-verse-*` (the Lambda execution roles) and `cdk-hnb659fds-*` (CDK's own bootstrap roles) — cannot touch any other role, user, or policy in the account.
- **Lambda / DynamoDB / EventBridge / Logs**: only resources named `daybreak-verse-*`.
- **S3**: only buckets named `daybreak-verse-*` (the site bucket) and `cdk-hnb659fds-assets-*` (CDK's own asset-staging bucket).
- **Bedrock**: `InvokeModel` only, only on the Nova Micro model ARN (plus its cross-region inference-profile ARN, in case that routing is required — read-only `GetFoundationModel`/`ListFoundationModels` included for the smoke test).
- **CloudFront / API Gateway**: broader (`Resource: "*"`) because neither service supports fine-grained resource ARNs before the resource exists, and CDK's create/update calls for them don't take a resource-name-prefix parameter to scope against. The action list itself is still limited to what's needed (e.g. no `cloudfront:CreateInvalidation`, matching the design decision to never invalidate).

If a `cdk deploy` step hits `AccessDenied` on something not listed here, send me the exact error — I'll add the specific missing permission rather than widening the policy speculatively.
