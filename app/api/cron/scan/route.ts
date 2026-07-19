import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';
import { ASSET_COVERAGE } from '@/lib/data/signals';
// crypto.randomUUID() is built into Node 18+ — no package needed

export const dynamic = 'force-dynamic';
// Vercel limit for cron is usually longer, but let's allow maxDuration
export const maxDuration = 300; 

const STAGGER_MS = 2000;
const TIMEOUT_MS = 20000;

async function fetchModel(modelName: string, instrument: string, timeoutMs: number) {
  // Mocking the actual model call for the purpose of the demo
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout ${modelName}`)), timeoutMs);
    setTimeout(() => {
      clearTimeout(timer);
      resolve({
        model: modelName,
        bias: Math.random() > 0.5 ? 'BULLISH' : 'BEARISH',
        confidence: Math.floor(Math.random() * 20) + 60,
      });
    }, 1000 + Math.random() * 2000);
  });
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV !== 'development') {
    // In dev we might not have CRON_SECRET, but in prod we should verify
    console.warn("Unauthorised cron request");
  }

  const db = createServerClient();
  const allInstruments = ASSET_COVERAGE.flatMap(c => c.instruments);
  
  const results = [];

  for (const instrument of allInstruments) {
    const startTime = Date.now();
    try {
      const models = ['CLAUDE', 'GPT', 'GROK', 'GEMINI'];
      const promises = models.map(m => fetchModel(m, instrument, TIMEOUT_MS));
      
      const settled = await Promise.allSettled(promises);
      const successful = settled.filter(r => r.status === 'fulfilled');
      
      if (successful.length < 2) {
        throw new Error(`Only ${successful.length} models responded. Minimum 2 required.`);
      }

      // Calculate consensus
      let totalConfidence = 0;
      let bullish = 0;
      let bearish = 0;

      successful.forEach(res => {
        if (res.status === 'fulfilled') {
          const val: any = res.value;
          totalConfidence += val.confidence;
          if (val.bias === 'BULLISH') bullish++;
          else if (val.bias === 'BEARISH') bearish++;
        }
      });

      const avgConfidence = Math.floor(totalConfidence / successful.length);
      const direction = bullish > bearish ? 'BULLISH' : bearish > bullish ? 'BEARISH' : 'NEUTRAL';
      const consensusScore = avgConfidence;

      // Calculate ATR based SL/TP (mocked ATR calculation for now)
      const currentPrice = 100; // Mock current price
      const atr = 1.5; 
      const stopLoss = direction === 'BULLISH' ? currentPrice - atr * 1.5 : currentPrice + atr * 1.5;
      const target1 = direction === 'BULLISH' ? currentPrice + atr * 1 : currentPrice - atr * 1;
      
      const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000); // +12h

      const { data, error } = await db.from('signals').insert({
        instrument,
        asset_class: ASSET_COVERAGE.find(c => c.instruments.includes(instrument))?.class || 'FOREX',
        direction,
        conviction: avgConfidence,
        consensus_score: consensusScore,
        risk_grade: avgConfidence >= 80 ? 'A' : avgConfidence >= 70 ? 'B' : 'C',
        timeframe: '4H',
        session: 'Global',
        status: 'active',
        outcome: 'pending',
        expires_at: expiresAt.toISOString(),
        stop_loss: stopLoss,
        target_1: target1,
        atr_value: atr
      }).select();

      if (error) throw error;

      await db.from('scan_log').insert({
        instrument,
        status: 'success',
        models_responded: successful.length
      });

      results.push({ instrument, status: 'success' });
    } catch (e: any) {
      console.error(`Failed to scan ${instrument}:`, e);
      await db.from('scan_log').insert({
        instrument,
        status: 'failure',
        models_responded: 0,
        error_message: e.message
      });
      results.push({ instrument, status: 'failure', error: e.message });
    }

    // Stagger
    const elapsed = Date.now() - startTime;
    if (elapsed < STAGGER_MS) {
      await new Promise(r => setTimeout(r, STAGGER_MS - elapsed));
    }
  }

  return NextResponse.json({ success: true, results });
}
