"use client";

import { useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";

type AladinItem = {
  title: string;
  author: string;
  publisher: string;
  pubDate: string;
  isbn13: string;
  link: string;
  cover: string;
};

type SearchResponse = {
  query: string;
  totalResults: number;
  startIndex: number;
  itemsPerPage: number;
  items: AladinItem[];
  rawXml: string;
  error?: string;
};

export default function TestPage() {
  const [query, setQuery] = useState("해리포터 불의 잔");
  const [maxResults, setMaxResults] = useState("10");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSearch = useMemo(
    () => query.trim().length > 0 && Number(maxResults) > 0,
    [query, maxResults]
  );

  const runSearch = async () => {
    if (!canSearch || loading) return;
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const params = new URLSearchParams({
        query: query.trim(),
        maxResults: String(Math.min(Math.max(Number(maxResults) || 10, 1), 20)),
      });
      const res = await fetch(`/api/test/aladin-search?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `테스트 요청 실패 (${res.status})`);
      }
      setResponse(data as SearchResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "테스트 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="pt-28 pb-24 px-4 sm:px-6 max-w-6xl mx-auto">
      <section className="mb-8">
        <h1 className="text-[30px] sm:text-[40px] font-bold tracking-tight text-[#1D1D1F]">
          Aladin API Live Test
        </h1>
        <p className="text-[14px] sm:text-[16px] text-[#86868B] mt-2 font-medium">
          검색어를 입력하면 알라딘 API 응답(JSON 파싱 + 원본 XML)을 모두 표시합니다.
        </p>
      </section>

      <section className="bg-white rounded-[24px] border border-[#E5E5EA] p-5 sm:p-7 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_140px] gap-4">
          <div>
            <label className="text-[12px] font-bold text-[#86868B] uppercase tracking-[0.12em]">Query</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="예: 해리포터 불의 잔"
              className="mt-2 w-full rounded-xl border border-[#E5E5EA] bg-[#F5F5F7] px-4 py-3 text-[16px] font-semibold text-[#1D1D1F] outline-none focus:border-[#1D1D1F]"
            />
          </div>
          <div>
            <label className="text-[12px] font-bold text-[#86868B] uppercase tracking-[0.12em]">MaxResults</label>
            <input
              type="number"
              min={1}
              max={20}
              value={maxResults}
              onChange={(e) => setMaxResults(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[#E5E5EA] bg-[#F5F5F7] px-4 py-3 text-[16px] font-semibold text-[#1D1D1F] outline-none focus:border-[#1D1D1F]"
            />
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={runSearch}
            disabled={!canSearch || loading}
            className={`px-6 py-2.5 rounded-full text-[14px] font-bold flex items-center gap-2 ${
              !canSearch || loading
                ? "bg-[#E5E5EA] text-[#86868B] cursor-not-allowed"
                : "bg-[#1D1D1F] text-white hover:bg-black"
            }`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            응답 조회
          </button>
          <button
            type="button"
            onClick={() => setQuery("해리포터 불의 잔")}
            className="px-4 py-2.5 rounded-full text-[13px] font-semibold bg-[#F5F5F7] text-[#515154] hover:bg-[#E5E5EA]"
          >
            샘플 1
          </button>
          <button
            type="button"
            onClick={() => setQuery("해리포터 불의 잔 2")}
            className="px-4 py-2.5 rounded-full text-[13px] font-semibold bg-[#F5F5F7] text-[#515154] hover:bg-[#E5E5EA]"
          >
            샘플 2
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-[#FFD5D0] bg-[#FFF5F3] px-4 py-3 text-[13px] text-[#B42318] font-medium">
            {error}
          </div>
        )}
      </section>

      <section className="mt-8 grid grid-cols-1 gap-5">
        <article className="bg-white rounded-[24px] border border-[#E5E5EA] p-5 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
          <h2 className="text-[18px] font-bold text-[#1D1D1F] mb-3">요약 결과</h2>
          {!response && <p className="text-[14px] text-[#A1A1A6]">응답 조회를 실행하면 결과가 표시됩니다.</p>}
          {response && (
            <div className="space-y-2 text-[14px]">
              <p><span className="font-bold">Query:</span> {response.query}</p>
              <p><span className="font-bold">TotalResults:</span> {response.totalResults}</p>
              <p><span className="font-bold">StartIndex:</span> {response.startIndex}</p>
              <p><span className="font-bold">ItemsPerPage:</span> {response.itemsPerPage}</p>
              <p><span className="font-bold">Items:</span> {response.items.length}개</p>
            </div>
          )}
        </article>

        <article className="bg-white rounded-[24px] border border-[#E5E5EA] p-5 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
          <h2 className="text-[18px] font-bold text-[#1D1D1F] mb-3">응답 JSON (전체)</h2>
          {!response && <p className="text-[14px] text-[#A1A1A6]">응답 없음</p>}
          {response && (
            <pre className="text-[12px] leading-relaxed overflow-auto bg-[#F5F5F7] rounded-xl p-4 border border-[#E5E5EA]">
{JSON.stringify(response, null, 2)}
            </pre>
          )}
        </article>

        <article className="bg-white rounded-[24px] border border-[#E5E5EA] p-5 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
          <h2 className="text-[18px] font-bold text-[#1D1D1F] mb-3">원본 XML (전체)</h2>
          {!response && <p className="text-[14px] text-[#A1A1A6]">응답 없음</p>}
          {response && (
            <pre className="text-[12px] leading-relaxed overflow-auto bg-[#F5F5F7] rounded-xl p-4 border border-[#E5E5EA]">
{response.rawXml}
            </pre>
          )}
        </article>
      </section>
    </main>
  );
}
