"use client";
import { useEffect, useState } from "react";
import { db } from "@/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import Link from "next/link";
import { BiCheckCircle } from "react-icons/bi"; 
import Sidebar from "@/components/Sidebar";
import RightSection from "@/components/RightSection";
import WriteModal from "@/components/WriteModal";
import MobileNav from "@/components/MobileNav"; 
import LinkPreview from "@/components/LinkPreview"; // 링크 미리보기 컴포넌트

export default function Home() {
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<string>("all");
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([]);
  // 주차 ID와 한글 이름을 연결해주는 지도(Map)
  const [weekLabels, setWeekLabels] = useState<Record<string, string>>({});

  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(newPosts);
      
      const weeks = Array.from(new Set(newPosts.map((p: any) => p.weekId))).sort().reverse();
      setAvailableWeeks(weeks as string[]);

      // 게시글들에서 주차 이름 정보를 수집
      const labels: Record<string, string> = {};
      newPosts.forEach((p: any) => {
        if (p.weekLabel) {
            labels[p.weekId] = p.weekLabel; 
        } else {
            labels[p.weekId] = p.weekId; 
        }
      });
      setWeekLabels(labels);
    });
    return () => unsubscribe();
  }, []);

  const filteredPosts = selectedWeek === "all" ? posts : posts.filter(p => p.weekId === selectedWeek);

  // URL 찾는 정규식
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  // 첫 번째 링크만 추출 (카드 표시용)
  const extractFirstUrl = (text: string) => {
    const match = text.match(urlRegex);
    return match ? match[0] : null;
  };

  // 본문 내용을 파란색 링크로 바꿔주는 함수
  const renderContentWithLinks = (text: string) => {
    return text.split(urlRegex).map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a key={index} href={part} target="_blank" rel="noopener noreferrer" style={{ color: '#1d9bf0', textDecoration: 'none' }} onClick={(e) => e.stopPropagation()}>
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f5f7f8' }}>
      
      <div className="mobile-container" style={{ display: 'flex', width: '100%', maxWidth: '1200px', alignItems: 'flex-start' }}>
        
        <div className="pc-only" style={{ width: '260px', flexShrink: 0 }}>
          <Sidebar onOpenWrite={() => setIsWriteModalOpen(true)} />
        </div>

        <main style={{ flex: 1, padding: '20px', maxWidth: '640px', width: '100%' }}>
          
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#222', marginBottom: '10px' }}>
              {selectedWeek === 'all' ? '전체 타임라인' : (weekLabels[selectedWeek] || selectedWeek)}
            </h2>

            <div className="mobile-only horizontal-scroll">
              <button onClick={() => setSelectedWeek('all')} style={{ whiteSpace: 'nowrap', padding: '8px 16px', borderRadius: '20px', border: 'none', backgroundColor: selectedWeek === 'all' ? '#333' : 'white', color: selectedWeek === 'all' ? 'white' : '#555', fontWeight: 'bold', fontSize: '0.9rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                전체
              </button>
              {availableWeeks.map(week => (
                <button key={week} onClick={() => setSelectedWeek(week)} style={{ whiteSpace: 'nowrap', padding: '8px 16px', borderRadius: '20px', border: 'none', backgroundColor: selectedWeek === week ? '#333' : 'white', color: selectedWeek === week ? 'white' : '#555', fontWeight: 'bold', fontSize: '0.9rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  {weekLabels[week] || week}
                </button>
              ))}
            </div>
          </div>

          {filteredPosts.length === 0 ? (
             <div style={{ textAlign: 'center', padding: '50px', color: '#888' }}>표시할 기록이 없습니다.</div>
          ) : (
            filteredPosts.map((post) => {
              const firstUrl = extractFirstUrl(post.content);
              
              return (
                <article key={post.id} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', position: 'relative', border: '1px solid #eee' }}>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <Link href={`/profile/${post.uid}`} style={{ flexShrink: 0 }}>
                        <img src={post.authorPhoto || "/default-avatar.png"} style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #eee', cursor: 'pointer' }} />
                    </Link>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <Link href={`/profile/${post.uid}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {post.authorIsAdmin && <BiCheckCircle size={16} color="#F4B400" title="관리자" />} 
                            <span style={{ fontWeight: 'bold', fontSize: '1rem', color: '#333' }}>{post.authorName}</span>
                        </Link>
                        <span style={{ color: '#999', fontSize: '0.85rem' }}>· {post.weekLabel || weekLabels[post.weekId] || post.weekId}</span>
                        <span style={{ color: '#888', fontSize: '0.8rem' }}>· {post.createdAt?.seconds ? format(new Date(post.createdAt.seconds * 1000), "M/d HH:mm", { locale: ko }) : ""}</span>
                      </div>
                      <div style={{ whiteSpace: 'pre-wrap', marginBottom: '10px', lineHeight: '1.6', color: '#333' }}>
                        {renderContentWithLinks(post.content)}
                      </div>
                      
                      {/* 링크 미리보기 (오픈 그래프 카드) */}
                      {firstUrl && <LinkPreview url={firstUrl} />}

                      {/* 사용자가 올린 이미지 */}
                      {post.imageUrl && (
                        <div style={{ marginTop: '15px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #cfd9de', maxHeight: '500px' }}>
                          <img src={post.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: '500px' }} />
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </main>

        <div className="pc-only" style={{ width: '300px', flexShrink: 0 }}>
          <RightSection weeks={availableWeeks} weekLabels={weekLabels} selectedWeek={selectedWeek} onSelectWeek={setSelectedWeek} />
        </div>

      </div>
      
      <MobileNav onOpenWrite={() => setIsWriteModalOpen(true)} />
      {isWriteModalOpen && <WriteModal onClose={() => setIsWriteModalOpen(false)} />}
    </div>
  );
}