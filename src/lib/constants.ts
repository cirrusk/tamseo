// 파일 경로: src/lib/constants.ts

// =========================================================================
// 🛠️ TYPES & MOCK DATA (모든 페이지에서 공통으로 쓰는 데이터와 타입)
// =========================================================================

export interface BookMetadata { title: string; author: string; publisher: string; pubYear: string; isbn: string; imageUrl?: string; }
export interface LibraryAvailability { libraryName: string; isAvailable: boolean; }
export interface GroupedBookResult { metadata: BookMetadata; libraries: LibraryAvailability[]; }
export interface SearchResultItem { searchTerm: string; books: GroupedBookResult[]; }
export interface LibraryInfo { district: string; name: string; address: string; }
export interface BookCollection { id: string; brand: string; title: string; category: string; ageGroup: string; description: string; books: string[]; }

export const DISTRICTS = ["11230", "11250", "11090", "11160", "11210", "11050", "11170", "11180", "11110", "11100", "11060", "11200", "11140", "11130", "11220", "11040", "11080", "11240", "11150", "11190", "11030", "11120", "11010", "11020", "11070"];
export const DISTRICT_NAMES: Record<string, string> = { "11230": "강남구", "11250": "강동구", "11090": "강북구", "11160": "강서구", "11210": "관악구", "11050": "광진구", "11170": "구로구", "11180": "금천구", "11110": "노원구", "11100": "도봉구", "11060": "동대문구", "11200": "동작구", "11140": "마포구", "11130": "서대문구", "11220": "서초구", "11040": "성동구", "11080": "성북구", "11240": "송파구", "11150": "양천구", "11190": "영등포구", "11030": "용산구", "11120": "은평구", "11010": "종로구", "11020": "중구", "11070": "중랑구" };

export const SEOUL_LIBRARIES: LibraryInfo[] = [
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

export const BRANDS = ["전체", "그레이트북스", "아람북스", "비룡소", "키즈스콜레", "무지개출판사"];
export const KIDS_COLLECTIONS: BookCollection[] = [
  { id: "c1", brand: "그레이트북스", title: "내 친구 과학공룡", category: "과학", ageGroup: "4~7세", description: "아이들의 호기심을 채워주는 재미있는 과학 그림책", books: ["요리조리 빙글빙글", "뼈뼈 사우루스", "자석의 비밀", "우주로 간 라이카", "물방울의 여행", "소화가 꿀꺽꿀꺽"] },
  { id: "c2", brand: "그레이트북스", title: "내 친구 수학공룡", category: "수학", ageGroup: "4~7세", description: "일상 속 수학의 원리를 깨우치는 스토리텔링 수학", books: ["모양 친구들 숨바꼭질", "1부터 10까지 세어봐", "크다 작다 길다 짧다", "시간을 재어보자"] },
  { id: "c3", brand: "아람북스", title: "자연이랑", category: "자연관찰", ageGroup: "0~3세", description: "생생한 사진과 이야기로 만나는 첫 자연관찰 전집", books: ["호랑이는 무서워", "사자는 동물의 왕", "코끼리 코는 길어", "기린은 목이 길어", "팬더는 대나무를 좋아해"] },
  { id: "c4", brand: "아람북스", title: "심쿵", category: "인성", ageGroup: "4~7세", description: "아이의 마음을 알아주고 다독이는 인성 동화", books: ["화가 날 땐 어떡하지?", "동생이 미워요", "나도 할 수 있어", "어둠이 무섭지 않아"] },
  { id: "c5", brand: "키즈스콜레", title: "마마파파 세계명작", category: "명작", ageGroup: "4~7세", description: "세계적인 일러스트레이터들이 참여한 아름다운 명작", books: ["백설공주", "신데렐라", "아기돼지 삼형제", "헨젤과 그레텔", "미운 오리 새끼"] },
  { id: "c6", brand: "비룡소", title: "비룡소 그림동화", category: "창작", ageGroup: "전연령", description: "전 세계의 아름다운 수상작들을 모은 그림책", books: ["지각대장 존", "무지개 물고기", "누가 내 머리에 똥 쌌어?", "구름빵", "달샤베트"] },
];

// 백엔드 API 통신 함수 (남편분이 만드신 백엔드와 연결됩니다)
export const fetchLibraryData = async (districtCode: string, bookTitles: string[]): Promise<SearchResultItem[]> => {
  try {
    const query = bookTitles.join(',');
    const response = await fetch(`/api/search?district=${districtCode}&queries=${encodeURIComponent(query)}`);
    if (!response.ok) {
      const errorData = await response.json();
      if (errorData.error) throw new Error(errorData.error);
      throw new Error('API 호출 실패');
    }
    return await response.json();
  } catch (error: any) {
    console.error("Failed to fetch data:", error);
    alert(error.message || "도서관 정보를 불러오는데 실패했습니다.");
    return [];
  }
};