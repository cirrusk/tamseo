import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEFAULT_DISTRICT_CODE = "11230"; // 강남구
const SEOUL_CENTER = { lat: 37.5665, lon: 126.978 };
const SEOUL_DISTANCE_LIMIT_KM = 80;

const DISTRICT_CENTERS: Array<{ code: string; lat: number; lon: number }> = [
  { code: "11230", lat: 37.5172, lon: 127.0473 }, // 강남구
  { code: "11250", lat: 37.5301, lon: 127.1238 }, // 강동구
  { code: "11090", lat: 37.6396, lon: 127.0257 }, // 강북구
  { code: "11160", lat: 37.5509, lon: 126.8495 }, // 강서구
  { code: "11210", lat: 37.4781, lon: 126.9515 }, // 관악구
  { code: "11050", lat: 37.5384, lon: 127.0822 }, // 광진구
  { code: "11170", lat: 37.4955, lon: 126.8875 }, // 구로구
  { code: "11180", lat: 37.4569, lon: 126.8955 }, // 금천구
  { code: "11110", lat: 37.6542, lon: 127.0568 }, // 노원구
  { code: "11100", lat: 37.6688, lon: 127.0471 }, // 도봉구
  { code: "11060", lat: 37.5744, lon: 127.0396 }, // 동대문구
  { code: "11200", lat: 37.5124, lon: 126.9393 }, // 동작구
  { code: "11140", lat: 37.5663, lon: 126.9019 }, // 마포구
  { code: "11130", lat: 37.5791, lon: 126.9368 }, // 서대문구
  { code: "11220", lat: 37.4836, lon: 127.0326 }, // 서초구
  { code: "11040", lat: 37.5634, lon: 127.0369 }, // 성동구
  { code: "11080", lat: 37.5894, lon: 127.0167 }, // 성북구
  { code: "11240", lat: 37.5145, lon: 127.1059 }, // 송파구
  { code: "11150", lat: 37.5169, lon: 126.8664 }, // 양천구
  { code: "11190", lat: 37.5264, lon: 126.8962 }, // 영등포구
  { code: "11030", lat: 37.5324, lon: 126.99 }, // 용산구
  { code: "11120", lat: 37.6027, lon: 126.9291 }, // 은평구
  { code: "11010", lat: 37.5735, lon: 126.979 }, // 종로구
  { code: "11020", lat: 37.5638, lon: 126.9976 }, // 중구
  { code: "11070", lat: 37.6066, lon: 127.0927 }, // 중랑구
];

const DISTRICT_NAME_TO_CODE: Record<string, string> = {
  "강남구": "11230",
  "강동구": "11250",
  "강북구": "11090",
  "강서구": "11160",
  "관악구": "11210",
  "광진구": "11050",
  "구로구": "11170",
  "금천구": "11180",
  "노원구": "11110",
  "도봉구": "11100",
  "동대문구": "11060",
  "동작구": "11200",
  "마포구": "11140",
  "서대문구": "11130",
  "서초구": "11220",
  "성동구": "11040",
  "성북구": "11080",
  "송파구": "11240",
  "양천구": "11150",
  "영등포구": "11190",
  "용산구": "11030",
  "은평구": "11120",
  "종로구": "11010",
  "중구": "11020",
  "중랑구": "11070",
};

const DISTRICT_ALIASES: Array<{ code: string; aliases: string[] }> = [
  { code: "11230", aliases: ["강남구", "gangnam", "gangnam-gu"] },
  { code: "11250", aliases: ["강동구", "gangdong", "gangdong-gu"] },
  { code: "11090", aliases: ["강북구", "gangbuk", "gangbuk-gu"] },
  { code: "11160", aliases: ["강서구", "gangseo", "gangseo-gu"] },
  { code: "11210", aliases: ["관악구", "gwanak", "gwanak-gu"] },
  { code: "11050", aliases: ["광진구", "gwangjin", "gwangjin-gu"] },
  { code: "11170", aliases: ["구로구", "guro", "guro-gu"] },
  { code: "11180", aliases: ["금천구", "geumcheon", "geumcheon-gu"] },
  { code: "11110", aliases: ["노원구", "nowon", "nowon-gu"] },
  { code: "11100", aliases: ["도봉구", "dobong", "dobong-gu"] },
  { code: "11060", aliases: ["동대문구", "dongdaemun", "dongdaemun-gu"] },
  { code: "11200", aliases: ["동작구", "dongjak", "dongjak-gu"] },
  { code: "11140", aliases: ["마포구", "mapo", "mapo-gu"] },
  { code: "11130", aliases: ["서대문구", "seodaemun", "seodaemun-gu"] },
  { code: "11220", aliases: ["서초구", "seocho", "seocho-gu"] },
  { code: "11040", aliases: ["성동구", "seongdong", "seongdong-gu"] },
  { code: "11080", aliases: ["성북구", "seongbuk", "seongbuk-gu"] },
  { code: "11240", aliases: ["송파구", "songpa", "songpa-gu"] },
  { code: "11150", aliases: ["양천구", "yangcheon", "yangcheon-gu"] },
  { code: "11190", aliases: ["영등포구", "yeongdeungpo", "yeongdeungpo-gu"] },
  { code: "11030", aliases: ["용산구", "yongsan", "yongsan-gu"] },
  { code: "11120", aliases: ["은평구", "eunpyeong", "eunpyeong-gu"] },
  { code: "11010", aliases: ["종로구", "jongno", "jongno-gu"] },
  { code: "11020", aliases: ["중구", "jung-gu", "jung gu", "junggu"] },
  { code: "11070", aliases: ["중랑구", "jungnang", "jungnang-gu"] },
];

const toRad = (value: number): number => (value * Math.PI) / 180;
const haversineDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const findNearestDistrictCode = (lat: number, lon: number): string => {
  let nearest = DISTRICT_CENTERS[0];
  let minDistance = Number.POSITIVE_INFINITY;
  for (const center of DISTRICT_CENTERS) {
    const distance = haversineDistanceKm(lat, lon, center.lat, center.lon);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = center;
    }
  }
  return nearest.code;
};

const getClientIp = (headers: Headers): string | null => {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const candidates = forwardedFor
      .split(",")
      .map((part) => part.trim().replace("::ffff:", "").replace(/:\d+$/, ""))
      .filter(Boolean);
    const publicCandidate = candidates.find((candidate) => !isPrivateIp(candidate));
    if (publicCandidate) return publicCandidate;
    if (candidates[0]) return candidates[0];
  }
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp.replace("::ffff:", "");
  return null;
};

const isPrivateIp = (ip: string): boolean => {
  const [a, b] = ip.split(".").map((part) => Number(part));
  const is172Private = a === 172 && Number.isInteger(b) && b >= 16 && b <= 31;
  return (
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("127.") ||
    is172Private ||
    ip.startsWith("::1")
  );
};

const inferDistrictFromHeaders = (headers: Headers): string | null => {
  const countryCode = (
    headers.get("x-vercel-ip-country") ||
    headers.get("cf-ipcountry") ||
    headers.get("x-country-code") ||
    ""
  ).toUpperCase();

  if (countryCode && countryCode !== "KR") return DEFAULT_DISTRICT_CODE;

  const locationHints = [
    headers.get("x-vercel-ip-city") || "",
    headers.get("x-vercel-ip-country-region") || "",
    headers.get("x-region-name") || "",
    headers.get("x-city") || "",
  ].join(" ");

  for (const [districtName, districtCode] of Object.entries(DISTRICT_NAME_TO_CODE)) {
    if (locationHints.includes(districtName)) return districtCode;
  }

  return null;
};

const normalizeText = (value: string): string => value.toLowerCase().replace(/[\s_]/g, "");

const inferDistrictFromText = (value: string): string | null => {
  if (!value) return null;
  const normalized = normalizeText(value);
  for (const item of DISTRICT_ALIASES) {
    if (item.aliases.some((alias) => normalized.includes(normalizeText(alias)))) {
      return item.code;
    }
  }
  return null;
};

const fetchIpGeo = async (
  ip: string
): Promise<{
  countryCode?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  region?: string;
} | null> => {
  const providers = [
    async () => {
      const res = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
        cache: "no-store",
        signal: AbortSignal.timeout(2200),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return {
        countryCode: typeof data?.country_code === "string" ? data.country_code.toUpperCase() : undefined,
        latitude: typeof data?.latitude === "number" ? data.latitude : undefined,
        longitude: typeof data?.longitude === "number" ? data.longitude : undefined,
        city: typeof data?.city === "string" ? data.city : undefined,
        region: typeof data?.region === "string" ? data.region : undefined,
      };
    },
    async () => {
      const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
        cache: "no-store",
        signal: AbortSignal.timeout(2200),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return {
        countryCode: typeof data?.country_code === "string" ? data.country_code.toUpperCase() : undefined,
        latitude: typeof data?.latitude === "number" ? data.latitude : undefined,
        longitude: typeof data?.longitude === "number" ? data.longitude : undefined,
        city: typeof data?.city === "string" ? data.city : undefined,
        region: typeof data?.region === "string" ? data.region : undefined,
      };
    },
    async () => {
      const res = await fetch(`https://ipinfo.io/${encodeURIComponent(ip)}/json`, {
        cache: "no-store",
        signal: AbortSignal.timeout(2200),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const [lat, lon] =
        typeof data?.loc === "string" ? data.loc.split(",").map((v: string) => Number(v.trim())) : [undefined, undefined];
      return {
        countryCode: typeof data?.country === "string" ? data.country.toUpperCase() : undefined,
        latitude: typeof lat === "number" && !Number.isNaN(lat) ? lat : undefined,
        longitude: typeof lon === "number" && !Number.isNaN(lon) ? lon : undefined,
        city: typeof data?.city === "string" ? data.city : undefined,
        region: typeof data?.region === "string" ? data.region : undefined,
      };
    },
  ];

  for (const provider of providers) {
    try {
      const result = await provider();
      if (result?.countryCode) return result;
    } catch {
      // try next provider
    }
  }
  return null;
};

export async function GET(request: Request) {
  const headerBased = inferDistrictFromHeaders(request.headers);
  if (headerBased) {
    return NextResponse.json({ districtCode: headerBased });
  }

  const ip = getClientIp(request.headers);
  if (!ip || isPrivateIp(ip)) {
    return NextResponse.json({ districtCode: DEFAULT_DISTRICT_CODE });
  }

  const geo = await fetchIpGeo(ip);
  if (!geo?.countryCode || geo.countryCode !== "KR") {
    return NextResponse.json({ districtCode: DEFAULT_DISTRICT_CODE });
  }

  const districtFromText = inferDistrictFromText(`${geo.region ?? ""} ${geo.city ?? ""}`);
  if (districtFromText) {
    return NextResponse.json({ districtCode: districtFromText });
  }

  if (typeof geo.latitude !== "number" || typeof geo.longitude !== "number") {
    return NextResponse.json({ districtCode: DEFAULT_DISTRICT_CODE });
  }

  const distanceToSeoul = haversineDistanceKm(
    geo.latitude,
    geo.longitude,
    SEOUL_CENTER.lat,
    SEOUL_CENTER.lon
  );
  if (distanceToSeoul > SEOUL_DISTANCE_LIMIT_KM) {
    return NextResponse.json({ districtCode: DEFAULT_DISTRICT_CODE });
  }

  const districtCode = findNearestDistrictCode(geo.latitude, geo.longitude);
  return NextResponse.json({ districtCode });
}
