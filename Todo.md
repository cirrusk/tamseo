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
