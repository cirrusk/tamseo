"use client";

import React, { useState, useMemo, useRef, useEffect, Suspense } from 'react';
import { Search, ChevronRight, BookOpen, MapPin, CheckCircle2, XCircle, Info, Filter, X, Loader2, ChevronDown, ChevronUp, Library as LibraryIcon, ChevronLeft, Check, Mail, MessageSquare } from 'lucide-react';

// =========================================================================
// 🛠️ [에러 수정 포인트 2] 캔버스 미리보기용 모듈 대체
// 캔버스 환경 오류를 막기 위해 실제 import 대신 내부 함수로 대체했습니다.
// 실제 프로젝트(남편분 작업)에서는 이 부분을 아래 코드로 바꾸셔야 합니다:
// import { useSearchParams, useRouter } from 'next/navigation';
// =========================================================================
import { useSearchParams, useRouter } from 'next/navigation';

// --- TYPES ---
interface BookMetadata { title: string; author: string; publisher: string; pubYear: string; isbn: string; imageUrl?: string; }
interface LibraryAvailability { libraryName: string; isAvailable: boolean; }
interface GroupedBookResult { metadata: BookMetadata; libraries: LibraryAvailability[]; }
interface SearchResultItem { searchTerm: string; books: GroupedBookResult[]; }
interface LibraryInfo { district: string; name: string; address: string; }
interface BookCollection { id: string; brand: string; title: string; category: string; ageGroup: string; description: string; books: string[]; }

// =========================================================================
// 🛠️ [에러 수정 포인트 1] export 키워드 삭제
// Next.js App Router의 page.tsx 파일에서는 정해진 변수 외에는 'export'를 사용할 수 없습니다.
// 도커 빌드 에러의 원인이었던 'export' 단어를 모두 제거했습니다.
// =========================================================================
const DISTRICTS = ["11230", "11250", "11090", "11160", "11210", "11050", "11170", "11180", "11110", "11100", "11060", "11200", "11140", "11130", "11220", "11040", "11080", "11240", "11150", "11190", "11030", "11120", "11010", "11020", "11070"];
const DISTRICT_NAMES: Record<string, string> = { "11230": "강남구", "11250": "강동구", "11090": "강북구", "11160": "강서구", "11210": "관악구", "11050": "광진구", "11170": "구로구", "11180": "금천구", "11110": "노원구", "11100": "도봉구", "11060": "동대문구", "11200": "동작구", "11140": "마포구", "11130": "서대문구", "11220": "서초구", "11040": "성동구", "11080": "성북구", "11240": "송파구", "11150": "양천구", "11190": "영등포구", "11030": "용산구", "11120": "은평구", "11010": "종로구", "11020": "중구", "11070": "중랑구" };
const SEOUL_LIBRARIES: LibraryInfo[] = [
  { district: "마포구", name: "마포중앙도서관", address: "서울 마포구 성산로 128" },
  { district: "마포구", name: "마포평생학습관", address: "서울 마포구 홍익로2길 16" },
  { district: "강남구", name: "강남구립못골도서관", address: "서울 강남구 자곡로 116" },
  { district: "강남구", name: "강남도서관", address: "서울 강남구 선릉로116길 45" },
];

const BRANDS = ["전체", "그레이트북스", "아람북스", "비룡소", "키즈스콜레", "무지개출판사"];
const KIDS_COLLECTIONS: BookCollection[] = [
  { id: "c1", brand: "그레이트북스", title: "내 친구 과학공룡", category: "과학", ageGroup: "4~7세", description: "아이들의 호기심을 채워주는 재미있는 과학 그림책", books: ["요리조리 빙글빙글", "뼈뼈 사우루스", "자석의 비밀", "우주로 간 라이카", "물방울의 여행", "소화가 꿀꺽꿀꺽"] },
  { id: "c2", brand: "그레이트북스", title: "내 친구 수학공룡", category: "수학", ageGroup: "4~7세", description: "일상 속 수학의 원리를 깨우치는 스토리텔링 수학", books: ["모양 친구들 숨바꼭질", "1부터 10까지 세어봐", "크다 작다 길다 짧다", "시간을 재어보자"] },
  { id: "c3", brand: "아람북스", title: "자연이랑", category: "자연관찰", ageGroup: "0~3세", description: "생생한 사진과 이야기로 만나는 첫 자연관찰 전집", books: ["호랑이는 무서워", "사자는 동물의 왕", "코끼리 코는 길어", "기린은 목이 길어", "팬더는 대나무를 좋아해"] },
];

const fetchLibraryData = async (districtCode: string, bookTitles: string[]): Promise<SearchResultItem[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockResults = bookTitles.map((title, idx) => ({
        searchTerm: title,
        books: [{
            metadata: { title: `${title}`, author: idx % 2 === 0 ? "한강" : "김호연", publisher: "문학동네", pubYear: "2023", isbn: `979110000000${idx}`, imageUrl: idx % 2 === 0 ? "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop" : "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=800&auto=format&fit=crop" },
            libraries: [ { libraryName: "마포중앙도서관", isAvailable: true }, { libraryName: "강남구립못골도서관", isAvailable: idx % 2 !== 0 } ]
        }]
      }));
      resolve(mockResults);
    }, 1500);
  });
};

// --- 공통 UI 컴포넌트 ---
const TamseoLogo = ({ className = "" }: { className?: string }) => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="28" height="28" rx="7" fill="#1D1D1F"/>
    <path d="M8.5 11C8.5 9.89543 9.39543 9 10.5 9H13.5V19H10.5C9.39543 19 8.5 18.1046 8.5 17V11Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19.5 11C19.5 9.89543 18.6046 9 17.5 9H14.5V19H17.5C18.6046 19 19.5 18.1046 19.5 17V11Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LibraryListModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [libraries, setLibraries] = useState<LibraryInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>("All");

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
        })
        .catch(err => {
          console.error("도서관 목록 호출 실패:", err);
          setTimeout(() => setLibraries(SEOUL_LIBRARIES), 800);
        })
        .finally(() => setTimeout(() => setLoading(false), 800));
    }
  }, [isOpen, libraries.length]);

  if (!isOpen) return null;
  const districtNames = Object.values(DISTRICT_NAMES).sort();
  const filteredLibraries = selectedDistrictName === "All" ? libraries : libraries.filter(lib => lib.district === selectedDistrictName);

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

// --- 검색 기능 컴포넌트 ---
function SearchContent({ injectedBooks, setInjectedBooks, setCurrentView }: any) {
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

  useEffect(() => {
    if (injectedBooks && injectedBooks.length > 0) {
      setBookInput(prev => {
        const existing = prev.split('\n').map(b => b.trim()).filter(b => b.length > 0);
        const combined = Array.from(new Set([...existing, ...injectedBooks])).slice(0, 5);
        return combined.join('\n');
      });
      setInjectedBooks([]);
    }
  }, [injectedBooks, setInjectedBooks]);

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

// --- 기타 페이지 (소개, 전집, 정책) ---
const AboutPage = () => (
  <div className="pt-28 pb-32 px-6 max-w-[700px] mx-auto animate-in fade-in slide-in-from-bottom-8 duration-[1000ms] ease-out text-center">
    <h1 className="text-[36px] md:text-[52px] font-bold tracking-tight text-[#1D1D1F] leading-[1.2] mb-6">가장 아날로그적인 온기를 위한,<br />가장 스마트한 연결.</h1>
    <p className="text-[17px] text-[#515154] font-medium mt-10">탐서 브랜드 스토리 페이지입니다.</p>
  </div>
);

const CollectionsPage = ({ onSendToSearch }: any) => (
  <div className="pt-28 pb-32 px-6 max-w-[700px] mx-auto animate-in fade-in text-center">
    <h1 className="text-[36px] font-bold tracking-tight text-[#1D1D1F] mb-6">전집 탐색</h1>
    <button onClick={() => onSendToSearch(['샘플 도서 1', '샘플 도서 2'])} className="bg-[#1D1D1F] text-white px-6 py-2 rounded-full">검색창으로 이동</button>
  </div>
);

const PrivacyPolicyPage = () => (
  <div className="pt-28 pb-32 px-6 max-w-[700px] mx-auto animate-in fade-in text-center">
    <h1 className="text-[36px] font-bold tracking-tight text-[#1D1D1F] mb-6">개인정보 처리방침</h1>
  </div>
);

// --- 최상위 앱 ---
export default function App() {
  const [currentView, setCurrentView] = useState<'search' | 'about' | 'collections' | 'privacy'>('search');
  const [injectedBooks, setInjectedBooks] = useState<string[]>([]);
  const [showPrivacyBanner, setShowPrivacyBanner] = useState(false);

  useEffect(() => {
    const hasConsented = localStorage.getItem('tamseo-privacy-consent');
    if (!hasConsented) setShowPrivacyBanner(true);
  }, []);

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
            <button onClick={() => setCurrentView('collections')} className="text-[13px] font-bold px-4 py-1.5 rounded-full bg-white border border-[#E5E5EA]">전집 탐색</button>
          </div>
        </div>
      </nav>

      {currentView === 'search' && <SearchContent injectedBooks={injectedBooks} setInjectedBooks={setInjectedBooks} setCurrentView={setCurrentView} />}
      {currentView === 'about' && <AboutPage />}
      {currentView === 'collections' && <CollectionsPage onSendToSearch={(b: string[]) => { setInjectedBooks(b); setCurrentView('search'); }} />}
      {currentView === 'privacy' && <PrivacyPolicyPage />}

      <footer className="border-t border-[#E5E5EA] py-12 mt-16 text-center">
         <button onClick={() => setCurrentView('privacy')} className="text-[12px] font-medium text-[#86868B] hover:text-[#1D1D1F]">개인정보처리방침</button>
      </footer>
    </div>
  );
}