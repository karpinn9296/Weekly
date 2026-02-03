"use client";
import { useEffect, useState } from "react";
import { db } from "@/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import Sidebar from "@/components/Sidebar";
import RightSection from "@/components/RightSection";
import WriteModal from "@/components/WriteModal";
import MobileNav from "@/components/MobileNav"; 

export default function Home() {
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<string>("all");
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([]);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(newPosts);
      const weeks = Array.from(new Set(newPosts.map((p: any) => p.weekId))).sort().reverse();
      setAvailableWeeks(weeks as string[]);
    });
    return () => unsubscribe();
  }, []);

  const filteredPosts = selectedWeek === "all" ? posts : posts.filter(p => p.weekId === selectedWeek);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f5f7f8' }}>
      
      {/* 모바일 컨테이너 클래스 추가 */}
      <div className="mobile-container" style={{ display: 'flex', width: '100%', maxWidth: '1200px', alignItems: 'flex-start' }}>
        
        {/* [Left] 사이드바 -> 모바일에서는 숨김 (.pc-only) */}
        <div className="pc-only" style={{ width: '260px', flexShrink: 0 }}>
          <Sidebar onOpenWrite={() => setIsWriteModalOpen(true)} />
        </div>

        {/* [Center] 메인 피드 */}
        <main style={{ flex: 1, padding: '20px', maxWidth: '640px', width: '100%' }}>
          
          {/* 헤더 영역 */}
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#222', marginBottom: '10px' }}>
              {selectedWeek === 'all' ? '전체 타임라인' : selectedWeek}
            </h2>

            {/* [모바일 전용] 상단 가로 스크롤 주차 필터 (.mobile-only) */}
            <div className="mobile-only horizontal-scroll">
              <button 
                onClick={() => setSelectedWeek('all')}
                style={{ 
                  whiteSpace: 'nowrap', padding: '8px 16px', borderRadius: '20px', border: 'none',
                  backgroundColor: selectedWeek === 'all' ? '#333' : 'white',
                  color: selectedWeek === 'all' ? 'white' : '#555',
                  fontWeight: 'bold', fontSize: '0.9rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
              >
                전체
              </button>
              {availableWeeks.map(week => (
                <button 
                  key={week}
                  onClick={() => setSelectedWeek(week)}
                  style={{ 
                    whiteSpace: 'nowrap', padding: '8px 16px', borderRadius: '20px', border: 'none',
                    backgroundColor: selectedWeek === week ? '#333' : 'white',
                    color: selectedWeek === week ? 'white' : '#555',
                    fontWeight: 'bold', fontSize: '0.9rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}
                >
                  {week}
                </button>
              ))}
            </div>
          </div>

          {/* 게시글 리스트 */}
          {filteredPosts.length === 0 ? (
             <div style={{ textAlign: 'center', padding: '50px', color: '#888' }}>표시할 기록이 없습니다.</div>
          ) : (
            filteredPosts.map((post) => (
              <article key={post.id} style={{ 
                backgroundColor: 'white', 
                borderRadius: '16px', 
                padding: '20px', 
                marginBottom: '15px', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                border: '1px solid #eee'
              }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <img 
                    src={post.authorPhoto || "/default-avatar.png"} 
                    alt="프사" 
                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #eee' }} 
                  />
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#222' }}>{post.authorName}</span>
                      <span style={{ color: '#888', fontSize: '0.8rem' }}>· {post.weekLabel || post.weekId}</span>
                      <span style={{ color: '#888', fontSize: '0.8rem' }}>· {post.createdAt?.seconds ? format(new Date(post.createdAt.seconds * 1000), "M/d HH:mm", { locale: ko }) : ""}</span>
                    </div>

                    <div style={{ fontSize: '0.95rem', lineHeight: '1.5', color: '#333', marginBottom: '12px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {post.content}
                    </div>

                    {post.imageUrl && (
                      <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #eee', maxHeight: '400px', backgroundColor: '#f9f9f9' }}>
                        <img src={post.imageUrl} alt="post" style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: '400px' }} />
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))
          )}
        </main>

        {/* [Right] 주차 필터 -> 모바일에서는 숨김 (.pc-only) */}
        <div className="pc-only" style={{ width: '300px', flexShrink: 0 }}>
          <RightSection 
            weeks={availableWeeks} 
            selectedWeek={selectedWeek} 
            onSelectWeek={setSelectedWeek} 
          />
        </div>

      </div>
      
      {/* [모바일 전용] 하단 네비게이션 (.mobile-only) */}
      <MobileNav onOpenWrite={() => setIsWriteModalOpen(true)} />

      {isWriteModalOpen && (
        <WriteModal onClose={() => setIsWriteModalOpen(false)} />
      )}
    </div>
  );
}