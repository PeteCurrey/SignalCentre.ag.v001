import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get("symbol") || "EURUSD";

  return NextResponse.json({
    symbol,
    consensus_score: 89,
    alert_text: "TC Alert: Long positions above support with targets at R1 and R2.",
    direction: "bullish",
  });
}
