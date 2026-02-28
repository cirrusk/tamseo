"use client";

import React, { useState, useMemo } from 'react';
import { Search, BookOpen, MapPin, CheckCircle2, XCircle, Library, Loader2, Info, Settings2, X, Filter, ChevronDown, ChevronUp } from 'lucide-react';

// --- TYPES ---

interface BookMetadata {
  title: string;
  author: string;
  publisher: string;
  pubYear: string;
  isbn: string;
}

interface LibraryAvailability {
  libraryName: string;
  isAvailable: boolean;
}

interface GroupedBookResult {
  metadata: BookMetadata;
  libraries: LibraryAvailability[];
}

interface SearchResultItem {
  searchTerm: string;
  books: GroupedBookResult[];
}

interface ColumnVisibility {
  isbn: boolean;
  author: boolean;
  publisher: boolean;
  pubYear: boolean;
}

interface LibraryInfo {
  district: string;
  name: string;
  address: string;
}

// --- CONSTANTS ---

// 서울시 자치구 코드 (도서관 정보나루 API 기준)
const DISTRICTS = [
  "11230", "11250", "11090", "11160", "11210", 
  "11050", "11170", "11180", "11110", "11100", 
  "11060", "11200", "11140", "11130", "11220", 
  "11040", "11080", "11240", "11150", "11190", 
  "11030", "11120", "11010", "11020", "11070"
];

// 자치구 이름 매핑 (API 코드를 한글 이름으로 보여주기 위함)
const DISTRICT_NAMES: Record<string, string> = {
  "11230": "강남구", "11250": "강동구", "11090": "강북구", "11160": "강서구", "11210": "관악구",
  "11050": "광진구", "11170": "구로구", "11180": "금천구", "11110": "노원구", "11100": "도봉구",
  "11060": "동대문구", "11200": "동작구", "11140": "마포구", "11130": "서대문구", "11220": "서초구",
  "11040": "성동구", "11080": "성북구", "11240": "송파구", "11150": "양천구", "11190": "영등포구",
  "11030": "용산구", "11120": "은평구", "11010": "종로구", "11020": "중구", "11070": "중랑구"
};

// 도서관 목록 모달용 정적 데이터 (예시)
const SEOUL_LIBRARIES: LibraryInfo[] = [
  { district: "마포구", name: "마포중앙도서관", address: "서울 마포구 성산로 128" },
  { district: "마포구", name: "마포평생학습관", address: "서울 마포구 홍익로2길 16" },
  { district: "강남구", name: "강남구립못골도서관", address: "서울 강남구 자곡로 116" },
  { district: "강남구", name: "강남도서관", address: "서울 강남구 선릉로116길 45" },
  { district: "서초구", name: "서초구립반포도서관", address: "서울 서초구 고무래로 34" },
  { district: "서초구", name: "국립중앙도서관", address: "서울 서초구 반포대로 201" },
  { district: "종로구", name: "종로도서관", address: "서울 종로구 사직로9길 7" },
  { district: "종로구", name: "정독도서관", address: "서울 종로구 북촌로5길 48" },
  { district: "송파구", name: "송파도서관", address: "서울 송파구 동남로 263" },
  { district: "송파구", name: "송파글마루도서관", address: "서울 송파구 충민로 120" },
  { district: "용산구", name: "용산도서관", address: "서울 용산구 두텁바위로 160" },
  { district: "관악구", name: "관악도서관", address: "서울 관악구 신림로3길 35" },
  { district: "광진구", name: "광진정보도서관", address: "서울 광진구 아차산로78길 90" },
  { district: "노원구", name: "노원정보도서관", address: "서울 노원구 노원로34길 43" },
  { district: "동대문구", name: "동대문구정보화도서관", address: "서울 동대문구 회기로10길 60" },
];

// --- REAL API CALL FUNCTION ---
const fetchLibraryData = async (districtCode: string, bookTitles: string[]): Promise<SearchResultItem[]> => {
  try {
    const query = bookTitles.join(',');
    // 우리가 만든 Next.js API Route 호출
    const response = await fetch(`/api/search?district=${districtCode}&queries=${encodeURIComponent(query)}`);
    
    // 에러 핸들링 강화
    if (!response.ok) {
      const errorData = await response.json();
      // 백엔드에서 보낸 에러 메시지가 있으면 그 내용을 throw
      if (errorData.error) {
        throw new Error(errorData.error);
      }
      throw new Error('API 호출 실패');
    }
    
    return await response.json();
  } catch (error: any) {
    console.error("Failed to fetch library data:", error);
    // 에러 메시지 팝업 출력
    alert(error.message || "도서관 정보를 불러오는데 실패했습니다.");
    return [];
  }
};

// --- COMPONENT: LIBRARY LIST MODAL ---

const LibraryListModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>("All");

  if (!isOpen) return null;

  const districtNames = Object.values(DISTRICT_NAMES).sort();

  const filteredLibraries = selectedDistrictName === "All" 
    ? SEOUL_LIBRARIES 
    : SEOUL_LIBRARIES.filter(lib => lib.district === selectedDistrictName);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-stone-100 flex justify-between items-center bg-stone-50 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <Library className="w-5 h-5 text-teal-600" />
              서울 도서관 목록
            </h3>
            <p className="text-xs text-stone-500 mt-1">이 서비스에서 정보가 제공되는 주요 도서관 목록입니다.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Section */}
        <div className="px-5 pt-5 pb-2 border-b border-stone-100 bg-white shrink-0">
          <p className="text-xs font-semibold text-stone-500 mb-2">자치구별 보기</p>
          <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto custom-scrollbar">
            <button
              onClick={() => setSelectedDistrictName("All")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedDistrictName === "All"
                  ? "bg-teal-600 text-white shadow-md shadow-teal-200"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              전체
            </button>
            {districtNames.map((dName) => (
              <button
                key={dName}
                onClick={() => setSelectedDistrictName(dName)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedDistrictName === dName
                    ? "bg-teal-600 text-white shadow-md shadow-teal-200"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {dName}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Content */}
        <div className="overflow-y-auto p-5 grow">
          <table className="w-full text-sm text-left text-stone-600">
            <thead className="text-xs text-stone-700 uppercase bg-stone-100 sticky top-0">
              <tr>
                <th className="px-4 py-3 rounded-l-lg w-[60px] text-center">No</th>
                <th className="px-4 py-3">자치구</th>
                <th className="px-4 py-3">도서관명</th>
                <th className="px-4 py-3 rounded-r-lg">주소</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredLibraries.length > 0 ? (
                filteredLibraries.map((lib, idx) => (
                  <tr key={`${lib.district}-${idx}`} className="hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-3 text-center text-stone-400 font-mono text-xs">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-stone-900">{lib.district}</td>
                    <td className="px-4 py-3 text-teal-600 font-medium">{lib.name}</td>
                    <td className="px-4 py-3 text-stone-500">{lib.address}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-stone-400">
                    해당 자치구에 등록된 도서관 정보가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-stone-100 bg-stone-50 flex justify-end shrink-0">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-stone-300 rounded-lg text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT: LIBRARY STATS SUMMARY ---

const LibraryStats = ({ data }: { data: SearchResultItem[] }) => {
  const stats = useMemo(() => {
    // 1. 도서관별 통계 집계
    const libStats: Record<string, { owned: Set<string>, available: Set<string> }> = {};

    data.forEach(termResult => {
      termResult.books.forEach(book => {
        const bookIdentifier = book.metadata.title; // 통계 기준: 책 제목

        book.libraries.forEach(lib => {
          if (!libStats[lib.libraryName]) {
            libStats[lib.libraryName] = { owned: new Set(), available: new Set() };
          }
          libStats[lib.libraryName].owned.add(bookIdentifier);

          if (lib.isAvailable) {
            libStats[lib.libraryName].available.add(bookIdentifier);
          }
        });
      });
    });

    // 2. 최대 권수 찾기
    let maxOwnedCount = 0;
    let maxAvailableCount = 0;

    Object.values(libStats).forEach((s) => {
      if (s.owned.size > maxOwnedCount) maxOwnedCount = s.owned.size;
      if (s.available.size > maxAvailableCount) maxAvailableCount = s.available.size;
    });

    // 3. 최대 권수를 보유한 모든 도서관 찾기 (동률 처리)
    const bestOwnedLibs: string[] = [];
    const bestAvailableLibs: string[] = [];

    Object.entries(libStats).forEach(([name, s]) => {
      if (s.owned.size === maxOwnedCount && maxOwnedCount > 0) {
        bestOwnedLibs.push(name);
      }
      if (s.available.size === maxAvailableCount && maxAvailableCount > 0) {
        bestAvailableLibs.push(name);
      }
    });

    return { 
      maxOwnedCount, 
      bestOwnedLibs, 
      maxAvailableCount, 
      bestAvailableLibs 
    };
  }, [data]);

  if (!data || data.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      {/* 최다 보유 도서관 */}
      <div className="bg-teal-50 border border-teal-100 rounded-xl p-5 flex flex-col gap-3 shadow-sm">
        <div className="flex items-center gap-2 text-teal-800 font-bold">
          <div className="p-1.5 bg-teal-100 rounded-lg">
            <Library className="w-4 h-4" />
          </div>
          도서 최다 보유 도서관
        </div>
        <div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-bold text-lg text-stone-800">
              {stats.bestOwnedLibs.length > 0 ? stats.bestOwnedLibs.join(', ') : '-'}
            </span>
            {stats.maxOwnedCount > 0 && (
              <span className="bg-teal-600 text-white px-2 py-0.5 rounded-md text-xs font-bold shrink-0">
                {stats.maxOwnedCount}건 보유
              </span>
            )}
          </div>
          <p className="text-xs text-stone-500 mt-1">
            {stats.bestOwnedLibs.length > 1 ? "여러 도서관이 동일하게 가장 많은 책을 보유하고 있습니다." : "가장 많은 종류의 책을 보유한 도서관입니다."}
          </p>
        </div>
      </div>

      {/* 대여 가능 최다 보유 도서관 */}
      <div className="bg-orange-50 border border-orange-100 rounded-xl p-5 flex flex-col gap-3 shadow-sm">
        <div className="flex items-center gap-2 text-orange-800 font-bold">
          <div className="p-1.5 bg-orange-100 rounded-lg">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          대여 가능 도서 최다 보유
        </div>
        <div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-bold text-lg text-stone-800">
              {stats.bestAvailableLibs.length > 0 ? stats.bestAvailableLibs.join(', ') : '-'}
            </span>
            {stats.maxAvailableCount > 0 && (
              <span className="bg-orange-600 text-white px-2 py-0.5 rounded-md text-xs font-bold shrink-0">
                {stats.maxAvailableCount}건 가능
              </span>
            )}
          </div>
          <p className="text-xs text-stone-500 mt-1">
            {stats.bestAvailableLibs.length > 1 ? "여러 도서관에서 동일하게 가장 많은 책을 빌릴 수 있습니다." : "가장 많은 책을 바로 대출할 수 있는 곳입니다."}
          </p>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT: RESULTS TABLE ---

const ResultTable = ({ 
  data, 
  visibleColumns 
}: { 
  data: SearchResultItem[], 
  visibleColumns: ColumnVisibility 
}) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-stone-200">
        <Library className="w-12 h-12 text-stone-300 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-stone-900">조건에 맞는 결과가 없습니다</h3>
        <p className="text-stone-500">필터 설정을 변경하여 다시 확인해보세요.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-stone-200">
      <table className="w-full text-sm text-left text-stone-600">
        <thead className="text-xs text-stone-700 uppercase bg-stone-100 border-b border-stone-200">
          <tr>
            <th scope="col" className="px-6 py-3 font-bold bg-stone-100 border-r border-stone-200 min-w-[120px]">검색어</th>
            <th scope="col" className="px-6 py-3 font-bold min-w-[150px]">책제목</th>
            
            {visibleColumns.isbn && <th scope="col" className="px-6 py-3 font-bold min-w-[120px]">ISBN</th>}
            {visibleColumns.author && <th scope="col" className="px-6 py-3 font-bold min-w-[100px]">저자</th>}
            {visibleColumns.publisher && <th scope="col" className="px-6 py-3 font-bold min-w-[100px]">출판사</th>}
            {visibleColumns.pubYear && <th scope="col" className="px-6 py-3 font-bold text-center w-[80px]">출판연도</th>}
            
            <th scope="col" className="px-6 py-3 font-bold min-w-[140px]">도서관명</th>
            <th scope="col" className="px-6 py-3 font-bold text-center min-w-[120px]">대출가능여부</th>
          </tr>
        </thead>
        <tbody>
          {data.map((termResult, termIndex) => {
            const totalRowsForTerm = termResult.books.reduce((acc, book) => acc + book.libraries.length, 0);
            
            return (
              <React.Fragment key={`term-${termIndex}`}>
                {termResult.books.map((book, bookIndex) => (
                  <React.Fragment key={`book-${termIndex}-${bookIndex}`}>
                    {book.libraries.map((lib, libIndex) => (
                      <tr 
                        key={`lib-${termIndex}-${bookIndex}-${libIndex}`} 
                        className="bg-white border-b border-stone-100 hover:bg-stone-50 transition-colors"
                      >
                        {/* 검색어 셀: 1. 검색어 (3종) 형식으로 표시 */}
                        {bookIndex === 0 && libIndex === 0 && (
                          <td 
                            rowSpan={totalRowsForTerm} 
                            className="px-6 py-4 border-r border-stone-200 align-top bg-stone-50/50"
                          >
                            <div className="font-bold text-stone-800 text-base mb-1">
                              {termIndex + 1}. {termResult.searchTerm}
                            </div>
                            <div className="text-xs text-stone-500 font-medium bg-stone-200/50 rounded px-2 py-1 inline-block">
                              {termResult.books.length}종 검색됨
                            </div>
                          </td>
                        )}

                        {/* 책 정보 셀: 1-1. 책제목 형식으로 표시 */}
                        {libIndex === 0 && (
                          <>
                            <td 
                              rowSpan={book.libraries.length} 
                              className="px-6 py-4 font-medium text-stone-900 border-r border-stone-100 align-top bg-white"
                            >
                              <div className="flex gap-2">
                                <span className="font-mono text-stone-400 text-xs mt-0.5 shrink-0 select-none">
                                  {termIndex + 1}-{bookIndex + 1}.
                                </span>
                                <span>{book.metadata.title}</span>
                              </div>
                            </td>

                            {visibleColumns.isbn && (
                              <td 
                                rowSpan={book.libraries.length} 
                                className="px-6 py-4 border-r border-stone-100 align-top bg-white font-mono text-xs text-stone-500"
                              >
                                {book.metadata.isbn}
                              </td>
                            )}
                            
                            {visibleColumns.author && (
                              <td 
                                rowSpan={book.libraries.length} 
                                className="px-6 py-4 border-r border-stone-100 align-top bg-white"
                              >
                                {book.metadata.author}
                              </td>
                            )}

                            {visibleColumns.publisher && (
                              <td 
                                rowSpan={book.libraries.length} 
                                className="px-6 py-4 border-r border-stone-100 align-top bg-white"
                              >
                                {book.metadata.publisher}
                              </td>
                            )}

                            {visibleColumns.pubYear && (
                              <td 
                                rowSpan={book.libraries.length} 
                                className="px-6 py-4 text-center border-r border-stone-100 align-top bg-white"
                              >
                                {book.metadata.pubYear}
                              </td>
                            )}
                          </>
                        )}
                        
                        {/* 도서관별 정보 셀 */}
                        <td className="px-6 py-4 font-medium text-teal-700">
                          {lib.libraryName}
                        </td>
                        <td className="px-6 py-4 text-center align-top">
                          {lib.isAvailable ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              대출가능
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              <XCircle className="w-3.5 h-3.5" />
                              대출중
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// --- COMPONENT: SKELETON LOADER ---

const ResultsSkeleton = () => (
  <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-4 animate-pulse">
    <div className="h-10 bg-stone-100 rounded w-full mb-6"></div>
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="flex gap-4">
        <div className="h-8 bg-stone-100 rounded w-[15%]"></div>
        <div className="h-8 bg-stone-100 rounded w-[25%]"></div>
        <div className="h-8 bg-stone-100 rounded w-[20%]"></div>
        <div className="h-8 bg-stone-100 rounded w-[40%]"></div>
      </div>
    ))}
  </div>
);

// --- MAIN APP COMPONENT ---

export default function SeoulLibraryApp() {
  const [districtCode, setDistrictCode] = useState<string>("11140"); // Default: 마포구
  const [bookInput, setBookInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<SearchResultItem[] | null>(null);
  const [searched, setSearched] = useState<boolean>(false);
  const [showLibraryList, setShowLibraryList] = useState<boolean>(false);

  // 컬럼 보기/숨기기 상태
  const [visibleColumns, setVisibleColumns] = useState<ColumnVisibility>({
    isbn: true,
    author: true,
    publisher: true,
    pubYear: true
  });
  
  // 필터링 상태 (도서관명, 대출상태)
  const [availableLibraries, setAvailableLibraries] = useState<string[]>([]);
  const [selectedLibraries, setSelectedLibraries] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['available', 'unavailable']);
  const [showFilters, setShowFilters] = useState<boolean>(false); // 기본값: 접힘

  const toggleColumn = (key: keyof ColumnVisibility) => {
    setVisibleColumns(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // 보안: 특수문자 차단 정규식 (한글, 영문, 숫자, 공백 허용)
  const SAFE_INPUT_REGEX = /^[가-힣a-zA-Z0-9\s]+$/;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 빈 줄 제거 및 최대 5권 제한 로직 추가
    let terms = bookInput
      .split('\n')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    if (terms.length === 0) {
      alert("적어도 한 권 이상의 책 제목을 입력해주세요.");
      return;
    }

    // 1. [Security] 특수문자 검사
    for (const term of terms) {
      if (!SAFE_INPUT_REGEX.test(term)) {
        alert(`보안 정책상 특수문자는 사용할 수 없습니다.\n입력값: "${term}"\n\n(한글, 영문, 숫자, 공백만 입력해주세요.)`);
        return;
      }
    }

    // 2. [Validation] 5권 제한 검사 (여기서 미리 자르거나 경고)
    if (terms.length > 5) {
      alert("검색어는 최대 5권까지만 입력 가능합니다.\n상위 5권에 대해서만 검색을 진행합니다.");
      terms = terms.slice(0, 5);
    }

    setLoading(true);
    setSearched(true);
    setResults(null);
    setSelectedLibraries([]); 
    setShowFilters(false); 

    try {
      const data = await fetchLibraryData(districtCode, terms);
      setResults(data);
      
      const libs = new Set<string>();
      data.forEach(item => {
        item.books.forEach(book => {
          book.libraries.forEach(lib => libs.add(lib.libraryName));
        });
      });
      const libArray = Array.from(libs).sort();
      setAvailableLibraries(libArray);
      setSelectedLibraries(libArray);

    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSampleData = () => {
    setBookInput("채식주의자\n소년이 온다\n파친코\n아몬드\n82년생 김지영");
  };

  // 필터링된 결과 계산 (useMemo)
  const filteredResults = useMemo(() => {
    if (!results) return null;

    return results.map(term => {
      const filteredBooks = term.books.map(book => {
        const filteredLibs = book.libraries.filter(lib => {
          const nameMatch = selectedLibraries.includes(lib.libraryName);
          const statusMatch = (lib.isAvailable && selectedStatuses.includes('available')) ||
                              (!lib.isAvailable && selectedStatuses.includes('unavailable'));
          return nameMatch && statusMatch;
        });
        
        return {
          ...book,
          libraries: filteredLibs
        };
      }).filter(book => book.libraries.length > 0);

      return {
        ...term,
        books: filteredBooks
      };
    }).filter(term => term.books.length > 0);
  }, [results, selectedLibraries, selectedStatuses]);


  const toggleLibraryFilter = (libName: string) => {
    setSelectedLibraries(prev => 
      prev.includes(libName) 
        ? prev.filter(l => l !== libName)
        : [...prev, libName]
    );
  };
  
  const toggleAllLibraries = () => {
    if (selectedLibraries.length === availableLibraries.length) {
      setSelectedLibraries([]);
    } else {
      setSelectedLibraries(availableLibraries);
    }
  };

  const toggleStatusFilter = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900 pb-20">
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col items-center justify-center gap-2">
          {/* 로고 영역 (public 폴더에 logo.png 또는 logo.jpg 파일을 넣어주세요) */}
          <div className="w-full flex justify-center mb-2">
             {/* 이미지가 없으면 대체 텍스트가 보입니다. */}
             <img src="/logo.png" alt="도서관 통 로고" className="h-16 w-auto object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
          </div>
          
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-teal-800">도서관 통</h1>
          </div>
          <p className="text-xs text-stone-500 font-medium">서울시 도서관 통합 검색 & 실시간 대출 확인</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-8">
        
        {/* Search Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              {/* District Selector */}
              <div className="md:col-span-1">
                <label htmlFor="district" className="block text-sm font-semibold text-stone-700 mb-2">
                  자치구 선택
                </label>
                <div className="relative">
                  <select 
                    id="district"
                    value={districtCode}
                    onChange={(e) => setDistrictCode(e.target.value)}
                    className="w-full appearance-none bg-stone-50 border border-stone-200 text-stone-700 py-3 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all cursor-pointer"
                  >
                    {DISTRICTS.map((code) => (
                      <option key={code} value={code}>{DISTRICT_NAMES[code]}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-stone-500">
                    <MapPin className="w-4 h-4" />
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => setShowLibraryList(true)}
                  className="mt-2 text-xs text-stone-500 hover:text-teal-600 flex items-center gap-1 transition-colors group"
                >
                  <Info className="w-3.5 h-3.5 text-stone-400 group-hover:text-teal-500" />
                  <span className="underline decoration-stone-300 group-hover:decoration-teal-500">서울 도서관 목록 보기</span>
                </button>
              </div>

              {/* Book Input */}
              <div className="md:col-span-3">
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="books" className="block text-sm font-semibold text-stone-700">
                    검색할 도서 목록
                  </label>
                  <button 
                    type="button" 
                    onClick={handleSampleData}
                    className="text-xs text-teal-600 hover:underline font-medium"
                  >
                    예시 데이터 입력
                  </button>
                </div>
                <textarea
                  id="books"
                  rows={5}
                  value={bookInput}
                  onChange={(e) => setBookInput(e.target.value)}
                  placeholder="한 줄에 한 권씩 입력하세요...&#10;예:&#10;한강 채식주의자&#10;파친코"
                  className="w-full bg-stone-50 border border-stone-200 text-stone-700 p-4 rounded-xl focus:outline-none focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all resize-none placeholder:text-stone-400"
                />
                <p className="text-xs text-stone-500 mt-2 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-teal-500" />
                  한 번에 <span className="font-semibold text-teal-600">최대 5권</span>까지 검색 가능하며, 검색어당 <span className="font-semibold text-teal-600">인기 도서 상위 3권</span>까지 자동으로 검색됩니다.
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-teal-200 transition-all transform active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  도서관 조회중...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  대출 가능 확인하기
                </>
              )}
            </button>
          </form>
        </section>

        {/* Results Section */}
        <section>
          {loading && <ResultsSkeleton />}
          
          {!loading && filteredResults && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Library Stats */}
              <LibraryStats data={results || []} />

              <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
                
                {/* Result Header & Compact Controls */}
                <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-stone-50/50">
                  <div className="flex flex-col">
                    <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                      조회 결과 <span className="text-teal-600">{filteredResults.length}건</span>
                    </h2>
                    <span className="text-xs text-stone-500 mt-1">대출 가능 여부를 확인할 수 있습니다. (검색어당 상위 3권 표시)</span>
                  </div>
                  
                  {/* Column Toggle Controls */}
                  <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-lg border border-stone-200 text-sm">
                    <Settings2 className="w-4 h-4 text-stone-400" />
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input type="checkbox" checked={visibleColumns.isbn} onChange={() => toggleColumn('isbn')} className="rounded text-teal-600 focus:ring-0" /> ISBN
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input type="checkbox" checked={visibleColumns.author} onChange={() => toggleColumn('author')} className="rounded text-teal-600 focus:ring-0" /> 저자
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input type="checkbox" checked={visibleColumns.publisher} onChange={() => toggleColumn('publisher')} className="rounded text-teal-600 focus:ring-0" /> 출판사
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input type="checkbox" checked={visibleColumns.pubYear} onChange={() => toggleColumn('pubYear')} className="rounded text-teal-600 focus:ring-0" /> 연도
                    </label>
                  </div>
                </div>
                
                {/* Separator / Filter Toggle Button */}
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-stone-200"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium border shadow-sm transition-all ${
                        showFilters 
                          ? 'bg-teal-50 border-teal-200 text-teal-700' 
                          : 'bg-white border-stone-300 text-stone-500 hover:text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <Filter className="w-3 h-3" />
                      상세 필터 설정
                      {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* Filter Panel (Collapsible) */}
                {showFilters && (
                  <div className="p-4 bg-stone-50 border-t border-b border-stone-100 grid md:grid-cols-12 gap-6 text-sm animate-in slide-in-from-top-2 duration-200">
                    
                    {/* Left: Library Filter */}
                    <div className="md:col-span-9">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-stone-700">도서관 선택 ({selectedLibraries.length}/{availableLibraries.length})</h4>
                        <div className="flex gap-2">
                          <button 
                            type="button"
                            onClick={() => setSelectedLibraries(availableLibraries)} 
                            className="text-xs text-teal-600 hover:text-teal-800 hover:underline font-medium"
                          >
                            전체 선택
                          </button>
                          <span className="text-stone-300">|</span>
                          <button 
                            type="button"
                            onClick={() => setSelectedLibraries([])} 
                            className="text-xs text-stone-500 hover:text-stone-700 hover:underline font-medium"
                          >
                            선택 해제
                          </button>
                        </div>
                      </div>
                      
                      <div className="bg-white border border-stone-200 rounded-lg p-3 h-32 overflow-y-auto custom-scrollbar grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {availableLibraries.map(lib => (
                          <label key={lib} className="flex items-center gap-2 cursor-pointer text-stone-600 hover:text-stone-900 select-none">
                            <input 
                              type="checkbox" 
                              checked={selectedLibraries.includes(lib)}
                              onChange={() => toggleLibraryFilter(lib)}
                              className="rounded border-stone-300 text-teal-600 focus:ring-teal-500"
                            />
                            <span className="truncate" title={lib}>{lib}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Right: Status Filter */}
                    <div className="md:col-span-3 border-t md:border-t-0 md:border-l border-stone-200 pt-4 md:pt-0 md:pl-6">
                      <h4 className="font-bold text-stone-700 mb-2 flex items-center gap-2">
                        대출 상태
                      </h4>
                      <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 cursor-pointer hover:bg-stone-100 p-1.5 rounded-md -ml-1.5 transition-colors">
                          <input 
                            type="checkbox" 
                            checked={selectedStatuses.includes('available')}
                            onChange={() => toggleStatusFilter('available')}
                            className="rounded border-stone-300 text-teal-600 focus:ring-teal-500"
                          />
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                            대출가능
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer hover:bg-stone-100 p-1.5 rounded-md -ml-1.5 transition-colors">
                          <input 
                            type="checkbox" 
                            checked={selectedStatuses.includes('unavailable')}
                            onChange={() => toggleStatusFilter('unavailable')}
                            className="rounded border-stone-300 text-teal-600 focus:ring-teal-500"
                          />
                          <span className="flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5 text-red-500" />
                            대출중
                          </span>
                        </label>
                      </div>
                    </div>

                  </div>
                )}
              </div>
              
              <ResultTable data={filteredResults} visibleColumns={visibleColumns} />
            </div>
          )}

          {!loading && searched && results && results.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-stone-200">
              <Library className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-stone-900">결과가 없습니다</h3>
              <p className="text-stone-500">다른 검색어나 자치구를 선택해보세요.</p>
            </div>
          )}
        </section>
        
      </main>
      
      <footer className="max-w-7xl mx-auto px-4 py-8 mt-8 text-center border-t border-stone-200">
        <p className="text-stone-400 text-sm">
          &copy; {new Date().getFullYear()} 도서관 통. All rights reserved.
        </p>
      </footer>

      <LibraryListModal isOpen={showLibraryList} onClose={() => setShowLibraryList(false)} />
    </div>
  );
}
