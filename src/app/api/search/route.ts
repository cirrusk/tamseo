import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const API_BASE_URL = 'http://data4library.kr/api';
// API Key 앞뒤 공백 제거 (실수 방지)
const API_KEY = process.env.LIBRARY_API_KEY?.trim();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const district = searchParams.get('district'); 
  const queries = searchParams.get('queries');   

  // 1. 보안 및 유효성 검사
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // API Key 확인 로그 (보안을 위해 일부만 출력)
  const keyLog = API_KEY 
    ? `${API_KEY.substring(0, 4)}...${API_KEY.substring(API_KEY.length - 4)}` 
    : 'Missing';
  console.log(`[System] API Key Check: ${keyLog}`);

  if (!API_KEY) {
    return NextResponse.json({ error: 'API Key가 설정되지 않았습니다.' }, { status: 500 });
  }

  if (!district || !queries) {
    return NextResponse.json({ error: '필수 파라미터가 누락되었습니다.' }, { status: 400 });
  }

  const bookTitles = queries.split(',').map(t => t.trim()).filter(t => t !== '');

  // 최대 5권 제한
  if (bookTitles.length > 5) {
    return NextResponse.json({ error: '최대 5권까지만 검색 가능합니다.' }, { status: 400 });
  }

  // 2. [Safe Mode] Rate Limiting (Vercel KV)
  try {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const limitKey = `rate_limit:${ip}:${new Date().toISOString().split('T')[0]}`;
      
      const currentUsage = await kv.incr(limitKey);
      
      if (currentUsage === 1) {
        await kv.expire(limitKey, 60 * 60 * 24);
      }

      // 테스트 중에는 제한을 넉넉하게 (50회)
      if (currentUsage > 50) { 
        return NextResponse.json({ error: '일일 검색 허용량을 초과했습니다.' }, { status: 429 });
      }

      const logData = {
        ip,
        userAgent,
        district,
        queries: bookTitles,
        timestamp: new Date().toISOString()
      };
      kv.lpush('search_logs', JSON.stringify(logData)).catch(() => {});
    } else {
      console.log("[System] Vercel KV not configured. Skipping rate limiting.");
    }
  } catch (error) {
    console.error("[System] KV Error (Ignored):", error);
  }

  // 3. 검색 로직 (6단계 전략)
  const results = [];

  // 타임아웃 방지용 타이머 (9초)
  const startTime = Date.now();

  for (const title of bookTitles) {
    if (Date.now() - startTime > 9000) break; // 시간이 너무 오래 걸리면 중단

    const cleanTitle = title.trim();
    const noSpaceTitle = cleanTitle.replace(/\s+/g, '');
    
    try {
      let foundBooks = null;
      
      const searchBook = async (strategy: string, params: string) => {
        const targetUrl = `${API_BASE_URL}/srchBooks?authKey=${API_KEY}&pageNo=1&pageSize=5&format=json&exactMatch=N&${params}`;
        try {
          const res = await fetch(targetUrl, { signal: AbortSignal.timeout(6000) });
          const rawText = await res.text();
          
          // [디버깅 활성화] API가 진짜로 뭐라고 했는지 확인 (에러 파악의 핵심!)
          console.log(`[Debug] ${strategy} Response: ${rawText.substring(0, 150)}...`);

          // XML 에러 응답 체크 (API 키 오류 등)
          if (rawText.trim().startsWith('<')) {
            console.error(`[API Error] XML Response received: ${rawText.substring(0, 200)}`);
            return null;
          }

          let data;
          try {
            data = JSON.parse(rawText);
          } catch (e) {
            console.error("[Error] JSON Parsing Failed");
            return null;
          }
          
          if (data.response?.docs?.length > 0) {
            // 상위 3권까지 가져오기
            return data.response.docs.slice(0, 3).map((item: any) => item.doc);
          }
        } catch (e) { 
            console.error(`[Search Error] Strategy ${strategy} failed:`, e);
            return null; 
        }
        return null;
      };

      // === [총력전: 6단계 검색 전략] ===
      if (!foundBooks) foundBooks = await searchBook("1.원본+대출순", `title=${encodeURIComponent(cleanTitle)}&sort=loan`);
      if (!foundBooks && cleanTitle !== noSpaceTitle) foundBooks = await searchBook("2.공백제거+대출순", `title=${encodeURIComponent(noSpaceTitle)}&sort=loan`);
      if (!foundBooks) foundBooks = await searchBook("3.키워드+대출순", `keyword=${encodeURIComponent(cleanTitle)}&sort=loan`);
      if (!foundBooks) foundBooks = await searchBook("4.원본+정렬X", `title=${encodeURIComponent(cleanTitle)}`);
      if (!foundBooks && cleanTitle !== noSpaceTitle) foundBooks = await searchBook("5.공백제거+정렬X", `title=${encodeURIComponent(noSpaceTitle)}`);
      if (!foundBooks) foundBooks = await searchBook("6.키워드+정렬X", `keyword=${encodeURIComponent(cleanTitle)}`);
      
      if (!foundBooks) {
        console.log(`[Fail] No results for: ${title}`);
        continue; 
      }

      // 찾아낸 책들(최대 3권)에 대해 각각 도서관 정보 조회
      const processedBooks = [];

      for (const bookInfo of foundBooks) {
        // ISBN13이 없으면 ISBN10 사용
        const isbn = bookInfo.isbn13 || bookInfo.isbn;
        if (!isbn) continue;

        // 2. 소장 도서관 찾기 (Top 5만 조회하여 속도 향상)
        const libRes = await fetch(
          `${API_BASE_URL}/libSrchByBook?authKey=${API_KEY}&isbn=${isbn}&region=11&dtl_region=${district}&pageSize=5&format=json`,
          { signal: AbortSignal.timeout(6000) }
        );
        const libData = await libRes.json();
        const librariesFound = libData.response?.libs || [];
        
        // 3. 대출 가능 여부 확인 (병렬 처리)
        const librariesWithStatus = await Promise.all(librariesFound.map(async (item: any) => {
          const libCode = item.lib.libCode;
          try {
            const existRes = await fetch(
              `${API_BASE_URL}/bookExist?authKey=${API_KEY}&libCode=${libCode}&isbn13=${isbn}&format=json`,
              { signal: AbortSignal.timeout(2000) } // 개별 조회 2초 제한
            );
            const existData = await existRes.json();
            return {
              libraryName: item.lib.libName,
              isAvailable: existData.response?.result?.loanAvailable === 'Y'
            };
          } catch (e) {
            return { libraryName: item.lib.libName, isAvailable: false };
          }
        }));

        if (librariesWithStatus.length > 0) {
          processedBooks.push({
            metadata: {
              title: bookInfo.bookname,
              author: bookInfo.authors,
              publisher: bookInfo.publisher,
              pubYear: bookInfo.publication_year,
              isbn: bookInfo.isbn13 || bookInfo.isbn
            },
            libraries: librariesWithStatus
          });
        }
      }

      if (processedBooks.length > 0) {
        results.push({
          searchTerm: cleanTitle,
          books: processedBooks
        });
      }

    } catch (error) {
      console.error(`Processing Error (${title}):`, error);
    }
  }

  return NextResponse.json(results);
}
