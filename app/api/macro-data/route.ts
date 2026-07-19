import { NextResponse } from "next/server";

export async function GET() {
  // Mock data for macro yields
  return NextResponse.json({
    fed_funds_rate: "5.25",
    uk_base_rate: "5.25",
    us_10y_bond: "4.42",
  });
}
