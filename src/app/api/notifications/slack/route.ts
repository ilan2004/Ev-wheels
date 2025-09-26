import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text: string = body?.text || '';
    const webhook = process.env.SLACK_WEBHOOK_URL;
    if (!webhook) {
      // Webhook not configured; succeed silently
      return NextResponse.json({ success: true, skipped: true });
    }
    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (!res.ok) {
      const msg = await res.text();
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}
