const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

/** 동일 주소 동시 요청 방지 */
const inflightByKey = new Map<string, Promise<{ lat: number; lng: number } | null>>();

function normalizeKey(address: string): string {
  return address.trim().replace(/\s+/g, ' ');
}

/** @returns WGS84 lat, lng 또는 실패 시 null */
export async function geocodeAddressToLatLng(
  address: string,
): Promise<{ lat: number; lng: number } | null> {
  const q = address.trim();
  if (!q) return null;

  const key = normalizeKey(q);
  const existing = inflightByKey.get(key);
  if (existing) return existing;

  const run = (async (): Promise<{ lat: number; lng: number } | null> => {
    const params = new URLSearchParams({ address: q, key: API_KEY, region: 'KR', language: 'ko' });
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`,
      );
      if (!res.ok) return null;
      const data = (await res.json()) as {
        status: string;
        results?: Array<{ geometry?: { location?: { lat: number; lng: number } } }>;
      };
      if (data.status !== 'OK') return null;
      const loc = data.results?.[0]?.geometry?.location;
      if (!loc || !Number.isFinite(loc.lat) || !Number.isFinite(loc.lng)) return null;
      return { lat: loc.lat, lng: loc.lng };
    } catch {
      return null;
    }
  })().finally(() => {
    inflightByKey.delete(key);
  });

  inflightByKey.set(key, run);
  return run;
}
