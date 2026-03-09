// 파일 경로: src/app/page.tsx

"use client";

import React, { useState, useMemo, useRef, useEffect, Suspense } from 'react';
import { Search, ChevronRight, BookOpen, MapPin, CheckCircle2, Info, X, Loader2, ChevronDown, Hammer, XCircle, Sparkles } from 'lucide-react';
import { TamseoLogo } from '@/components/SharedUI';

// =========================================================================
// 🛠️ CANVAS PREVIEW MOCKS
// (미리보기 환경에서 next/navigation 및 외부 모듈을 임시로 대체합니다)
// =========================================================================
const useSearchParams = () => new URLSearchParams('');
const useRouter = () => ({
  replace: (..._args: any[]) => {},
  push: (..._args: any[]) => {},
});

interface BookMetadata { title: string; author: string; publisher: string; pubYear: string; isbn: string; imageUrl?: string; }
interface LibraryAvailability { libraryName: string; isAvailable: boolean; }
interface GroupedBookResult { metadata: BookMetadata; libraries: LibraryAvailability[]; }
interface SearchResultItem { searchTerm: string; books: GroupedBookResult[]; }
interface LibraryInfo { district: string; name: string; address: string; }
interface ExpandedSearchTerm { original: string; expanded: string; }
interface SearchApiResponse {
  results: SearchResultItem[];
  invalidTerms?: string[];
  expandedTerms?: ExpandedSearchTerm[];
}

const DISTRICTS = ["11230", "11250", "11090", "11160", "11210", "11050", "11170", "11180", "11110", "11100", "11060", "11200", "11140", "11130", "11220", "11040", "11080", "11240", "11150", "11190", "11030", "11120", "11010", "11020", "11070"];
const DISTRICT_NAMES: Record<string, string> = { "11230": "강남구", "11250": "강동구", "11090": "강북구", "11160": "강서구", "11210": "관악구", "11050": "광진구", "11170": "구로구", "11180": "금천구", "11110": "노원구", "11100": "도봉구", "11060": "동대문구", "11200": "동작구", "11140": "마포구", "11130": "서대문구", "11220": "서초구", "11040": "성동구", "11080": "성북구", "11240": "송파구", "11150": "양천구", "11190": "영등포구", "11030": "용산구", "11120": "은평구", "11010": "종로구", "11020": "중구", "11070": "중랑구" };
const SEOUL_LIBRARIES: LibraryInfo[] = [
  { district: "마포구", name: "마포중앙도서관", address: "서울 마포구 성산로 128" },
  { district: "마포구", name: "마포평생학습관", address: "서울 마포구 홍익로2길 16" },
  { district: "강남구", name: "강남구립못골도서관", address: "서울 강남구 자곡로 116" },
  { district: "강남구", name: "강남도서관", address: "서울 강남구 선릉로116길 45" },
];

const fetchLibraryData = async (
  districtCode: string,
  bookTitles: string[]
): Promise<SearchApiResponse> => {
  const params = new URLSearchParams({
    district: districtCode,
    queries: bookTitles.join(','),
  });
  const response = await fetch(`/api/search?${params.toString()}`, {
    method: 'GET',
    cache: 'no-store',
  });
  if (!response.ok) {
    let message = `검색 API 요청 실패 (${response.status})`;
    let invalidTerms: string[] = [];
    try {
      const errorBody = await response.json();
      if (errorBody?.error) message = errorBody.error;
      if (Array.isArray(errorBody?.invalidTerms)) invalidTerms = errorBody.invalidTerms;
    } catch {}
    const err = new Error(message) as Error & { invalidTerms?: string[] };
    err.invalidTerms = invalidTerms;
    throw err;
  }
  const data = await response.json();
  if (Array.isArray(data)) {
    return { results: data, invalidTerms: [], expandedTerms: [] };
  }
  return {
    results: Array.isArray(data?.results) ? data.results : [],
    invalidTerms: Array.isArray(data?.invalidTerms) ? data.invalidTerms : [],
    expandedTerms: Array.isArray(data?.expandedTerms) ? data.expandedTerms : [],
  };
};

const DISTRICT_WHEEL_ITEM_HEIGHT = 44;
const DISTRICT_WHEEL_VISIBLE_ROWS = 5;
const splitInputTerms = (value: string): string[] =>
  value
    .split(/[\n,]/)
    .map((term) => term.trim())
    .filter((term) => term.length > 0);

const DistrictWheelPicker = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollEndTimerRef = useRef<number | null>(null);

  const options = useMemo(
    () => DISTRICTS.map((code) => ({ code, name: DISTRICT_NAMES[code] })),
    []
  );
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.code === value)
  );
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const wheelHeight = DISTRICT_WHEEL_ITEM_HEIGHT * DISTRICT_WHEEL_VISIBLE_ROWS;
  const spacerHeight = DISTRICT_WHEEL_ITEM_HEIGHT * Math.floor(DISTRICT_WHEEL_VISIBLE_ROWS / 2);

  useEffect(() => {
    setActiveIndex(selectedIndex);
  }, [selectedIndex]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (!open || !scrollRef.current) return;
    requestAnimationFrame(() => {
      if (!scrollRef.current) return;
      scrollRef.current.scrollTo({
        top: selectedIndex * DISTRICT_WHEEL_ITEM_HEIGHT,
        behavior: "smooth",
      });
    });
  }, [open, selectedIndex]);

  useEffect(
    () => () => {
      if (scrollEndTimerRef.current) window.clearTimeout(scrollEndTimerRef.current);
    },
    []
  );

  const handleWheelScroll = () => {
    if (!scrollRef.current) return;
    const nextIndex = Math.round(scrollRef.current.scrollTop / DISTRICT_WHEEL_ITEM_HEIGHT);
    const safeIndex = Math.max(0, Math.min(options.length - 1, nextIndex));
    setActiveIndex(safeIndex);

    if (scrollEndTimerRef.current) window.clearTimeout(scrollEndTimerRef.current);
    scrollEndTimerRef.current = window.setTimeout(() => {
      if (!scrollRef.current) return;
      const targetTop = safeIndex * DISTRICT_WHEEL_ITEM_HEIGHT;
      scrollRef.current.scrollTo({ top: targetTop, behavior: "smooth" });
      const nextCode = options[safeIndex]?.code;
      if (nextCode && nextCode !== value) onChange(nextCode);
    }, 90);
  };

  return (
    <div ref={containerRef} className="relative flex items-center">
      <MapPin className="w-4 h-4 text-[#86868B] absolute left-0 pointer-events-none" />
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="bg-transparent pl-6 pr-4 text-[15px] font-bold text-[#1D1D1F] hover:text-[#0066CC] transition-colors flex items-center gap-1"
      >
        <span>{DISTRICT_NAMES[value]}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-9 left-0 z-40 w-[180px] rounded-2xl border border-[#E5E5EA] bg-white/95 backdrop-blur-xl shadow-[0_18px_36px_rgba(0,0,0,0.12)] p-3">
          <div className="relative" style={{ height: `${wheelHeight}px` }}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white via-white/85 to-transparent z-10 rounded-t-xl" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white via-white/85 to-transparent z-10 rounded-b-xl" />
            <div className="pointer-events-none absolute inset-x-1 top-1/2 -translate-y-1/2 h-11 rounded-xl border border-[#D2D2D7]/60 bg-[#F5F5F7]/60 z-0" />
            <div
              ref={scrollRef}
              onScroll={handleWheelScroll}
              className="h-full overflow-y-auto snap-y snap-mandatory scroll-smooth custom-scrollbar relative z-20 [perspective:1000px]"
            >
              <div style={{ height: `${spacerHeight}px` }} />
              {options.map((option, index) => {
                const distance = index - activeIndex;
                const absDistance = Math.abs(distance);
                const scale = Math.max(0.8, 1 - absDistance * 0.1);
                const opacity = Math.max(0.35, 1 - absDistance * 0.22);
                const rotateX = Math.max(-26, Math.min(26, distance * -10));
                return (
                  <button
                    key={option.code}
                    type="button"
                    onClick={() => {
                      onChange(option.code);
                      setOpen(false);
                    }}
                    className="w-full h-11 snap-center flex items-center justify-center text-[14px] font-semibold tracking-tight transition-all duration-200"
                    style={{
                      transform: `rotateX(${rotateX}deg) scale(${scale})`,
                      opacity,
                      color: option.code === value ? "#1D1D1F" : "#86868B",
                    }}
                  >
                    {option.name}
                  </button>
                );
              })}
              <div style={{ height: `${spacerHeight}px` }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// ✨ [수정됨] 지역 도서관 모달 (DB API 연동 및 로딩 상태 추가)
const LibraryListModal = ({
  isOpen,
  onClose,
  initialDistrictName,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialDistrictName: string;
}) => {
  const [libraries, setLibraries] = useState<LibraryInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>("All");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  // 모달이 열릴 때 한 번만 전체 도서관 목록을 백엔드에서 가져옵니다.
  useEffect(() => {
    if (isOpen && libraries.length === 0) {
      setLoading(true);
      fetch('/api/libraries')
        .then(res => {
          if (!res.ok) throw new Error("API Route is unavailable in Canvas");
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data)) setLibraries(data);
          setUpdatedAt(new Date().toISOString());
        })
        .catch(err => {
          console.error("도서관 목록 호출 실패:", err);
          // Canvas 미리보기를 위한 예외 처리(Mock Data 적용)
          setTimeout(() => setLibraries(SEOUL_LIBRARIES), 800);
          setUpdatedAt(new Date().toISOString());
        })
        .finally(() => setTimeout(() => setLoading(false), 800));
    }
  }, [isOpen, libraries.length]);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedDistrictName(initialDistrictName || "All");
  }, [isOpen, initialDistrictName]);

  if (!isOpen) return null;
  
  const districtNames = Object.values(DISTRICT_NAMES).sort();
  const filteredLibraries = selectedDistrictName === "All" ? libraries : libraries.filter(lib => lib.district === selectedDistrictName);
  const updatedLabel = updatedAt
    ? new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(updatedAt))
    : "-";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#F5F5F7] rounded-[24px] shadow-[0_20px_40px_rgb(0,0,0,0.2)] w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden transform scale-100 animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-[#E5E5EA] flex justify-between items-center bg-white shrink-0">
          <div>
            <h3 className="text-[20px] font-bold text-[#1D1D1F] tracking-tight">
              지원 도서관 목록
              <span className="ml-2 text-[13px] font-semibold text-[#86868B]">서울 {libraries.length}곳</span>
            </h3>
            <p className="text-[13px] text-[#86868B] mt-1 font-medium">탐서에서 실시간 조회가 가능한 주요 도서관입니다.</p>
            <p className="text-[11px] text-[#A1A1A6] mt-1 font-semibold tracking-wide">업데이트 {updatedLabel}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-[#F5F5F7] text-[#86868B] hover:text-[#1D1D1F] rounded-full transition-colors"><X size={18} /></button>
        </div>
        
        {/* 지역 필터 탭 */}
        <div className="px-6 py-4 bg-white shrink-0 border-b border-[#E5E5EA]">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setSelectedDistrictName("All")} className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-colors ${selectedDistrictName === "All" ? "bg-[#1D1D1F] text-white" : "bg-[#F5F5F7] text-[#86868B] hover:bg-[#E5E5EA] hover:text-[#1D1D1F]"}`}>전체</button>
            {districtNames.map(dName => (<button key={dName} onClick={() => setSelectedDistrictName(dName)} className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-colors ${selectedDistrictName === dName ? "bg-[#1D1D1F] text-white" : "bg-[#F5F5F7] text-[#86868B] hover:bg-[#E5E5EA] hover:text-[#1D1D1F]"}`}>{dName}</button>))}
          </div>
        </div>
        
        {/* 도서관 목록 리스트 영역 */}
        <div className="overflow-y-auto p-6 grow bg-white custom-scrollbar">
          <ul className="divide-y divide-[#F5F5F7]">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-[#86868B]">
                <Loader2 className="animate-spin w-8 h-8 mb-4 text-[#D2D2D7]" />
                <p className="text-[14px] font-medium">서울시 전체 도서관 데이터를 불러오는 중입니다...</p>
                <p className="text-[12px] mt-1 opacity-70">(최초 1회에는 DB 동기화로 약 5~10초 소요됩니다)</p>
              </div>
            ) : filteredLibraries.length > 0 ? (
              filteredLibraries.map((lib, idx) => (
                <li key={idx} className="py-4 flex items-center gap-4">
                  <div className="w-8 text-center text-[12px] font-bold text-[#D2D2D7]">{idx + 1}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-[#F5F5F7] rounded-md text-[11px] font-bold text-[#86868B]">{lib.district}</span>
                      <span className="text-[15px] font-bold text-[#1D1D1F]">{lib.name}</span>
                    </div>
                    <p className="text-[13px] text-[#86868B] mt-1 font-medium">{lib.address}</p>
                  </div>
                </li>
              ))
            ) : (
              <li className="py-12 text-center text-[#86868B] font-medium">해당 지역에 등록된 도서관이 없습니다.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

// ... 아래는 기존 SearchContent 및 App 컴포넌트 내용과 100% 동일하게 이어집니다 ...
function SearchContent({
  injectedBooks,
  setInjectedBooks,
}: {
  injectedBooks: string[];
  setInjectedBooks: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [districtCode, setDistrictCode] = useState<string>("11230"); 
  const [districtReady, setDistrictReady] = useState(false);
  const [bookInput, setBookInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [slowLoading, setSlowLoading] = useState<boolean>(false);
  const [emptyTerms, setEmptyTerms] = useState<string[]>([]);
  const [expandedTerms, setExpandedTerms] = useState<ExpandedSearchTerm[]>([]);
  const [results, setResults] = useState<SearchResultItem[] | null>(null);
  const [searched, setSearched] = useState<boolean>(false);
  
  const [isFocused, setIsFocused] = useState(false);
  const [showLibraryList, setShowLibraryList] = useState(false); 
  const textareaRef = useRef<HTMLTextAreaElement>(null); 

  const [expandedStats, setExpandedStats] = useState({ owned: false, available: false });
  const formRef = useRef<HTMLFormElement>(null);
  const slowLoadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const SAFE_INPUT_REGEX = /^[가-힣a-zA-Z0-9\s]+$/;

  useEffect(() => {
    let cancelled = false;

    const initializeDistrict = async () => {
      const storedDistrict = localStorage.getItem('tamseo-selected-district');
      if (storedDistrict && DISTRICTS.includes(storedDistrict)) {
        if (!cancelled) {
          setDistrictCode(storedDistrict);
          setDistrictReady(true);
        }
        return;
      }

      try {
        const res = await fetch('/api/location/default-district', {
          method: 'GET',
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('지역 기본값 조회 실패');
        const data = await res.json();
        const nextCode = typeof data?.districtCode === 'string' ? data.districtCode : '11230';
        if (!cancelled && DISTRICTS.includes(nextCode)) setDistrictCode(nextCode);
      } catch {
        if (!cancelled) setDistrictCode('11230');
      } finally {
        if (!cancelled) setDistrictReady(true);
      }
    };

    void initializeDistrict();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!districtReady) return;
    localStorage.setItem('tamseo-selected-district', districtCode);
  }, [districtCode, districtReady]);

  useEffect(() => {
    const booksQuery = searchParams.get('books');
    if (booksQuery) {
      const books = decodeURIComponent(booksQuery).split(',');
      setBookInput(prev => {
        const existing = splitInputTerms(prev);
        const combined = Array.from(new Set([...existing, ...books])).slice(0, 5);
        return combined.join('\n');
      });
      router.replace('/', { scroll: false } as any);
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (injectedBooks.length === 0) return;

    setBookInput((prev) => {
      const existing = splitInputTerms(prev);
      const combined = Array.from(new Set([...existing, ...injectedBooks])).slice(0, 5);
      return combined.join('\n');
    });
    setInjectedBooks([]);
  }, [injectedBooks, setInjectedBooks]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight, 62)}px`;
    }
  }, [bookInput]);

  useEffect(() => {
    return () => {
      if (slowLoadingTimerRef.current) {
        clearTimeout(slowLoadingTimerRef.current);
      }
    };
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    let terms = splitInputTerms(bookInput);
    
    if (terms.length === 0) { alert("적어도 한 권 이상의 책 제목을 입력해주세요."); return; }
    for (const term of terms) { 
      if (!SAFE_INPUT_REGEX.test(term)) { alert(`보안 정책상 특수문자는 사용할 수 없습니다.\n입력값: "${term}"`); return; } 
    }
    if (terms.length > 5) { alert("최대 5권까지만 검색됩니다."); terms = terms.slice(0, 5); }

    if (slowLoadingTimerRef.current) clearTimeout(slowLoadingTimerRef.current);
    setSlowLoading(false);
    slowLoadingTimerRef.current = setTimeout(() => setSlowLoading(true), 3000);

    setLoading(true); setSearched(true); setResults(null);
    setEmptyTerms([]);
    setExpandedTerms([]);
    setExpandedStats({ owned: false, available: false });

    try {
      const data = await fetchLibraryData(districtCode, terms);
      const successfulResults = data.results.filter(
        (item) => Array.isArray(item.books) && item.books.length > 0
      );
      const successfulTerms = new Set(
        successfulResults
          .map((item) => item.searchTerm.trim())
          .filter((term) => term.length > 0)
      );
      const emptyTermsFromResults = data.results
        .filter((item) => !Array.isArray(item.books) || item.books.length === 0)
        .map((item) => item.searchTerm.trim())
        .filter((term) => term.length > 0);
      const knownEmptyTerms = Array.from(
        new Set([...(data.invalidTerms ?? []), ...emptyTermsFromResults].map((term) => term.trim()).filter((term) => term.length > 0))
      );
      const knownEmptyTermSet = new Set(knownEmptyTerms);
      const unresolvedNoHoldingTerms = Array.from(
        new Set(terms.map((term) => term.trim()).filter((term) => term.length > 0))
      ).filter((term) => !successfulTerms.has(term) && !knownEmptyTermSet.has(term));
      const mergedEmptyTerms = Array.from(new Set([...knownEmptyTerms, ...unresolvedNoHoldingTerms]));
      const successfulTermSet = new Set(
        successfulResults
          .map((item) => item.searchTerm.trim())
          .filter((term) => term.length > 0)
      );
      const normalizedExpandedTerms = (data.expandedTerms ?? [])
        .map((item) => ({
          original: typeof item?.original === "string" ? item.original.trim() : "",
          expanded: typeof item?.expanded === "string" ? item.expanded.trim() : "",
        }))
        .filter((item) => item.original.length > 0 && item.expanded.length > 0)
        .filter((item) => successfulTermSet.has(item.original));

      setResults(successfulResults);
      setEmptyTerms(mergedEmptyTerms);
      setExpandedTerms(normalizedExpandedTerms);
    } catch (error) {
      console.error("Search failed", error);
      const invalidTerms = (error as Error & { invalidTerms?: string[] }).invalidTerms ?? [];
      setEmptyTerms(invalidTerms);
      setExpandedTerms([]);
      setResults([]);
    } finally {
      if (slowLoadingTimerRef.current) {
        clearTimeout(slowLoadingTimerRef.current);
        slowLoadingTimerRef.current = null;
      }
      setSlowLoading(false);
      setLoading(false);
    }
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  const filteredResults = useMemo(() => {
    if (!results) return [];
    return results.filter((item) => Array.isArray(item.books) && item.books.length > 0);
  }, [results]);

  const totalFilteredBookCount = useMemo(() => {
    return filteredResults.reduce((sum, term) => sum + term.books.length, 0);
  }, [filteredResults]);

  const stats = useMemo(() => {
    if (filteredResults.length === 0) return null;
    const libStats: Record<string, { ownedTerms: Set<string>, availableTerms: Set<string> }> = {};
    const totalTermsCount = filteredResults.length;

    filteredResults.forEach(termResult => {
      termResult.books.forEach(book => {
        book.libraries.forEach(lib => {
          if (!libStats[lib.libraryName]) { libStats[lib.libraryName] = { ownedTerms: new Set(), availableTerms: new Set() }; }
          libStats[lib.libraryName].ownedTerms.add(termResult.searchTerm);
          if (lib.isAvailable) libStats[lib.libraryName].availableTerms.add(termResult.searchTerm);
        });
      });
    });

    let maxOwnedCount = 0; let maxAvailableCount = 0;
    Object.values(libStats).forEach((s) => { 
      if (s.ownedTerms.size > maxOwnedCount) maxOwnedCount = s.ownedTerms.size; 
      if (s.availableTerms.size > maxAvailableCount) maxAvailableCount = s.availableTerms.size; 
    });
    const bestOwnedLibs: string[] = []; const bestAvailableLibs: string[] = [];
    Object.entries(libStats).forEach(([name, s]) => { 
      if (s.ownedTerms.size === maxOwnedCount && maxOwnedCount > 0) bestOwnedLibs.push(name); 
      if (s.availableTerms.size === maxAvailableCount && maxAvailableCount > 0) bestAvailableLibs.push(name); 
    });
    return { totalTermsCount, maxOwnedCount, bestOwnedLibs, maxAvailableCount, bestAvailableLibs };
  }, [filteredResults]);

  const ResultsSkeleton = () => (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-16">
        <div className="h-40 bg-white rounded-[24px] border border-[#E5E5EA]"></div><div className="h-40 bg-[#E5E5EA] rounded-[24px]"></div>
      </div>
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
      <div className={`transition-all duration-[800ms] cubic-bezier(0.16, 1, 0.3, 1) transform ${searched ? 'translate-y-0' : 'translate-y-[15vh]'}`}>
        <div className="text-center mb-8">
          <h1 className="text-[36px] md:text-[52px] font-bold tracking-tight text-[#1D1D1F] leading-[1.15] mb-3">원하는 지식을 <br className="md:hidden" />발견하세요.</h1>
          <p className="text-[17px] md:text-[19px] text-[#86868B] font-medium tracking-tight">서울시 자치구의 도서관을 하나의 창에서.</p>
        </div>

        <form ref={formRef} onSubmit={handleSearch} className="w-full max-w-[720px] mx-auto">
          <div className={`relative bg-white rounded-[28px] p-2 flex flex-col transition-all duration-500 ease-out border border-transparent ${isFocused ? 'shadow-[0_12px_40px_rgb(0,0,0,0.12)] scale-[1.01] border-[#E5E5EA]' : 'shadow-[0_4px_20px_rgb(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgb(0,0,0,0.08)]'}`}>
            <div className="flex items-start px-4 pt-4 pb-2">
              <Search className="w-6 h-6 text-[#86868B] shrink-0 mt-0.5" strokeWidth={2.5} />
              <textarea ref={textareaRef} rows={2} value={bookInput} onChange={(e) => setBookInput(e.target.value)} onKeyDown={handleTextareaKeyDown} placeholder="찾고 싶은 책 제목을 입력하세요.&#10;(줄바꿈 또는 쉼표로 최대 5권 동시 검색)" className="w-full ml-4 bg-transparent text-[19px] font-semibold text-[#1D1D1F] placeholder:text-[#86868B]/50 focus:outline-none resize-none leading-relaxed custom-scrollbar overflow-hidden" style={{ minHeight: '62px' }} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-2 pt-3 px-4 pb-2 border-t border-[#F5F5F7] gap-4 sm:gap-0">
              <div className="flex items-center gap-4">
                <DistrictWheelPicker value={districtCode} onChange={setDistrictCode} />
                <button type="button" onClick={() => setShowLibraryList(true)} className="text-[13px] text-[#86868B] hover:text-[#1D1D1F] font-semibold flex items-center gap-1 transition-colors">
                  <Info size={14} /> 지원 도서관
                </button>
              </div>
              <div className="flex items-center gap-3 self-end sm:self-auto">
                <div className="hidden md:flex items-center gap-1.5 text-[11px] text-[#86868B] font-semibold">
                  <span className="px-1.5 py-0.5 rounded-md bg-[#F5F5F7] border border-[#E5E5EA] text-[#6E6E73]">⌘/Ctrl</span>
                  <span>+</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-[#F5F5F7] border border-[#E5E5EA] text-[#6E6E73]">Enter</span>
                </div>
                <button
                  type="submit"
                  disabled={loading || !bookInput.trim()}
                  className={`px-8 py-2.5 rounded-full text-[15px] font-bold transition-transform active:scale-95 flex items-center gap-2 ${
                    loading
                      ? 'bg-[#E5E5EA] text-[#86868B] cursor-not-allowed'
                      : 'bg-[#1D1D1F] text-white hover:bg-black'
                  } ${!bookInput.trim() ? 'opacity-30 cursor-not-allowed' : ''}`}
                >
                  {loading ? <><Loader2 className="animate-spin w-4 h-4"/> 탐색 중</> : '탐서 시작'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {loading && (
        <div className="mt-16">
          {slowLoading && (
            <div className="mb-6 bg-white/80 backdrop-blur-md border border-[#E5E5EA] rounded-2xl px-5 py-4 animate-in fade-in slide-in-from-top-2 duration-500">
              <p className="text-[14px] font-semibold text-[#1D1D1F] tracking-tight">
                🔄 도서관 서버에서 데이터를 실시간 수집 중입니다...
              </p>
              <p className="text-[13px] text-[#86868B] mt-1 font-medium">
                전체 도서관을 꼼꼼히 확인하고 있어요. 조금만 더 기다려주세요!
              </p>
            </div>
          )}
          <ResultsSkeleton />
        </div>
      )}

      {!loading && searched && filteredResults.length > 0 && stats && (
        <div className="mt-16 animate-in fade-in slide-in-from-bottom-8 duration-[1000ms] ease-out">
          <section className="mb-16">
            <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-3 mb-6">
              <span className="text-[13px] font-bold text-[#86868B] uppercase tracking-[0.15em]">
                Smart Insights
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="group bg-white rounded-[28px] p-7 sm:p-9 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-[#E5E5EA]/80 flex flex-col transition-all duration-500 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] hover:border-[#D2D2D7]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[#F5F5F7] flex items-center justify-center shrink-0 transition-colors group-hover:bg-[#1D1D1F]">
                    <BookOpen size={18} className="text-[#86868B] group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-[14px] font-bold text-[#515154] tracking-tight">가장 많은 이야기를 품은 곳</span>
                </div>

                <div className="flex-1 flex flex-col justify-center">
                  {stats.bestOwnedLibs.length > 0 ? (
                    <>
                      <h3 className="text-[28px] sm:text-[34px] font-extrabold text-[#1D1D1F] tracking-tight leading-[1.25] mb-3 break-keep">
                        {stats.bestOwnedLibs[0]}
                      </h3>
                      <div className="flex items-center gap-2 mb-6">
                        <span className="bg-[#1D1D1F] text-white px-3 py-1 rounded-lg text-[14px] font-bold tracking-tight shadow-sm">
                          {stats.maxOwnedCount}종
                        </span>
                        <span className="text-[15px] font-medium text-[#86868B] tracking-tight">모두 만나볼 수 있어요</span>
                      </div>

                      {stats.bestOwnedLibs.length > 1 && (
                        <div className="mt-auto border-t border-[#E5E5EA]/80 pt-5">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[12px] font-bold text-[#86868B]">같은 조건의 다른 도서관</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {stats.bestOwnedLibs.slice(1, expandedStats.owned ? undefined : 3).map((lib, i) => (
                              <div key={i} className="px-3 py-1.5 bg-[#F5F5F7] rounded-lg text-[13px] font-bold text-[#515154] hover:bg-[#E5E5EA] transition-colors cursor-default">
                                {lib}
                              </div>
                            ))}
                            {stats.bestOwnedLibs.length > 4 && (
                              <button onClick={() => setExpandedStats(p => ({ ...p, owned: !p.owned }))} className="px-3 py-1.5 text-[13px] font-bold text-[#0066CC] hover:bg-[#E8F2FF] rounded-lg transition-colors">
                                {expandedStats.owned ? '접기' : `+${stats.bestOwnedLibs.length - 4}곳 더보기`}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-[24px] font-bold text-[#D2D2D7]">-</div>
                  )}
                </div>
              </div>

              <div className="group bg-[#1D1D1F] rounded-[28px] p-7 sm:p-9 shadow-[0_12px_40px_rgba(0,0,0,0.12)] flex flex-col relative overflow-hidden transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#34C759] opacity-10 rounded-full blur-[50px] transition-opacity duration-700 group-hover:opacity-20 pointer-events-none"></div>
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="w-10 h-10 rounded-full bg-white/10 border border-white/5 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={18} className="text-[#34C759]" />
                  </div>
                  <span className="text-[14px] font-bold text-white/80 tracking-tight">지금 바로 만날 수 있는 곳</span>
                </div>

                <div className="flex-1 flex flex-col justify-center relative z-10">
                  {stats.bestAvailableLibs.length > 0 ? (
                    <>
                      <h3 className="text-[28px] sm:text-[34px] font-extrabold text-white tracking-tight leading-[1.25] mb-3 break-keep">
                        {stats.bestAvailableLibs[0]}
                      </h3>
                      <div className="flex items-center gap-2 mb-6">
                        <span className="bg-[#34C759] text-white px-3 py-1 rounded-lg text-[14px] font-bold tracking-tight shadow-[0_0_12px_rgba(52,199,89,0.4)]">
                          {stats.maxAvailableCount}종
                        </span>
                        <span className="text-[15px] font-medium text-white/60 tracking-tight">즉시 대출 가능해요</span>
                      </div>

                      {stats.bestAvailableLibs.length > 1 && (
                        <div className="mt-auto border-t border-white/10 pt-5">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[12px] font-bold text-white/40">같은 조건의 다른 도서관</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {stats.bestAvailableLibs.slice(1, expandedStats.available ? undefined : 3).map((lib, i) => (
                              <div key={i} className="px-3 py-1.5 bg-white/10 rounded-lg text-[13px] font-bold text-white/80 hover:bg-white/20 transition-colors backdrop-blur-md cursor-default">
                                {lib}
                              </div>
                            ))}
                            {stats.bestAvailableLibs.length > 4 && (
                              <button onClick={() => setExpandedStats(p => ({ ...p, available: !p.available }))} className="px-3 py-1.5 text-[13px] font-bold text-white/90 hover:bg-white/20 rounded-lg transition-colors border border-transparent hover:border-white/10">
                                {expandedStats.available ? '접기' : `+${stats.bestAvailableLibs.length - 4}곳 더보기`}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-[24px] font-bold text-white/30">-</div>
                  )}
                </div>
              </div>
            </div>
          </section>
          
          <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-3 mb-6">
            <span className="text-[13px] font-bold text-[#86868B] uppercase tracking-[0.15em]">Results ({filteredResults.length}개 검색어 · {totalFilteredBookCount}권)</span>
          </div>

          <div className="space-y-16">
              {filteredResults.map((term, tIdx) => {
                const expandedMatch = expandedTerms.find(
                  (item) => item.original === term.searchTerm
                );
                return (
                <section key={`term-${tIdx}`} className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                  <header className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6 px-1 sm:px-2 py-3 group">
                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                      <h2 className="text-[20px] sm:text-[24px] font-bold text-[#1D1D1F] tracking-tight">
                        {term.searchTerm}
                      </h2>
                      {expandedMatch && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#F5F5F7] rounded-lg border border-[#E5E5EA]/80">
                          <Sparkles className="w-3.5 h-3.5 text-[#A1A1A6]" />
                          <span className="text-[12px] font-medium text-[#86868B] tracking-tight">
                            <strong className="font-semibold text-[#515154]">&ldquo;{expandedMatch.expanded}&rdquo;</strong> 확장 검색 적용
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="hidden sm:block h-[1px] bg-[#E5E5EA] flex-1 mt-1 transition-colors group-hover:bg-[#D2D2D7]"></div>
                    <div className="shrink-0 flex sm:block items-center justify-between border-t sm:border-0 border-[#F5F5F7] pt-3 sm:pt-0 mt-1 sm:mt-0">
                      <span className="sm:hidden text-[12px] font-bold text-[#86868B] uppercase tracking-wider">Results</span>
                      <span className="text-[13px] font-bold text-[#1D1D1F] bg-[#F5F5F7] px-3 py-1.5 rounded-lg border border-[#E5E5EA]/50">
                        총 {term.books.length}권
                      </span>
                    </div>
                  </header>

                  <div className="space-y-6">
                    {term.books.map((book, bIdx) => (
                      <article key={`book-${tIdx}-${bIdx}`} className="group bg-white rounded-[20px] sm:rounded-[24px] p-4 sm:p-8 md:p-10 shadow-[0_2px_12px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgb(0,0,0,0.06)] transition-all duration-300 flex flex-row sm:flex-col md:flex-row gap-4 sm:gap-6 md:gap-12 relative overflow-hidden border border-[#E5E5EA]/50">
                        <div className="shrink-0 relative z-10 w-[72px] sm:w-[140px] md:w-[160px]">
                          <div className="aspect-[2/3] rounded-[4px] sm:rounded-[6px] overflow-hidden relative shadow-[4px_4px_10px_rgba(0,0,0,0.1)] sm:shadow-[10px_10px_20px_rgba(0,0,0,0.1),-5px_0_10px_rgba(0,0,0,0.02)] transition-transform duration-500 group-hover:-translate-y-1 sm:group-hover:-translate-y-2 group-hover:scale-[1.02] bg-[#F5F5F7]">
                            {/* ✨ [수정됨] 실제 이미지 URL이 있으면 렌더링하고 오류시 아이콘으로 대체되도록 처리 */}
                            {book.metadata.imageUrl ? (
                              <img 
                                src={book.metadata.imageUrl} 
                                alt={book.metadata.title} 
                                className="w-full h-full object-cover" 
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                                  const fallbackIcon = document.createElement('div');
                                  fallbackIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D2D2D7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-book-open"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`;
                                  e.currentTarget.parentElement?.appendChild(fallbackIcon);
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-10 h-10 text-[#D2D2D7]" /></div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-tr from-black/[0.02] via-transparent to-white/[0.1] mix-blend-overlay"></div><div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-r from-white/40 to-transparent"></div>
                          </div>
                        </div>
                        <div className="flex-1 flex flex-col relative z-10 min-w-0">
                          <header className="mb-4 sm:mb-6 mt-0 sm:mt-2">
                            <h3 className="text-[17px] sm:text-[24px] md:text-[32px] font-bold tracking-tight text-[#1D1D1F] leading-[1.25] mb-1.5 sm:mb-2 line-clamp-2">{book.metadata.title}</h3>
                            <p className="text-[12px] sm:text-[15px] text-[#86868B] font-medium tracking-tight truncate">{book.metadata.author} <span className="mx-1.5 sm:mx-2 text-[#D2D2D7]">|</span> {book.metadata.publisher} <span className="hidden sm:inline"><span className="mx-1.5 sm:mx-2 text-[#D2D2D7]">|</span> {book.metadata.pubYear}</span></p>
                            <p className="hidden sm:block text-[11px] text-[#A1A1A6] font-mono mt-2">ISBN {book.metadata.isbn}</p>
                          </header>
                          <div className="mt-auto border-t border-[#F5F5F7] pt-3 sm:pt-6">
                            <h4 className="hidden sm:block text-[11px] font-bold text-[#86868B] uppercase tracking-[0.15em] mb-4">Availability</h4>
                            <ul className="flex flex-col gap-1.5 sm:grid sm:grid-cols-2 sm:gap-y-3 sm:gap-x-8">
                              {book.libraries.map((lib, lIdx) => (
                                <li key={lIdx} className="flex items-center justify-between py-1.5 sm:p-2 sm:-mx-2 rounded-lg hover:bg-[#F5F5F7] transition-colors cursor-default border-b border-[#F5F5F7] sm:border-0 last:border-0">
                                  <span className="text-[13px] sm:text-[14px] font-semibold text-[#1D1D1F] truncate pr-2">{lib.libraryName}</span>
                                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                    {lib.isAvailable ? (<><span className="text-[11px] sm:text-[12px] font-bold text-[#34C759]">가능</span><div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#34C759] shadow-[0_0_8px_rgba(52,199,89,0.4)]"></div></>) : (<><span className="text-[11px] sm:text-[12px] font-bold text-[#FF3B30]">대출중</span><div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#FF3B30]"></div></>)}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )})}
          </div>

          {emptyTerms.length > 0 && (
            <div className="mt-16 pt-12 border-t border-[#E5E5EA]">
              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-[#F5F5F7] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search size={20} className="text-[#86868B]" />
                </div>
                <h3 className="text-[20px] sm:text-[22px] font-bold text-[#1D1D1F] tracking-tight mb-2">아쉽게도 지식을 찾지 못했어요</h3>
                <p className="text-[14px] text-[#86868B] font-medium">입력하신 도서를 소장하고 있는 도서관를 찾을 수 없습니다.</p>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {emptyTerms.map((term, idx) => (
                  <div key={`${term}-${idx}`} className="bg-white border border-[#E5E5EA] shadow-sm rounded-2xl px-5 py-3.5 flex items-center gap-3">
                    <XCircle size={16} className="text-[#D2D2D7]" />
                    <span className="text-[15px] font-bold text-[#515154] tracking-tight">{term}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {!loading && searched && filteredResults.length === 0 && emptyTerms.length > 0 && (
        <div className="mt-20 bg-white rounded-[24px] py-20 px-6 text-center shadow-sm border border-[#E5E5EA] animate-in fade-in">
          <div className="w-16 h-16 bg-[#F5F5F7] rounded-full flex items-center justify-center mx-auto mb-6">
            <Search size={28} className="text-[#86868B]" />
          </div>
          <h3 className="text-[22px] md:text-[26px] font-bold text-[#1D1D1F] tracking-tight mb-3">아쉽게도 지식을 찾지 못했어요</h3>
          <p className="text-[15px] text-[#86868B] font-medium max-w-md mx-auto leading-relaxed">
            입력하신 도서를 소장하고 있는 도서관를 찾을 수 없습니다.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-10">
            {emptyTerms.map((term, idx) => (
              <div key={`${term}-${idx}`} className="bg-white border border-[#E5E5EA] shadow-sm rounded-2xl px-5 py-3.5 flex items-center gap-3">
                <XCircle size={16} className="text-[#D2D2D7]" />
                <span className="text-[15px] font-bold text-[#515154] tracking-tight">{term}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <LibraryListModal
        isOpen={showLibraryList}
        onClose={() => setShowLibraryList(false)}
        initialDistrictName={DISTRICT_NAMES[districtCode] || "All"}
      />
    </main>
  );
}

// --- 기타 페이지 (소개, 전집, 정책) ---
const Hero3DLogo = () => {
  return (
    <div className="relative flex justify-center items-center w-full h-[280px] sm:h-[360px] perspective-[1000px] mb-8 sm:mb-12">
      <div className="absolute bottom-6 sm:bottom-12 w-32 sm:w-48 h-6 bg-black/30 rounded-[100%] blur-xl animate-[shadow-pulse_6s_ease-in-out_infinite]"></div>
      <div className="relative w-32 h-32 sm:w-44 sm:h-44 rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-to-b from-[#2C2C2E] to-[#1D1D1F] shadow-[0_30px_60px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-2px_4px_rgba(0,0,0,0.5)] flex items-center justify-center animate-[float-3d_6s_ease-in-out_infinite] transform-style-[preserve-3d]">
        <div className="absolute inset-0 rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-to-tr from-white/5 to-transparent pointer-events-none"></div>
        <svg width="64" height="64" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)]">
          <path d="M8.5 11C8.5 9.89543 9.39543 9 10.5 9H13.5V19H10.5C9.39543 19 8.5 18.1046 8.5 17V11Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M19.5 11C19.5 9.89543 18.6046 9 17.5 9H14.5V19H17.5C18.6046 19 19.5 18.1046 19.5 17V11Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
};

const AboutPage = () => (
  <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] selection:bg-black selection:text-white antialiased overflow-x-hidden" style={{ fontFamily: "'Pretendard', sans-serif" }}>
    <div className="pt-16 sm:pt-20 pb-32 px-5 sm:px-6 max-w-[700px] mx-auto animate-in fade-in slide-in-from-bottom-8 duration-[1000ms] ease-out">
      <Hero3DLogo />

      <header className="mb-16 sm:mb-24 text-center">
        <h1 className="text-[32px] sm:text-[42px] md:text-[52px] font-extrabold tracking-tight text-[#1D1D1F] leading-[1.25] sm:leading-[1.2] mb-6">
          가장 아날로그적인 온기를 위한,<br className="hidden sm:block" />
          가장 스마트한 연결.
        </h1>
      </header>

      <article className="space-y-12 sm:space-y-16">
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-both">
          <p className="text-[17px] md:text-[19px] leading-[1.7] sm:leading-[1.8] text-[#515154] font-medium mb-6">
            AI가 우리의 질문에 1초 만에 대답을 내놓고, 알고리즘이 끝없는 숏폼 영상을 쏟아내는 완벽한 디지털의 시대. 하지만 역설적이게도 우리는 다시 <strong className="text-[#1D1D1F] font-bold">종이책</strong>을 찾고 있습니다.
          </p>
          <p className="text-[17px] md:text-[19px] leading-[1.7] sm:leading-[1.8] text-[#515154] font-medium mb-6">
            종일 쏟아지는 스크린의 빛과 알림에 지친 현대인에게, 스마트폰을 내려놓고 서걱거리는 종이의 촉감을 느끼는 시간은 현대인에게 허락된 가장 온전하고 사치스러운 디지털 디톡스이기 때문입니다.
          </p>
        </section>

        <section className="pt-10 border-t border-[#E5E5EA]/70 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-both">
          <h2 className="text-[22px] md:text-[26px] font-bold text-[#1D1D1F] tracking-tight mb-5">
            터치 한 번의 시대, 지식의 탐색은 왜 여전히 느릴까?
          </h2>
          <p className="text-[17px] md:text-[19px] leading-[1.7] sm:leading-[1.8] text-[#515154] font-medium mb-6">
            음식 배달도, 필요한 물건의 배송도 단 한 번의 터치로 내일 새벽이면 해결되는 세상에 살고 있습니다. 인스타그램이나 유튜브를 보다가 마음에 드는 책 서너 권을 발견하는 것도 순식간이죠.
          </p>
          <blockquote className="my-8 pl-6 py-2 border-l-4 border-[#1D1D1F] text-[18px] md:text-[20px] font-semibold text-[#1D1D1F] leading-relaxed italic bg-gradient-to-r from-[#F5F5F7] to-transparent">
            &ldquo;이번 주말엔 이 책들을 도서관에서 빌려 읽어야지.&rdquo;
          </blockquote>
          <p className="text-[17px] md:text-[19px] leading-[1.7] sm:leading-[1.8] text-[#515154] font-medium mb-6">
            하지만 막상 도서관 시스템에 접속하는 순간, 설렘은 곧 귀찮음으로 바뀝니다. 내가 읽고 싶은 책 5권이 우리 동네 어느 도서관에 있는지 확인하려면, 책 제목을 하나하나 검색하고, 도서관 목록을 일일이 대조해야 합니다. 가장 편안해야 할 독서의 시작이, 가장 소모적인 노동이 되어버리는 순간입니다.
          </p>
        </section>

        <section className="pt-10 border-t border-[#E5E5EA]/70 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
          <h2 className="text-[22px] md:text-[26px] font-bold text-[#1D1D1F] tracking-tight mb-5">
            어느 워킹맘의 지친 퇴근길에서 시작된 질문
          </h2>
          <p className="text-[17px] md:text-[19px] leading-[1.7] sm:leading-[1.8] text-[#515154] font-medium mb-6">
            모두가 묵인하던 이 보편적인 불편함은 사실, 쫓기듯 살아가는 한 워킹맘의 아주 개인적인 고민에서 출발했습니다. 엄마로서 아이에게 세상의 수많은 이야기를 종이책으로 직접 만져보게 해주고 싶었지만, 매번 전집을 구매하기엔 비용과 공간의 한계가 있어 자연스레 공공 도서관을 찾게 되었습니다.
          </p>
          <p className="text-[17px] md:text-[19px] leading-[1.7] sm:leading-[1.8] text-[#515154] font-medium mb-6">
            하지만 워킹맘에게 허락된 시간은 아이가 잠든 고요한 밤이나 흔들리는 출퇴근 지하철 안뿐이었습니다. 쪼개어 쓰는 그 귀한 시간에, 여러 권의 책을 일일이 검색하고 가장 책이 많은 도서관을 찾는 일은 너무나 지치는 일이었습니다.
          </p>
          <div className="my-8 p-6 sm:p-8 bg-white border border-[#E5E5EA] rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <p className="text-[18px] sm:text-[20px] leading-[1.6] text-[#1D1D1F] font-bold text-center">
              &ldquo;검색에 버려지는 이 아까운 시간을 줄이고,<br className="hidden sm:block"/> 단 한 번에 끝낼 수는 없을까?&rdquo;<br/>
              <span className="block mt-4 text-[#86868B] text-[15px] font-medium">탐서(探書)는 바로 그 절실함에서 만들어졌습니다.</span>
            </p>
          </div>
        </section>

        <section className="pt-10 border-t border-[#E5E5EA]/70 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400 fill-mode-both">
          <h2 className="text-[22px] md:text-[26px] font-bold text-[#1D1D1F] tracking-tight mb-5">
            당신의 주말을 바꿀 작은 나침반
          </h2>
          <p className="text-[17px] md:text-[19px] leading-[1.7] sm:leading-[1.8] text-[#515154] font-medium mb-6">
            이제, 탐서(探書)의 캔버스 위에 당신이 궁금해진 여러 권의 책 이름을 한 번에 올려두기만 하세요.
          </p>
          <p className="text-[17px] md:text-[19px] leading-[1.7] sm:leading-[1.8] text-[#515154] font-medium mb-6">
            탐서가 실시간 데이터를 분석하여, 당신이 찾는 여러 종류의 책들을 가장 많이, 그리고 지금 당장 대출할 수 있는 <strong className="text-[#1D1D1F]">최적의 도서관</strong>을 단숨에 찾아냅니다. 마치 독서를 위한 가장 지적이고 친절한 컨시어지처럼 말이죠.
          </p>
          <p className="text-[17px] md:text-[19px] leading-[1.7] sm:leading-[1.8] text-[#515154] font-medium mb-16">
            이제 어디로 가야 할지 헤매거나 여러 번 검색창을 두드릴 필요가 없습니다. 화면 속에서 빛나는 초록색 점을 따라 가벼운 발걸음을 옮기기만 하세요. 조용한 도서관 서가 사이에서 당신을 기다려온 완벽한 종이책들을 만나게 될 것입니다.
          </p>
        </section>
      </article>
    </div>

    <style dangerouslySetInnerHTML={{ __html: `
      .perspective-\\[1000px\\] { perspective: 1000px; }
      .transform-style-\\[preserve-3d\\] { transform-style: preserve-3d; }
      @keyframes float-3d {
        0% { transform: translateY(0px) rotateX(10deg) rotateY(-5deg); }
        50% { transform: translateY(-20px) rotateX(15deg) rotateY(0deg); }
        100% { transform: translateY(0px) rotateX(10deg) rotateY(-5deg); }
      }
      @keyframes shadow-pulse {
        0% { transform: scale(1); opacity: 0.3; }
        50% { transform: scale(0.8); opacity: 0.15; }
        100% { transform: scale(1); opacity: 0.3; }
      }
    ` }} />
  </div>
);

const PrivacyPolicyPage = () => (
  <div className="pt-28 pb-32 px-6 max-w-[700px] mx-auto animate-in fade-in text-center">
    <h1 className="text-[36px] font-bold tracking-tight text-[#1D1D1F] mb-6">개인정보 처리방침</h1>
  </div>
);

// --- 최상위 앱 ---
export default function App() {
  const [currentView, setCurrentView] = useState<'search' | 'about' | 'privacy'>('search');
  const [injectedBooks, setInjectedBooks] = useState<string[]>([]);
  const [showCollectionsNotice, setShowCollectionsNotice] = useState(false);

  const handleCollectionClick = () => {
    if (showCollectionsNotice) return;
    setShowCollectionsNotice(true);
  };

  useEffect(() => {
    if (!showCollectionsNotice) return;
    const timer = setTimeout(() => setShowCollectionsNotice(false), 3000);
    return () => clearTimeout(timer);
  }, [showCollectionsNotice]);

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] selection:bg-black selection:text-white antialiased" style={{ fontFamily: "'Pretendard', sans-serif" }}>
      <nav className="fixed top-0 w-full z-50 bg-[#F5F5F7]/80 backdrop-blur-xl border-b border-black/[0.05] supports-[backdrop-filter]:bg-[#F5F5F7]/60">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setCurrentView('search')}>
            <div className="transition-transform group-hover:scale-105 shrink-0"><TamseoLogo /></div>
            <div className="flex items-baseline"><span className="text-[15px] font-bold tracking-tight text-[#1D1D1F]">탐서</span></div>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => setCurrentView('about')} className="text-[13px] font-bold">소개</button>
            <button onClick={handleCollectionClick} className="text-[13px] font-bold px-4 py-1.5 rounded-full bg-white border border-[#E5E5EA] hover:bg-[#F5F5F7] transition-all flex items-center gap-1.5">
              전집 탐색
            </button>
          </div>
        </div>
      </nav>

      {showCollectionsNotice && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${showCollectionsNotice ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
          <div className="bg-[#1D1D1F]/90 backdrop-blur-md px-5 py-3 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-white/10 flex items-center gap-3">
            <Hammer className="w-4 h-4 text-white/70" />
            <p className="text-[13px] font-medium text-white tracking-tight">
              더 나은 큐레이션을 위해 <span className="font-bold text-[#34C759]">준비 중</span>입니다.
            </p>
          </div>
        </div>
      )}

      {currentView === 'search' && <SearchContent injectedBooks={injectedBooks} setInjectedBooks={setInjectedBooks} />}
      {currentView === 'about' && <AboutPage />}
      {currentView === 'privacy' && <PrivacyPolicyPage />}

    </div>
  );
}
