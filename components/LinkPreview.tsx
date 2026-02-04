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
              setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
              setLoading(false);
            };
            img.onerror = () => {
              setImgSize(null);
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

  // 세로 이미지 판단 (높이가 너비보다 클 때)
  const isVertical = imgSize && imgSize.h > imgSize.w;

  return (
    <a 
      href={meta.url} 
      target="_blank" 
      rel="noopener noreferrer" 
      style={{ textDecoration: 'none', color: 'inherit', display: 'block', marginTop: '10px', width: '100%', maxWidth: '100%' }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ border: '1px solid #cfd9de', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#fff', transition: 'background 0.2s' }}>
        
        {meta.image && (
          isVertical ? (
            // [모드 1] 세로 이미지 (쇼츠) -> 16:9 박스 + 블러 배경 (너무 길어짐 방지)
            <div style={{ 
              width: '100%', 
              aspectRatio: '16 / 9', 
              borderBottom: '1px solid #cfd9de', 
              backgroundColor: '#000',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div 
                style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: `url(${meta.image})`,
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  filter: 'blur(20px) brightness(0.7)', transform: 'scale(1.2)',
                }} 
              />
              <img 
                src={meta.image} 
                alt="preview" 
                style={{ position: 'relative', width: '100%', height: '100%', objectFit: 'contain', zIndex: 1 }} 
              />
            </div>
          ) : (
            // [모드 2] 가로/정사각형 -> 높이 자동 조절 (비율에 딱 맞춤)
            <div style={{ width: '100%', borderBottom: '1px solid #cfd9de', lineHeight: 0 }}>
              <img 
                src={meta.image} 
                alt="preview" 
                style={{ width: '100%', height: 'auto', objectFit: 'cover', display: 'block' }} 
              />
            </div>
          )
        )}

        <div style={{ padding: '12px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '4px', color: '#0f1419', lineHeight: '1.3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {meta.title}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#536471', marginBottom: '8px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: '1.4' }}>
            {meta.description}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#888', display: 'flex', alignItems: 'center', gap: '4px' }}>
             🔗 {meta.siteName}
          </div>
        </div>
      </div>
    </a>
  );
}