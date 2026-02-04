import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return NextResponse.json({ error: 'No URL provided' }, { status: 400 });

  try {
    // 1. 봇인 척하고 사이트 접속 (차단 방지)
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Bot/1.0; +http://localhost:3000)',
      }
    });
    
    if (!res.ok) throw new Error('Failed to fetch');

    const html = await res.text();
    const $ = cheerio.load(html);
    
    // 2. 메타 태그 긁어오기 (OG 태그 우선)
    const title = $('meta[property="og:title"]').attr('content') || $('title').text() || "";
    const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || "";
    let image = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content') || "";
    const siteName = $('meta[property="og:site_name"]').attr('content') || new URL(targetUrl).hostname;

    // 이미지 경로가 상대경로(/image.png)일 경우 절대경로(https://...)로 변환
    if (image && !image.startsWith('http')) {
      const urlObj = new URL(targetUrl);
      image = `${urlObj.protocol}//${urlObj.host}${image}`;
    }

    return NextResponse.json({ title, description, image, siteName, url: targetUrl });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 });
  }
}