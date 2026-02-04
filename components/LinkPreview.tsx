"use client";
import { useEffect, useState } from "react";

export default function LinkPreview({ url }: { url: string }) {
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!url) return;
    // 아까 만든 API에 물어보기
    fetch(`/api/meta?url=${encodeURIComponent(url)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error || (!data.title && !data.description)) {
          setError(true);
        } else {
          setMeta(data);
        }
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });
  }, [url]);

  if (loading) return null; // 로딩 중엔 깜빡임 방지를 위해 아무것도 안 보여줌
  if (error || !meta) return null;

  return (
    <a 
      href={meta.url} 
      target="_blank" 
      rel="noopener noreferrer" 
      style={{ textDecoration: 'none', color: 'inherit', display: 'block', marginTop: '10px', maxWidth: '480px' }}
      onClick={(e) => e.stopPropagation()} // 카드 클릭 시 게시글 클릭 이벤트 방지
    >
      <div style={{ border: '1px solid #cfd9de', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#fff', transition: 'background 0.2s' }}>
        
        {/* 1. 썸네일 이미지 (있으면 표시) */}
        {meta.image && (
          <div style={{ width: '100%', height: '250px', borderBottom: '1px solid #cfd9de', backgroundColor: '#f7f9f9' }}>
            <img src={meta.image} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        {/* 2. 텍스트 정보 */}
        <div style={{ padding: '12px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '4px', color: '#0f1419', lineHeight: '1.3' }}>
            {meta.title}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#536471', marginBottom: '8px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
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