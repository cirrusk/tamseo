import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashIp, normalizeQuery } from "@/lib/logging/search-log.repository";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const parseDate = (value: string | null): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export async function GET(request: Request) {
  const adminToken = process.env.ADMIN_API_TOKEN?.trim();
  const provided = request.headers.get("x-admin-token")?.trim();

  if (!adminToken) {
    return NextResponse.json({ error: "ADMIN_API_TOKEN이 설정되지 않았습니다." }, { status: 503 });
  }

  if (!provided || provided !== adminToken) {
    return NextResponse.json({ error: "관리자 인증에 실패했습니다." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  const from = parseDate(searchParams.get("from"));
  const to = parseDate(searchParams.get("to"));

  const query = searchParams.get("query")?.trim() ?? "";
  const ipRaw = searchParams.get("ip")?.trim() ?? "";
  const deviceType = searchParams.get("deviceType")?.trim() ?? "";
  const districtCode = searchParams.get("districtCode")?.trim() ?? "";
  const status = searchParams.get("status")?.trim() ?? "";

  const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(searchParams.get("pageSize") ?? "20", 10) || 20, 1), 100);

  const createdAtFilter: { gte?: Date; lte?: Date } = {};
  if (from) createdAtFilter.gte = from;
  if (to) createdAtFilter.lte = to;

  const where: any = {
    ...(Object.keys(createdAtFilter).length > 0 ? { createdAt: createdAtFilter } : {}),
    ...(ipRaw ? { ipHash: hashIp(ipRaw) } : {}),
    ...(deviceType ? { deviceType } : {}),
    ...(districtCode ? { districtCode } : {}),
    ...(status === "success" ? { success: true } : {}),
    ...(status === "error" ? { success: false } : {}),
    ...(query
      ? {
          queryRows: {
            some: {
              normalized: normalizeQuery(query),
            },
          },
        }
      : {}),
  };

  const [total, events, topDevices, topQueries] = await Promise.all([
    prisma.searchEvent.count({ where }),
    prisma.searchEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        createdAt: true,
        requestId: true,
        ipHash: true,
        userAgentRaw: true,
        deviceType: true,
        osName: true,
        browserName: true,
        districtCode: true,
        districtName: true,
        queries: true,
        normalizedQueries: true,
        queryCount: true,
        resultCount: true,
        latencyMs: true,
        statusCode: true,
        success: true,
        errorCode: true,
      },
    }),
    prisma.searchEvent.groupBy({
      by: ["deviceType"],
      where,
      _count: { _all: true },
      orderBy: { _count: { deviceType: "desc" } },
      take: 5,
    }),
    prisma.searchEventQuery.groupBy({
      by: ["normalized"],
      where: {
        ...(query ? { normalized: normalizeQuery(query) } : {}),
        ...(Object.keys(createdAtFilter).length > 0 ? { createdAt: createdAtFilter } : {}),
      },
      _count: { _all: true },
      orderBy: { _count: { normalized: "desc" } },
      take: 10,
    }),
  ]);

  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  return NextResponse.json({
    filters: {
      from: from?.toISOString() ?? null,
      to: to?.toISOString() ?? null,
      query: query || null,
      ip: ipRaw || null,
      deviceType: deviceType || null,
      districtCode: districtCode || null,
      status: status || null,
    },
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
    summary: {
      topDevices: topDevices.map((item: { deviceType: string; _count: { _all: number } }) => ({
        deviceType: item.deviceType,
        count: item._count._all,
      })),
      topQueries: topQueries.map((item: { normalized: string; _count: { _all: number } }) => ({
        query: item.normalized,
        count: item._count._all,
      })),
    },
    items: events,
  });
}
