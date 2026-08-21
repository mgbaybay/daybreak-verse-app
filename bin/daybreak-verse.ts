#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { DaybreakVerseStack } from '../lib/daybreak-verse-stack';

const app = new cdk.App();
new DaybreakVerseStack(app, 'DaybreakVerseStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' },
});
