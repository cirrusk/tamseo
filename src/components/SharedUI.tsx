// 파일 경로: src/components/SharedUI.tsx

"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Library as LibraryIcon, Mail, MessageSquare, Info } from 'lucide-react';

export const TamseoLogo = ({ className = "" }: { className?: string }) => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="28" height="28" rx="7" fill="#1D1D1F"/>
    <path d="M8.5 11C8.5 9.89543 9.39543 9 10.5 9H13.5V19H10.5C9.39543 19 8.5 18.1046 8.5 17V11Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19.5 11C19.5 9.89543 18.6046 9 17.5 9H14.5V19H17.5C18.6046 19 19.5 18.1046 19.5 17V11Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const NavBar = () => {
  const pathname = usePathname();
  
  return (
    <nav className="fixed top-0 w-full z-50 bg-[#F5F5F7]/80 backdrop-blur-xl border-b border-black/[0.05] supports-[backdrop-filter]:bg-[#F5F5F7]/60">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="transition-transform group-hover:scale-105 shrink-0"><TamseoLogo /></div>
          <div className="flex items-baseline">
            <span className="text-[15px] font-bold tracking-tight text-[#1D1D1F]">탐서</span>
            <span className="text-[10px] font-semibold text-[#86868B] ml-2.5 tracking-[0.2em] uppercase hidden sm:inline-block">Tamseo</span>
          </div>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/about" className={`text-[13px] font-bold transition-colors ${pathname === '/about' ? 'text-[#1D1D1F]' : 'text-[#86868B] hover:text-[#1D1D1F]'}`}>
            소개
          </Link>
          <Link href="/collections" className={`text-[13px] font-bold px-4 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${pathname === '/collections' ? 'bg-[#1D1D1F] text-white shadow-sm' : 'bg-white border border-[#E5E5EA] text-[#1D1D1F] hover:bg-[#E5E5EA]/50'}`}>
            <LibraryIcon size={14} strokeWidth={2.5} /> 전집 탐색
          </Link>
        </div>
      </div>
    </nav>
  );
};

export const Footer = () => (
  <footer className="border-t border-[#E5E5EA] py-12 mt-16 bg-white/30">
    <div className="max-w-4xl mx-auto px-6 flex flex-col items-center">
      <TamseoLogo className="mb-5 opacity-40 grayscale" />
      <p className="text-[12px] font-bold text-[#A1A1A6] tracking-widest uppercase mb-2">Tamseo</p>
      <p className="text-[14px] font-medium text-[#86868B] mb-8 text-center">가장 아날로그적인 휴식을 위한, 가장 스마트한 연결.</p>
      
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-10 text-[13px] font-medium text-[#A1A1A6]">
        <a href="mailto:thetamseo.official@gmail.com" className="flex items-center gap-1.5 hover:text-[#1D1D1F] transition-colors">
          <Mail size={14} /> thetamseo.official@gmail.com
        </a>
        <span className="hidden sm:block w-[1px] h-3 bg-[#E5E5EA]"></span>
        <a href="https://docs.google.com/forms/d/e/1FAIpQLSfhG2FO6js-RX70cha-sHviJ7PFcDaA-U79McVykTunoOh55w/viewform?usp=publish-editor" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-[#1D1D1F] transition-colors">
          <MessageSquare size={14} /> 개선 및 건의사항 남기기
        </a>
      </div>

      <div className="flex gap-4 mb-4 text-[12px] font-medium text-[#86868B]">
        <Link href="/privacy" className="hover:text-[#1D1D1F] transition-colors">개인정보처리방침</Link>
      </div>
      <p className="text-[12px] font-medium text-[#D2D2D7]">&copy; {new Date().getFullYear()} Tamseo. All rights reserved.</p>
    </div>
  </footer>
);

export const PrivacyBanner = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hasConsented = localStorage.getItem('tamseo-privacy-consent');
    if (!hasConsented) setShow(true);
  }, []);

  const handleConsent = () => {
    localStorage.setItem('tamseo-privacy-consent', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 z-[100] flex justify-center animate-in slide-in-from-bottom-10 fade-in duration-500">
      <div className="bg-[#1D1D1F]/95 backdrop-blur-xl border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.2)] rounded-2xl p-4 sm:px-6 sm:py-4 flex flex-col sm:flex-row items-center gap-4 max-w-3xl w-full">
        <div className="flex items-start sm:items-center gap-3 flex-1">
          <Info className="w-5 h-5 text-white/70 shrink-0 mt-0.5 sm:mt-0" />
          <p className="text-[13px] leading-relaxed text-white/90">
            탐서는 원활한 서비스 제공과 어뷰징 방지를 위해 <span className="font-bold text-white">IP 주소, 기기 정보, 검색어</span> 등 최소한의 로그 데이터를 수집합니다. 서비스를 계속 이용하시면 이에 동의한 것으로 간주됩니다.
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
          <button onClick={handleConsent} className="flex-1 sm:flex-none bg-white text-[#1D1D1F] hover:bg-[#F5F5F7] px-5 py-2.5 rounded-xl text-[13px] font-bold transition-colors shadow-sm">
            확인 및 동의
          </button>
        </div>
      </div>
    </div>
  );
};