import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json(
    { error: "해당 테스트 API는 비활성화되었습니다." },
    { status: 404 }
  );
}
