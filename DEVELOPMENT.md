# 개발 문서 초안 (Repo 환경 점검 기준)

## 1) 프로젝트 개요
- 프로젝트명: `seoul-library-checker`
- 목적: 서울시 자치구 기준으로 도서 검색 후 도서관별 소장/대출 가능 여부를 조회하는 웹 앱
- 프레임워크: Next.js `14.2.16` (App Router)
- 언어/스타일: TypeScript + Tailwind CSS

## 2) 현재 저장소 구조
```text
src/
  app/
    api/search/route.ts   # 서버 API 라우트 (data4library 연동)
    page.tsx              # 메인 UI/검색/필터/결과 테이블
    layout.tsx            # 앱 레이아웃/메타
    globals.css           # Tailwind 엔트리
public/
  logo.png
package.json
next.config.js
tailwind.config.ts
postcss.config.js
tsconfig.json
```

## 3) 실행 환경 요구사항
- Node.js: 18.17+ 또는 20+ 권장 (Next.js 14 기준)
- 패키지 매니저: npm (기본)

### 설치/실행
```bash
npm install
npm run dev
```

### 주요 스크립트
- `npm run dev`: 개발 서버 실행
- `npm run build`: 프로덕션 빌드
- `npm run start`: 빌드 결과 실행
- `npm run lint`: Next lint

## 4) 환경 변수
### 필수
- `LIBRARY_API_KEY`: data4library API Key

### 선택
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

> 선택 변수 설정 시 `/api/search` 라우트에서 Vercel KV 기반 rate limit/logging 활성화

### `.env.local` 예시
```dotenv
LIBRARY_API_KEY=YOUR_DATA4LIBRARY_KEY
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
```

## 5) 런타임 아키텍처 요약
### 클라이언트 (`src/app/page.tsx`)
- 자치구 코드 + 도서명(줄바꿈 입력) 기반 검색
- 입력값 보안 검증: 한글/영문/숫자/공백만 허용
- 최대 5권으로 제한
- 결과 테이블 + 컬럼 토글 + 도서관/대출상태 필터 제공

### 서버 (`src/app/api/search/route.ts`)
- `GET /api/search?district=...&queries=...`
- 파라미터/키 유효성 검사
- (옵션) KV rate limit: IP당 일 50회
- 외부 API 연동: `http://data4library.kr/api`
- 6단계 검색 전략(title/keyword, 공백제거, 정렬 여부)
- 검색어당 최대 3개 도서, 도서별 최대 5개 도서관 조회
- 도서관별 `bookExist` 조회로 대출 가능 여부 계산

## 6) API 명세(내부)
### Request
- Method: `GET`
- Path: `/api/search`
- Query
  - `district` (필수): 자치구 코드
  - `queries` (필수): 콤마로 구분된 도서명 목록

### Success Response
- Status: `200`
- Body: `SearchResultItem[]`
  - `searchTerm`
  - `books[]`
    - `metadata` (`title`, `author`, `publisher`, `pubYear`, `isbn`)
    - `libraries[]` (`libraryName`, `isAvailable`)

### Error Response
- `400`: 파라미터 누락/요청 제한 초과
- `429`: 일일 검색 허용량 초과(KV 사용 시)
- `500`: API Key 미설정

## 7) 현재 점검 결과 (2026-02-28)
- 코드 구조: App Router 단일 앱 구조로 정상
- 패키지/의존성: `package.json` 기준 문제 없음
- 실행 검증: 현재 셸에 `node/npm/pnpm/yarn/bun` 미설치로 실행/빌드/린트 미수행
- 저장소 상태: 변경 파일 다수 존재(워킹트리 dirty)

## 8) 확인된 리스크 및 정리 필요 항목
1. `.gitignore` 형식 점검 필요
- 현재 내용이 `node_modules.env.local` 한 줄로 저장되어 있음
- 의도대로라면 최소 아래 항목 분리 필요
  - `node_modules/`
  - `.env.local`
  - `.env`
  - `.next/`

2. `.env.local` 파일 내용 정리 필요
- 키 값 외 설명 문구/마크다운 텍스트가 포함되어 있어 파싱 혼란 가능
- 환경변수만 남기도록 정리 권장

3. `page.tsx` 단일 파일 크기 큼
- 약 900줄 규모
- UI 컴포넌트(모달/테이블/필터)를 `src/components`로 분리 권장

4. 테스트 부재
- 단위/통합 테스트 스위트 없음
- API 라우트 입력 검증 및 파싱 실패 케이스 우선 테스트 권장

## 9) 권장 개발 작업 순서
1. Node 런타임 설치 및 `npm run lint`, `npm run build` 기준선 확보
2. `.gitignore`, `.env.local` 정리
3. `page.tsx` 컴포넌트 분리(가독성/유지보수성 개선)
4. `/api/search`에 대한 테스트 추가
5. 운영 환경에서 KV 연동 여부 결정 후 rate limit 정책 확정

## 10) 빠른 온보딩 체크리스트
- [ ] Node.js 설치 확인 (`node -v`, `npm -v`)
- [ ] `.env.local`에 `LIBRARY_API_KEY` 설정
- [ ] `npm install`
- [ ] `npm run dev` 후 `/` 페이지 동작 확인
- [ ] 첫 검색 시 `/api/search` 응답 정상 여부 확인
