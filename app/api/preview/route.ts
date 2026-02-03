import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return NextResponse.json({ error: 'URL missing' }, { status: 400 });

  try {
    // 1. 해당 사이트 HTML 가져오기 (User-Agent 설정으로 봇 차단 우회)
    const { data } = await axios.get(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Bot/1.0)' }
    });
    
    // 2. 메타태그 파싱
    const $ = cheerio.load(data);
    const title = $('meta[property="og:title"]').attr('content') || $('title').text();
    const image = $('meta[property="og:image"]').attr('content');
    const description = $('meta[property="og:description"]').attr('content');

    return NextResponse.json({ title, image, description, url: targetUrl });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}