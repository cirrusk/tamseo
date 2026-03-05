import { NextResponse } from "next/server";

const ALADIN_ITEM_SEARCH_URL = "http://www.aladin.co.kr/ttb/api/ItemSearch.aspx";
const ALADIN_TTB_KEY = process.env.ALADIN_TTB_KEY?.trim() || "ttbhjopa91932001";
const DEFAULT_MAX_RESULTS = 10;
const MAX_RESULTS_LIMIT = 20;

const xmlEntityMap: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": "\"",
  "&apos;": "'",
  "&#39;": "'",
};

const decodeXmlEntities = (value: string): string =>
  value.replace(/(&amp;|&lt;|&gt;|&quot;|&apos;|&#39;)/g, (m) => xmlEntityMap[m] ?? m);

const extractTag = (source: string, tag: string): string => {
  const match = source.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}>([\\s\\S]*?)<\\/${tag}>`));
  if (!match) return "";
  return decodeXmlEntities((match[1] ?? match[2] ?? "").trim());
};

type AladinItem = {
  title: string;
  author: string;
  publisher: string;
  pubDate: string;
  isbn13: string;
  link: string;
  cover: string;
};

const parseItemsFromXml = (xml: string): AladinItem[] => {
  const items: AladinItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let itemMatch: RegExpExecArray | null = itemRegex.exec(xml);

  while (itemMatch) {
    const block = itemMatch[1] || "";
    items.push({
      title: extractTag(block, "title"),
      author: extractTag(block, "author"),
      publisher: extractTag(block, "publisher"),
      pubDate: extractTag(block, "pubDate"),
      isbn13: extractTag(block, "isbn13"),
      link: extractTag(block, "link"),
      cover: extractTag(block, "cover"),
    });
    itemMatch = itemRegex.exec(xml);
  }

  return items;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("query") || "").trim();
  const maxResultsRaw = Number(searchParams.get("maxResults") || DEFAULT_MAX_RESULTS);
  const maxResults = Number.isFinite(maxResultsRaw)
    ? Math.min(Math.max(1, Math.trunc(maxResultsRaw)), MAX_RESULTS_LIMIT)
    : DEFAULT_MAX_RESULTS;

  if (!query) {
    return NextResponse.json({ error: "query 파라미터가 필요합니다." }, { status: 400 });
  }

  const params = new URLSearchParams({
    ttbkey: ALADIN_TTB_KEY,
    Query: query,
    QueryType: "Title",
    MaxResults: String(maxResults),
    start: "1",
    SearchTarget: "Book",
    output: "xml",
    Version: "20131101",
  });

  try {
    const response = await fetch(`${ALADIN_ITEM_SEARCH_URL}?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    const xmlText = await response.text();
    if (!response.ok) {
      return NextResponse.json(
        { error: `알라딘 API 요청 실패 (${response.status})`, raw: xmlText.slice(0, 800) },
        { status: response.status }
      );
    }

    const parsedItems = parseItemsFromXml(xmlText);
    return NextResponse.json({
      query,
      totalResults: Number(extractTag(xmlText, "totalResults") || 0),
      startIndex: Number(extractTag(xmlText, "startIndex") || 1),
      itemsPerPage: Number(extractTag(xmlText, "itemsPerPage") || maxResults),
      items: parsedItems,
      rawXml: xmlText,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "알라딘 API 호출 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
