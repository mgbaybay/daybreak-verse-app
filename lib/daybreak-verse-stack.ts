import * as path from 'path';
import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as iam from 'aws-cdk-lib/aws-iam';

const NOVA_MICRO_MODEL_ARN = 'arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-micro-v1:0';

export class DaybreakVerseStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // --- INFRA-2: DynamoDB archive table (autonomous path) ---
    const archiveTable = new dynamodb.TableV2(this, 'ArchiveTable', {
      tableName: 'daybreak-verse-archive',
      partitionKey: { name: 'date', type: dynamodb.AttributeType.STRING },
      billing: dynamodb.Billing.onDemand(),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // --- INFRA-8: DynamoDB rate-limit table (on-demand path) ---
    const rateLimitTable = new dynamodb.TableV2(this, 'RateLimitTable', {
      tableName: 'daybreak-verse-ratelimit',
      partitionKey: { name: 'cityId', type: dynamodb.AttributeType.STRING },
      billing: dynamodb.Billing.onDemand(),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // --- INFRA-3: S3 static site bucket ---
    const siteBucket = new s3.Bucket(this, 'SiteBucket', {
      bucketName: `daybreak-verse-site-${this.account}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // --- INFRA-4: CloudFront distribution (OAC, default domain, no invalidation) ---
    const distribution = new cloudfront.Distribution(this, 'SiteDistribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(siteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
    });

    // --- OD-1: Lambda B (on-demand handler) + narrowly-scoped role ---
    const onDemandFn = new NodejsFunction(this, 'OnDemandFunction', {
      functionName: 'daybreak-verse-ondemand',
      entry: path.join(__dirname, '..', 'lambda', 'ondemand', 'index.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      bundling: { externalModules: [] },
      environment: {
        RATE_LIMIT_TABLE_NAME: rateLimitTable.tableName,
      },
    });
    onDemandFn.addToRolePolicy(
      new iam.PolicyStatement({ actions: ['bedrock:InvokeModel'], resources: [NOVA_MICRO_MODEL_ARN] }),
    );
    rateLimitTable.grant(onDemandFn, 'dynamodb:PutItem');

    // --- INFRA-9: API Gateway (HTTP API) fronting Lambda B, throttled ---
    const httpApi = new apigwv2.HttpApi(this, 'OnDemandApi', {
      apiName: 'daybreak-verse-ondemand-api',
      createDefaultStage: false,
    });
    httpApi.addRoutes({
      path: '/poem',
      methods: [apigwv2.HttpMethod.GET],
      integration: new HttpLambdaIntegration('OnDemandIntegration', onDemandFn),
    });
    const apiStage = new apigwv2.HttpStage(this, 'OnDemandApiStage', {
      httpApi,
      stageName: '$default',
      autoDeploy: true,
      throttle: { rateLimit: 5, burstLimit: 10 },
    });
    const onDemandApiUrl = `${httpApi.apiEndpoint}/poem`;

    // --- INFRA-5: Lambda A (autonomous generator) + least-privilege role ---
    const generatorFn = new NodejsFunction(this, 'GeneratorFunction', {
      functionName: 'daybreak-verse-generator',
      entry: path.join(__dirname, '..', 'lambda', 'generator', 'index.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: cdk.Duration.seconds(60),
      memorySize: 256,
      bundling: { externalModules: [] },
      environment: {
        ARCHIVE_TABLE_NAME: archiveTable.tableName,
        SITE_BUCKET_NAME: siteBucket.bucketName,
        ONDEMAND_API_URL: onDemandApiUrl,
      },
    });
    generatorFn.addToRolePolicy(
      new iam.PolicyStatement({ actions: ['bedrock:InvokeModel'], resources: [NOVA_MICRO_MODEL_ARN] }),
    );
    archiveTable.grant(generatorFn, 'dynamodb:PutItem', 'dynamodb:Scan');
    siteBucket.grantPut(generatorFn);

    // --- INFRA-6: EventBridge scheduled rule (06:00 Asia/Manila daily) ---
    new events.Rule(this, 'DailyScheduleRule', {
      ruleName: 'daybreak-verse-daily-schedule',
      schedule: events.Schedule.expression('cron(0 22 * * ? *)'),
      targets: [new targets.LambdaFunction(generatorFn)],
    });

    new cdk.CfnOutput(this, 'SiteUrl', { value: `https://${distribution.distributionDomainName}` });
    new cdk.CfnOutput(this, 'OnDemandApiUrl', { value: onDemandApiUrl });
    new cdk.CfnOutput(this, 'GeneratorFunctionName', { value: generatorFn.functionName });
  }
}
