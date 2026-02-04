import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return NextResponse.json({ error: 'No URL provided' }, { status: 400 });

  try {
    let title = "";
    let description = "";
    let image = "";
    let siteName = "";

    // 1. 유튜브 링크인지 확인 (YouTube는 oEmbed API 사용)
    if (targetUrl.includes('youtube.com') || targetUrl.includes('youtu.be')) {
      try {
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(targetUrl)}&format=json`;
        const res = await fetch(oembedUrl);
        if (res.ok) {
          const data = await res.json();
          title = data.title;
          siteName = data.author_name; // 채널명
          image = data.thumbnail_url;
          description = "YouTube Video"; // 유튜브는 설명을 따로 안 줌
          return NextResponse.json({ title, description, image, siteName, url: targetUrl });
        }
      } catch (e) {
        console.error("YouTube oEmbed failed, falling back to cheerio", e);
      }
    }

    // 2. 일반 사이트 (기존 방식 - 봇인 척 위장)
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
    
    if (!res.ok) throw new Error('Failed to fetch');

    const html = await res.text();
    const $ = cheerio.load(html);
    
    title = $('meta[property="og:title"]').attr('content') || $('title').text() || "";
    description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || "";
    image = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content') || "";
    siteName = $('meta[property="og:site_name"]').attr('content') || new URL(targetUrl).hostname;

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