// 파일 경로: src/app/collections/page.tsx

"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronRight, ChevronLeft, Check, X } from 'lucide-react';
import { KIDS_COLLECTIONS, BRANDS, BookCollection } from '@/lib/constants';

export default function CollectionsPage() {
  const router = useRouter();
  const [selectedBrand, setSelectedBrand] = useState("전체");
  const [searchQuery, setSearchQuery] = useState(""); 
  const [viewingCollection, setViewingCollection] = useState<BookCollection | null>(null);
  const [cartBooks, setCartBooks] = useState<string[]>([]);

  const filteredCollections = useMemo(() => {
    let result = KIDS_COLLECTIONS;
    if (selectedBrand !== "전체") result = result.filter(c => c.brand === selectedBrand);
    if (searchQuery.trim() !== "") {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(c => c.title.toLowerCase().includes(lowerQuery) || c.brand.toLowerCase().includes(lowerQuery) || c.category.toLowerCase().includes(lowerQuery));
    }
    return result;
  }, [selectedBrand, searchQuery]);

  const toggleBookInCart = (book: string) => {
    setCartBooks(prev => {
      if (prev.includes(book)) return prev.filter(b => b !== book);
      if (prev.length >= 5) {
        alert("검색은 한 번에 최대 5권까지만 가능합니다.");
        return prev;
      }
      return [...prev, book];
    });
  };

  // 장바구니에 담은 책을 메인 검색창(Query Parameter)으로 전달
  const handleSendToSearch = () => {
    if (cartBooks.length === 0) return;
    const query = encodeURIComponent(cartBooks.join(','));
    router.push(`/?books=${query}`);
  };

  return (
    <div className="pt-24 pb-40 px-4 sm:px-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-[800ms] ease-out relative min-h-[80vh]">
      <div className="mb-10">
        <h1 className="text-[32px] md:text-[44px] font-bold tracking-tight text-[#1D1D1F] leading-tight mb-3">어떤 전집을 찾으시나요?</h1>
        <p className="text-[17px] text-[#86868B] font-medium tracking-tight mb-8">유명 출판사의 전집 목록을 둘러보고, 원하는 낱권들을 선택해 한 번에 검색하세요.</p>

        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none"><Search className="w-5 h-5 text-[#A1A1A6]" strokeWidth={2.5} /></div>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="전집명, 출판사, 장르 검색 (예: 과학공룡, 아람)" className="w-full bg-white border border-[#E5E5EA] text-[#1D1D1F] text-[16px] pl-12 pr-4 py-4 rounded-[20px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] focus:outline-none focus:border-[#1D1D1F]/30 focus:shadow-[0_4px_20px_rgb(0,0,0,0.06)] transition-all font-medium placeholder:text-[#A1A1A6]" />
          {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-4 flex items-center text-[#A1A1A6] hover:text-[#1D1D1F] transition-colors"><X className="w-5 h-5" /></button>}
        </div>

        <div className="flex overflow-x-auto custom-scrollbar pb-3 gap-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {BRANDS.map(brand => (
            <button key={brand} onClick={() => setSelectedBrand(brand)} className={`whitespace-nowrap px-5 py-2.5 rounded-full text-[14px] font-bold transition-all duration-300 ${selectedBrand === brand ? 'bg-[#1D1D1F] text-white shadow-md' : 'bg-white text-[#86868B] border border-[#E5E5EA] hover:border-[#1D1D1F]/30 hover:text-[#1D1D1F]'}`}>
              {brand}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <div className={`transition-all duration-500 ${viewingCollection ? 'opacity-0 scale-95 pointer-events-none absolute inset-0' : 'opacity-100 scale-100'}`}>
          {filteredCollections.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCollections.map(collection => (
                <div key={collection.id} onClick={() => setViewingCollection(collection)} className="group bg-white border border-[#E5E5EA] hover:border-[#1D1D1F]/20 rounded-[24px] p-6 cursor-pointer transition-all hover:shadow-[0_12px_30px_rgb(0,0,0,0.06)] flex flex-col h-[220px]">
                  <div className="flex justify-between items-start mb-3">
                    <div className="text-[12px] font-bold text-[#86868B]">{collection.brand}</div>
                    <div className="flex gap-1.5">
                      <span className="bg-[#F5F5F7] text-[#515154] text-[10px] font-bold px-2 py-0.5 rounded-md tracking-tight">{collection.category}</span>
                      <span className="bg-[#E8F2FF] text-[#0066CC] text-[10px] font-bold px-2 py-0.5 rounded-md tracking-tight">{collection.ageGroup}</span>
                    </div>
                  </div>
                  <h4 className="text-[20px] font-bold text-[#1D1D1F] mb-2 group-hover:text-[#0066CC] transition-colors leading-snug line-clamp-2">{collection.title}</h4>
                  <p className="text-[14px] text-[#515154] leading-relaxed line-clamp-2">{collection.description}</p>
                  <div className="mt-auto pt-4 border-t border-[#F5F5F7] flex items-center justify-between">
                    <span className="text-[13px] font-bold text-[#1D1D1F] bg-[#F5F5F7] px-2.5 py-1 rounded-md">총 {collection.books.length}권</span>
                    <div className="w-8 h-8 rounded-full bg-[#F5F5F7] flex items-center justify-center group-hover:bg-[#1D1D1F] transition-colors">
                      <ChevronRight size={16} className="text-[#A1A1A6] group-hover:text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center border border-[#E5E5EA] border-dashed rounded-[24px]">
              <Search className="w-12 h-12 text-[#D2D2D7] mx-auto mb-4" strokeWidth={1} />
              <p className="text-[17px] font-bold text-[#1D1D1F]">검색 결과가 없습니다.</p>
            </div>
          )}
        </div>

        {viewingCollection && (
          <div className="bg-white border border-[#E5E5EA] rounded-[28px] p-6 md:p-10 shadow-[0_20px_40px_rgb(0,0,0,0.08)] animate-in slide-in-from-right-8 fade-in duration-500">
            <button onClick={() => setViewingCollection(null)} className="flex items-center gap-2 text-[14px] font-bold text-[#86868B] hover:text-[#1D1D1F] transition-colors mb-6"><ChevronLeft size={18} /> 이전으로 돌아가기</button>
            <div className="mb-8 border-b border-[#E5E5EA] pb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-[13px] font-bold text-[#86868B]">{viewingCollection.brand}</div><div className="w-1 h-1 rounded-full bg-[#D2D2D7]"></div>
                <div className="text-[13px] font-bold text-[#515154]">{viewingCollection.category}</div><div className="w-1 h-1 rounded-full bg-[#D2D2D7]"></div>
                <div className="text-[13px] font-bold text-[#0066CC]">{viewingCollection.ageGroup}</div>
              </div>
              <h2 className="text-[28px] md:text-[36px] font-bold text-[#1D1D1F] tracking-tight">{viewingCollection.title}</h2>
              <p className="text-[16px] text-[#515154] mt-2">{viewingCollection.description}</p>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[15px] font-bold text-[#1D1D1F]">포함된 낱권 목록</span>
              <span className="text-[13px] font-semibold text-[#0066CC] bg-[#0066CC]/10 px-3 py-1 rounded-full">{cartBooks.length} / 5권 선택됨</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2 pb-2">
              {viewingCollection.books.map((book, idx) => {
                const isSelected = cartBooks.includes(book);
                return (
                  <label key={idx} className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border ${isSelected ? 'bg-[#F5F5F7] border-[#1D1D1F] shadow-[0_2px_10px_rgb(0,0,0,0.05)]' : 'bg-white border-[#E5E5EA] hover:border-[#1D1D1F]/30 hover:bg-[#F5F5F7]/50'}`}>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-[#1D1D1F] border-[#1D1D1F]' : 'border-[#D2D2D7]'}`}>
                      {isSelected && <Check size={14} className="text-white" strokeWidth={3} />}
                    </div>
                    <span className={`text-[15px] transition-colors line-clamp-1 ${isSelected ? 'font-bold text-[#1D1D1F]' : 'font-medium text-[#515154]'}`}>{book}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {cartBooks.length > 0 && (
        <div className="fixed bottom-10 left-0 right-0 z-50 flex justify-center px-4 animate-in slide-in-from-bottom-10 fade-in duration-500">
          <div className="bg-white/90 backdrop-blur-xl border border-[#E5E5EA] shadow-[0_20px_40px_rgba(0,0,0,0.15)] rounded-full p-2.5 flex items-center gap-4 max-w-[450px] w-full">
            <div className="flex items-center gap-3 pl-4">
              <div className="w-8 h-8 bg-[#1D1D1F] rounded-full flex items-center justify-center text-white font-bold text-[14px]">{cartBooks.length}</div>
              <div className="flex flex-col">
                <span className="text-[13px] font-bold text-[#1D1D1F] leading-tight">선택됨</span>
                <span className="text-[11px] font-medium text-[#86868B] leading-tight cursor-pointer hover:underline" onClick={() => setCartBooks([])}>비우기</span>
              </div>
            </div>
            <button onClick={handleSendToSearch} className="ml-auto bg-[#0066CC] hover:bg-[#0055B3] text-white px-6 py-3 rounded-full text-[15px] font-bold transition-all active:scale-95 flex items-center gap-2 shadow-[0_4px_14px_rgba(0,102,204,0.3)]">
              검색창으로 이동 <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}