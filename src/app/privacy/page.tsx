import React from 'react';

export default function PrivacyPolicyPage() {
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
}
