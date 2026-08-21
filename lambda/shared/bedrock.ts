import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const MODEL_ID = 'amazon.nova-micro-v1:0';

const client = new BedrockRuntimeClient({ region: 'us-east-1' });

/**
 * Calls Nova Micro with the built prompt and returns the poem text.
 * Throws on failure — callers decide what "failure" means for them
 * (Lambda A skips the day, Lambda B returns a clean error response).
 */
export async function generatePoem(prompt: string): Promise<string> {
  const payload = {
    messages: [{ role: 'user', content: [{ text: prompt }] }],
    inferenceConfig: { maxTokens: 400, temperature: 0.8 },
  };

  const response = await client.send(
    new InvokeModelCommand({
      modelId: MODEL_ID,
      body: JSON.stringify(payload),
      contentType: 'application/json',
      accept: 'application/json',
    }),
  );

  const body = JSON.parse(new TextDecoder().decode(response.body));
  const text = body?.output?.message?.content?.[0]?.text;
  if (typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('Bedrock response did not contain poem text');
  }
  return text.trim();
}
