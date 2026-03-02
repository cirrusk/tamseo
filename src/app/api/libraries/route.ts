// 파일 경로: src/app/api/libraries/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

const API_KEY = process.env.LIBRARY_API_KEY?.trim();

// 서울시 자치구 이름 -> 코드 매핑 (정보나루 주소 파싱용)
const DISTRICT_NAME_TO_CODE: Record<string, string> = {
  "강남구": "11230", "강동구": "11250", "강북구": "11090", "강서구": "11160", "관악구": "11210",
  "광진구": "11050", "구로구": "11170", "금천구": "11180", "노원구": "11110", "도봉구": "11100",
  "동대문구": "11060", "동작구": "11200", "마포구": "11140", "서대문구": "11130", "서초구": "11220",
  "성동구": "11040", "성북구": "11080", "송파구": "11240", "양천구": "11150", "영등포구": "11190",
  "용산구": "11030", "은평구": "11120", "종로구": "11010", "중구": "11020", "중랑구": "11070"
};

export async function GET() {
  try {
    // 1. 우리 DB에서 먼저 도서관 데이터 조회
    const dbLibraries = await prisma.library.findMany({
      include: { region: true },
      orderBy: { name: 'asc' }
    });

    // 2. DB에 데이터가 충분히 있다면 (세팅 완료 상태) API 호출 없이 즉시 반환 (초고속 캐싱)
    if (dbLibraries.length > 100) {
      const formatted = dbLibraries.map(lib => ({
        district: lib.region.name, // "마포구"
        name: lib.name,
        address: lib.address
      }));
      return NextResponse.json(formatted);
    }

    // 3. DB에 데이터가 없다면, 정보나루 API 최초 호출 (region=11: 서울특별시, pageSize=500: 한 번에 모두 가져오기)
    if (!API_KEY) return NextResponse.json({ error: 'API Key missing' }, { status: 500 });

    const res = await fetch(`http://data4library.kr/api/libSrch?authKey=${API_KEY}&region=11&pageSize=500&format=json`);
    const data = await res.json();
    const libs = data.response?.libs || [];

    // 오류 방지: Region(자치구) 기초 데이터 25개가 DB에 무조건 있도록 보장
    for (const [name, code] of Object.entries(DISTRICT_NAME_TO_CODE)) {
      await prisma.region.upsert({
        where: { code },
        update: {},
        create: { code, name, city: "서울특별시", isActive: true }
      });
    }

    const newLibraries = [];

    // 4. 정보나루에서 가져온 도서관 데이터를 파싱하여 DB에 저장
    for (const item of libs) {
      const lib = item.lib;
      const address = lib.address || "";
      
      // 주소 텍스트에서 "OO구" 형태의 자치구 이름 추출 (예: "서울특별시 마포구 성산로...")
      const match = address.match(/서울특별시\s+([가-힣]+구)/);
      const districtName = match ? match[1] : null;
      
      if (districtName && DISTRICT_NAME_TO_CODE[districtName]) {
        const regionCode = DISTRICT_NAME_TO_CODE[districtName];
        
        // UPSERT: 이미 있으면 주소 업데이트, 없으면 새로 생성
        await prisma.library.upsert({
          where: { libCode: lib.libCode },
          update: { name: lib.libName, address: lib.address, isActive: true },
          create: {
            libCode: lib.libCode,
            name: lib.libName,
            address: lib.address,
            isActive: true,
            regionCode: regionCode
          }
        });

        newLibraries.push({
          district: districtName,
          name: lib.libName,
          address: lib.address
        });
      }
    }

    // 5. 최초 동기화된 목록을 가나다순으로 정렬하여 클라이언트에 반환
    newLibraries.sort((a, b) => a.name.localeCompare(b.name));
    return NextResponse.json(newLibraries);

  } catch (error) {
    console.error("Library Fetch/Sync Error:", error);
    return NextResponse.json({ error: 'Failed to sync libraries' }, { status: 500 });
  }
}