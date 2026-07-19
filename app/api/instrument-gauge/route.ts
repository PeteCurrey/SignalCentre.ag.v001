import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/client";


export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get("symbol") || "XAUUSD";

  // Check if API keys exist, if not, use mock
  const tdKey = process.env.TWELVE_DATA_API_KEY;
  const finnhubKey = process.env.FINNHUB_API_KEY;

  if (!tdKey || !finnhubKey) {
    return NextResponse.json(
      { error: "API keys (Twelve Data and/or Finnhub) are not configured." },
      { status: 500 }
    );
  }

  try {
    // 1. Fetch Twelve Data Quote
    const quoteRes = await fetch(`https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${tdKey}`);
    const quoteData = await quoteRes.json();

    // 2. Fetch Technical Indicators (RSI, EMA, MACD) in parallel
    const [rsiRes, emaRes, macdRes] = await Promise.all([
      fetch(`https://api.twelvedata.com/technical_indicator?symbol=${symbol}&interval=4h&type=rsi&apikey=${tdKey}`),
      fetch(`https://api.twelvedata.com/technical_indicator?symbol=${symbol}&interval=4h&type=ema&time_period=50&apikey=${tdKey}`),
      fetch(`https://api.twelvedata.com/technical_indicator?symbol=${symbol}&interval=4h&type=macd&apikey=${tdKey}`)
    ]);

    const rsiData = await rsiRes.json();
    const emaData = await emaRes.json();
    const macdData = await macdRes.json();

    // 3. Fetch Finnhub News
    const newsRes = await fetch(`https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=2024-01-01&to=2024-01-02&token=${finnhubKey}`);
    const newsData = await newsRes.json();

    // 4. Fetch latest Signal for COT and Macro proxy
    const db = createServiceClient();
    const { data } = await db
      .from("signals")
      .select("direction, atr_value, catalyst")
      .eq("instrument", symbol)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    const signal: any = data;

    // Process variables
    const price = parseFloat(quoteData.close || "0");
    const rsiVal = parseFloat(rsiData.values?.[0]?.rsi || "50");
    const emaVal = parseFloat(emaData.values?.[0]?.ema || "0");
    const macdHist = parseFloat(macdData.values?.[0]?.macd_hist || "0");

    // Factor Signals (-1, 0, 1)
    const signals = {
      rsi: rsiVal < 30 ? 1 : rsiVal > 70 ? -1 : 0,
      ema: price > emaVal ? 1 : -1,
      cot: signal?.direction === "bullish" ? 1 : signal?.direction === "bearish" ? -1 : 0,
      vol: signal?.atr_value ? 0 : 0, // Simplified: neutral for now
      news: 1, // Simplified news sentiment proxy
      order_flow: macdHist > 0 ? 1 : macdHist < 0 ? -1 : 0,
      macro: signal?.direction === "bullish" ? 1 : -1
    };

    // Calculate overall bias
    const weights = { rsi: 20, ema: 20, cot: 10, vol: 10, news: 15, order_flow: 15, macro: 10 };
    const score = 
      (signals.rsi * weights.rsi) + 
      (signals.ema * weights.ema) + 
      (signals.cot * weights.cot) + 
      (signals.vol * weights.vol) + 
      (signals.news * weights.news) + 
      (signals.order_flow * weights.order_flow) + 
      (signals.macro * weights.macro);

    const bias_pct = Math.round(((score + 100) / 200) * 100);
    const direction = bias_pct >= 50 ? "BULLISH" : "BEARISH";

    return NextResponse.json({
      symbol,
      price: quoteData.close,
      change: quoteData.change,
      change_pct: quoteData.percent_change,
      rsi: rsiVal.toFixed(1),
      ema50: emaVal.toFixed(2),
      trend: price > emaVal ? "ABOVE" : "BELOW",
      session: "LONDON", // Hardcoded for this demo
      bias_pct,
      direction,
      factors: {
        RSI: { value: rsiVal.toFixed(1), signal: signals.rsi, label: `RSI at ${rsiVal.toFixed(1)}` },
        EMA: { value: emaVal.toFixed(2), signal: signals.ema, label: `EMA50 at ${emaVal.toFixed(2)}` },
        COT: { value: "Proxy", signal: signals.cot, label: "COT direction proxy" },
        VOL: { value: "Normal", signal: signals.vol, label: "ATR normal" },
        NEWS: { value: "Positive", signal: signals.news, label: "News sentiment" },
        ORDER_FLOW: { value: macdHist.toFixed(4), signal: signals.order_flow, label: "MACD Histogram" },
        MACRO: { value: "Aligned", signal: signals.macro, label: signal?.catalyst || "Macro context" }
      },
      news: (newsData || []).slice(0, 3).map((n: any) => ({
        source: n.source || "News",
        headline: n.headline,
        url: n.url,
        time: new Date(n.datetime * 1000).toISOString()
      })),
      computed_at: new Date().toISOString()
    }, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" }
    });
  } catch (error) {
    console.error("Instrument Gauge API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
