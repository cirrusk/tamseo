# Todo

이 문서는 현재 작업의 계획/진행/완료 상태를 관리한다.

## 사용 규칙
- 작업 시작 전에 계획을 먼저 작성한다.
- 작업 중에는 상태를 `TODO`, `IN_PROGRESS`, `DONE`, `BLOCKED` 중 하나로 유지한다.
- 작업 완료 후 결과와 후속 액션을 반드시 반영한다.

## 현재 작업

### 2026-03-02 - Prisma + PostgreSQL 로그 저장 레이어 전환
- 상태: DONE
- 목표: Vercel KV 제거 후 Prisma + PostgreSQL 기반 로그 저장 구조로 전환
- 작업 항목:
  1. DONE: Prisma 스키마 설계 (`SearchEvent`, `SearchEventQuery`, `DailyRateLimit`)
  2. DONE: Prisma 클라이언트 초기화 레이어 추가
  3. DONE: `/api/search`의 KV 로직 제거 및 DB 저장 로직 대체
  4. DONE: 레이트리밋을 DB 기반으로 전환
  5. DONE: 환경변수/의존성 정리 (`@vercel/kv` 제거, Prisma 의존성 추가)
  6. DONE: 빌드 검증 및 결과 기록
- 비고:
  - IP는 기본적으로 해시 저장, 원문 저장은 옵션 처리
  - 로그 저장 실패가 검색 응답을 막지 않도록 설계
  - 검증 결과:
    - `npm run build` 성공
    - `curl -sS -I http://127.0.0.1:3000` 응답 `HTTP/1.1 200 OK`
    - 빌드 경고 1건 유지: `src/app/page.tsx`의 `<img>` 사용 경고(`@next/next/no-img-element`)

### 2026-03-02 - 개발문서 업데이트
- 상태: DONE
- 목표: Prisma/PostgreSQL 전환 내역을 `DEVELOPMENT.md`에 기록
- 작업 항목:
  1. DONE: 신규 구조(`prisma/`, `src/lib/db`, `src/lib/logging`) 반영
  2. DONE: `/api/search` KV 제거 및 DB 전환 내용 반영
  3. DONE: 운영 리스크/체크리스트/자주 쓰는 명령어 갱신

### 2026-03-02 - Todo 기록 요청 반영
- 상태: DONE
- 목표: 사용자 요청사항을 `Todo.md`에 즉시 반영
- 작업 항목:
  1. DONE: 요청 수신 후 `Todo.md` 기록 추가
  2. DONE: 완료 상태로 이력 남김

### 2026-03-02 - Prisma 마이그레이션 + 운영 환경 변수 + 관리자 로그 API
- 상태: DONE
- 목표:
  - `DATABASE_URL` 설정 후 `npx prisma migrate dev --name add_search_log_tables` 실행
  - 운영 환경 `LOG_IP_SALT` 적용 경로 정리
  - `/api/admin/search-logs` 조회 API 추가
- 작업 항목:
  1. DONE: 로컬 DB 연결 정보 확인 및 `DATABASE_URL` 설정
  2. DONE: Prisma migrate 실행 시도 및 결과 확인
  3. DONE: 관리자 로그 조회 API 구현
  4. DONE: 운영 환경 변수 반영 가이드 문서화
  5. DONE: 빌드/기본 동작 검증 후 결과 기록
- 결과:
  - `.env.local`에 `DATABASE_URL`, `LOG_IP_SALT`, `ADMIN_API_TOKEN` 추가
  - `npx prisma migrate dev --name add_search_log_tables` 실행 시도: DB 미기동으로 `P1001` 발생
  - DB 미기동 상황에서도 적용 가능하도록 SQL 마이그레이션 파일 생성:
    - `prisma/migrations/20260302000000_add_search_log_tables/migration.sql`
  - 관리자 API 추가: `GET /api/admin/search-logs` (헤더 `x-admin-token` 필요)
  - `npm run build` 성공 (기존 `<img>` ESLint 경고 1건 유지)

### 2026-03-04 - 도서 검색 회귀 분석
- 상태: DONE
- 목표: "이전엔 검색되던 기능이 현재 실패" 원인 분석
- 작업 항목:
  1. DONE: `/api/search` 직접 호출 재현 확인
  2. DONE: 서버 로그에서 실패 스택 확인
  3. DONE: 회귀 원인 후보와 대응안 정리
- 결과:
  - 로컬 `/api/search?district=11140&queries=해리포터` 응답은 정상(결과 반환)
  - 단, 요청마다 Prisma DB 연결 실패 로그 발생:
    - `Can't reach database server at 127.0.0.1:5432`
  - 결론: 검색 로직 자체보다 DB 연결 실패로 인한 지연/타임아웃 가능성이 가장 큼

### 2026-03-04 - 기본 검색 지역 중랑구 전환
- 상태: DONE
- 목표: 기본 검색 자치구를 마포구에서 중랑구로 변경
- 작업 항목:
  1. DONE: `src/app/page.tsx` 기본 `districtCode`를 `11070`으로 변경
  2. DONE: 빌드 검증 및 결과 기록
- 결과:
  - 초기 선택 자치구가 `중랑구(11070)`로 변경됨
  - `npm run build` 성공
  - 기존 ESLint 경고 1건(`@next/next/no-img-element`) 유지

### 2026-03-04 - 중랑구 검색 동작 테스트
- 상태: DONE
- 목표: 중랑구(`11070`) 기준 검색 API 정상 동작 확인
- 작업 항목:
  1. DONE: 로컬 서버 실행 및 `/api/search` 직접 호출
  2. DONE: 응답 결과 확인 후 기록
- 결과:
  - `GET /api/search?district=11070&queries=해리포터` 정상 응답 확인
  - 응답에 중랑구 도서관 포함 확인:
    - `중랑구립면목정보도서관`
    - `중랑구립정보도서관`
    - `중랑숲어린이도서관`
  - 부가 이슈: PostgreSQL 미연결(`127.0.0.1:5432`)로 레이트리밋/로그 저장은 실패 로그 발생

### 2026-03-04 - 검색 결과 검색어 단위 그룹 UI 개선
- 상태: DONE
- 목표: 다중 검색 시 결과를 입력 검색어 기준으로 명확히 분리 표시
- 작업 항목:
  1. DONE: 결과 렌더링을 검색어 섹션 구조로 개편
  2. DONE: 애플 컨셉 스타일 유지한 그룹 헤더/카운트 추가
  3. DONE: 빌드 검증 및 결과 기록
- 결과:
  - 검색 결과 상단을 `Results by Search Term` 구조로 변경
  - 검색어별 섹션 카드(`“검색어” + 결과 권수`)로 그룹 분리 표시
  - 책 카드에서 중복된 검색어 배지 제거 후 그룹 헤더로 정보 집중
  - `npm run build` 성공, 기존 `<img>` ESLint 경고 1건 유지

### 2026-03-04 - 동일 ISBN 결과 병합
- 상태: DONE
- 목표: 검색 결과에서 동일 ISBN 도서를 1건으로 병합 표시
- 작업 항목:
  1. DONE: `/api/search`에 ISBN 기준 dedupe 로직 추가
  2. DONE: 도서관 목록 병합(중복 제거 + 대출 가능 여부 보존) 처리
  3. DONE: 빌드 검증 및 결과 기록
- 결과:
  - 동일 ISBN 도서는 1건으로 병합되어 반환됨
  - 중복 도서관은 이름 기준으로 합쳐지고 `isAvailable`는 OR 로직으로 보존
  - `npm run build` 성공, 기존 `<img>` ESLint 경고 1건 유지

### 2026-03-04 - 검색 단축키(Ctrl/Cmd+Enter) 추가
- 상태: DONE
- 목표: 검색 입력창에서 `Ctrl+Enter`/`Cmd+Enter`로 검색 실행 + 버튼 근처 단축키 힌트 제공
- 작업 항목:
  1. DONE: 텍스트 입력창 키 조합 이벤트 처리 추가
  2. DONE: 버튼 영역에 작은 단축키 힌트 UI 추가
  3. DONE: 빌드 검증 및 결과 기록
- 결과:
  - `Ctrl+Enter`/`Cmd+Enter` 입력 시 검색 폼 제출 동작 추가
  - 검색 버튼 옆에 작은 키캡 스타일 힌트(`⌘/Ctrl + Enter`) 표시
  - `npm run build` 성공, 기존 `<img>` ESLint 경고 1건 유지

### 2026-03-04 - 검색어 그룹 헤더 디자인 리파인
- 상태: DONE
- 목표: 검색어를 섹션 타이틀로 더 강하게 강조(애플 스타일)
- 작업 항목:
  1. DONE: 검색어 섹션 헤더를 굵은 하단선 + 대형 타이포로 변경
  2. DONE: 카드 내부 중복 정보 제거 상태 재확인
  3. DONE: 빌드 검증 및 결과 기록
- 결과:
  - 검색어 헤더에 `border-b-2 border-[#1D1D1F]` 적용
  - 헤더 좌측 아이콘 + 대형 타이포(`text-[26px] sm:text-[32px] font-extrabold`) 적용
  - 카드 내부 검색어 중복 표시는 유지되지 않음(미니멀 상태)
  - `npm run build` 성공, 기존 `<img>` ESLint 경고 1건 유지

### 2026-03-05 - 검색어 헤더 sticky 적용
- 상태: DONE
- 목표: 스크롤 중에도 현재 검색어 그룹 헤더가 상단에 고정되도록 개선
- 작업 항목:
  1. DONE: 검색어 섹션 헤더를 `position: sticky`로 전환
  2. DONE: 상단 네비게이션과 겹치지 않도록 `top` 오프셋/배경 처리
  3. DONE: 빌드 검증 및 결과 기록
- 결과:
  - 검색어 헤더에 `sticky top-16 z-30` 적용
  - 스크롤 중 가독성을 위해 반투명 배경 + 블러(`bg-[#F5F5F7]/95 backdrop-blur-xl`) 적용
  - `npm run build` 성공, 기존 `<img>` ESLint 경고 1건 유지

### 2026-03-05 - 개인정보처리방침 중복 제거 + 검색중 UI 강화
- 상태: DONE
- 목표:
  - 검색란 바로 아래 보이던 중복 `개인정보처리방침` 제거
  - 검색 수행 중 상태를 애플 컨셉으로 명확히 표시
- 작업 항목:
  1. DONE: `page.tsx` 내부 중복 footer 제거(공통 layout footer만 유지)
  2. DONE: 로딩 상태 카드(`도서 검색 중`) 추가 및 스켈레톤 결합
  3. DONE: 빌드 검증 및 결과 기록
- 결과:
  - `page.tsx` 하단 `개인정보처리방침` 버튼 제거(중복 해소)
  - 검색 중 상태에 애플 톤 로딩 카드 추가:
    - `Searching` 라벨
    - `도서 검색 중입니다` 타이틀
    - 검색어 개수 안내 문구
    - 진행감 있는 로딩 바 + 기존 스켈레톤
  - `npm run build` 성공, 기존 `<img>` ESLint 경고 1건 유지

### 2026-03-05 - 로딩 미니바 최상단 고정
- 상태: DONE
- 목표: 검색 결과 로딩 중 미니 바가 화면 최상단(내비 아래)에서 항상 보이도록 수정
- 작업 항목:
  1. DONE: 로딩 상태 카드 컨테이너를 `fixed top-*` 구조로 변경
  2. DONE: 본문 스켈레톤과 겹침 없는 여백/레이어 보정
  3. DONE: 빌드 검증 및 결과 기록
- 결과:
  - 로딩 카드가 `fixed top-16 z-40`로 내비게이션 바로 아래 고정 노출
  - 스켈레톤 영역에 `mt-24` 여백을 추가해 고정 카드와 겹침 최소화
  - `npm run build` 성공, 기존 `<img>` ESLint 경고 1건 유지

### 2026-03-05 - 로딩 미니바 제거
- 상태: DONE
- 목표: 검색 로딩 중 상단 미니바를 제거하고 화면을 단순화
- 작업 항목:
  1. DONE: 로딩 미니바 UI 및 관련 상태 제거
  2. DONE: 스켈레톤 로딩만 남기도록 렌더링 정리
  3. DONE: 빌드 검증 및 결과 기록
- 결과:
  - 로딩 미니바(`SearchLoadingStatus`) 및 `loadingTerms` 상태 제거
  - 로딩 시 `ResultsSkeleton`만 표시되도록 단순화
  - `npm run build` 성공, 기존 `<img>` ESLint 경고 1건 유지

### 2026-03-05 - 모바일 레이아웃 + Insights 집계 기준 변경
- 상태: DONE
- 목표:
  - 좁은 화면에서 책 카드가 표지 좌측 배치 형태로 보이도록 개선
  - Insights를 "검색 결과 건수"가 아닌 "입력 검색어 종류 수" 기준으로 집계
- 작업 항목:
  1. DONE: `stats` 계산을 검색어 기준(`ownedTerms`, `availableTerms`)으로 변경
  2. DONE: Insights 명칭/문구를 검색어 종류 기준으로 수정
  3. DONE: 모바일 카드 레이아웃(표지 좌측) 및 타이포/간격 최적화
  4. DONE: 빌드 검증 및 결과 기록
- 결과:
  - Insights 집계를 책 수 기준에서 검색어 종류 기준으로 전환
  - 문구를 `N권`에서 `N종류` 중심으로 변경
  - 모바일 카드에서 표지가 좌측 고정(`flex-row`)되도록 개선하고 텍스트/목록 밀도 조정
  - `npm run build` 성공, 기존 `<img>` ESLint 경고 1건 유지

### 2026-03-05 - 검색 안내 문구/소개/전집탐색 UX 업데이트
- 상태: DONE
- 목표:
  - 검색 입력 안내 문구를 "최대 5권" 기준으로 명확화
  - 전집 탐색 클릭 시 페이지 이동 없이 "개발 중" 안내 표시
  - 소개 클릭 시 상세 소개 본문 표시
- 작업 항목:
  1. DONE: 검색 placeholder 문구를 `(줄바꿈으로 최대 5권 동시 검색)`으로 변경
  2. DONE: 전집 탐색 버튼 클릭 시 상단 토스트형 `개발 중` 알림 구현
  3. DONE: `AboutPage`를 제공된 장문 소개 구조로 교체
  4. DONE: 빌드 검증 및 결과 기록
- 결과:
  - 전집 탐색 버튼은 현재 뷰를 유지하고 안내 토스트만 표시
  - 소개 페이지는 반응형 타이포/섹션 구분/브랜드 시그니처 포함 본문으로 강화
  - `npm run build` 성공, 기존 `<img>` ESLint 경고 1건 유지

### 2026-03-05 - 소개 페이지 3D 히어로 디자인 업데이트
- 상태: DONE
- 목표: 소개 페이지를 3D 부유 로고 + 에디토리얼 레이아웃 중심으로 개편
- 작업 항목:
  1. DONE: `Hero3DLogo`/`TamseoMiniLogo` 컴포넌트 추가
  2. DONE: 소개 본문 섹션/인용 카드 디자인을 신규 시안으로 교체
  3. DONE: 부유/그림자 애니메이션 keyframes 적용
  4. DONE: 빌드 검증 및 결과 기록
- 결과:
  - 소개 페이지 상단에 3D 부유 로고 + 그림자 펄스 애니메이션 적용
  - 본문 간격/섹션 구분/인용 카드 강조 등 에디토리얼 레이아웃 강화
  - `npm run build` 성공, 기존 `<img>` ESLint 경고 1건 유지

### 2026-03-05 - 소개 하단 로고 제거 + 검색 로딩 위치 보정
- 상태: DONE
- 목표:
  - 소개 페이지 본문 하단 중복 로고 블록 제거
  - 검색 로딩 중 흐린 스켈레톤이 검색창 위로 겹치지 않게 조정
- 작업 항목:
  1. DONE: `TamseoMiniLogo` 및 하단 `숨겨진 지식을 찾다` 블록 제거
  2. DONE: 로딩 영역을 `mt-16` 래핑해 검색창 아래에서 시작되도록 보정
  3. DONE: 빌드 검증 및 결과 기록

### 2026-03-05 - 검색 입력값 서버 보안 검증 강화
- 상태: DONE
- 목표:
  - 클라이언트 우회 요청에도 안전하게 동작하도록 `/api/search` 서버 검증 강화
  - DB 장애 시에도 최소한의 남용 방어가 유지되도록 fallback 레이트리밋 추가
- 작업 항목:
  1. DONE: 자치구 코드 allowlist 검증(`INVALID_DISTRICT`) 추가
  2. DONE: 검색어 정규화/제어문자 제거/길이 제한/허용문자 allowlist 검증 추가
  3. DONE: PostgreSQL 레이트리밋 실패 시 in-memory fallback 레이트리밋 추가
  4. DONE: 로그 정규화 함수(`normalizeQuery`)를 NFKC + 제어문자 제거로 강화
  5. DONE: 빌드 검증 및 결과 기록
- 결과:
  - `src/app/api/search/route.ts`에 서버 입력 검증 계층 추가
  - `src/lib/logging/search-log.repository.ts` 정규화 강화
  - `npm run build` 성공
  - 기존 ESLint 경고 1건(`src/app/page.tsx`의 `<img>` 사용) 유지

### 2026-03-05 - 지역 휠 피커 + 지원 도서관 메타 정보 UI 개선
- 상태: DONE
- 목표:
  - 지역 선택을 부드러운 스냅 기반 3D 휠 피커로 개선
  - 지원 도서관 모달에 최신 업데이트 날짜와 총 지원 개수 노출
- 작업 항목:
  1. DONE: 검색 폼 지역 선택 `select`를 `DistrictWheelPicker`로 교체
  2. DONE: 스냅 스크롤/중앙 포커스/3D 회전 느낌 스타일 적용
  3. DONE: 모달 헤더에 `서울 N곳` 표기 추가
  4. DONE: 모달 헤더에 `업데이트 YYYY.MM.DD` 표기 추가
  5. DONE: 빌드 검증 및 결과 기록
- 결과:
  - 지역 선택이 상하 스크롤 스냅 기반 휠 UI로 동작
  - 지원 도서관 목록 헤더에 총 개수와 업데이트 날짜가 노출됨
  - `npm run build` 성공
  - 기존 ESLint 경고 1건(`src/app/page.tsx`의 `<img>` 사용) 유지

### 2026-03-05 - 최초 접속 IP 기반 기본 지역 자동 설정
- 상태: DONE
- 목표:
  - 최초 접속 시 IP 기반으로 서울 자치구 기본값을 자동 설정
  - 한국이 아니거나 서울과 먼 경우 강남구를 기본값으로 강제
  - 기존 마지막 선택 지역(localStorage) 우선 동작 유지
- 작업 항목:
  1. DONE: `/api/location/default-district` API 추가
  2. DONE: 헤더 기반 국가/지역 힌트 우선 판별 로직 추가
  3. DONE: IP geolocation + 서울 자치구 중심점 nearest 계산 로직 추가
  4. DONE: 비한국/원거리/실패 시 강남구(`11230`) fallback 처리
  5. DONE: `page.tsx` 초기화 로직을 "저장값 우선, 없으면 API 조회"로 변경
  6. DONE: 빌드 검증 및 결과 기록
- 결과:
  - 첫 방문자는 자동 추천 지역으로 설정되고, 재방문자는 마지막 선택 지역을 유지
  - 위치 판별이 불가하거나 서울 외 권역이면 기본값은 강남구로 설정
  - `npm run build` 성공
  - 기존 ESLint 경고 1건(`src/app/page.tsx`의 `<img>` 사용) 유지

### 2026-03-05 - CI 타입 에러(`implicit any`) 수정
- 상태: DONE
- 목표:
  - GitHub Actions Docker 빌드 실패 원인인 관리자 API 타입 에러를 제거
- 작업 항목:
  1. DONE: `src/app/api/admin/search-logs/route.ts`의 `map` 콜백 파라미터 타입 명시
  2. DONE: 로컬 `npm run build`로 재검증
- 결과:
  - `Type error: Parameter 'item' implicitly has an 'any' type` 해소
  - `npm run build` 성공
  - 기존 ESLint 경고 1건(`src/app/page.tsx`의 `<img>` 사용) 유지

### 2026-03-05 - Docker CI Prisma Client 초기화 오류 수정
- 상태: DONE
- 목표:
  - Docker 빌드 환경에서 `@prisma/client did not initialize yet` 오류 제거
- 작업 항목:
  1. DONE: `Dockerfile` build 단계에 `npx prisma generate` 추가
  2. DONE: 로컬 빌드 재검증
- 결과:
  - Docker 빌드 시 Prisma Client 생성 단계가 명시적으로 수행되도록 보완
  - `npm run build` 성공
  - 기존 ESLint 경고 1건(`src/app/page.tsx`의 `<img>` 사용) 유지

### 2026-03-05 - 지역 휠 스크롤 부드러움 + IP 기반 자치구 자동선택 정확도 개선
- 상태: DONE
- 목표:
  - 지역 휠 피커가 끊기지 않고 자연스럽게 스냅되도록 개선
  - 최초 접속 시 IP 기반 자치구 자동선택 정확도 향상(서울 내 구 단위)
  - 두 번째 접속부터 마지막 선택 지역 유지
- 작업 항목:
  1. DONE: 휠 스크롤 중 즉시 값 반영 제거, 스크롤 종료 시점에만 선택 확정
  2. DONE: 중앙 포커스 기준 `activeIndex` 분리로 스크롤 중 시각 안정성 개선
  3. DONE: IP 추론 API에 다중 Geo provider(ipapi/ipwhois/ipinfo) fallback 추가
  4. DONE: 영문/한글 자치구 별칭 매핑(`jungnang-gu` 등)으로 구 단위 판별 강화
  5. DONE: 기존 localStorage 우선 로직 유지(재접속 시 마지막 선택 유지)
  6. DONE: 빌드 검증
- 결과:
  - 휠 피커 스크롤이 부드럽게 이어지고 멈춤 현상 완화
  - 최초 접속 시 서울 내 IP는 자치구 추론 후 자동 설정, 실패/비한국/원거리 시 강남구 fallback
  - `npm run build` 성공
  - 기존 ESLint 경고 1건(`src/app/page.tsx`의 `<img>` 사용) 유지

### 2026-03-05 - 검색어 그룹 헤더 에디토리얼 스타일 리파인
- 상태: DONE
- 목표:
  - 검색어 그룹 헤더의 과한 시각적 무게를 줄이고 콘텐츠 집중도 개선
- 작업 항목:
  1. DONE: 아이콘/따옴표 제거
  2. DONE: 타이포 크기/굵기 다운스케일(`extrabold` -> `bold`)
  3. DONE: 두꺼운 검은 하단선 제거, 얇은 회색 디바이더로 교체
  4. DONE: 우측 결과 권수 배지를 정갈한 톤으로 보정
  5. DONE: 빌드 검증
- 결과:
  - 그룹 헤더가 카드 UI와 톤을 맞춘 정갈한 에디토리얼 형태로 변경됨
  - `npm run build` 성공
  - 기존 ESLint 경고 1건(`src/app/page.tsx`의 `<img>` 사용) 유지

### 2026-03-05 - 검색어 헤더 sticky 해제
- 상태: DONE
- 목표:
  - 검색어 헤더가 스크롤 시 고정되지 않고 자연스럽게 위로 사라지도록 변경
- 작업 항목:
  1. DONE: 검색어 헤더에서 `sticky/top/z/backdrop` 관련 클래스 제거
  2. DONE: 로컬 빌드 검증
- 결과:
  - 검색어 헤더가 일반 문서 흐름으로 렌더링되어 스크롤 시 자연스럽게 사라짐
  - `npm run build` 성공
  - 기존 ESLint 경고 1건(`src/app/page.tsx`의 `<img>` 사용) 유지

### 2026-03-05 - 도서 제목에 vol 값 결합
- 상태: DONE
- 목표:
  - 추가 API 호출 없이 기존 `srchBooks` 응답의 `vol` 필드를 제목 뒤에 표시
- 작업 항목:
  1. DONE: `src/app/api/search/route.ts`에 `buildDisplayTitle` 유틸 추가
  2. DONE: 응답 metadata.title 생성 시 `bookname + vol` 결합 적용
  3. DONE: 중복 결합 방지(이미 제목에 vol이 포함된 경우 그대로 유지)
  4. DONE: 빌드 검증
- 결과:
  - 예: `해리포터와 불의 잔` -> `해리포터와 불의 잔 4-4` 형태로 표시 가능
  - `npm run build` 성공
  - 기존 ESLint 경고 1건(`src/app/page.tsx`의 `<img>` 사용) 유지

### 2026-03-05 - ISBN 기반 알라딘 title 우선 표기
- 상태: DONE
- 목표:
  - 정보나루 ISBN으로 알라딘 `ItemLookUp`을 조회해 화면 title을 알라딘 기준으로 노출
- 작업 항목:
  1. DONE: `/api/search`에 알라딘 조회 유틸(`fetchAladinTitleByIsbn`) 추가
  2. DONE: ISBN별 캐시(Map) 적용으로 중복 호출 최소화
  3. DONE: metadata.title을 알라딘 title 우선, 실패 시 기존 title fallback 처리
  4. DONE: 빌드 검증
- 결과:
  - 동일 ISBN 기준으로 알라딘 title을 우선 표시
  - `ALADIN_TTB_KEY` 환경변수 지원(미설정 시 제공된 기본 키 fallback)
  - `npm run build` 성공
  - 기존 ESLint 경고 1건(`src/app/page.tsx`의 `<img>` 사용) 유지

### 2026-03-05 - ISBN 기반 알라딘 cover 이미지 우선 표기
- 상태: DONE
- 목표:
  - 도서 이미지를 정보나루 이미지 대신 알라딘 `cover` 값으로 우선 표기
- 작업 항목:
  1. DONE: `/api/search`에 알라딘 조회 결과를 `{ title, coverUrl }` 형태로 확장
  2. DONE: ISBN별 캐시 기반으로 이미지 조회 재사용
  3. DONE: `metadata.imageUrl`을 `aladin cover` 우선, 실패 시 기존 이미지 fallback 처리
  4. DONE: 빌드 검증
- 결과:
  - 화면 표지는 알라딘 `cover` URL을 우선 사용
  - 알라딘 실패 시 기존 정보나루 이미지 로직으로 자동 대체
  - `npm run build` 성공
  - 기존 ESLint 경고 1건(`src/app/page.tsx`의 `<img>` 사용) 유지

### 2026-03-05 - 검색 결과 상세옵션 UI 숨김
- 상태: DONE
- 목표:
  - 상세옵션은 추후 개발 예정이므로 현재 화면에서 보이지 않게 처리
- 작업 항목:
  1. DONE: 결과 섹션의 상세옵션 토글 버튼 제거
  2. DONE: 상세옵션 패널 렌더링 블록 제거
  3. DONE: 필터 상태/핸들러/관련 import 정리
  4. DONE: 빌드 검증
- 결과:
  - 검색 결과 화면에서 상세옵션 UI가 더 이상 노출되지 않음
  - 결과 리스트는 기본값(전체) 기준으로 바로 표시
  - `npm run build` 성공
  - 기존 ESLint 경고 1건(`src/app/page.tsx`의 `<img>` 사용) 유지
- 결과:
  - 소개 페이지 본문 하단 로고 중복 제거 완료
  - 로딩 시 스켈레톤이 검색창 아래부터 표시되어 가독성 개선
  - `npm run build` 성공, 기존 `<img>` ESLint 경고 1건 유지

### 2026-03-05 - 검색 시작 후 상단 고정 보정
- 상태: DONE
- 목표: 검색 로딩 시에도 검색 UI가 최상단에 유지되도록 보정
- 작업 항목:
  1. DONE: 검색 컨테이너 translate 조건을 `searched` 기준으로 단순화
  2. DONE: 빌드 검증 및 결과 기록
- 결과:
  - 검색 시작 시(`searched=true`) 로딩 여부와 무관하게 검색 UI가 `translate-y-0` 유지
  - 로딩 중 검색 화면이 상단에 고정되어 시각적 겹침/혼잡 완화
  - `npm run build` 성공, 기존 `<img>` ESLint 경고 1건 유지

### 2026-03-05 - 지역 설정/동의 유지 + 전집 토스트 리디자인
- 상태: DONE
- 목표:
  - 마지막 선택 도서관 지역을 재접속 시 기본값으로 복원
  - 개인정보 동의를 최초 1회 이후 다시 노출되지 않도록 강화
  - 전집 탐색 클릭 토스트를 캡슐형 iOS 스타일로 개선
- 작업 항목:
  1. DONE: 지역 코드 localStorage 저장/복원 로직 추가
  2. DONE: 개인정보 동의 상태를 cookie + localStorage로 이중 저장
  3. DONE: 전집 탐색 토스트를 Hammer 아이콘 포함 캡슐형으로 변경
  4. DONE: 빌드 검증 및 결과 기록
- 결과:
  - 마지막 선택 도서관 지역이 `tamseo-selected-district`로 저장/복원됨
  - 개인정보 동의는 localStorage + cookie(`tamseo_privacy_consent`)로 유지되어 재노출 방지 강화
  - 전집 탐색 클릭 시 캡슐형 토스트(`Hammer` 아이콘, 3초)로 안내, 페이지 이동 없음
  - `npm run build` 성공, 기존 `<img>` ESLint 경고 1건 유지

### 2026-03-05 - 전집 토스트 렌더 정리(후속)
- 상태: DONE
- 목표: 전집 토스트 관련 렌더 블록 정리 및 빌드 안정화
- 작업 항목:
  1. DONE: `App` 하단 토스트 렌더링 구간 불필요 블록 제거
  2. DONE: 타이머 동작 단일화(`useEffect` 기반)
  3. DONE: 빌드 검증
- 결과:
  - 토스트 UI가 의도된 한 블록만 렌더링되도록 정리됨
  - `npm run build` 성공, 기존 `<img>` ESLint 경고 1건 유지

### 2026-03-05 - 소개 하단 로고 제거 + 검색 로딩 레이어 위치 조정
- 상태: IN_PROGRESS
- 목표:
  - 소개 페이지 본문 하단 중복 로고 블록 제거
  - 검색 중 흐린 영역이 검색창 위로 겹치지 않도록 레이아웃 보정
- 작업 항목:
  1. IN_PROGRESS: 소개 페이지 하단 `숨겨진 지식을 찾다` 로고 영역 삭제
  2. TODO: 로딩 스켈레톤 시작 위치를 검색창 아래로 이동
  3. TODO: 빌드 검증 및 결과 기록
