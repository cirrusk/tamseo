import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";

export type DeviceType = "mobile" | "tablet" | "desktop" | "bot" | "unknown";

export interface DeviceInfo {
  userAgentRaw: string;
  deviceType: DeviceType;
  osName: string | null;
  browserName: string | null;
}

export interface SearchEventLogInput {
  requestId: string;
  ipRaw: string;
  userAgentRaw: string;
  deviceType: DeviceType;
  osName: string | null;
  browserName: string | null;
  districtCode: string;
  districtName: string | null;
  queries: string[];
  normalizedQueries: string[];
  resultCount: number;
  latencyMs: number;
  statusCode: number;
  success: boolean;
  errorCode?: string;
}

export const normalizeQuery = (value: string): string =>
  value
    .normalize("NFKC")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

export const getClientIp = (headers: Headers): string => {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "unknown";
};

export const hashIp = (ipRaw: string): string => {
  const salt = process.env.LOG_IP_SALT ?? "";
  return crypto.createHash("sha256").update(`${salt}:${ipRaw}`).digest("hex");
};

export const parseDeviceInfo = (userAgentRaw: string): DeviceInfo => {
  const ua = userAgentRaw.toLowerCase();

  const isBot = /(bot|crawler|spider|slurp|bingpreview|headless)/i.test(userAgentRaw);
  const isTablet = /(ipad|tablet|nexus 7|sm-t)/.test(ua);
  const isMobile = !isTablet && /(mobi|iphone|android)/.test(ua);

  let osName: string | null = null;
  if (/windows/.test(ua)) osName = "Windows";
  else if (/(iphone|ipad|ios)/.test(ua)) osName = "iOS";
  else if (/android/.test(ua)) osName = "Android";
  else if (/(mac os x|macintosh)/.test(ua)) osName = "macOS";
  else if (/linux/.test(ua)) osName = "Linux";

  let browserName: string | null = null;
  if (/edg\//.test(ua)) browserName = "Edge";
  else if (/opr\//.test(ua)) browserName = "Opera";
  else if (/chrome\//.test(ua)) browserName = "Chrome";
  else if (/safari\//.test(ua) && !/chrome\//.test(ua)) browserName = "Safari";
  else if (/firefox\//.test(ua)) browserName = "Firefox";

  const deviceType: DeviceType = isBot
    ? "bot"
    : isTablet
      ? "tablet"
      : isMobile
        ? "mobile"
        : ua
          ? "desktop"
          : "unknown";

  return { userAgentRaw, deviceType, osName, browserName };
};

export const getUtcDayStart = (value = new Date()): Date =>
  new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));

export const incrementDailyRateLimit = async (ipHash: string): Promise<number> => {
  const day = getUtcDayStart();

  const record = await prisma.dailyRateLimit.upsert({
    where: {
      day_ipHash: { day, ipHash },
    },
    create: {
      day,
      ipHash,
      count: 1,
    },
    update: {
      count: { increment: 1 },
    },
    select: {
      count: true,
    },
  });

  return record.count;
};

export const createSearchEventLog = async (input: SearchEventLogInput): Promise<void> => {
  const ipHash = hashIp(input.ipRaw);
  const normalizedUnique = Array.from(new Set(input.normalizedQueries));

  await prisma.searchEvent.create({
    data: {
      requestId: input.requestId,
      ipHash,
      ipRaw: process.env.STORE_RAW_IP === "true" ? input.ipRaw : null,
      userAgentRaw: input.userAgentRaw,
      deviceType: input.deviceType,
      osName: input.osName,
      browserName: input.browserName,
      districtCode: input.districtCode,
      districtName: input.districtName,
      queries: input.queries,
      normalizedQueries: normalizedUnique,
      queryCount: input.queries.length,
      resultCount: input.resultCount,
      latencyMs: input.latencyMs,
      statusCode: input.statusCode,
      success: input.success,
      errorCode: input.errorCode ?? null,
      queryRows: {
        create: normalizedUnique.map((normalized) => ({
          normalized,
        })),
      },
    },
  });
};
