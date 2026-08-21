import { City } from './cities';
import { Weather, conditionEmoji } from './weather';

export interface ArchiveRecord {
  date: string; // YYYY-MM-DD, Asia/Manila local date
  cityLabel: string;
  weather: Weather | null;
  poem: string;
  imageKey?: string | null;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function poemToHtml(poem: string): string {
  return poem
    .split('\n')
    .map((line) => (line.trim().length === 0 ? '<br>' : `<p>${escapeHtml(line)}</p>`))
    .join('\n');
}

function entryImage(record: ArchiveRecord): string {
  if (!record.imageKey) {
    return '';
  }
  return `<img class="entry-image" src="/${record.imageKey}" alt="A photo evoking the ${escapeHtml(record.weather?.condition ?? 'day’s')} weather in ${escapeHtml(record.cityLabel)}" loading="lazy">`;
}

function weatherLabel(weather: Weather | null): string {
  if (!weather) {
    return '<span class="weather-badge">weather unavailable today</span>';
  }
  const emoji = conditionEmoji(weather.condition);
  return `<span class="weather-badge">${emoji} ${Math.round(weather.tempC)}&deg;C &middot; ${escapeHtml(weather.condition)}</span>`;
}

const SHARED_STYLES = `
  :root { color-scheme: light dark; }
  body {
    font-family: Georgia, 'Times New Roman', serif;
    max-width: 42rem;
    margin: 0 auto;
    padding: 2.5rem 1.25rem 4rem;
    line-height: 1.7;
    background: #faf6ef;
    color: #2b2621;
  }
  header { margin-bottom: 2rem; }
  header h1 { font-size: 1.6rem; margin: 0 0 0.25rem; }
  header nav a { color: #7a5230; text-decoration: none; margin-right: 1rem; font-size: 0.9rem; }
  header nav a:hover { text-decoration: underline; }
  .meta { margin-bottom: 1.5rem; }
  .weather-badge {
    display: inline-block;
    background: #efe6d4;
    color: #6b5a3f;
    border-radius: 999px;
    padding: 0.2rem 0.75rem;
    font-size: 0.85rem;
  }
  .entry-image { display: block; width: 100%; max-height: 320px; object-fit: cover; border-radius: 8px; margin-bottom: 1.25rem; }
  .poem p { margin: 0; }
  .poem p:nth-of-type(4n+1) { margin-top: 1.1em; }
  .entry { margin-bottom: 3rem; padding-bottom: 2rem; border-bottom: 1px solid #e3dccf; }
  .entry:last-child { border-bottom: none; }
  .entry h2 { font-size: 1.1rem; margin-bottom: 0.25rem; }
  .ondemand { margin-top: 3rem; padding: 1.5rem; border: 1px dashed #b3a68d; border-radius: 6px; background: #f2ecdf; }
  .ondemand h2 { font-size: 1rem; margin-top: 0; }
  .ondemand label { display: block; margin-bottom: 0.5rem; font-size: 0.9rem; }
  .ondemand select, .ondemand button { font-size: 0.95rem; padding: 0.4rem; }
  .ondemand button { margin-left: 0.5rem; cursor: pointer; }
  .ondemand-result { margin-top: 1rem; white-space: pre-wrap; }
  footer { margin-top: 3rem; color: #6b6258; font-size: 0.85rem; }
`;

function pageShell(title: string, activeNav: 'today' | 'archive', body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>${SHARED_STYLES}</style>
</head>
<body>
  <header>
    <h1>Daybreak Verse</h1>
    <nav>
      <a href="/index.html"${activeNav === 'today' ? ' aria-current="page"' : ''}>Today</a>
      <a href="/archive.html"${activeNav === 'archive' ? ' aria-current="page"' : ''}>Archive</a>
    </nav>
  </header>
  ${body}
  <footer>A poem written each morning by an autonomous AWS agent (Amazon Bedrock, Nova Micro), themed to the date and weather.</footer>
</body>
</html>
`;
}

function onDemandWidget(apiUrl: string, cities: City[]): string {
  const options = cities.map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.label)}</option>`).join('\n      ');
  return `
  <section class="ondemand">
    <h2>Try it yourself &mdash; on-demand demo (not part of the autonomous archive)</h2>
    <p style="font-size:0.85rem;color:#6b6258;">This asks the same agent to write a one-off poem for a city you pick. It is generated live and shown here only &mdash; it is never saved to the daily archive above.</p>
    <label for="city-select">City</label>
    <select id="city-select">
      ${options}
    </select>
    <button id="generate-btn" type="button">Generate</button>
    <div class="ondemand-result" id="ondemand-result"></div>
    <script>
      document.getElementById('generate-btn').addEventListener('click', async function () {
        var btn = document.getElementById('generate-btn');
        var result = document.getElementById('ondemand-result');
        var cityId = document.getElementById('city-select').value;
        btn.disabled = true;
        result.textContent = 'Generating…';
        try {
          var res = await fetch(${JSON.stringify(apiUrl)} + '?city=' + encodeURIComponent(cityId));
          var data = await res.json();
          if (!res.ok) {
            result.textContent = data && data.error ? data.error : 'Something went wrong. Try again in a bit.';
          } else {
            result.textContent = data.poem;
          }
        } catch (e) {
          result.textContent = 'Network error. Try again in a bit.';
        } finally {
          btn.disabled = false;
        }
      });
    </script>
  </section>`;
}

export function renderIndexPage(latest: ArchiveRecord | null, apiUrl: string, cities: City[]): string {
  const body = latest
    ? `
  <main>
    <div class="entry">
      <h2>${escapeHtml(latest.date)} &mdash; ${escapeHtml(latest.cityLabel)}</h2>
      <div class="meta">${weatherLabel(latest.weather)}</div>
      ${entryImage(latest)}
      <div class="poem">
        ${poemToHtml(latest.poem)}
      </div>
    </div>
  </main>
  ${onDemandWidget(apiUrl, cities)}`
    : `
  <main><p>No poem has been generated yet &mdash; check back after the next scheduled run.</p></main>
  ${onDemandWidget(apiUrl, cities)}`;

  return pageShell('Daybreak Verse — Today', 'today', body);
}

export function renderArchivePage(records: ArchiveRecord[]): string {
  const sorted = [...records].sort((a, b) => (a.date < b.date ? 1 : -1));
  const entries = sorted
    .map(
      (r) => `
    <div class="entry">
      <h2>${escapeHtml(r.date)} &mdash; ${escapeHtml(r.cityLabel)}</h2>
      <div class="meta">${weatherLabel(r.weather)}</div>
      ${entryImage(r)}
      <div class="poem">
        ${poemToHtml(r.poem)}
      </div>
    </div>`,
    )
    .join('\n');

  const body = `<main>${entries || '<p>No entries yet.</p>'}</main>`;
  return pageShell('Daybreak Verse — Archive', 'archive', body);
}
