"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ChevronRight, BookOpen, MapPin, CheckCircle2, XCircle, Info, Filter, X, Loader2, ChevronDown, ChevronUp, Library as LibraryIcon, ChevronLeft, Check, Mail, MessageSquare } from 'lucide-react';

// =========================================================================
// 📁 공통 타입 및 데이터 (src/lib/constants.ts)
// =========================================================================
interface BookMetadata { title: string; author: string; publisher: string; pubYear: string; isbn: string; imageUrl?: string; }
interface LibraryAvailability { libraryName: string; isAvailable: boolean; }
interface GroupedBookResult { metadata: BookMetadata; libraries: LibraryAvailability[]; }
interface SearchResultItem { searchTerm: string; books: GroupedBookResult[]; }
interface LibraryInfo { district: string; name: string; address: string; }
interface BookCollection { id: string; brand: string; title: string; category: string; ageGroup: string; description: string; books: string[]; }

const DISTRICTS = ["11230", "11250", "11090", "11160", "11210", "11050", "11170", "11180", "11110", "11100", "11060", "11200", "11140", "11130", "11220", "11040", "11080", "11240", "11150", "11190", "11030", "11120", "11010", "11020", "11070"];
const DISTRICT_NAMES: Record<string, string> = { "11230": "강남구", "11250": "강동구", "11090": "강북구", "11160": "강서구", "11210": "관악구", "11050": "광진구", "11170": "구로구", "11180": "금천구", "11110": "노원구", "11100": "도봉구", "11060": "동대문구", "11200": "동작구", "11140": "마포구", "11130": "서대문구", "11220": "서초구", "11040": "성동구", "11080": "성북구", "11240": "송파구", "11150": "양천구", "11190": "영등포구", "11030": "용산구", "11120": "은평구", "11010": "종로구", "11020": "중구", "11070": "중랑구" };
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
  { district: "용산구", name: "용산도서관", address: "서울 용산구 두텁바위로 160" },
  { district: "관악구", name: "관악도서관", address: "서울 관악구 신림로3길 35" },
];

const BRANDS = ["전체", "그레이트북스", "아람북스", "비룡소", "키즈스콜레", "무지개출판사"];
const KIDS_COLLECTIONS: BookCollection[] = [
  { id: "c1", brand: "그레이트북스", title: "내 친구 과학공룡", category: "과학", ageGroup: "4~7세", description: "아이들의 호기심을 채워주는 재미있는 과학 그림책", books: ["요리조리 빙글빙글", "뼈뼈 사우루스", "자석의 비밀", "우주로 간 라이카", "물방울의 여행", "소화가 꿀꺽꿀꺽"] },
  { id: "c2", brand: "그레이트북스", title: "내 친구 수학공룡", category: "수학", ageGroup: "4~7세", description: "일상 속 수학의 원리를 깨우치는 스토리텔링 수학", books: ["모양 친구들 숨바꼭질", "1부터 10까지 세어봐", "크다 작다 길다 짧다", "시간을 재어보자"] },
  { id: "c3", brand: "아람북스", title: "자연이랑", category: "자연관찰", ageGroup: "0~3세", description: "생생한 사진과 이야기로 만나는 첫 자연관찰 전집", books: ["호랑이는 무서워", "사자는 동물의 왕", "코끼리 코는 길어", "기린은 목이 길어", "팬더는 대나무를 좋아해"] },
  { id: "c4", brand: "아람북스", title: "심쿵", category: "인성", ageGroup: "4~7세", description: "아이의 마음을 알아주고 다독이는 인성 동화", books: ["화가 날 땐 어떡하지?", "동생이 미워요", "나도 할 수 있어", "어둠이 무섭지 않아"] },
  { id: "c5", brand: "키즈스콜레", title: "마마파파 세계명작", category: "명작", ageGroup: "4~7세", description: "세계적인 일러스트레이터들이 참여한 아름다운 명작", books: ["백설공주", "신데렐라", "아기돼지 삼형제", "헨젤과 그레텔", "미운 오리 새끼"] },
  { id: "c6", brand: "비룡소", title: "비룡소 그림동화", category: "창작", ageGroup: "전연령", description: "전 세계의 아름다운 수상작들을 모은 그림책", books: ["지각대장 존", "무지개 물고기", "누가 내 머리에 똥 쌌어?", "구름빵", "달샤베트"] },
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

// =========================================================================
// 📁 공통 UI 컴포넌트 (src/components/SharedUI.tsx)
// =========================================================================
const TamseoLogo = ({ className = "" }: { className?: string }) => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="28" height="28" rx="7" fill="#1D1D1F"/>
    <path d="M8.5 11C8.5 9.89543 9.39543 9 10.5 9H13.5V19H10.5C9.39543 19 8.5 18.1046 8.5 17V11Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19.5 11C19.5 9.89543 18.6046 9 17.5 9H14.5V19H17.5C18.6046 19 19.5 18.1046 19.5 17V11Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const NavBar = ({ currentView, setCurrentView }: any) => (
  <nav className="fixed top-0 w-full z-50 bg-[#F5F5F7]/80 backdrop-blur-xl border-b border-black/[0.05] supports-[backdrop-filter]:bg-[#F5F5F7]/60">
    <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
      <div className="flex items-center gap-2 cursor-pointer group" onClick={() => { setCurrentView('search'); window.scrollTo(0,0); }}>
        <div className="flex items-baseline">
          <span className="text-[15px] font-bold tracking-tight text-[#1D1D1F]">탐서</span>
          <span className="text-[10px] font-semibold text-[#86868B] ml-2.5 tracking-[0.2em] uppercase hidden sm:inline-block">Tamseo</span>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <button onClick={() => { setCurrentView('about'); window.scrollTo(0,0); }} className={`text-[13px] font-bold transition-colors ${currentView === 'about' ? 'text-[#1D1D1F]' : 'text-[#86868B] hover:text-[#1D1D1F]'}`}>
          소개
        </button>
        <button onClick={() => { setCurrentView('collections'); window.scrollTo(0,0); }} className={`text-[13px] font-bold px-4 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${currentView === 'collections' ? 'bg-[#1D1D1F] text-white shadow-sm' : 'bg-white border border-[#E5E5EA] text-[#1D1D1F] hover:bg-[#E5E5EA]/50'}`}>
          <LibraryIcon size={14} strokeWidth={2.5} /> 전집 탐색
        </button>
      </div>
    </div>
  </nav>
);

const Footer = ({ setCurrentView }: any) => (
  <footer className="border-t border-[#E5E5EA] py-12 mt-16 bg-white/30">
    <div className="max-w-4xl mx-auto px-6 flex flex-col items-center">
      <TamseoLogo className="mb-5 opacity-40 grayscale" />
      <p className="text-[12px] font-bold text-[#A1A1A6] tracking-widest uppercase mb-2">Tamseo</p>
      <p className="text-[14px] font-medium text-[#86868B] mb-8 text-center">가장 아날로그적인 휴식을 위한, 가장 스마트한 연결.</p>
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-10 text-[13px] font-medium text-[#A1A1A6]">
        <a href="mailto:thetamseo.official@gmail.com" className="flex items-center gap-1.5 hover:text-[#1D1D1F] transition-colors"><Mail size={14} /> thetamseo.official@gmail.com</a>
        <span className="hidden sm:block w-[1px] h-3 bg-[#E5E5EA]"></span>
        <a href="https://docs.google.com/forms/d/e/1FAIpQLSfhG2FO6js-RX70cha-sHviJ7PFcDaA-U79McVykTunoOh55w/viewform?usp=publish-editor" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-[#1D1D1F] transition-colors">
          <MessageSquare size={14} /> 개선 및 건의사항 남기기
        </a>
      </div>
      <div className="flex gap-4 mb-4 text-[12px] font-medium text-[#86868B]">
        <button onClick={() => { setCurrentView('privacy'); window.scrollTo(0,0); }} className="hover:text-[#1D1D1F] transition-colors">개인정보처리방침</button>
      </div>
      <p className="text-[12px] font-medium text-[#D2D2D7]">&copy; {new Date().getFullYear()} Tamseo. All rights reserved.</p>
    </div>
  </footer>
);


// =========================================================================
// 📁 소개 페이지 (src/app/about/page.tsx)
// =========================================================================
const AboutPage = () => {
  return (
    <div className="pt-28 pb-32 px-6 max-w-[700px] mx-auto animate-in fade-in slide-in-from-bottom-8 duration-[1000ms] ease-out">
      <header className="mb-16 text-center">
        <h1 className="text-[36px] md:text-[52px] font-bold tracking-tight text-[#1D1D1F] leading-[1.2] mb-6">가장 아날로그적인 온기를 위한,<br />가장 스마트한 연결.</h1>
      </header>
      <article className="space-y-12">
        <section>
          <p className="text-[17px] md:text-[19px] leading-[1.7] text-[#515154] font-medium mb-6">AI가 우리의 질문에 1초 만에 대답을 내놓고, 알고리즘이 끝없는 숏폼 영상을 쏟아내는 완벽한 디지털의 시대. 하지만 역설적이게도 우리는 다시 &apos;종이책&apos;을 찾고 있습니다.</p>
          <p className="text-[17px] md:text-[19px] leading-[1.7] text-[#515154] font-medium mb-6">최근 미국 도서관협회(ALA)와 퓨 리서치(Pew Research)의 조사에 따르면, 디지털 네이티브라 불리는 Z세대와 밀레니얼 세대의 80%가 전자책보다 <span className="text-[#1D1D1F] font-bold">종이책</span>을 선호한다고 답했습니다. 종일 쏟아지는 스크린의 빛과 알림에 지친 현대인에게, 스마트폰을 내려놓고 서걱거리는 종이의 촉감을 느끼는 시간은 현대인에게 허락된 가장 온전하고 사치스러운 &apos;디지털 디톡스&apos;이기 때문입니다.</p>
        </section>
        <section className="pt-8 border-t border-[#E5E5EA]/70">
          <h2 className="text-[22px] md:text-[26px] font-bold text-[#1D1D1F] tracking-tight mb-5">터치 한 번의 시대, 지식의 탐색은 왜 여전히 느릴까?</h2>
          <p className="text-[17px] md:text-[19px] leading-[1.7] text-[#515154] font-medium mb-6">음식 배달도, 필요한 물건의 배송도 단 한 번의 터치로 내일 새벽이면 해결되는 세상에 살고 있습니다. 인스타그램이나 유튜브를 보다가 마음에 드는 책 서너 권을 발견하는 것도 순식간이죠.</p>
          <blockquote className="my-8 pl-6 py-2 border-l-4 border-[#1D1D1F] text-[18px] md:text-[20px] font-semibold text-[#1D1D1F] leading-relaxed italic">&quot;이번 주말엔 이 책들을 도서관에서 빌려 읽어야지.&quot;</blockquote>
          <p className="text-[17px] md:text-[19px] leading-[1.7] text-[#515154] font-medium mb-6">하지만 막상 도서관 시스템에 접속하는 순간, 설렘은 곧 귀찮음으로 바뀝니다. 내가 읽고 싶은 책 5권이 우리 동네 어느 도서관에 있는지 확인하려면, 책 제목을 하나하나 검색하고, 도서관 목록을 일일이 대조해야 합니다.</p>
          <blockquote className="my-8 pl-6 py-2 border-l-4 border-[#1D1D1F] text-[18px] md:text-[20px] font-semibold text-[#1D1D1F] leading-relaxed italic">&quot;내가 찾는 책들이 한곳에 제일 많이 모여있는 도서관은 어디일까?&quot;<br />&quot;헛걸음하지 않으려면 어디로 가야 할까?&quot;</blockquote>
          <p className="text-[17px] md:text-[19px] leading-[1.7] text-[#515154] font-medium mb-6">검색하는 시간과 어느 도서관을 가야 할지 비교하는 시간. 가장 편안해야 할 독서의 시작이, 가장 소모적인 노동이 되어버리는 순간입니다.</p>
        </section>
        <section className="pt-8 border-t border-[#E5E5EA]/70">
          <h2 className="text-[22px] md:text-[26px] font-bold text-[#1D1D1F] tracking-tight mb-5">어느 워킹맘의 지친 퇴근길에서 시작된 질문</h2>
          <p className="text-[17px] md:text-[19px] leading-[1.7] text-[#515154] font-medium mb-6">모두가 묵인하던 이 보편적인 불편함은 사실, 쫓기듯 살아가는 한 워킹맘의 아주 개인적인 고민에서 출발했습니다.</p>
          <p className="text-[17px] md:text-[19px] leading-[1.7] text-[#515154] font-medium mb-6">엄마로서 아이에게 세상의 수많은 이야기를 종이책으로 직접 만져보게 해주고 싶었습니다. 하지만 매번 책을 구매하기엔 비용도 부담이었고, 보관할 집의 공간에도 한계가 있어 자연스레 공공 도서관을 찾게 되었습니다.</p>
          <p className="text-[17px] md:text-[19px] leading-[1.7] text-[#515154] font-medium mb-6">하지만 워킹맘에게 허락된 시간은 아이가 잠든 고요한 밤이나 흔들리는 출퇴근 지하철 안뿐이었습니다. 쪼개어 쓰는 그 귀한 시간에, 읽고 싶은 책들을 일일이 검색하고 가장 책이 많은 도서관을 찾는 일은 너무나 지치고 어려운 일이었습니다.</p>
          <p className="text-[17px] md:text-[19px] leading-[1.7] text-[#1D1D1F] font-bold mb-6">&quot;검색에 버려지는 이 아까운 시간을 줄이고, 단 한 번에 끝낼 수는 없을까?&quot;<br/>탐서(探書)는 바로 그 절실함에서 만들어졌습니다.</p>
        </section>
        <section className="pt-8 border-t border-[#E5E5EA]/70">
          <h2 className="text-[22px] md:text-[26px] font-bold text-[#1D1D1F] tracking-tight mb-5">당신의 주말을 바꿀 작은 나침반</h2>
          <p className="text-[17px] md:text-[19px] leading-[1.7] text-[#515154] font-medium mb-6">이제, 탐서(探書)의 캔버스 위에 당신이 궁금해진 여러 권의 책 이름을 한 번에 올려두기만 하세요.</p>
          <p className="text-[17px] md:text-[19px] leading-[1.7] text-[#515154] font-medium mb-6">탐서가 전국 방방곡곡의 수만 개 공공 도서관 데이터를 실시간으로 분석하여, 당신이 찾는 책들을 가장 많이, 그리고 지금 당장 대출할 수 있는 &apos;최적의 도서관&apos;을 단숨에 찾아냅니다. 마치 여러 권의 책을 한 번에 담아 내어주는 가장 지적이고 친절한 컨시어지처럼 말이죠.</p>
          <p className="text-[17px] md:text-[19px] leading-[1.7] text-[#515154] font-medium mb-12">이제 어디로 가야 할지 헤매거나 여러 번 검색창을 두드릴 필요가 없습니다. 탐서가 안내하는 곳으로 가벼운 발걸음을 옮기기만 하세요. 화면 속에서 빛나는 초록색 점(대출 가능)을 따라 걷다 보면, 조용한 도서관 서가 사이에서 당신을 오랫동안 기다려온 완벽한 종이책들을 만나게 될 것입니다.</p>
          <div className="flex items-center gap-4 mt-16 pt-8 border-t border-[#1D1D1F] max-w-[200px]">
            <div className="shrink-0"><TamseoLogo /></div>
            <div>
              <p className="text-[14px] font-bold text-[#1D1D1F] tracking-tight">숨겨진 지식을 찾다.</p>
              <p className="text-[11px] font-semibold text-[#86868B] uppercase tracking-[0.2em] mt-0.5">Tamseo</p>
            </div>
          </div>
        </section>
      </article>
    </div>
  );
};


// =========================================================================
// 📁 개인정보처리방침 (src/app/privacy/page.tsx)
// =========================================================================
const PrivacyPolicyPage = () => {
  return (
    <div className="pt-28 pb-32 px-4 sm:px-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-[800ms] ease-out">
      <div className="bg-white border border-[#E5E5EA] rounded-[32px] p-8 sm:p-14 shadow-[0_4px_30px_rgb(0,0,0,0.03)]">
        <header className="mb-12 border-b border-[#E5E5EA] pb-8">
          <h1 className="text-[28px] md:text-[36px] font-bold text-[#1D1D1F] tracking-tight mb-2">개인정보 처리방침</h1>
          <p className="text-[15px] text-[#86868B]">탐서 서비스 이용을 위한 개인정보 보호 가이드라인</p>
        </header>

        <div className="text-[#515154] text-[15px] leading-relaxed space-y-10">
          <p>
            <strong>탐서(Tamseo)</strong> (이하 &apos;서비스&apos;라 합니다)는 이용자의 자유롭고 안전한 서비스 이용을 위해 『개인정보 보호법』 및 관계 법령이 정한 바를 준수하여, 적법하게 개인정보를 처리하고 안전하게 관리하고 있습니다. 이에 『개인정보 보호법』 제30조에 따라 이용자에게 개인정보 처리에 관한 절차 및 기준을 안내하고, 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 다음과 같이 개인정보 처리방침을 수립·공개합니다.
          </p>

          <section>
            <h3 className="text-[18px] font-bold text-[#1D1D1F] mb-4">제1조 (개인정보의 처리 목적 및 수집 항목)</h3>
            <p className="mb-3">서비스는 회원가입 절차 없이 누구나 익명으로 이용할 수 있는 개방형 서비스입니다. 단, 원활한 서비스 제공과 어뷰징 방지를 위해 최소한의 시스템 로그 정보를 자동으로 수집하여 처리하고 있습니다.</p>
            <ul className="list-disc pl-5 space-y-2 mt-3 marker:text-[#D2D2D7]">
              <li><strong className="text-[#1D1D1F]">수집 항목:</strong> 이용자의 IP 주소, 단말기 및 브라우저 정보(User-Agent), 서비스 이용 기록(접속 일시, 검색한 도서명, 선택한 지역 코드)</li>
              <li><strong className="text-[#1D1D1F]">처리 목적:</strong>
                <ul className="list-[circle] pl-5 mt-2 space-y-1 marker:text-[#E5E5EA]">
                  <li>서비스 안정성 확보 및 부정 이용 방지 (1일 IP 기반 검색 횟수 제한 등)</li>
                  <li>서비스 개선 및 통계 분석 (지역별 도서 검색 트렌드 분석, 접속 환경 등)</li>
                </ul>
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-[18px] font-bold text-[#1D1D1F] mb-4">제2조 (개인정보의 처리 및 보유 기간)</h3>
            <p className="mb-3">서비스는 원칙적으로 수집 목적이 달성된 후 지체 없이 파기합니다. 단, 관계 법령 또는 내부 방침에 따라 일정 기간 보관합니다.</p>
            <ul className="list-disc pl-5 space-y-2 mt-3 marker:text-[#D2D2D7]">
              <li><strong>부정 이용 방지 및 통계 분석용 접속 로그 (내부 방침):</strong> 수집일로부터 6개월 보관 후 파기</li>
              <li><strong>컴퓨터통신, 인터넷 로그기록자료, 접속지 추적자료 (통신비밀보호법):</strong> 3개월</li>
            </ul>
          </section>

          <section>
            <h3 className="text-[18px] font-bold text-[#1D1D1F] mb-4">제3조 (개인정보의 제3자 제공 및 처리 위탁)</h3>
            <p>① 서비스는 본래 목적 범위를 초과하여 처리하거나 제3자에게 제공하지 않습니다. (단, 수사 목적으로 수사기관의 요구가 있는 경우 등 법령에 의거한 예외 존재)</p>
            <p className="mt-2">② 현재 외부 업체에 개인정보 처리업무를 위탁하고 있지 않으며, 향후 발생 시 본 처리방침을 통해 안내하겠습니다.</p>
          </section>

          <section>
            <h3 className="text-[18px] font-bold text-[#1D1D1F] mb-4">제4조 (개인정보의 파기 절차 및 파기 방법)</h3>
            <p>서비스는 보유기간 경과, 목적 달성 시 지체 없이 해당 정보를 파기합니다. 전자적 파일 형태로 기록·저장된 정보는 기록을 재생할 수 없도록 영구 삭제(DB 자동 삭제)합니다.</p>
          </section>

          <section>
            <h3 className="text-[18px] font-bold text-[#1D1D1F] mb-4">제5조 (정보주체의 권리·의무 및 그 행사방법)</h3>
            <p>이용자는 언제든지 열람, 정정, 삭제, 처리정지 요구 등의 권리를 행사할 수 있으며 서비스(이메일 문의)를 통해 조치합니다. 단, IP 주소 등 특정 개인을 식별하기 어려운 로그(가명/익명 정보 수준)만 수집하므로, 이용자를 특정할 수 없는 경우 권리 행사가 제한될 수 있습니다.</p>
          </section>

          <section>
            <h3 className="text-[18px] font-bold text-[#1D1D1F] mb-4">제6조 (개인정보의 안전성 확보 조치)</h3>
            <ul className="list-disc pl-5 space-y-2 marker:text-[#D2D2D7]">
              <li><strong>관리적 조치:</strong> 내부관리계획 수립, 개인정보 취급 최소화</li>
              <li><strong>기술적 조치:</strong> DB 접근권한 관리, 통신 구간 암호화(HTTPS/SSL)</li>
              <li><strong>물리적 조치:</strong> 서버 시스템의 비인가자 접근 통제</li>
            </ul>
          </section>

          <section>
            <h3 className="text-[18px] font-bold text-[#1D1D1F] mb-4">제7조 (개인정보 자동 수집 장치의 설치·운영 및 거부)</h3>
            <p>① 맞춤 서비스 및 &apos;안내 팝업 닫기&apos; 상태 유지를 위해 &apos;쿠키(Cookie)&apos;와 &apos;로컬 스토리지&apos;를 사용합니다.</p>
            <p className="mt-2">② 이용자는 브라우저 설정(Chrome 설정 {'>'} 개인정보 및 보안 등)을 통해 저장을 거부할 수 있으나, 거부 시 안내 배너가 반복 노출될 수 있습니다.</p>
          </section>

          <section>
            <h3 className="text-[18px] font-bold text-[#1D1D1F] mb-4">제8조 (개인정보 보호책임자 및 고충 처리 부서)</h3>
            <ul className="list-none space-y-1 bg-[#F5F5F7] p-5 rounded-2xl">
              <li><strong>담당자:</strong> 탐서(Tamseo) 운영팀</li>
              <li><strong>이메일:</strong> thetamseo.official@gmail.com</li>
            </ul>
            <p className="mt-5 text-[14px] font-medium text-[#86868B]">기타 개인정보 침해에 대한 신고나 상담 기관:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-[14px] text-[#86868B] marker:text-[#D2D2D7]">
              <li>개인정보침해신고센터 (privacy.kisa.or.kr / 118)</li>
              <li>대검찰청 사이버수사과 (www.spo.go.kr / 1301)</li>
              <li>경찰청 사이버수사국 (ecrm.cyber.go.kr / 182)</li>
            </ul>
          </section>

          <section className="pt-8 border-t border-[#E5E5EA]">
            <h3 className="text-[18px] font-bold text-[#1D1D1F] mb-4">제9조 (개인정보 처리방침의 변경)</h3>
            <p>본 방침의 내용 추가, 삭제 및 수정이 있을 시에는 시행 7일 전부터 공지사항을 통해 고지합니다.</p>
            <div className="mt-5 text-[14px] font-medium bg-[#F5F5F7] inline-block px-4 py-3 rounded-xl border border-[#E5E5EA]">
              <span className="block mb-1">공고일자: 2026년 03월 02일</span>
              <span className="block">시행일자: <strong className="text-[#1D1D1F]">2026년 03월 02일</strong></span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};


// =========================================================================
// 📁 전집 탐색 페이지 (src/app/collections/page.tsx)
// =========================================================================
const CollectionsPage = ({ onSendToSearch }: { onSendToSearch: (books: string[]) => void }) => {
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
      if (prev.length >= 5) { alert("검색은 한 번에 최대 5권까지만 가능합니다."); return prev; }
      return [...prev, book];
    });
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
            <button key={brand} onClick={() => setSelectedBrand(brand)} className={`whitespace-nowrap px-5 py-2.5 rounded-full text-[14px] font-bold transition-all duration-300 ${selectedBrand === brand ? 'bg-[#1D1D1F] text-white shadow-md' : 'bg-white text-[#86868B] border border-[#E5E5EA] hover:border-[#1D1D1F]/30 hover:text-[#1D1D1F]'}`}>{brand}</button>
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
                    <div className="w-8 h-8 rounded-full bg-[#F5F5F7] flex items-center justify-center group-hover:bg-[#1D1D1F] transition-colors"><ChevronRight size={16} className="text-[#A1A1A6] group-hover:text-white" /></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center border border-[#E5E5EA] border-dashed rounded-[24px]"><Search className="w-12 h-12 text-[#D2D2D7] mx-auto mb-4" strokeWidth={1} /><p className="text-[17px] font-bold text-[#1D1D1F]">검색 결과가 없습니다.</p></div>
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
              <span className="text-[15px] font-bold text-[#1D1D1F]">포함된 낱권 목록</span><span className="text-[13px] font-semibold text-[#0066CC] bg-[#0066CC]/10 px-3 py-1 rounded-full">{cartBooks.length} / 5권 선택됨</span>
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
              <div className="flex flex-col"><span className="text-[13px] font-bold text-[#1D1D1F] leading-tight">선택됨</span><span className="text-[11px] font-medium text-[#86868B] leading-tight cursor-pointer hover:underline" onClick={() => setCartBooks([])}>비우기</span></div>
            </div>
            <button onClick={() => onSendToSearch(cartBooks)} className="ml-auto bg-[#0066CC] hover:bg-[#0055B3] text-white px-6 py-3 rounded-full text-[15px] font-bold transition-all active:scale-95 flex items-center gap-2 shadow-[0_4px_14px_rgba(0,102,204,0.3)]"><ChevronRight size={16} /> 검색창으로 이동</button>
          </div>
        </div>
      )}
    </div>
  );
};


// =========================================================================
// 📁 메인 검색 페이지 (src/app/page.tsx)
// =========================================================================
const LibraryListModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>("All");
  if (!isOpen) return null;
  const districtNames = Object.values(DISTRICT_NAMES).sort();
  const filteredLibraries = selectedDistrictName === "All" ? SEOUL_LIBRARIES : SEOUL_LIBRARIES.filter(lib => lib.district === selectedDistrictName);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#F5F5F7] rounded-[24px] shadow-[0_20px_40px_rgb(0,0,0,0.2)] w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden transform scale-100 animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-[#E5E5EA] flex justify-between items-center bg-white shrink-0">
          <div><h3 className="text-[20px] font-bold text-[#1D1D1F] tracking-tight">지원 도서관 목록</h3><p className="text-[13px] text-[#86868B] mt-1 font-medium">탐서에서 실시간 조회가 가능한 주요 도서관입니다.</p></div>
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

const SearchPage = ({ injectedBooks, setInjectedBooks }: { injectedBooks: string[], setInjectedBooks: (b: string[]) => void }) => {
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
    for (const term of terms) { if (!SAFE_INPUT_REGEX.test(term)) { alert(`보안 정책상 특수문자는 사용할 수 없습니다.\n입력값: "${term}"`); return; } }
    if (terms.length > 5) { alert("최대 5권까지만 검색됩니다."); terms = terms.slice(0, 5); }
    setLoading(true); setSearched(true); setResults(null); setSelectedLibraries([]); setSelectedBookKeys(new Set()); setShowFilters(false); setExpandedStats({ owned: false, available: false });

    try {
      const data = await fetchLibraryData(districtCode, terms);
      setResults(data);
      const libs = new Set<string>();
      const allBookKeys = new Set<string>(); 
      data.forEach((item, tIdx) => {
        item.books.forEach((book, bIdx) => { allBookKeys.add(getBookKey(tIdx, bIdx)); book.libraries.forEach(lib => libs.add(lib.libraryName)); });
      });
      const libArray = Array.from(libs).sort();
      setAvailableLibraries(libArray); setSelectedLibraries(libArray); setSelectedBookKeys(allBookKeys); 
    } catch (error) { console.error("Search failed", error); } finally { setLoading(false); }
  };

  const filteredResults = useMemo(() => {
    if (!results) return null;
    return results.map((term, tIdx) => {
      const filteredBooks = term.books.filter((_, bIdx) => selectedBookKeys.has(getBookKey(tIdx, bIdx))).map(book => {
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
};


// =========================================================================
// 🚀 [최상위 라우터] 데모 화면용 App 통합 컨테이너
// 데모 환경에서는 하나의 파일로 실행되어야 하므로 아래처럼 임시 라우터로 감쌌습니다.
// =========================================================================
export default function App() {
  const [currentView, setCurrentView] = useState<'search' | 'about' | 'collections' | 'privacy'>('search');
  const [injectedBooks, setInjectedBooks] = useState<string[]>([]);
  const [showPrivacyBanner, setShowPrivacyBanner] = useState(false);

  useEffect(() => {
    const hasConsented = localStorage.getItem('tamseo-privacy-consent');
    if (!hasConsented) setShowPrivacyBanner(true);
  }, []);

  const handlePrivacyConsent = () => {
    localStorage.setItem('tamseo-privacy-consent', 'true');
    setShowPrivacyBanner(false);
  };

  const handleSendToSearch = (books: string[]) => {
    setInjectedBooks(books);
    setCurrentView('search');
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] selection:bg-black selection:text-white antialiased" style={{ fontFamily: "'Pretendard', sans-serif" }}>
      <NavBar currentView={currentView} setCurrentView={setCurrentView} />

      {/* 라우팅 역할 */}
      {currentView === 'search' && <SearchPage injectedBooks={injectedBooks} setInjectedBooks={setInjectedBooks} />}
      {currentView === 'about' && <AboutPage />}
      {currentView === 'collections' && <CollectionsPage onSendToSearch={handleSendToSearch} />}
      {currentView === 'privacy' && <PrivacyPolicyPage />}

      <Footer setCurrentView={setCurrentView} />

      {/* 쿠키 배너 */}
      {showPrivacyBanner && (
        <div className="fixed bottom-6 left-4 right-4 z-[100] flex justify-center animate-in slide-in-from-bottom-10 fade-in duration-500">
          <div className="bg-[#1D1D1F]/95 backdrop-blur-xl border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.2)] rounded-2xl p-4 sm:px-6 sm:py-4 flex flex-col sm:flex-row items-center gap-4 max-w-3xl w-full">
            <div className="flex items-start sm:items-center gap-3 flex-1">
              <Info className="w-5 h-5 text-white/70 shrink-0 mt-0.5 sm:mt-0" />
              <p className="text-[13px] leading-relaxed text-white/90">탐서는 원활한 서비스 제공과 어뷰징 방지를 위해 <span className="font-bold text-white">IP 주소, 기기 정보, 검색어</span> 등 최소한의 로그 데이터를 수집합니다. 서비스를 계속 이용하시면 이에 동의한 것으로 간주됩니다.</p>
            </div>
            <button onClick={handlePrivacyConsent} className="w-full sm:w-auto shrink-0 bg-white text-[#1D1D1F] hover:bg-[#F5F5F7] px-5 py-2.5 rounded-xl text-[13px] font-bold transition-colors shadow-sm">
              확인 및 동의
            </button>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css");
        @keyframes shimmer { 100% { transform: translateX(100%); } }
        .custom-scrollbar::-webkit-scrollbar { width: 0px; height: 0px; display: none; }
      `}} />
    </div>
  );
}
