import { conditionImageQuery } from './weather';

export interface WeatherImage {
  bytes: Uint8Array;
  contentType: string;
}

/**
 * Looks up a photo matching the day's weather condition via Pixabay and
 * downloads it. Returns null on any failure (missing API key, no results,
 * network error) so callers can render the poem without an image instead of
 * failing the run — same fallback pattern as the weather fetch itself.
 */
export async function fetchWeatherImage(condition: string): Promise<WeatherImage | null> {
  const apiKey = process.env.PIXABAY_API_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    const query = conditionImageQuery(condition);
    const searchUrl = `https://pixabay.com/api/?key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(query)}&image_type=photo&safesearch=true&per_page=3&orientation=horizontal`;
    const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(5000) });
    if (!searchRes.ok) {
      return null;
    }

    const body = (await searchRes.json()) as { hits?: Array<{ webformatURL?: unknown }> };
    const imageUrl = body?.hits?.[0]?.webformatURL;
    if (typeof imageUrl !== 'string') {
      return null;
    }

    const imageRes = await fetch(imageUrl, { signal: AbortSignal.timeout(8000) });
    if (!imageRes.ok) {
      return null;
    }

    const contentType = imageRes.headers.get('content-type') ?? 'image/jpeg';
    const bytes = new Uint8Array(await imageRes.arrayBuffer());
    return { bytes, contentType };
  } catch {
    return null;
  }
}

export function extensionForContentType(contentType: string): string {
  if (contentType.includes('png')) {
    return 'png';
  }
  if (contentType.includes('webp')) {
    return 'webp';
  }
  return 'jpg';
}
