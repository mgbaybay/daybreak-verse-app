import { Weather } from './weather';

/** Formats "today" as a local calendar date string in the given IANA timezone. */
export function localDateString(timezone: string, now: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

function localDateLabel(timezone: string, now: Date): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(now);
}

export function buildPrompt(cityLabel: string, timezone: string, now: Date, weather: Weather | null): string {
  const dateLabel = localDateLabel(timezone, now);

  const weatherLine = weather
    ? `The current weather there is roughly ${Math.round(weather.tempC)}°C with ${weather.condition}.`
    : `Weather data isn't available right now, so theme the poem on the date and season alone.`;

  return [
    `Write a short original poem for a reader in ${cityLabel} on ${dateLabel}.`,
    weatherLine,
    '',
    'Requirements:',
    '- Exactly 3 stanzas, each with exactly 4 lines (12 lines total).',
    '- Warm, observational tone — like noticing the day, not reporting on it.',
    '- Do NOT restate the weather as literal numbers or stats (e.g. never write things like "14mph winds" or "22°C"). Evoke the feeling of the weather instead.',
    '- No title, no preamble, no explanation — output only the 12 lines of the poem.',
  ].join('\n');
}
