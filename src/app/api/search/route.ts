import crypto from "crypto";
import { NextResponse } from "next/server";
import {
  createSearchEventLog,
  getClientIp,
  hashIp,
  incrementDailyRateLimit,
  normalizeQuery,
  parseDeviceInfo,
} from "@/lib/logging/search-log.repository";

const API_BASE_URL = "http://data4library.kr/api";
const API_KEY = process.env.LIBRARY_API_KEY?.trim();
const DAILY_RATE_LIMIT = 50;
const MAX_QUERY_COUNT = 5;
const MAX_QUERY_LENGTH = 120;
const MAX_TOTAL_QUERY_LENGTH = 350;
const MAX_USER_AGENT_LENGTH = 512;
const SAFE_QUERY_REGEX = /^[\p{L}\p{N}\s\-_,.:;!?'"()[\]&/]+$/u;
const CONTROL_CHARS_REGEX = /[\u0000-\u001F\u007F]/g;
const FALLBACK_RATE_LIMIT_BUCKET = new Map<string, { count: number; expiresAt: number }>();

const DISTRICT_CODE_TO_NAME: Record<string, string> = {
  "11230": "강남구",
  "11250": "강동구",
  "11090": "강북구",
  "11160": "강서구",
  "11210": "관악구",
  "11050": "광진구",
  "11170": "구로구",
  "11180": "금천구",
  "11110": "노원구",
  "11100": "도봉구",
  "11060": "동대문구",
  "11200": "동작구",
  "11140": "마포구",
  "11130": "서대문구",
  "11220": "서초구",
  "11040": "성동구",
  "11080": "성북구",
  "11240": "송파구",
  "11150": "양천구",
  "11190": "영등포구",
  "11030": "용산구",
  "11120": "은평구",
  "11010": "종로구",
  "11020": "중구",
  "11070": "중랑구",
};

const normalizeImageUrl = (value: string): string => {
  const trimmed = value.trim();
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (trimmed.startsWith("http://")) return `https://${trimmed.slice("http://".length)}`;
  return trimmed;
};

const sanitizeHeaderValue = (value: string, maxLength: number): string =>
  value.replace(CONTROL_CHARS_REGEX, "").trim().slice(0, maxLength);

const normalizeSearchQuery = (raw: string): string =>
  raw.normalize("NFKC").replace(CONTROL_CHARS_REGEX, "").replace(/\s+/g, " ").trim();

const parseAndValidateQueries = (queriesRaw: string): { queries: string[]; error?: string } => {
  const queries = queriesRaw
    .split(",")
    .map(normalizeSearchQuery)
    .filter((value) => value.length > 0);

  if (queries.length === 0) {
    return { queries: [], error: "적어도 한 권 이상의 책 제목을 입력해주세요." };
  }

  if (queries.length > MAX_QUERY_COUNT) {
    return { queries: [], error: "최대 5권까지만 검색 가능합니다." };
  }

  const deduped = Array.from(new Set(queries));
  const totalLength = deduped.reduce((sum, query) => sum + query.length, 0);
  if (totalLength > MAX_TOTAL_QUERY_LENGTH) {
    return { queries: [], error: "검색어 길이가 너무 깁니다. 입력을 줄여주세요." };
  }

  for (const query of deduped) {
    if (query.length > MAX_QUERY_LENGTH) {
      return { queries: [], error: `검색어는 ${MAX_QUERY_LENGTH}자 이하로 입력해주세요.` };
    }
    if (!SAFE_QUERY_REGEX.test(query)) {
      return { queries: [], error: `보안 정책상 허용되지 않는 문자가 포함되어 있습니다: "${query}"` };
    }
  }

  return { queries: deduped };
};

const incrementFallbackRateLimit = (ipHash: string): number => {
  const now = Date.now();
  const dayKey = new Date().toISOString().slice(0, 10);
  const key = `${dayKey}:${ipHash}`;
  const tomorrowUtc = new Date(new Date().toISOString().slice(0, 10));
  tomorrowUtc.setUTCDate(tomorrowUtc.getUTCDate() + 1);
  const expiresAt = tomorrowUtc.getTime();

  for (const [bucketKey, bucket] of Array.from(FALLBACK_RATE_LIMIT_BUCKET.entries())) {
    if (bucket.expiresAt <= now) FALLBACK_RATE_LIMIT_BUCKET.delete(bucketKey);
  }

  const prev = FALLBACK_RATE_LIMIT_BUCKET.get(key);
  const nextCount = (prev?.count ?? 0) + 1;
  FALLBACK_RATE_LIMIT_BUCKET.set(key, { count: nextCount, expiresAt });
  return nextCount;
};

const pickBookImageUrl = (bookInfo: any): string | undefined => {
  const candidate =
    bookInfo?.bookImageURL ||
    bookInfo?.bookImageUrl ||
    bookInfo?.bookimageURL ||
    bookInfo?.bookimageUrl ||
    bookInfo?.bookImage ||
    bookInfo?.bookimage ||
    bookInfo?.imageURL ||
    bookInfo?.imageUrl ||
    bookInfo?.book_image_url ||
    bookInfo?.book_image ||
    bookInfo?.cover;
  if (typeof candidate !== "string") return undefined;
  const trimmed = normalizeImageUrl(candidate);
  if (!trimmed) return undefined;
  return trimmed;
};

const buildDisplayTitle = (bookInfo: any): string => {
  const rawTitle = typeof bookInfo?.bookname === "string" ? bookInfo.bookname.trim() : "";
  const rawVol = bookInfo?.vol;

  if (!rawTitle) return "";
  if (rawVol === null || rawVol === undefined) return rawTitle;

  const vol = String(rawVol).trim();
  if (!vol) return rawTitle;

  // Avoid appending duplicate volume text when title already includes it.
  if (rawTitle.includes(vol)) return rawTitle;
  return `${rawTitle} ${vol}`.replace(/\s+/g, " ").trim();
};

export async function GET(request: Request) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  const ipRaw = sanitizeHeaderValue(getClientIp(request.headers), 128) || "unknown";
  const userAgentRaw = sanitizeHeaderValue(
    request.headers.get("user-agent") || "unknown",
    MAX_USER_AGENT_LENGTH
  );
  const { deviceType, osName, browserName } = parseDeviceInfo(userAgentRaw);

  let statusCode = 200;
  let errorCode: string | undefined;
  let responseBody: unknown = [];
  let resultCount = 0;

  let districtCode = "unknown";
  let districtName: string | null = null;
  let bookTitles: string[] = [];

  try {
    const { searchParams } = new URL(request.url);
    const district = searchParams.get("district");
    const queries = searchParams.get("queries");

    if (!API_KEY) {
      statusCode = 500;
      errorCode = "MISSING_API_KEY";
      responseBody = { error: "API Key가 설정되지 않았습니다." };
      return NextResponse.json(responseBody, { status: statusCode });
    }

    if (!district || !queries) {
      statusCode = 400;
      errorCode = "MISSING_REQUIRED_PARAMS";
      responseBody = { error: "필수 파라미터가 누락되었습니다." };
      return NextResponse.json(responseBody, { status: statusCode });
    }

    if (!Object.prototype.hasOwnProperty.call(DISTRICT_CODE_TO_NAME, district)) {
      statusCode = 400;
      errorCode = "INVALID_DISTRICT";
      responseBody = { error: "유효하지 않은 자치구 코드입니다." };
      return NextResponse.json(responseBody, { status: statusCode });
    }

    districtCode = district;
    districtName = DISTRICT_CODE_TO_NAME[districtCode];

    const { queries: validatedQueries, error: queryError } = parseAndValidateQueries(queries);
    if (queryError) {
      statusCode = 400;
      errorCode = "INVALID_QUERY";
      responseBody = { error: queryError };
      return NextResponse.json(responseBody, { status: statusCode });
    }
    bookTitles = validatedQueries;

    try {
      const currentUsage = await incrementDailyRateLimit(hashIp(ipRaw));
      if (currentUsage > DAILY_RATE_LIMIT) {
        statusCode = 429;
        errorCode = "RATE_LIMIT_EXCEEDED";
        responseBody = { error: "일일 검색 허용량을 초과했습니다." };
        return NextResponse.json(responseBody, { status: statusCode });
      }
    } catch (rateLimitError) {
      console.error("[RateLimit] PostgreSQL rate limit failed (ignored):", rateLimitError);
      const currentUsage = incrementFallbackRateLimit(hashIp(ipRaw));
      if (currentUsage > DAILY_RATE_LIMIT) {
        statusCode = 429;
        errorCode = "RATE_LIMIT_EXCEEDED_FALLBACK";
        responseBody = { error: "일일 검색 허용량을 초과했습니다." };
        return NextResponse.json(responseBody, { status: statusCode });
      }
    }

    const results = [];
    const searchStartTime = Date.now();

    for (const title of bookTitles) {
      if (Date.now() - searchStartTime > 9000) break;

      const cleanTitle = title.trim();
      const noSpaceTitle = cleanTitle.replace(/\s+/g, "");

      try {
        let foundBooks: any[] | null = null;

        const searchBook = async (strategy: string, params: string) => {
          const targetUrl = `${API_BASE_URL}/srchBooks?authKey=${API_KEY}&pageNo=1&pageSize=5&format=json&exactMatch=N&${params}`;
          try {
            const response = await fetch(targetUrl, { signal: AbortSignal.timeout(6000) });
            const rawText = await response.text();

            console.log(`[Debug] ${strategy} Response: ${rawText.substring(0, 150)}...`);

            if (rawText.trim().startsWith("<")) {
              console.error(`[API Error] XML Response received: ${rawText.substring(0, 200)}`);
              return null;
            }

            let data;
            try {
              data = JSON.parse(rawText);
            } catch {
              console.error("[Error] JSON Parsing Failed");
              return null;
            }

            if (data.response?.docs?.length > 0) {
              return data.response.docs.slice(0, 3).map((item: any) => item.doc);
            }
          } catch (searchError) {
            console.error(`[Search Error] Strategy ${strategy} failed:`, searchError);
            return null;
          }
          return null;
        };

        if (!foundBooks) {
          foundBooks = await searchBook("1.원본+대출순", `title=${encodeURIComponent(cleanTitle)}&sort=loan`);
        }
        if (!foundBooks && cleanTitle !== noSpaceTitle) {
          foundBooks = await searchBook("2.공백제거+대출순", `title=${encodeURIComponent(noSpaceTitle)}&sort=loan`);
        }
        if (!foundBooks) {
          foundBooks = await searchBook("3.키워드+대출순", `keyword=${encodeURIComponent(cleanTitle)}&sort=loan`);
        }
        if (!foundBooks) {
          foundBooks = await searchBook("4.원본+정렬X", `title=${encodeURIComponent(cleanTitle)}`);
        }
        if (!foundBooks && cleanTitle !== noSpaceTitle) {
          foundBooks = await searchBook("5.공백제거+정렬X", `title=${encodeURIComponent(noSpaceTitle)}`);
        }
        if (!foundBooks) {
          foundBooks = await searchBook("6.키워드+정렬X", `keyword=${encodeURIComponent(cleanTitle)}`);
        }

        if (!foundBooks) {
          console.log(`[Fail] No results for: ${title}`);
          continue;
        }

        const processedBooksByIsbn = new Map<
          string,
          {
            metadata: {
              title: string;
              author: string;
              publisher: string;
              pubYear: string;
              isbn: string;
              imageUrl?: string;
            };
            libraries: { libraryName: string; isAvailable: boolean }[];
          }
        >();

        for (const bookInfo of foundBooks) {
          const isbn = bookInfo.isbn13 || bookInfo.isbn;
          if (!isbn) continue;

          const libRes = await fetch(
            `${API_BASE_URL}/libSrchByBook?authKey=${API_KEY}&isbn=${isbn}&region=11&dtl_region=${districtCode}&pageSize=5&format=json`,
            { signal: AbortSignal.timeout(6000) }
          );
          const libData = await libRes.json();
          const librariesFound = libData.response?.libs || [];

          const librariesWithStatus = await Promise.all(
            librariesFound.map(async (item: any) => {
              const libCode = item.lib.libCode;
              try {
                const existRes = await fetch(
                  `${API_BASE_URL}/bookExist?authKey=${API_KEY}&libCode=${libCode}&isbn13=${isbn}&format=json`,
                  { signal: AbortSignal.timeout(2000) }
                );
                const existData = await existRes.json();
                return {
                  libraryName: item.lib.libName,
                  isAvailable: existData.response?.result?.loanAvailable === "Y",
                };
              } catch {
                return { libraryName: item.lib.libName, isAvailable: false };
              }
            })
          );

          if (librariesWithStatus.length === 0) continue;

          const isbnKey = String(isbn);
          const existing = processedBooksByIsbn.get(isbnKey);

          if (!existing) {
            processedBooksByIsbn.set(isbnKey, {
              metadata: {
                title: buildDisplayTitle(bookInfo),
                author: bookInfo.authors,
                publisher: bookInfo.publisher,
                pubYear: bookInfo.publication_year,
                isbn: isbnKey,
                imageUrl: pickBookImageUrl(bookInfo),
              },
              libraries: librariesWithStatus,
            });
            continue;
          }

          const mergedLibraries = new Map(
            existing.libraries.map((lib) => [lib.libraryName, lib.isAvailable] as const)
          );
          for (const lib of librariesWithStatus) {
            const prev = mergedLibraries.get(lib.libraryName) ?? false;
            mergedLibraries.set(lib.libraryName, prev || lib.isAvailable);
          }

          existing.libraries = Array.from(mergedLibraries.entries()).map(
            ([libraryName, isAvailable]) => ({
              libraryName,
              isAvailable,
            })
          );

          if (!existing.metadata.imageUrl) {
            existing.metadata.imageUrl = pickBookImageUrl(bookInfo);
          }
        }

        const processedBooks = Array.from(processedBooksByIsbn.values());

        if (processedBooks.length > 0) {
          results.push({
            searchTerm: cleanTitle,
            books: processedBooks,
          });
        }
      } catch (processingError) {
        console.error(`Processing Error (${title}):`, processingError);
      }
    }

    resultCount = results.reduce((sum, item: any) => sum + item.books.length, 0);
    responseBody = results;
    return NextResponse.json(responseBody, { status: statusCode });
  } catch (error) {
    console.error("Search API unexpected error:", error);
    statusCode = 500;
    errorCode = "INTERNAL_SERVER_ERROR";
    responseBody = { error: "검색 중 서버 오류가 발생했습니다." };
    return NextResponse.json(responseBody, { status: statusCode });
  } finally {
    const normalizedQueries = bookTitles.map(normalizeQuery).filter(Boolean);

    void createSearchEventLog({
      requestId,
      ipRaw,
      userAgentRaw,
      deviceType,
      osName,
      browserName,
      districtCode,
      districtName,
      queries: bookTitles,
      normalizedQueries,
      resultCount,
      latencyMs: Date.now() - startTime,
      statusCode,
      success: statusCode < 400,
      errorCode,
    }).catch((logError) => {
      console.error("[SearchLog] PostgreSQL logging failed (ignored):", logError);
    });
  }
}
