import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { DEFAULT_CITY, CITIES } from '../shared/cities';
import { fetchWeather, Weather } from '../shared/weather';
import { buildPrompt, localDateString } from '../shared/prompt';
import { generatePoem } from '../shared/bedrock';
import { renderIndexPage, renderArchivePage, ArchiveRecord } from '../shared/templates';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3 = new S3Client({});

const ARCHIVE_TABLE_NAME = process.env.ARCHIVE_TABLE_NAME!;
const SITE_BUCKET_NAME = process.env.SITE_BUCKET_NAME!;
const ONDEMAND_API_URL = process.env.ONDEMAND_API_URL!;

interface StoredRecord {
  date: string;
  cityLabel: string;
  weather: Weather | null;
  poem: string;
}

function toArchiveRecord(item: StoredRecord): ArchiveRecord {
  return { date: item.date, cityLabel: item.cityLabel, weather: item.weather, poem: item.poem };
}

async function loadAllRecords(): Promise<ArchiveRecord[]> {
  const records: ArchiveRecord[] = [];
  let ExclusiveStartKey: Record<string, unknown> | undefined;
  do {
    const res = await ddb.send(new ScanCommand({ TableName: ARCHIVE_TABLE_NAME, ExclusiveStartKey }));
    for (const item of res.Items ?? []) {
      records.push(toArchiveRecord(item as StoredRecord));
    }
    ExclusiveStartKey = res.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return records;
}

async function putHtml(key: string, html: string): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: SITE_BUCKET_NAME,
      Key: key,
      Body: html,
      ContentType: 'text/html; charset=utf-8',
      CacheControl: 'max-age=300',
    }),
  );
}

export async function handler(): Promise<void> {
  const now = new Date();
  const date = localDateString(DEFAULT_CITY.timezone, now);

  const weather = await fetchWeather(DEFAULT_CITY.lat, DEFAULT_CITY.lon);
  const prompt = buildPrompt(DEFAULT_CITY.label, DEFAULT_CITY.timezone, now, weather);

  // Let a Bedrock failure throw and propagate — EventBridge's async Lambda
  // invocation retries twice, and after that this day is silently skipped.
  const poem = await generatePoem(prompt);

  const record: StoredRecord = { date, cityLabel: DEFAULT_CITY.label, weather, poem };
  await ddb.send(new PutCommand({ TableName: ARCHIVE_TABLE_NAME, Item: record }));

  const allRecords = await loadAllRecords();
  const latest = allRecords.find((r) => r.date === date) ?? toArchiveRecord(record);

  const indexHtml = renderIndexPage(latest, ONDEMAND_API_URL, CITIES);
  const archiveHtml = renderArchivePage(allRecords);

  await putHtml('index.html', indexHtml);
  await putHtml('archive.html', archiveHtml);
}
