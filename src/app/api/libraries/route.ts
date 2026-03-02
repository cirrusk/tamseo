import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const API_KEY = process.env.LIBRARY_API_KEY?.trim();

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

const FALLBACK_LIBRARIES = [
  { district: "마포구", name: "마포중앙도서관", address: "서울 마포구 성산로 128" },
  { district: "마포구", name: "마포평생학습관", address: "서울 마포구 홍익로2길 16" },
  { district: "강남구", name: "강남구립못골도서관", address: "서울 강남구 자곡로 116" },
  { district: "강남구", name: "강남도서관", address: "서울 강남구 선릉로116길 45" },
  { district: "서초구", name: "국립중앙도서관", address: "서울 서초구 반포대로 201" },
  { district: "종로구", name: "정독도서관", address: "서울 종로구 북촌로5길 48" },
  { district: "송파구", name: "송파도서관", address: "서울 송파구 동남로 263" },
  { district: "용산구", name: "용산도서관", address: "서울 용산구 두텁바위로 160" },
  { district: "관악구", name: "관악도서관", address: "서울 관악구 신림로3길 35" },
  { district: "중구", name: "남산도서관", address: "서울 중구 소파로 46" },
  { district: "중랑구", name: "중랑구립정보도서관", address: "서울 중랑구 신내로15길 197" },
];

export async function GET() {
  if (!API_KEY) {
    return NextResponse.json(FALLBACK_LIBRARIES);
  }

  try {
    const res = await fetch(
      `http://data4library.kr/api/libSrch?authKey=${API_KEY}&region=11&pageSize=500&format=json`,
      { cache: "no-store", signal: AbortSignal.timeout(8000) }
    );

    if (!res.ok) {
      return NextResponse.json(FALLBACK_LIBRARIES);
    }

    const data = await res.json();
    const libs = data.response?.libs || [];

    const normalized = libs
      .map((item: any) => {
        const lib = item?.lib;
        const address = lib?.address || "";
        const match = address.match(/서울특별시\s+([가-힣]+구)/);
        const district = match?.[1];

        if (!district || !DISTRICT_NAME_TO_CODE[district]) return null;
        return {
          district,
          name: lib.libName as string,
          address,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => a.name.localeCompare(b.name));

    return NextResponse.json(normalized.length > 0 ? normalized : FALLBACK_LIBRARIES);
  } catch (error) {
    console.error("Library list fetch failed:", error);
    return NextResponse.json(FALLBACK_LIBRARIES);
  }
}
