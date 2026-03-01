// 파일 경로: src/app/page.tsx

"use client";

import React, { useState, useMemo, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, ChevronRight, BookOpen, MapPin, CheckCircle2, XCircle, Info, Filter, X, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchLibraryData, DISTRICTS, DISTRICT_NAMES, SEOUL_LIBRARIES, SearchResultItem } from '@/lib/constants';

// 지역 도서관 모달 (이 페이지에서만 사용)
const LibraryListModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>("All");
  if (!isOpen) return null;
  const districtNames = Object.values(DISTRICT_NAMES).sort();
  const filteredLibraries = selectedDistrictName === "All" ? SEOUL_LIBRARIES : SEOUL_LIBRARIES.filter(lib => lib.district === selectedDistrictName);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#F5F5F7] rounded-[24px] shadow-[0_20px_40px_rgb(0,0,0,0.2)] w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden transform scale-100 animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-[#E5E5EA] flex justify-between items-center bg-white shrink-0">
          <div>
            <h3 className="text-[20px] font-bold text-[#1D1D1F] tracking-tight">지원 도서관 목록</h3>
            <p className="text-[13px] text-[#86868B] mt-1 font-medium">탐서에서 실시간 조회가 가능한 주요 도서관입니다.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-[#F5F5F7] text-[#86868B] hover:text-[#1D1D1F] rounded-full transition-colors"><X size={18} /></button>
        </div>
        <div className="px-6 py-4 bg-white shrink-0 border-b border-[#E5E5EA]">
          <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto custom-scrollbar">
            <button onClick={() => setSelectedDistrictName("All")} className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-colors ${selectedDistrictName === "All" ? "bg-[#1D1D1F] text-white" : "bg-[#F5F5F7] text-[#86868B] hover:bg-[#E5E5EA] hover:text-[#1D1D1F]"}`}>전체</button>
            {districtNames.map(dName => (<button key={dName} onClick={() => setSelectedDistrictName(dName)} className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-colors ${selectedDistrictName === dName ? "bg-[#1D1D1F] text-white" : "bg-[#F5F5F7] text-[#86868B] hover:bg-[#E5E5EA] hover:text-[#1D1D1F]"}`}>{dName}</button>))}
          </div>
        </div>
        <div className="overflow-y-auto p-6 grow bg-white">
          <ul className="divide-y divide-[#F5F5F7]">
            {filteredLibraries.length > 0 ? filteredLibraries.map((lib, idx) => (
              <li key={idx} className="py-4 flex items-center gap-4">
                <div className="w-8 text-center text-[12px] font-bold text-[#D2D2D7]">{idx + 1}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2"><span className="px-2 py-0.5 bg-[#F5F5F7] rounded-md text-[11px] font-bold text-[#86868B]">{lib.district}</span><span className="text-[15px] font-bold text-[#1D1D1F]">{lib.name}</span></div>
                  <p className="text-[13px] text-[#86868B] mt-1 font-medium">{lib.address}</p>
                </div>
              </li>
            )) : <li className="py-12 text-center text-[#86868B] font-medium">등록된 도서관이 없습니다.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
};

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [districtCode, setDistrictCode] = useState<string>("11140"); 
  const [bookInput, setBookInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<SearchResultItem[] | null>(null);
  const [searched, setSearched] = useState<boolean>(false);
  
  const [isFocused, setIsFocused] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showLibraryList, setShowLibraryList] = useState(false); 
  const textareaRef = useRef<HTMLTextAreaElement>(null); 

  const [expandedStats, setExpandedStats] = useState({ owned: false, available: false });
  const [availableLibraries, setAvailableLibraries] = useState<string[]>([]);
  const [selectedLibraries, setSelectedLibraries] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['available', 'unavailable']);
  const [selectedBookKeys, setSelectedBookKeys] = useState<Set<string>>(new Set()); 

  const SAFE_INPUT_REGEX = /^[가-힣a-zA-Z0-9\s]+$/;
  const getBookKey = (tIdx: number, bIdx: number) => `book-${tIdx}-${bIdx}`;

  // Next.js 라우터를 통해 전달받은 검색어 자동 입력
  useEffect(() => {
    const booksQuery = searchParams.get('books');
    if (booksQuery) {
      const books = decodeURIComponent(booksQuery).split(',');
      setBookInput(prev => {
        const existing = prev.split('\n').map(b => b.trim()).filter(b => b.length > 0);
        const combined = Array.from(new Set([...existing, ...books])).slice(0, 5);
        return combined.join('\n');
      });
      // 파라미터를 소모한 뒤 URL 정리 (새로고침 시 중복 방지)
      router.replace('/', { scroll: false });
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight, 62)}px`;
    }
  }, [bookInput]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    let terms = bookInput.split('\n').map(t => t.trim()).filter(t => t.length > 0);
    
    if (terms.length === 0) { alert("적어도 한 권 이상의 책 제목을 입력해주세요."); return; }
    for (const term of terms) { 
      if (!SAFE_INPUT_REGEX.test(term)) { alert(`보안 정책상 특수문자는 사용할 수 없습니다.\n입력값: "${term}"`); return; } 
    }
    if (terms.length > 5) { alert("최대 5권까지만 검색됩니다."); terms = terms.slice(0, 5); }

    setLoading(true); setSearched(true); setResults(null);
    setSelectedLibraries([]); setSelectedBookKeys(new Set()); setShowFilters(false);
    setExpandedStats({ owned: false, available: false });

    try {
      const data = await fetchLibraryData(districtCode, terms);
      setResults(data);
      const libs = new Set<string>();
      const allBookKeys = new Set<string>(); 
      data.forEach((item, tIdx) => {
        item.books.forEach((book, bIdx) => {
          allBookKeys.add(getBookKey(tIdx, bIdx));
          book.libraries.forEach(lib => libs.add(lib.libraryName));
        });
      });
      const libArray = Array.from(libs).sort();
      setAvailableLibraries(libArray);
      setSelectedLibraries(libArray);
      setSelectedBookKeys(allBookKeys); 
    } catch (error) { console.error("Search failed", error); } 
    finally { setLoading(false); }
  };

  const filteredResults = useMemo(() => {
    if (!results) return null;
    return results.map((term, tIdx) => {
      const filteredBooks = term.books.filter((_, bIdx) => selectedBookKeys.has(getBookKey(tIdx, bIdx)))
      .map(book => {
        const filteredLibs = book.libraries.filter(lib => {
          const nameMatch = selectedLibraries.includes(lib.libraryName);
          const statusMatch = (lib.isAvailable && selectedStatuses.includes('available')) || (!lib.isAvailable && selectedStatuses.includes('unavailable'));
          return nameMatch && statusMatch;
        });
        return { ...book, libraries: filteredLibs };
      }).filter(book => book.libraries.length > 0);
      return { ...term, books: filteredBooks };
    }).filter(term => term.books.length > 0);
  }, [results, selectedLibraries, selectedStatuses, selectedBookKeys]);

  const stats = useMemo(() => {
    if (!results || results.length === 0) return null;
    const libStats: Record<string, { owned: Set<string>, available: Set<string> }> = {};
    results.forEach(termResult => {
      termResult.books.forEach(book => {
        const bookId = book.metadata.title;
        book.libraries.forEach(lib => {
          if (!libStats[lib.libraryName]) { libStats[lib.libraryName] = { owned: new Set(), available: new Set() }; }
          libStats[lib.libraryName].owned.add(bookId);
          if (lib.isAvailable) libStats[lib.libraryName].available.add(bookId);
        });
      });
    });
    let maxOwnedCount = 0; let maxAvailableCount = 0;
    Object.values(libStats).forEach((s) => { 
      if (s.owned.size > maxOwnedCount) maxOwnedCount = s.owned.size; 
      if (s.available.size > maxAvailableCount) maxAvailableCount = s.available.size; 
    });
    const bestOwnedLibs: string[] = []; const bestAvailableLibs: string[] = [];
    Object.entries(libStats).forEach(([name, s]) => { 
      if (s.owned.size === maxOwnedCount && maxOwnedCount > 0) bestOwnedLibs.push(name); 
      if (s.available.size === maxAvailableCount && maxAvailableCount > 0) bestAvailableLibs.push(name); 
    });
    return { maxOwnedCount, bestOwnedLibs, maxAvailableCount, bestAvailableLibs };
  }, [results]);

  const toggleLibraryFilter = (libName: string) => { setSelectedLibraries(prev => prev.includes(libName) ? prev.filter(l => l !== libName) : [...prev, libName]); };
  const toggleAllLibraries = () => { if (selectedLibraries.length === availableLibraries.length) setSelectedLibraries([]); else setSelectedLibraries(availableLibraries); };
  const toggleStatusFilter = (status: string) => { setSelectedStatuses(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]); };
  const toggleTermGroup = (tIdx: number) => {
    if (!results) return;
    const term = results[tIdx];
    const childKeys = term.books.map((_, bIdx) => getBookKey(tIdx, bIdx));
    const allSelected = childKeys.every(k => selectedBookKeys.has(k));
    const newSet = new Set(selectedBookKeys);
    if (allSelected) childKeys.forEach(k => newSet.delete(k)); else childKeys.forEach(k => newSet.add(k));
    setSelectedBookKeys(newSet);
  };
  const toggleBookItem = (tIdx: number, bIdx: number) => {
    const key = getBookKey(tIdx, bIdx);
    const newSet = new Set(selectedBookKeys);
    if (newSet.has(key)) newSet.delete(key); else newSet.add(key);
    setSelectedBookKeys(newSet);
  };

  const ResultsSkeleton = () => (
    <div className="mt-20 space-y-8 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-16"><div className="h-40 bg-white rounded-[24px] border border-[#E5E5EA]"></div><div className="h-40 bg-[#E5E5EA] rounded-[24px]"></div></div>
      {[1, 2].map((i) => (
        <div key={i} className="bg-white rounded-[24px] p-8 md:p-10 border border-[#E5E5EA] flex flex-col md:flex-row gap-8">
          <div className="w-[140px] md:w-[180px] aspect-[2/3] bg-[#F5F5F7] rounded-[4px] shrink-0 mx-auto md:mx-0"></div>
          <div className="flex-1 space-y-4 py-4"><div className="h-8 bg-[#F5F5F7] rounded-md w-3/4"></div><div className="h-4 bg-[#F5F5F7] rounded-md w-1/2"></div><div className="mt-12 space-y-3"><div className="h-10 bg-[#F5F5F7] rounded-xl w-full"></div></div></div>
        </div>
      ))}
    </div>
  );

  return (
    <main className="pt-28 pb-32 px-4 sm:px-6 max-w-4xl mx-auto">
      <div className={`transition-all duration-[800ms] cubic-bezier(0.16, 1, 0.3, 1) transform ${searched && !loading ? 'translate-y-0' : 'translate-y-[15vh]'}`}>
        <div className="text-center mb-8">
          <h1 className="text-[36px] md:text-[52px] font-bold tracking-tight text-[#1D1D1F] leading-[1.15] mb-3">원하는 지식을 <br className="md:hidden" />발견하세요.</h1>
          <p className="text-[17px] md:text-[19px] text-[#86868B] font-medium tracking-tight">서울시 자치구의 도서관을 하나의 창에서.</p>
        </div>

        <form onSubmit={handleSearch} className="w-full max-w-[720px] mx-auto">
          <div className={`relative bg-white rounded-[28px] p-2 flex flex-col transition-all duration-500 ease-out border border-transparent ${isFocused ? 'shadow-[0_12px_40px_rgb(0,0,0,0.12)] scale-[1.01] border-[#E5E5EA]' : 'shadow-[0_4px_20px_rgb(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgb(0,0,0,0.08)]'}`}>
            <div className="flex items-start px-4 pt-4 pb-2">
              <Search className="w-6 h-6 text-[#86868B] shrink-0 mt-0.5" strokeWidth={2.5} />
              <textarea ref={textareaRef} rows={2} value={bookInput} onChange={(e) => setBookInput(e.target.value)} placeholder="찾고 싶은 책 제목을 입력하세요.&#10;(줄바꿈으로 여러 권 동시 검색)" className="w-full ml-4 bg-transparent text-[19px] font-semibold text-[#1D1D1F] placeholder:text-[#86868B]/50 focus:outline-none resize-none leading-relaxed custom-scrollbar overflow-hidden" style={{ minHeight: '62px' }} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-2 pt-3 px-4 pb-2 border-t border-[#F5F5F7] gap-4 sm:gap-0">
              <div className="flex items-center gap-4">
                <div className="relative flex items-center">
                  <MapPin className="w-4 h-4 text-[#86868B] absolute left-0" />
                  <select value={districtCode} onChange={(e) => setDistrictCode(e.target.value)} className="bg-transparent pl-6 pr-4 text-[15px] font-bold text-[#1D1D1F] focus:outline-none cursor-pointer appearance-none hover:text-[#0066CC] transition-colors">
                    {DISTRICTS.map((code) => (<option key={code} value={code}>{DISTRICT_NAMES[code]}</option>))}
                  </select>
                </div>
                <button type="button" onClick={() => setShowLibraryList(true)} className="text-[13px] text-[#86868B] hover:text-[#1D1D1F] font-semibold flex items-center gap-1 transition-colors">
                  <Info size={14} /> 지원 도서관
                </button>
              </div>
              <div className="flex items-center gap-3 self-end sm:self-auto">
                <button type="submit" disabled={loading || !bookInput.trim()} className="bg-[#1D1D1F] text-white px-8 py-2.5 rounded-full text-[15px] font-bold hover:bg-black transition-transform active:scale-95 disabled:opacity-30 flex items-center gap-2">
                  {loading ? <><Loader2 className="animate-spin w-4 h-4"/> 탐색 중</> : '탐서 시작'}
                </button>
              </div>
            </div>
          </div>
          <div className={`mt-5 text-center transition-opacity duration-500 ${searched ? 'opacity-0 h-0 overflow-hidden mt-0' : 'opacity-100'}`}>
            <p className="text-[12px] md:text-[13px] text-[#86868B] flex items-center justify-center gap-1.5 font-medium">
              <Info size={14} className="shrink-0" /> 한 번에 최대 5권까지 검색 가능하며, 검색어당 인기 도서 상위 3권까지 자동으로 검색됩니다.
            </p>
          </div>
        </form>
      </div>

      {loading && <ResultsSkeleton />}

      {!loading && searched && filteredResults && stats && (
        <div className="mt-16 animate-in fade-in slide-in-from-bottom-8 duration-[1000ms] ease-out">
          <section className="mb-16">
            <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-3 mb-6">
              <span className="text-[13px] font-bold text-[#86868B] uppercase tracking-[0.15em]">Insights</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              <div className="bg-white rounded-[24px] p-6 sm:p-8 shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-[#E5E5EA] flex flex-col hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300">
                <div className="flex items-center gap-2 mb-6"><div className="w-8 h-8 rounded-full bg-[#F5F5F7] flex items-center justify-center shrink-0"><BookOpen size={16} className="text-[#86868B]" /></div><span className="text-[13px] font-bold text-[#86868B]">가장 많은 종류를 보유한 곳</span></div>
                <div className="flex-1 flex flex-col justify-center">
                  <p className="text-[14px] text-[#86868B] font-medium mb-3">검색하신 책 중 <span className="text-[#1D1D1F] font-bold text-[16px]">{stats.maxOwnedCount}권</span>을 보유하고 있습니다.</p>
                  {stats.bestOwnedLibs.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {stats.bestOwnedLibs.slice(0, expandedStats.owned ? undefined : 2).map((lib, i) => (<div key={i} className="bg-[#F5F5F7] border border-[#E5E5EA] px-3.5 py-1.5 rounded-lg text-[14px] font-bold text-[#1D1D1F] shadow-sm">{lib}</div>))}
                      {stats.bestOwnedLibs.length > 2 && (<button onClick={() => setExpandedStats(p => ({...p, owned: !p.owned}))} className="text-[13px] text-[#0066CC] font-semibold px-2 py-1 hover:bg-[#0066CC]/10 rounded-md transition-colors ml-1">{expandedStats.owned ? '접기' : `+${stats.bestOwnedLibs.length - 2}곳 더보기`}</button>)}
                    </div>
                  ) : (<div className="text-[24px] font-bold text-[#1D1D1F]">-</div>)}
                </div>
              </div>

              <div className="bg-[#1D1D1F] rounded-[24px] p-6 sm:p-8 shadow-[0_8px_20px_rgb(0,0,0,0.12)] flex flex-col relative overflow-hidden group/card transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#34C759] opacity-10 rounded-full blur-2xl transition-opacity duration-500"></div>
                <div className="flex items-center gap-2 mb-6 relative z-10"><div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0"><CheckCircle2 size={16} className="text-[#34C759]" /></div><span className="text-[13px] font-bold text-white/70">가장 많이 즉시 대출 가능한 곳</span></div>
                <div className="flex-1 flex flex-col justify-center relative z-10">
                  <p className="text-[14px] text-white/70 font-medium mb-3"><span className="text-white font-bold text-[16px]">{stats.maxAvailableCount}권</span> 바로 대출이 가능합니다.</p>
                  {stats.bestAvailableLibs.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {stats.bestAvailableLibs.slice(0, expandedStats.available ? undefined : 2).map((lib, i) => (<div key={i} className="bg-white/10 border border-white/5 px-3.5 py-1.5 rounded-lg text-[14px] font-bold text-white shadow-sm">{lib}</div>))}
                      {stats.bestAvailableLibs.length > 2 && (<button onClick={() => setExpandedStats(p => ({...p, available: !p.available}))} className="text-[13px] text-white/70 font-semibold px-2 py-1 hover:bg-white/10 rounded-md transition-colors ml-1">{expandedStats.available ? '접기' : `+${stats.bestAvailableLibs.length - 2}곳 더보기`}</button>)}
                    </div>
                  ) : (<div className="text-[24px] font-bold text-white">-</div>)}
                </div>
              </div>
            </div>
          </section>
          
          <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-3 mb-6">
            <span className="text-[13px] font-bold text-[#86868B] uppercase tracking-[0.15em]">Books Found ({filteredResults.length})</span>
            <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-1.5 text-[13px] font-bold px-3 py-1.5 rounded-full transition-colors ${showFilters ? 'bg-[#1D1D1F] text-white' : 'bg-[#F5F5F7] text-[#86868B] hover:text-[#1D1D1F]'}`}>
              <Filter size={14} /> 상세 옵션 {showFilters ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
            </button>
          </div>

          {showFilters && (
            <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_12px_rgb(0,0,0,0.03)] border border-[#E5E5EA] mb-8 grid grid-cols-1 md:grid-cols-3 gap-8 animate-in slide-in-from-top-4 fade-in duration-300">
              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-[13px] font-bold text-[#1D1D1F]">도서 선택</h4>
                  <button type="button" onClick={() => { const all = new Set<string>(); results?.forEach((t, ti) => t.books.forEach((_, bi) => all.add(getBookKey(ti, bi)))); setSelectedBookKeys(all); }} className="text-[11px] font-bold text-[#86868B] hover:text-[#1D1D1F]">전체선택</button>
                </div>
                <div className="space-y-4 max-h-[180px] overflow-y-auto custom-scrollbar pr-2">
                  {results?.map((term, tIdx) => (
                    <div key={tIdx}>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" checked={term.books.every((_, bIdx) => selectedBookKeys.has(getBookKey(tIdx, bIdx)))} onChange={() => toggleTermGroup(tIdx)} className="w-4 h-4 accent-[#1D1D1F] cursor-pointer" />
                        <span className="text-[14px] font-bold text-[#1D1D1F] group-hover:text-[#0066CC] transition-colors line-clamp-1">{tIdx + 1}. {term.searchTerm}</span>
                      </label>
                      <div className="ml-6 mt-2 space-y-2 border-l-2 border-[#F5F5F7] pl-3">
                        {term.books.map((book, bIdx) => (
                          <label key={bIdx} className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" checked={selectedBookKeys.has(getBookKey(tIdx, bIdx))} onChange={() => toggleBookItem(tIdx, bIdx)} className="w-3.5 h-3.5 accent-[#1D1D1F] cursor-pointer" />
                            <span className="text-[13px] font-medium text-[#86868B] group-hover:text-[#1D1D1F] transition-colors line-clamp-1">{book.metadata.title}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col md:border-l border-[#F5F5F7] md:pl-8">
                <div className="flex justify-between items-center mb-4"><h4 className="text-[13px] font-bold text-[#1D1D1F]">도서관 선택</h4><button type="button" onClick={toggleAllLibraries} className="text-[11px] font-bold text-[#86868B] hover:text-[#1D1D1F]">반전</button></div>
                <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto custom-scrollbar pr-2">
                  {availableLibraries.map(lib => (
                    <label key={lib} className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" checked={selectedLibraries.includes(lib)} onChange={() => toggleLibraryFilter(lib)} className="w-4 h-4 accent-[#1D1D1F] cursor-pointer" />
                      <span className="text-[13px] font-medium text-[#86868B] group-hover:text-[#1D1D1F] transition-colors truncate">{lib}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex flex-col md:border-l border-[#F5F5F7] md:pl-8">
                <h4 className="text-[13px] font-bold text-[#1D1D1F] mb-4">대출 상태</h4>
                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-3 cursor-pointer group bg-[#F5F5F7] p-3 rounded-xl hover:bg-[#E5E5EA] transition-colors">
                    <input type="checkbox" checked={selectedStatuses.includes('available')} onChange={() => toggleStatusFilter('available')} className="w-4 h-4 accent-[#34C759] cursor-pointer" />
                    <span className="flex items-center gap-1.5 text-[14px] font-bold text-[#1D1D1F]"><CheckCircle2 size={16} className="text-[#34C759]" /> 대출 가능</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group bg-[#F5F5F7] p-3 rounded-xl hover:bg-[#E5E5EA] transition-colors">
                    <input type="checkbox" checked={selectedStatuses.includes('unavailable')} onChange={() => toggleStatusFilter('unavailable')} className="w-4 h-4 accent-[#FF3B30] cursor-pointer" />
                    <span className="flex items-center gap-1.5 text-[14px] font-bold text-[#1D1D1F]"><XCircle size={16} className="text-[#FF3B30]" /> 대출 중</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {filteredResults.length > 0 ? (
            <div className="space-y-10">
              {filteredResults.map((term, tIdx) => (
                <React.Fragment key={`term-${tIdx}`}>
                  {term.books.map((book, bIdx) => (
                    <article key={`book-${tIdx}-${bIdx}`} className="group bg-white rounded-[24px] p-6 md:p-10 shadow-[0_2px_12px_rgb(0,0,0,0.03)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] transition-all duration-500 flex flex-col md:flex-row gap-6 md:gap-12 relative overflow-hidden border border-[#E5E5EA]/50">
                      <div className="shrink-0 mx-auto md:mx-0 relative z-10">
                        <div className="w-[120px] md:w-[160px] aspect-[2/3] rounded-[4px] overflow-hidden relative shadow-[10px_10px_20px_rgba(0,0,0,0.1),-5px_0_10px_rgba(0,0,0,0.02)] transition-transform duration-500 group-hover:-translate-y-2 group-hover:scale-[1.02] bg-[#F5F5F7]">
                          {book.metadata.imageUrl ? (<img src={book.metadata.imageUrl} alt={book.metadata.title} className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />) : (<div className="w-full h-full flex items-center justify-center"><BookOpen className="w-10 h-10 text-[#D2D2D7]" /></div>)}
                          <div className="absolute inset-0 bg-gradient-to-tr from-black/[0.02] via-transparent to-white/[0.1] mix-blend-overlay"></div><div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-r from-white/40 to-transparent"></div>
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col relative z-10">
                        <header className="mb-6">
                          <div className="text-[11px] font-bold text-[#86868B] mb-2 bg-[#F5F5F7] inline-block px-2 py-1 rounded">검색어: {term.searchTerm}</div>
                          <h2 className="text-[24px] md:text-[32px] font-bold tracking-tight text-[#1D1D1F] leading-[1.25] mb-2 line-clamp-2">{book.metadata.title}</h2>
                          <p className="text-[15px] text-[#86868B] font-medium tracking-tight">{book.metadata.author} <span className="mx-2 text-[#D2D2D7]">|</span> {book.metadata.publisher} <span className="mx-2 text-[#D2D2D7]">|</span> {book.metadata.pubYear}</p>
                          <p className="text-[11px] text-[#A1A1A6] font-mono mt-2">ISBN {book.metadata.isbn}</p>
                        </header>
                        <div className="mt-auto border-t border-[#F5F5F7] pt-6">
                          <h3 className="text-[11px] font-bold text-[#86868B] uppercase tracking-[0.15em] mb-4">Availability</h3>
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8">
                            {book.libraries.map((lib, lIdx) => (
                              <li key={lIdx} className="flex items-center justify-between p-2 -mx-2 rounded-lg hover:bg-[#F5F5F7] transition-colors cursor-default">
                                <span className="text-[14px] font-semibold text-[#1D1D1F]">{lib.libraryName}</span>
                                <div className="flex items-center gap-2">
                                  {lib.isAvailable ? (<><span className="text-[12px] font-bold text-[#34C759]">가능</span><div className="w-2 h-2 rounded-full bg-[#34C759] shadow-[0_0_8px_rgba(52,199,89,0.4)]"></div></>) : (<><span className="text-[12px] font-bold text-[#FF3B30]">대출중</span><div className="w-2 h-2 rounded-full bg-[#FF3B30]"></div></>)}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </article>
                  ))}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-[24px] py-20 px-6 text-center shadow-sm border border-[#E5E5EA]">
              <Search size={48} strokeWidth={1} className="mx-auto text-[#D2D2D7] mb-4" />
              <h3 className="text-[20px] font-bold text-[#1D1D1F] mb-2">조건에 맞는 결과가 없습니다</h3>
            </div>
          )}
        </div>
      )}
      {!loading && searched && results && results.length === 0 && (
        <div className="mt-20 bg-white rounded-[24px] py-20 px-6 text-center shadow-sm border border-[#E5E5EA] animate-in fade-in">
          <Search size={48} strokeWidth={1} className="mx-auto text-[#D2D2D7] mb-4" />
          <h3 className="text-[20px] font-bold text-[#1D1D1F] mb-2">지식을 찾지 못했습니다</h3>
        </div>
      )}
      <LibraryListModal isOpen={showLibraryList} onClose={() => setShowLibraryList(false)} />
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="pt-32 pb-32 text-center text-[#86868B] font-medium">로딩 중입니다...</div>}>
      <SearchContent />
    </Suspense>
  );
}