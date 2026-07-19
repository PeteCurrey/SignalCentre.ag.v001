import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get("symbol") || "EURUSD";

  return NextResponse.json({
    symbol,
    expert_rationale: "Machines spotted the breakout, and human analysts confirm structural alignment. Order block retest is holding strong under low selling volume, offering high-R:R entry criteria.",
    confidence: 82,
  });
}
