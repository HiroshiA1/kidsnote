import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { provider, apiKey, model } = await req.json();

    if (!provider || !apiKey || !model) {
      return NextResponse.json({ error: 'provider, apiKey, model は必須です' }, { status: 400 });
    }

    const testPrompt = 'こんにちは。接続テストです。「OK」とだけ返してください。';

    switch (provider) {
      case 'gemini': {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: testPrompt }] }],
            generationConfig: { maxOutputTokens: 32 },
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return NextResponse.json({
            error: `Gemini API エラー: ${err?.error?.message ?? res.statusText}`,
          }, { status: 400 });
        }
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        return NextResponse.json({ message: `接続成功: ${text.slice(0, 50)}` });
      }

      case 'openai': {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: testPrompt }],
            max_tokens: 32,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return NextResponse.json({
            error: `OpenAI API エラー: ${err?.error?.message ?? res.statusText}`,
          }, { status: 400 });
        }
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content ?? '';
        return NextResponse.json({ message: `接続成功: ${text.slice(0, 50)}` });
      }

      case 'claude': {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model,
            max_tokens: 32,
            messages: [{ role: 'user', content: testPrompt }],
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return NextResponse.json({
            error: `Claude API エラー: ${err?.error?.message ?? res.statusText}`,
          }, { status: 400 });
        }
        const data = await res.json();
        const text = data?.content?.[0]?.text ?? '';
        return NextResponse.json({ message: `接続成功: ${text.slice(0, 50)}` });
      }

      default:
        return NextResponse.json({ error: `未対応のプロバイダー: ${provider}` }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : '接続テストに失敗しました',
    }, { status: 500 });
  }
}
