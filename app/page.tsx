"use client";
import { useEffect, useState } from "react";
import { db } from "@/firebase";
import { collection, query, orderBy, onSnapshot, updateDoc, doc, getDoc, addDoc, where } from "firebase/firestore";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import Link from "next/link";
import { BiCheckCircle, BiHeart, BiSolidHeart, BiBell } from "react-icons/bi";
import Sidebar from "@/components/Sidebar";
import RightSection from "@/components/RightSection";
import WriteModal from "@/components/WriteModal";
import MobileNav from "@/components/MobileNav"; 
import LinkPreview from "@/components/LinkPreview";
import NotificationModal from "@/components/NotificationModal";
import LikesListModal from "@/components/LikesListModal"; // ★ 추가됨
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<string>("all");
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([]);
  const [weekLabels, setWeekLabels] = useState<Record<string, string>>({});
  
  const [hasUnread, setHasUnread] = useState(false);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [isNotiModalOpen, setIsNotiModalOpen] = useState(false);
  
  // ★ 추가: 좋아요 명단 모달 상태
  const [isLikesModalOpen, setIsLikesModalOpen] = useState(false);
  const [currentLikesList, setCurrentLikesList] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(newPosts);
      
      const weeks = Array.from(new Set(newPosts.map((p: any) => p.weekId))).sort().reverse();
      setAvailableWeeks(weeks as string[]);

      const labels: Record<string, string> = {};
      newPosts.forEach((p: any) => {
        labels[p.weekId] = p.weekLabel || p.weekId;
      });
      setWeekLabels(labels);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "notifications"), where("recipientUid", "==", user.uid), where("read", "==", false));
    const unsubscribe = onSnapshot(q, (snapshot) => { setHasUnread(!snapshot.empty); });
    return () => unsubscribe();
  }, [user]);

  // ★ 좋아요 처리 함수 (객체 저장 방식으로 변경)
  const handleLike = async (post: any) => {
    if (!user) return alert("로그인이 필요합니다!");
    
    const postRef = doc(db, "posts", post.id);
    const postSnap = await getDoc(postRef); // 최신 상태 가져오기 (안전한 업데이트 위해)
    
    if (!postSnap.exists()) return;

    const currentData = postSnap.data();
    const currentLikes = currentData.likes || [];

    // 이미 좋아요 눌렀는지 확인 (문자열 UID일 수도 있고, 객체일 수도 있음 - 호환성 유지)
    const existingIndex = currentLikes.findIndex((like: any) => 
      (typeof like === 'string' ? like === user.uid : like.uid === user.uid)
    );

    let newLikes = [...currentLikes];

    if (existingIndex !== -1) {
      // 좋아요 취소 (제거)
      newLikes.splice(existingIndex, 1);
    } else {
      // 좋아요 추가 (내 정보 전체 저장)
      newLikes.push({
        uid: user.uid,
        displayName: user.displayName || "이름 없음",
        photoURL: user.photoURL || ""
      });

      // 알림 전송
      if (post.uid !== user.uid) {
        await addDoc(collection(db, "notifications"), {
          recipientUid: post.uid,
          senderUid: user.uid,
          senderName: user.displayName || "알 수 없음",
          senderPhoto: user.photoURL,
          postId: post.id,
          type: 'like',
          createdAt: new Date(),
          read: false
        });
      }
    }

    // 통째로 업데이트 (ArrayRemove는 객체 일치 까다로우므로 덮어쓰기 방식 사용)
    await updateDoc(postRef, { likes: newLikes });
  };

  // ★ 좋아요 명단 열기
  const openLikesModal = (likes: any[]) => {
    // 문자열(구버전 데이터)인 경우 가짜 객체로 변환해서 보여줌
    const normalizedLikes = likes.map(like => 
      typeof like === 'string' ? { uid: like, displayName: "알 수 없음", photoURL: null } : like
    );
    setCurrentLikesList(normalizedLikes);
    setIsLikesModalOpen(true);
  };

  const filteredPosts = selectedWeek === "all" ? posts : posts.filter(p => p.weekId === selectedWeek);
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const extractFirstUrl = (text: string) => { const match = text.match(urlRegex); return match ? match[0] : null; };
  const renderContentWithLinks = (text: string) => {
    return text.split(urlRegex).map((part, index) => {
      if (part.match(urlRegex)) return <a key={index} href={part} target="_blank" rel="noopener noreferrer" style={{ color: '#1d9bf0', textDecoration: 'none' }} onClick={(e) => e.stopPropagation()}>{part}</a>;
      return part;
    });
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f5f7f8' }}>
      <div className="mobile-container" style={{ display: 'flex', width: '100%', maxWidth: '1200px' }}>
        
        <div className="pc-only" style={{ width: '260px', flexShrink: 0 }}>
          <Sidebar onOpenWrite={() => setIsWriteModalOpen(true)} onOpenNoti={() => setIsNotiModalOpen(true)} hasUnread={hasUnread} />
        </div>

        <main style={{ flex: 1, padding: '20px', maxWidth: '640px', width: '100%' }}>
          
          <div style={{ marginBottom: '20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#222' }}>
              {selectedWeek === 'all' ? '전체 타임라인' : (weekLabels[selectedWeek] || selectedWeek)}
            </h2>
            <button className="mobile-only" onClick={() => setIsNotiModalOpen(true)} style={{ background:'none', border:'none', cursor:'pointer', position: 'relative' }}>
               <BiBell size={24} color="#333" />
               {hasUnread && <span style={{ position: 'absolute', top: 0, right: 0, width: '8px', height: '8px', backgroundColor: '#f91880', borderRadius: '50%' }}></span>}
            </button>
          </div>

          <div className="mobile-only horizontal-scroll" style={{marginBottom: '20px'}}>
             <button onClick={() => setSelectedWeek('all')} style={{ whiteSpace: 'nowrap', padding: '8px 16px', borderRadius: '20px', border: 'none', backgroundColor: selectedWeek === 'all' ? '#333' : 'white', color: selectedWeek === 'all' ? 'white' : '#555', fontWeight: 'bold', fontSize: '0.9rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>전체</button>
             {availableWeeks.map(week => (
               <button key={week} onClick={() => setSelectedWeek(week)} style={{ whiteSpace: 'nowrap', padding: '8px 16px', borderRadius: '20px', border: 'none', backgroundColor: selectedWeek === week ? '#333' : 'white', color: selectedWeek === week ? 'white' : '#555', fontWeight: 'bold', fontSize: '0.9rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>{weekLabels[week] || week}</button>
             ))}
          </div>

          {filteredPosts.length === 0 ? (
             <div style={{ textAlign: 'center', padding: '50px', color: '#888' }}>표시할 로그가 없습니다.</div>
          ) : (
            filteredPosts.map((post) => {
              const firstUrl = extractFirstUrl(post.content);
              const likes = post.likes || [];
              const isLiked = likes.some((like: any) => (typeof like === 'string' ? like === user?.uid : like.uid === user?.uid));
              
              // ★ 좋아요 누른 사람 프사 추출 (최대 3명)
              const likeAvatars = likes.slice(0, 3).map((l: any) => typeof l === 'string' ? null : l.photoURL).filter(Boolean);

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
                      
                      <div style={{ whiteSpace: 'pre-wrap', marginBottom: '10px', lineHeight: '1.6', color: '#333', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                        {renderContentWithLinks(post.content)}
                      </div>
                      
                      {firstUrl && <LinkPreview url={firstUrl} />}

                      {post.imageUrl && (
                        <div style={{ marginTop: '15px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #cfd9de', maxHeight: '500px' }}>
                          <img src={post.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: '500px' }} />
                        </div>
                      )}

                      {/* ★ 좋아요 섹션 (버튼 + 프로필 겹치기) */}
                      <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button 
                          onClick={() => handleLike(post)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', padding: '5px', color: isLiked ? '#f91880' : '#536471' }}
                        >
                          {isLiked ? <BiSolidHeart size={20} /> : <BiHeart size={20} />}
                          <span style={{ fontSize: '0.9rem' }}>{likes.length || 0}</span>
                        </button>

                        {/* 좋아요 누른 사람 프사 표시 */}
                        {likes.length > 0 && (
                          <div 
                            onClick={() => openLikesModal(likes)}
                            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                          >
                            {likeAvatars.map((url: string, i: number) => (
                              <img 
                                key={i} 
                                src={url || "/default-avatar.png"} 
                                alt="like user"
                                style={{ 
                                  width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', border: '2px solid white', 
                                  marginLeft: i === 0 ? 0 : '-8px' // ★ 겹쳐 보이게 하는 핵심
                                }} 
                              />
                            ))}
                          </div>
                        )}
                      </div>

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
      
      <MobileNav onOpenWrite={() => setIsWriteModalOpen(true)} onOpenNoti={() => setIsNotiModalOpen(true)} hasUnread={hasUnread} />
      {isWriteModalOpen && <WriteModal onClose={() => setIsWriteModalOpen(false)} />}
      {isNotiModalOpen && <NotificationModal onClose={() => setIsNotiModalOpen(false)} />}
      {/* ★ 좋아요 모달 추가 */}
      {isLikesModalOpen && <LikesListModal likes={currentLikesList} onClose={() => setIsLikesModalOpen(false)} />}
    </div>
  );
}