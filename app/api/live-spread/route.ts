import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get("symbol") || "EURUSD";

  // Mock spread data
  const spread = Math.random() * 2 + 0.5; // Random between 0.5 and 2.5 pips
  return NextResponse.json({
    symbol,
    spread_pips: spread.toFixed(1),
  });
}
