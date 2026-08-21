export interface City {
  id: string;
  label: string;
  lat: number;
  lon: number;
  timezone: string;
}

/**
 * DEFAULT_CITY is the fixed location for the autonomous path (Lambda A).
 * It must always be present in CITIES so the on-demand dropdown includes it too.
 */
export const DEFAULT_CITY: City = {
  id: 'binangonan-ph',
  label: 'Binangonan, Rizal, Philippines',
  lat: 14.4639,
  lon: 121.1897,
  timezone: 'Asia/Manila',
};

export const CITIES: City[] = [
  DEFAULT_CITY,
  { id: 'manila-ph', label: 'Manila, Philippines', lat: 14.5995, lon: 120.9842, timezone: 'Asia/Manila' },
  { id: 'quezon-city-ph', label: 'Quezon City, Philippines', lat: 14.676, lon: 121.0437, timezone: 'Asia/Manila' },
  { id: 'cebu-ph', label: 'Cebu City, Philippines', lat: 10.3157, lon: 123.8854, timezone: 'Asia/Manila' },
  { id: 'davao-ph', label: 'Davao City, Philippines', lat: 7.1907, lon: 125.4553, timezone: 'Asia/Manila' },
  { id: 'tokyo-jp', label: 'Tokyo, Japan', lat: 35.6762, lon: 139.6503, timezone: 'Asia/Tokyo' },
  { id: 'osaka-jp', label: 'Osaka, Japan', lat: 34.6937, lon: 135.5023, timezone: 'Asia/Tokyo' },
  { id: 'seoul-kr', label: 'Seoul, South Korea', lat: 37.5665, lon: 126.978, timezone: 'Asia/Seoul' },
  { id: 'beijing-cn', label: 'Beijing, China', lat: 39.9042, lon: 116.4074, timezone: 'Asia/Shanghai' },
  { id: 'shanghai-cn', label: 'Shanghai, China', lat: 31.2304, lon: 121.4737, timezone: 'Asia/Shanghai' },
  { id: 'hong-kong-hk', label: 'Hong Kong', lat: 22.3193, lon: 114.1694, timezone: 'Asia/Hong_Kong' },
  { id: 'taipei-tw', label: 'Taipei, Taiwan', lat: 25.033, lon: 121.5654, timezone: 'Asia/Taipei' },
  { id: 'singapore-sg', label: 'Singapore', lat: 1.3521, lon: 103.8198, timezone: 'Asia/Singapore' },
  { id: 'kuala-lumpur-my', label: 'Kuala Lumpur, Malaysia', lat: 3.139, lon: 101.6869, timezone: 'Asia/Kuala_Lumpur' },
  { id: 'jakarta-id', label: 'Jakarta, Indonesia', lat: -6.2088, lon: 106.8456, timezone: 'Asia/Jakarta' },
  { id: 'bangkok-th', label: 'Bangkok, Thailand', lat: 13.7563, lon: 100.5018, timezone: 'Asia/Bangkok' },
  { id: 'hanoi-vn', label: 'Hanoi, Vietnam', lat: 21.0278, lon: 105.8342, timezone: 'Asia/Ho_Chi_Minh' },
  { id: 'ho-chi-minh-vn', label: 'Ho Chi Minh City, Vietnam', lat: 10.8231, lon: 106.6297, timezone: 'Asia/Ho_Chi_Minh' },
  { id: 'mumbai-in', label: 'Mumbai, India', lat: 19.076, lon: 72.8777, timezone: 'Asia/Kolkata' },
  { id: 'new-delhi-in', label: 'New Delhi, India', lat: 28.6139, lon: 77.209, timezone: 'Asia/Kolkata' },
  { id: 'dubai-ae', label: 'Dubai, UAE', lat: 25.2048, lon: 55.2708, timezone: 'Asia/Dubai' },
  { id: 'istanbul-tr', label: 'Istanbul, Turkey', lat: 41.0082, lon: 28.9784, timezone: 'Europe/Istanbul' },
  { id: 'moscow-ru', label: 'Moscow, Russia', lat: 55.7558, lon: 37.6173, timezone: 'Europe/Moscow' },
  { id: 'london-gb', label: 'London, United Kingdom', lat: 51.5072, lon: -0.1276, timezone: 'Europe/London' },
  { id: 'paris-fr', label: 'Paris, France', lat: 48.8566, lon: 2.3522, timezone: 'Europe/Paris' },
  { id: 'berlin-de', label: 'Berlin, Germany', lat: 52.52, lon: 13.405, timezone: 'Europe/Berlin' },
  { id: 'madrid-es', label: 'Madrid, Spain', lat: 40.4168, lon: -3.7038, timezone: 'Europe/Madrid' },
  { id: 'rome-it', label: 'Rome, Italy', lat: 41.9028, lon: 12.4964, timezone: 'Europe/Rome' },
  { id: 'amsterdam-nl', label: 'Amsterdam, Netherlands', lat: 52.3676, lon: 4.9041, timezone: 'Europe/Amsterdam' },
  { id: 'dublin-ie', label: 'Dublin, Ireland', lat: 53.3498, lon: -6.2603, timezone: 'Europe/Dublin' },
  { id: 'stockholm-se', label: 'Stockholm, Sweden', lat: 59.3293, lon: 18.0686, timezone: 'Europe/Stockholm' },
  { id: 'lisbon-pt', label: 'Lisbon, Portugal', lat: 38.7223, lon: -9.1393, timezone: 'Europe/Lisbon' },
  { id: 'athens-gr', label: 'Athens, Greece', lat: 37.9838, lon: 23.7275, timezone: 'Europe/Athens' },
  { id: 'cairo-eg', label: 'Cairo, Egypt', lat: 30.0444, lon: 31.2357, timezone: 'Africa/Cairo' },
  { id: 'lagos-ng', label: 'Lagos, Nigeria', lat: 6.5244, lon: 3.3792, timezone: 'Africa/Lagos' },
  { id: 'nairobi-ke', label: 'Nairobi, Kenya', lat: -1.2921, lon: 36.8219, timezone: 'Africa/Nairobi' },
  { id: 'cape-town-za', label: 'Cape Town, South Africa', lat: -33.9249, lon: 18.4241, timezone: 'Africa/Johannesburg' },
  { id: 'new-york-us', label: 'New York, USA', lat: 40.7128, lon: -74.006, timezone: 'America/New_York' },
  { id: 'los-angeles-us', label: 'Los Angeles, USA', lat: 34.0522, lon: -118.2437, timezone: 'America/Los_Angeles' },
  { id: 'chicago-us', label: 'Chicago, USA', lat: 41.8781, lon: -87.6298, timezone: 'America/Chicago' },
  { id: 'san-francisco-us', label: 'San Francisco, USA', lat: 37.7749, lon: -122.4194, timezone: 'America/Los_Angeles' },
  { id: 'seattle-us', label: 'Seattle, USA', lat: 47.6062, lon: -122.3321, timezone: 'America/Los_Angeles' },
  { id: 'toronto-ca', label: 'Toronto, Canada', lat: 43.6532, lon: -79.3832, timezone: 'America/Toronto' },
  { id: 'vancouver-ca', label: 'Vancouver, Canada', lat: 49.2827, lon: -123.1207, timezone: 'America/Vancouver' },
  { id: 'mexico-city-mx', label: 'Mexico City, Mexico', lat: 19.4326, lon: -99.1332, timezone: 'America/Mexico_City' },
  { id: 'sao-paulo-br', label: 'São Paulo, Brazil', lat: -23.5505, lon: -46.6333, timezone: 'America/Sao_Paulo' },
  { id: 'rio-de-janeiro-br', label: 'Rio de Janeiro, Brazil', lat: -22.9068, lon: -43.1729, timezone: 'America/Sao_Paulo' },
  { id: 'buenos-aires-ar', label: 'Buenos Aires, Argentina', lat: -34.6037, lon: -58.3816, timezone: 'America/Argentina/Buenos_Aires' },
  { id: 'lima-pe', label: 'Lima, Peru', lat: -12.0464, lon: -77.0428, timezone: 'America/Lima' },
  { id: 'bogota-co', label: 'Bogotá, Colombia', lat: 4.711, lon: -74.0721, timezone: 'America/Bogota' },
  { id: 'sydney-au', label: 'Sydney, Australia', lat: -33.8688, lon: 151.2093, timezone: 'Australia/Sydney' },
  { id: 'melbourne-au', label: 'Melbourne, Australia', lat: -37.8136, lon: 144.9631, timezone: 'Australia/Melbourne' },
  { id: 'auckland-nz', label: 'Auckland, New Zealand', lat: -36.8485, lon: 174.7633, timezone: 'Pacific/Auckland' },
];

export function findCityById(id: string): City | undefined {
  return CITIES.find((c) => c.id === id);
}
