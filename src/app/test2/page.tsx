"use client";

import { useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";

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

type LookupResponse = {
  isbn: string;
  totalResults: number;
  item: LookupItem | null;
  rawXml: string;
  error?: string;
};

export default function Test2Page() {
  const [isbn, setIsbn] = useState("9788983920928");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<LookupResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const normalizedIsbn = useMemo(() => isbn.replace(/[\s-]/g, "").trim(), [isbn]);
  const canSearch = normalizedIsbn.length > 0;

  const runLookup = async () => {
    if (!canSearch || loading) return;
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const params = new URLSearchParams({ isbn: normalizedIsbn });
      const res = await fetch(`/api/test/aladin-lookup?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `조회 실패 (${res.status})`);
      }
      setResponse(data as LookupResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="pt-28 pb-24 px-4 sm:px-6 max-w-6xl mx-auto">
      <section className="mb-8">
        <h1 className="text-[30px] sm:text-[40px] font-bold tracking-tight text-[#1D1D1F]">
          Aladin ItemLookUp Test
        </h1>
        <p className="text-[14px] sm:text-[16px] text-[#86868B] mt-2 font-medium">
          ISBN을 입력하면 ItemLookUp 응답(JSON + 원본 XML)을 표시합니다.
        </p>
      </section>

      <section className="bg-white rounded-[24px] border border-[#E5E5EA] p-5 sm:p-7 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
        <label className="text-[12px] font-bold text-[#86868B] uppercase tracking-[0.12em]">ISBN</label>
        <input
          value={isbn}
          onChange={(e) => setIsbn(e.target.value)}
          placeholder="예: 9788983920928"
          className="mt-2 w-full rounded-xl border border-[#E5E5EA] bg-[#F5F5F7] px-4 py-3 text-[16px] font-semibold text-[#1D1D1F] outline-none focus:border-[#1D1D1F]"
        />

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={runLookup}
            disabled={!canSearch || loading}
            className={`px-6 py-2.5 rounded-full text-[14px] font-bold flex items-center gap-2 ${
              !canSearch || loading
                ? "bg-[#E5E5EA] text-[#86868B] cursor-not-allowed"
                : "bg-[#1D1D1F] text-white hover:bg-black"
            }`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            조회
          </button>
          <button
            type="button"
            onClick={() => setIsbn("9788983920928")}
            className="px-4 py-2.5 rounded-full text-[13px] font-semibold bg-[#F5F5F7] text-[#515154] hover:bg-[#E5E5EA]"
          >
            샘플 ISBN
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
          {!response && <p className="text-[14px] text-[#A1A1A6]">조회 결과가 없습니다.</p>}
          {response && (
            <div className="space-y-2 text-[14px]">
              <p><span className="font-bold">ISBN:</span> {response.isbn}</p>
              <p><span className="font-bold">TotalResults:</span> {response.totalResults}</p>
              {response.item ? (
                <>
                  <p><span className="font-bold">Title:</span> {response.item.title}</p>
                  <p><span className="font-bold">Author:</span> {response.item.author}</p>
                  <p><span className="font-bold">Publisher:</span> {response.item.publisher}</p>
                  <p><span className="font-bold">PubDate:</span> {response.item.pubDate}</p>
                </>
              ) : (
                <p className="text-[#86868B]">item 결과 없음</p>
              )}
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
