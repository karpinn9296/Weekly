"use client";
import { useEffect, useState } from "react";

export default function LinkPreview({ url }: { url: string }) {
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imgSize, setImgSize] = useState<{ w: number, h: number } | null>(null);
  
  useEffect(() => {
    if (!url) return;
    setLoading(true);
    fetch(`/api/meta?url=${encodeURIComponent(url)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error || (!data.title && !data.description)) {
          setMeta(null);
        } else {
          setMeta(data);
          if (data.image) {
            const img = new Image();
            img.src = data.image;
            
            img.onload = () => {
              // ★ 해결 포인트: 유튜브 고화질 썸네일이 없어서 120px짜리 가짜 이미지를 줄 때 일반 화질로 교체
              if (img.src.includes('maxresdefault') && img.naturalWidth <= 120) {
                 const fallback = img.src.replace('maxresdefault.jpg', 'hqdefault.jpg');
                 setMeta({ ...data, image: fallback });
                 setImgSize({ w: 480, h: 360 }); // hqdefault 기본 비율
              } else {
                 setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
              }
              setLoading(false);
            };

            // ★ 해결 포인트: 404 에러가 나면 일반 화질로 교체 시도
            img.onerror = () => {
              if (img.src.includes('maxresdefault.jpg')) {
                const fallback = img.src.replace('maxresdefault.jpg', 'hqdefault.jpg');
                setMeta({ ...data, image: fallback });
                setImgSize({ w: 480, h: 360 });
              } else {
                setImgSize(null);
              }
              setLoading(false);
            };
          } else {
            setLoading(false);
          }
        }
      })
      .catch(() => { setMeta(null); setLoading(false); });
  }, [url]);

  if (loading) return null;
  if (!meta) return null;

  const isVertical = imgSize && imgSize.h > imgSize.w;

  return (
    <a href={meta.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit', display: 'block', marginTop: '10px', width: '100%', maxWidth: '100%' }} onClick={(e) => e.stopPropagation()}>
      <div style={{ border: '1px solid #cfd9de', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#fff', transition: 'background 0.2s' }}>
        {meta.image && (
          isVertical ? (
            <div style={{ width: '100%', aspectRatio: '16 / 9', borderBottom: '1px solid #cfd9de', backgroundColor: '#000', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${meta.image})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(20px) brightness(0.7)', transform: 'scale(1.2)' }} />
              <img src={meta.image} alt="preview" style={{ position: 'relative', width: '100%', height: '100%', objectFit: 'contain', zIndex: 1 }} />
            </div>
          ) : (
            <div style={{ width: '100%', borderBottom: '1px solid #cfd9de', lineHeight: 0 }}>
              <img src={meta.image} alt="preview" style={{ width: '100%', height: 'auto', objectFit: 'cover', display: 'block' }} />
            </div>
          )
        )}
        <div style={{ padding: '12px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '4px', color: '#0f1419', lineHeight: '1.3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta.title}</div>
          <div style={{ fontSize: '0.9rem', color: '#536471', marginBottom: '8px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: '1.4' }}>{meta.description}</div>
          <div style={{ fontSize: '0.85rem', color: '#888', display: 'flex', alignItems: 'center', gap: '4px' }}>🔗 {meta.siteName}</div>
        </div>
      </div>
    </a>
  );
}
