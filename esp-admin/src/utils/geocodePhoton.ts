/** Photon (Komoot) — OSM 기반. 무료·무키. 과도 호출 방지는 호출처에서 간격 두기 권장. */

const PHOTON = 'https://photon.komoot.io/api';
/** 대한민국 대략 범위(검색 편향) minLon,minLat,maxLon,maxLat */
const KR_BBOX = '124.2,33.0,132.5,39.0';

/** 동일 주소에 동시에 여러 요청이 나가지 않게(선택 행 우선·일반 루프가 겹칠 때) */
const inflightByKey = new Map<string, Promise<{ lat: number; lng: number } | null>>();

function normalizePhotonKey(address: string): string {
  return address.trim().replace(/\s+/g, ' ');
}

/** @returns WGS84 lat, lng 또는 실패 시 null */
export async function geocodeAddressToLatLng(address: string): Promise<{ lat: number; lng: number } | null> {
  const q = address.trim();
  if (!q) return null;

  const key = normalizePhotonKey(q);
  const existing = inflightByKey.get(key);
  if (existing) return existing;

  const run = (async (): Promise<{ lat: number; lng: number } | null> => {
    // Photon 공개 API는 lang=ko 미지원 → 400. bbox·한글 q 는 OK.
    const params = new URLSearchParams({
      q,
      limit: '1',
      bbox: KR_BBOX,
    });
    const url = `${PHOTON}?${params.toString()}`;

    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return null;
      const data = (await res.json()) as {
        features?: Array<{ geometry?: { coordinates?: [number, number] } }>;
      };
      const coords = data.features?.[0]?.geometry?.coordinates;
      if (!coords?.length || coords.length < 2) return null;

      const [lng, lat] = coords;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;

      return { lat, lng };
    } catch {
      return null;
    }
  })().finally(() => {
    inflightByKey.delete(key);
  });

  inflightByKey.set(key, run);
  return run;
}
