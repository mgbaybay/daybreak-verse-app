import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { findCityById } from '../shared/cities';
import { fetchWeather } from '../shared/weather';
import { buildPrompt } from '../shared/prompt';
import { generatePoem } from '../shared/bedrock';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const RATE_LIMIT_TABLE_NAME = process.env.RATE_LIMIT_TABLE_NAME!;
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;

interface HttpApiEvent {
  queryStringParameters?: Record<string, string> | null;
}

interface HttpApiResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

function jsonResponse(statusCode: number, body: unknown): HttpApiResponse {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

export async function handler(event: HttpApiEvent): Promise<HttpApiResponse> {
  const cityId = event.queryStringParameters?.city;
  if (!cityId) {
    return jsonResponse(400, { error: 'Missing required "city" query parameter.' });
  }

  const city = findCityById(cityId);
  if (!city) {
    return jsonResponse(400, { error: 'Unknown city id.' });
  }

  const now = Date.now();
  const existing = await ddb.send(new GetCommand({ TableName: RATE_LIMIT_TABLE_NAME, Key: { cityId } }));
  const lastGeneratedAt = existing.Item?.lastGeneratedAt as number | undefined;
  if (typeof lastGeneratedAt === 'number' && now - lastGeneratedAt < RATE_LIMIT_WINDOW_MS) {
    return jsonResponse(429, { error: `${city.label} already got a poem in the last 24 hours. Try another city, or check back later.` });
  }

  let poem: string;
  try {
    const weather = await fetchWeather(city.lat, city.lon);
    const prompt = buildPrompt(city.label, city.timezone, new Date(now), weather);
    poem = await generatePoem(prompt);
  } catch {
    return jsonResponse(502, { error: 'The poem generator is unavailable right now. Please try again shortly.' });
  }

  await ddb.send(new PutCommand({ TableName: RATE_LIMIT_TABLE_NAME, Item: { cityId, lastGeneratedAt: now } }));

  return jsonResponse(200, { city: city.label, poem });
}
