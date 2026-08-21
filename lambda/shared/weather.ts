export interface Weather {
  tempC: number;
  condition: string;
}

const WMO_CONDITIONS: Record<number, string> = {
  0: 'clear sky',
  1: 'mostly clear',
  2: 'partly cloudy',
  3: 'overcast',
  45: 'fog',
  48: 'freezing fog',
  51: 'light drizzle',
  53: 'drizzle',
  55: 'dense drizzle',
  61: 'light rain',
  63: 'rain',
  65: 'heavy rain',
  71: 'light snow',
  73: 'snow',
  75: 'heavy snow',
  80: 'light rain showers',
  81: 'rain showers',
  82: 'violent rain showers',
  95: 'thunderstorm',
  96: 'thunderstorm with hail',
  99: 'severe thunderstorm with hail',
};

function describeWeatherCode(code: number): string {
  return WMO_CONDITIONS[code] ?? 'changeable skies';
}

const CONDITION_EMOJI: Record<string, string> = {
  'clear sky': '☀️',
  'mostly clear': '🌤️',
  'partly cloudy': '⛅',
  'overcast': '☁️',
  fog: '🌫️',
  'freezing fog': '🌫️',
  'light drizzle': '🌦️',
  drizzle: '🌦️',
  'dense drizzle': '🌧️',
  'light rain': '🌧️',
  rain: '🌧️',
  'heavy rain': '🌧️',
  'light snow': '🌨️',
  snow: '❄️',
  'heavy snow': '❄️',
  'light rain showers': '🌦️',
  'rain showers': '🌧️',
  'violent rain showers': '⛈️',
  thunderstorm: '⛈️',
  'thunderstorm with hail': '⛈️',
  'severe thunderstorm with hail': '⛈️',
  'changeable skies': '🌡️',
};

export function conditionEmoji(condition: string): string {
  return CONDITION_EMOJI[condition] ?? '🌡️';
}

const CONDITION_IMAGE_QUERY: Record<string, string> = {
  'clear sky': 'sunny blue sky',
  'mostly clear': 'sunny sky light clouds',
  'partly cloudy': 'partly cloudy sky',
  'overcast': 'overcast gray sky',
  fog: 'foggy morning',
  'freezing fog': 'frosty fog',
  'light drizzle': 'light drizzle window',
  drizzle: 'drizzle rain window',
  'dense drizzle': 'heavy drizzle street',
  'light rain': 'light rain street',
  rain: 'rain city street',
  'heavy rain': 'heavy rain storm',
  'light snow': 'light snow falling',
  snow: 'snow covered landscape',
  'heavy snow': 'heavy snowfall',
  'light rain showers': 'rain shower street',
  'rain showers': 'rain shower city',
  'violent rain showers': 'storm rain shower',
  thunderstorm: 'thunderstorm lightning sky',
  'thunderstorm with hail': 'hail thunderstorm',
  'severe thunderstorm with hail': 'severe thunderstorm',
  'changeable skies': 'changing sky clouds',
};

/** A short, evocative search term for an image API — reuses the weather
 * condition category rather than a separate mood-analysis pass over the poem. */
export function conditionImageQuery(condition: string): string {
  return CONDITION_IMAGE_QUERY[condition] ?? 'atmospheric sky';
}

/**
 * Fetches current weather for a coordinate from Open-Meteo. Returns null on any
 * failure (network error, non-200, malformed body) rather than throwing, so
 * callers fall back to date-only theming instead of failing the whole run.
 */
export async function fetchWeather(lat: number, lon: number): Promise<Weather | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) {
      return null;
    }
    const body = (await res.json()) as { current?: { temperature_2m?: unknown; weather_code?: unknown } };
    const tempC = body?.current?.temperature_2m;
    const weatherCode = body?.current?.weather_code;
    if (typeof tempC !== 'number' || typeof weatherCode !== 'number') {
      return null;
    }
    return { tempC, condition: describeWeatherCode(weatherCode) };
  } catch {
    return null;
  }
}
