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

    // 1. 유튜브 링크 처리
    if (targetUrl.includes('youtube.com') || targetUrl.includes('youtu.be')) {
      try {
        // (1) 고화질 썸네일 강제 추출 (maxresdefault)
        // 영상 ID 추출 정규식
        const videoIdMatch = targetUrl.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
        const videoId = videoIdMatch ? videoIdMatch[1] : null;
        
        if (videoId) {
          // 검은 여백 없는 고화질 이미지 URL 생성
          image = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
        }

        // (2) 제목 등 나머지 정보는 oEmbed로 안전하게 가져오기
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(targetUrl)}&format=json`;
        const res = await fetch(oembedUrl);
        if (res.ok) {
          const data = await res.json();
          title = data.title;
          siteName = data.author_name;
          description = "YouTube Video";
          // 만약 위에서 만든 고화질 이미지가 실패할 수도 있으니, 여기서는 이미지 덮어쓰지 않음
          // (이미지가 비어있을 때만 oEmbed 썸네일 사용)
          if (!image) image = data.thumbnail_url;
          
          return NextResponse.json({ title, description, image, siteName, url: targetUrl });
        }
      } catch (e) {
        console.error("YouTube oEmbed failed", e);
      }
    }

    // 2. 일반 사이트 처리 (기존과 동일)
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
    // 이미지가 없으면 twitter:image 등 차선책 확인
    if (!image) {
        image = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content') || "";
    }
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