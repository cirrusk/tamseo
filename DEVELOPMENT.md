# 개발 컨텍스트 문서 (핸드오프용)

마지막 업데이트: 2026-03-02  
대상 저장소: `cirrusk/tamseo` (`/Users/park/tamseo`)

## 1) 프로젝트 개요
- 서비스명: 탐서(Tamseo)
- 목적: 서울시 도서관 도서 검색/대출 가능 여부 조회
- 프레임워크: Next.js 14.2.16 (App Router)
- 주요 스타일: Tailwind CSS
- 배포 방식: GitHub Actions에서 Docker 이미지 빌드/푸시 후 SSH 배포 스크립트 실행

## 2) 현재 구조(핵심 파일)
```text
src/app/
  layout.tsx
  page.tsx
  about/page.tsx
  collections/page.tsx
  privacy/page.tsx
  api/
    search/route.ts
    libraries/route.ts
src/components/
  SharedUI.tsx
src/lib/
  db/prisma.ts
  logging/search-log.repository.ts
  constants.ts
prisma/
  schema.prisma
.github/workflows/
  build-push.yml
Dockerfile
```

## 3) 실행/검증 환경 메모
- 이 작업 세션에서 `nvm/node/npm` 설치 완료
  - `nvm 0.39.7`
  - `node v24.14.0`
  - `npm 11.9.0`
- `.zshrc`에 nvm 로딩 추가됨:
  - `export NVM_DIR="$HOME/.nvm"`
  - `[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"`
- 로컬 검증 시에는 아래 형태로 실행하는 것이 안전:
```bash
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"
npx prisma generate
npm run build
npx next start -H 127.0.0.1 -p 3000
```
- 로그 저장 레이어(Prisma) 사용을 위해 `DATABASE_URL` 필수
- IP 해시 안정성을 위해 `LOG_IP_SALT` 설정 권장

## 4) 최근 변경에서 확정된 사항
1. `src/app/page.tsx` 빌드 오류 수정
- `TamseoLogo` 미정의 오류 해결(임포트 추가)
- App Router page 제약 위반 해결(`page.tsx`의 invalid named export 제거)
- `SearchContent` props 시그니처 정리 (`injectedBooks`, `setInjectedBooks`)
- Canvas mock router 시그니처 오류 수정 (`replace/push` 가변 인자 허용)

2. `src/app/api/libraries/route.ts` 동작 방식 수정
- Prisma 의존 제거(`@prisma/client` 미설치로 빌드 실패하던 이슈 해소)
- 런타임 조회 강제:
  - `export const dynamic = "force-dynamic"`
  - `export const revalidate = 0`
- 외부 API 호출에 `cache: "no-store"` + timeout 적용
- 외부 API 실패 시 fallback 목록 반환

3. 지원 도서관 모달 표시 개선
- 지역 탭 컨테이너의 높이 제한 제거하여 마지막 구(예: 중구/중랑구) 미노출 문제 완화

4. `src/app/api/search/route.ts` 로그 저장 구조 전환
- `@vercel/kv` 제거
- Prisma + PostgreSQL 기반으로 레이트리밋/로그 저장 전환
- 신규 모델:
  - `SearchEvent`
  - `SearchEventQuery`
  - `DailyRateLimit`
- 신규 레이어:
  - `src/lib/db/prisma.ts`
  - `src/lib/logging/search-log.repository.ts`
- 요청 로그는 `requestId` 단위로 IP/기기/검색어를 1건에 매칭 저장
- 로그 저장 실패가 검색 응답을 막지 않도록 비차단 처리 유지

## 5) 최근 장애 원인/해결 기록
### A. CI 빌드 실패: `TamseoLogo is not defined`
- 원인: `src/app/page.tsx`에서 사용만 하고 import 누락
- 조치: `import { TamseoLogo } from '@/components/SharedUI'` 추가

### B. CI 빌드 실패: `DISTRICTS is not a valid Page export field`
- 원인: `app/page.tsx`에서 `export const DISTRICTS ...` 등 named export 사용
- 조치: `export default` 외 export 제거

### C. CI 빌드 실패: `Module not found: Can't resolve '@prisma/client'`
- 원인: `api/libraries` 라우트에 Prisma 코드가 있으나 프로젝트 의존/스키마 불완전
- 조치: Prisma 제거, 정보나루 API 직접 호출 방식으로 단순화

### D. 사용자 증상: 지원 도서관 목록에서 중랑구 미표시
- 원인 후보 1: 모달 탭 영역 높이 제한으로 일부 구 버튼 잘림
- 원인 후보 2: `/api/libraries`가 fallback/정적 결과로 보이는 상황
- 조치: 탭 높이 제한 제거 + libraries 라우트를 강제 동적으로 전환

### E. 로그 저장 구조 개선 필요 (Vercel KV 의존 제거)
- 원인: 기존 `/api/search`가 `@vercel/kv`에 의존하고 있었음
- 조치: Prisma/PostgreSQL 저장 구조로 전환, KV 의존 제거

## 6) 현재 확인된 동작
- `npm run build` 성공 (경고 1건 존재)
- `npx next start -H 127.0.0.1 -p 3000` 기동 성공
- `GET /api/libraries` 응답에서 `중랑구` 데이터 확인됨
- `/api/search`는 PostgreSQL 로그 적재 경로로 동작(요청 처리와 분리된 비차단 저장)

## 7) 남아있는 경고/리스크
1. ESLint 경고
- `@next/next/no-img-element` (`src/app/page.tsx`)
- 빌드 실패 원인은 아니지만 최적화 관점에서 `next/image` 전환 검토 필요

2. UI 구조 중복 가능성
- `layout.tsx`에 공통 Nav/Footer가 있고, `page.tsx` 내부에도 유사 네비게이션/푸터가 존재
- 실제 화면에서 상단/하단 UI 중복 표출 가능성 있음

3. 외부 API 의존성
- `data4library.kr` DNS/네트워크 실패 시 libraries 라우트는 fallback으로 동작
- 배포 환경에서 DNS/Outbound 정책 확인 필요

4. DB 마이그레이션/환경변수 누락 리스크
- `DATABASE_URL` 미설정 시 Prisma 쿼리 실패 가능
- 스키마 변경 후 `prisma migrate` 미적용 시 런타임 오류 가능

## 8) 배포 파이프라인 참고
- 워크플로우: `.github/workflows/build-push.yml`
- 트리거: `main` push
- 개요:
  1. Docker 이미지 빌드
  2. GHCR 푸시
  3. SSH 접속 후 `deploy-app` 실행
- 운영 환경 변수(로그/관리자 API):
  - `DATABASE_URL` (필수)
  - `LOG_IP_SALT` (필수 권장, 고정 랜덤 문자열)
  - `ADMIN_API_TOKEN` (관리자 조회 API 인증 토큰)

## 9) 다음 대화에서 바로 시작할 체크리스트
1. 배포 환경 `DATABASE_URL`/`LOG_IP_SALT` 설정 여부 확인
2. 스키마 변경 시 `npx prisma migrate` 적용 상태 확인
3. 관리자 API 호출 시 `x-admin-token: $ADMIN_API_TOKEN` 헤더 포함 여부 확인
4. 최근 배포 실패 로그에서 `next build` 에러 줄(파일/라인) 먼저 확인
5. `src/app/page.tsx`에서 named export 재유입 여부 확인
6. `/api/libraries` 응답이 fallback인지 실제 API 데이터인지 확인
7. 실제 서비스 URL에서 모달 탭 하단 행(중구/중랑구) 노출 확인

## 10) 자주 쓰는 명령어
```bash
# nvm 로딩
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"

# 빌드
npx prisma generate
npm run build

# 마이그레이션 (개발 DB)
npx prisma migrate dev --name <migration_name>

# 관리자 로그 조회 API (예시)
curl -sS "http://127.0.0.1:3000/api/admin/search-logs?page=1&pageSize=20" \
  -H "x-admin-token: $ADMIN_API_TOKEN"

# 실행
npx next start -H 127.0.0.1 -p 3000

# libraries API 확인
curl -sS http://127.0.0.1:3000/api/libraries

# 상태 확인
git status -sb
git log --oneline -n 20
```
