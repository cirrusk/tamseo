# AGENTS.md

이 파일은 이 저장소(`/Users/park/tamseo`)에서 새 대화를 시작할 때 자동 참조되는 작업 지침이다.

## 1) 우선 읽기
- 반드시 [DEVELOPMENT.md](./DEVELOPMENT.md)를 먼저 읽고 시작한다.
- 최근 장애 이력/아키텍처/실행 방법은 DEVELOPMENT.md를 기준으로 판단한다.

## 2) 프로젝트 핵심
- 서비스: 탐서(Tamseo)
- 프레임워크: Next.js 14 App Router
- 핵심 엔드포인트:
  - `src/app/api/search/route.ts`
  - `src/app/api/libraries/route.ts`
- 메인 UI: `src/app/page.tsx`

## 3) 빌드/실행 표준 절차
1. nvm 로딩
```bash
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"
```
2. 빌드
```bash
npm run build
```
3. 실행 확인
```bash
npx next start -H 127.0.0.1 -p 3000
curl -sS -I http://127.0.0.1:3000
```

## 4) 자주 발생한 실수(재발 방지)
- `src/app/page.tsx`에서 `export default` 외 named export를 추가하지 말 것.
  - 예: `export const DISTRICTS` 추가 시 Next App Router 타입 에러 발생.
- `TamseoLogo`를 JSX에서 사용하면 반드시 import 확인.
  - `import { TamseoLogo } from '@/components/SharedUI';`
- `src/app/api/libraries/route.ts`는 Prisma 의존 금지.
  - `@prisma/client` 도입 시 CI 빌드 실패 이력 있음.
- libraries API는 런타임 조회 유지.
  - `dynamic = "force-dynamic"`, `revalidate = 0` 유지.

## 5) UI/기능 관련 주의
- “지원 도서관 목록” 모달에서 자치구 탭이 잘리지 않게 높이 제한/스크롤 설정 주의.
- 중랑구/중구 노출 여부는 모달 탭 + `/api/libraries` 응답 둘 다 확인.

## 6) 배포 파이프라인 참고
- 워크플로우: `.github/workflows/build-push.yml`
- `main` push 시 Docker build/push + SSH deploy 수행.
- CI 실패 시 반드시 `next build` 에러 줄(파일/라인)부터 확인.

## 7) 작업 완료 기준
- 코드 수정 후 최소 다음을 만족해야 함:
  - `npm run build` 성공
  - 필요한 경우 `next start` 응답(HTTP 200) 확인
- 빌드 경고와 실패를 구분해서 보고한다.

## 8) 커밋/푸시 규칙
- 사용자가 요청한 경우에만 커밋/푸시 수행.
- 커밋 메시지는 변경 의도를 명확히 작성.
- 푸시 전 `git status -sb`로 변경 범위 재확인.

## 9) Todo 운영 규칙
- 모든 작업은 루트 `Todo.md`에 계획을 먼저 작성한 뒤 시작한다.
- 작업 중에는 `Todo.md`를 매 단계 참조하여 진행 상태를 맞춘다.
- 작업 완료 시 `Todo.md`의 상태/결과/후속 작업을 반드시 업데이트한다.
- 사용자 요청이 바뀌면 `Todo.md` 계획도 즉시 동기화한다.
