import { NextResponse } from "next/server";

const ALADIN_ITEM_LOOKUP_URL = "http://www.aladin.co.kr/ttb/api/ItemLookUp.aspx";
const ALADIN_TTB_KEY = process.env.ALADIN_TTB_KEY?.trim() || "ttbhjopa91932001";

type LookupItem = {
  title: string;
  author: string;
  publisher: string;
  pubDate: string;
  isbn: string;
  isbn13: string;
  link: string;
  cover: string;
  categoryName: string;
};

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

const parseItemsFromXml = (xml: string): LookupItem[] => {
  const items: LookupItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let itemMatch: RegExpExecArray | null = itemRegex.exec(xml);

  while (itemMatch) {
    const block = itemMatch[1] || "";
    items.push({
      title: extractTag(block, "title"),
      author: extractTag(block, "author"),
      publisher: extractTag(block, "publisher"),
      pubDate: extractTag(block, "pubDate"),
      isbn: extractTag(block, "isbn"),
      isbn13: extractTag(block, "isbn13"),
      link: extractTag(block, "link"),
      cover: extractTag(block, "cover"),
      categoryName: extractTag(block, "categoryName"),
    });
    itemMatch = itemRegex.exec(xml);
  }

  return items;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isbn = (searchParams.get("isbn") || "").replace(/[\s-]/g, "").trim();

  if (!isbn) {
    return NextResponse.json({ error: "isbn 파라미터가 필요합니다." }, { status: 400 });
  }

  const params = new URLSearchParams({
    ttbkey: ALADIN_TTB_KEY,
    itemIdType: "ISBN",
    ItemId: isbn,
    output: "xml",
    Version: "20131101",
    OptResult: "ebookList,usedList,reviewList",
  });

  try {
    const response = await fetch(`${ALADIN_ITEM_LOOKUP_URL}?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    const xmlText = await response.text();
    if (!response.ok) {
      return NextResponse.json(
        { error: `알라딘 API 요청 실패 (${response.status})`, raw: xmlText.slice(0, 1000) },
        { status: response.status }
      );
    }

    const parsedItems = parseItemsFromXml(xmlText);
    return NextResponse.json({
      isbn,
      totalResults: Number(extractTag(xmlText, "totalResults") || 0),
      item: parsedItems[0] ?? null,
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
