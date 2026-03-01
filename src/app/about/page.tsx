// 파일 경로: src/app/about/page.tsx

import React from 'react';
import { TamseoLogo } from '@/components/SharedUI';

export default function AboutPage() {
  return (
    <div className="pt-28 pb-32 px-6 max-w-[700px] mx-auto animate-in fade-in slide-in-from-bottom-8 duration-[1000ms] ease-out">
      <header className="mb-16 text-center">
        <h1 className="text-[36px] md:text-[52px] font-bold tracking-tight text-[#1D1D1F] leading-[1.2] mb-6">
          가장 아날로그적인 온기를 위한,<br />가장 스마트한 연결.
        </h1>
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
}
