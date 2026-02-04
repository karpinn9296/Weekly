"use client";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { db, storage } from "@/firebase";
import { updateProfile } from "firebase/auth";
import { collection, query, where, orderBy, getDocs, doc, setDoc, getDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter, useParams } from "next/navigation";
import { BiArrowBack, BiCalendar, BiTrash, BiLogOut, BiCamera, BiFolder, BiListUl, BiCheckCircle } from "react-icons/bi";
import { format } from "date-fns";
import ImageCropper from "@/components/ImageCropper";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import WriteModal from "@/components/WriteModal";
import LinkPreview from "@/components/LinkPreview"; // 링크 프리뷰 추가

export default function UserProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const params = useParams();
  const profileId = params?.id as string; 
  
  const isOwner = user?.uid === profileId;

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  // 프로필 데이터
  const [profileData, setProfileData] = useState<any>(null);
  const [name, setName] = useState("");
  const [customId, setCustomId] = useState("");
  const [bio, setBio] = useState("");
  const [isAdmin, setIsAdmin] = useState(false); 
  
  // 이미지 데이터
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [headerBlob, setHeaderBlob] = useState<Blob | null>(null);
  const [headerPreview, setHeaderPreview] = useState(""); 

  // 데이터
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'weekly'>('all');
  const [selectedWeekFilter, setSelectedWeekFilter] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string>("");
  const [cropType, setCropType] = useState<'avatar' | 'header'>('avatar');
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);

  // 데이터 로드
  useEffect(() => {
    if (!profileId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const userDocRef = doc(db, "users", profileId);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfileData(data);
          setName(data.displayName || "이름 없음");
          setCustomId(data.customId || "user");
          setBio(data.bio || "");
          setAvatarPreview(data.photoURL || "/default-avatar.png");
          setHeaderPreview(data.headerUrl || "");
          setIsAdmin(data.isAdmin || false); 
        } else {
           setName("알 수 없는 사용자");
        }

        const q = query(collection(db, "posts"), where("uid", "==", profileId), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMyPosts(posts);

      } catch (error) { console.error("Error fetching profile:", error); }
      setLoading(false);
    };
    fetchData();
  }, [profileId]);

  const weeks = useMemo(() => {
    const uniqueWeeks = Array.from(new Set(myPosts.map(p => p.weekId)));
    return uniqueWeeks.map(weekId => {
      const post = myPosts.find(p => p.weekId === weekId);
      return {
        id: weekId,
        label: post?.weekLabel || weekId,
        count: myPosts.filter(p => p.weekId === weekId).length
      };
    });
  }, [myPosts]);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'header') => {
    if (!isOwner) return; 
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setCropImageSrc(reader.result as string);
        setCropType(type);
        setShowCropper(true);
      });
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const onCropComplete = (croppedBlob: Blob) => {
    const previewUrl = URL.createObjectURL(croppedBlob);
    if (cropType === 'avatar') {
      setAvatarBlob(croppedBlob);
      setAvatarPreview(previewUrl);
    } else {
      setHeaderBlob(croppedBlob);
      setHeaderPreview(previewUrl);
    }
  };

  const handleSave = async () => {
    if (!user || !isOwner) return;
    try {
      let photoURL = profileData?.photoURL || user.photoURL;
      let headerUrl = headerPreview;

      if (avatarBlob) {
        const avatarRef = ref(storage, `profiles/${user.uid}/avatar_${Date.now()}`);
        await uploadBytes(avatarRef, avatarBlob);
        photoURL = await getDownloadURL(avatarRef);
      }
      if (headerBlob) {
        const headerRef = ref(storage, `profiles/${user.uid}/header_${Date.now()}`);
        await uploadBytes(headerRef, headerBlob);
        headerUrl = await getDownloadURL(headerRef);
      }

      const batch = writeBatch(db);

      const userRef = doc(db, "users", user.uid);
      const updateData: any = { 
        displayName: name, 
        photoURL: photoURL, 
        bio, 
        customId, 
        headerUrl, 
        updatedAt: new Date() 
      };
      if (isAdmin) updateData.isAdmin = true;

      batch.set(userRef, updateData, { merge: true });
      await updateProfile(user, { displayName: name, photoURL: photoURL });

      const postsQuery = query(collection(db, "posts"), where("uid", "==", user.uid));
      const postsSnap = await getDocs(postsQuery);

      postsSnap.forEach((postDoc) => {
        batch.update(postDoc.ref, {
          authorName: name,
          authorPhoto: photoURL,
          authorIsAdmin: isAdmin
        });
      });

      await batch.commit();

      setProfileData({ ...profileData, ...updateData });
      setIsEditing(false);
      
      setMyPosts(prev => prev.map(p => ({
        ...p,
        authorName: name,
        authorPhoto: photoURL,
        authorIsAdmin: isAdmin
      })));

    } catch (e) { console.error(e); alert("저장 중 오류가 발생했습니다."); }
  };

  const handleDeletePost = async (postId: string) => {
    if (!isOwner) return;
    if (confirm("정말 삭제하시겠습니까?")) {
      await deleteDoc(doc(db, "posts", postId));
      setMyPosts(prev => prev.filter(p => p.id !== postId));
    }
  };

  const handleLogout = async () => { await logout(); router.push("/"); };

  // URL 처리 함수
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const extractFirstUrl = (text: string) => {
    const match = text.match(urlRegex);
    return match ? match[0] : null;
  };
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

  if (loading) return <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh'}}>로딩 중...</div>;

  const displayPosts = activeTab === 'all' 
    ? myPosts 
    : (selectedWeekFilter ? myPosts.filter(p => p.weekId === selectedWeekFilter) : []);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f5f7f8' }}>
        <div className="mobile-container" style={{ display: 'flex', width: '100%', maxWidth: '1200px', alignItems: 'flex-start' }}>
          
          <div className="pc-only" style={{ width: '260px', flexShrink: 0 }}>
             <Sidebar onOpenWrite={() => setIsWriteModalOpen(true)} />
          </div>

          <div style={{ flex: 1, width: '100%', maxWidth: '640px', background: 'white', minHeight: '100vh', boxShadow: '0 0 20px rgba(0,0,0,0.03)' }}>
            
            <div className="profile-header">
              <button 
                className="mobile-only"
                onClick={() => router.push("/")}
                style={{ 
                  position: 'absolute', top: '15px', left: '15px', zIndex: 50,
                  width: '36px', height: '36px', borderRadius: '50%', border: 'none',
                  backgroundColor: 'rgba(0,0,0,0.5)', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  backdropFilter: 'blur(4px)'
                }}
              >
                <BiArrowBack size={20} />
              </button>
  
              {headerPreview && <img src={headerPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              
              {isOwner && isEditing && (
                <label style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.6)', padding: '10px 20px', borderRadius: '20px', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', zIndex: 20 }}>
                  <BiCamera size={18} style={{marginRight: '5px'}}/> 헤더 변경
                  <input type="file" hidden onChange={(e) => onFileSelect(e, 'header')} accept="image/*" />
                </label>
              )}
  
              <div style={{ 
                position: 'absolute', bottom: '20px', left: '20px', 
                width: '120px', height: '120px',
                borderRadius: '50%', 
                border: '4px solid white', background: 'white', overflow: 'hidden', 
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                zIndex: 10
              }}>
                <img src={avatarPreview || "/default-avatar.png"} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {isOwner && isEditing && (
                  <label style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', cursor: 'pointer', fontSize: '24px' }}>
                    <BiCamera />
                    <input type="file" hidden onChange={(e) => onFileSelect(e, 'avatar')} accept="image/*" />
                  </label>
                )}
              </div>
            </div>
  
            <div style={{ padding: '15px 25px', position: 'relative' }}>
              
              {isOwner && (
                <div style={{ position: 'absolute', top: '15px', right: '25px', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 5 }}>
                  {isEditing ? (
                    <button onClick={handleSave} style={{ padding: '8px 20px', borderRadius: '20px', background: '#333', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}>저장하기</button>
                  ) : (
                    <>
                      <button onClick={handleLogout} style={{ width: '34px', height: '34px', borderRadius: '50%', border: '1px solid #ddd', background: 'white', color: '#d93025', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="로그아웃">
                        <BiLogOut size={18} />
                      </button>
                      <button onClick={() => setIsEditing(true)} style={{ padding: '7px 15px', borderRadius: '20px', border: '1px solid #ddd', background: 'white', fontWeight: 'bold', cursor: 'pointer', color: '#333', fontSize: '0.9rem' }}>
                        프로필 수정
                      </button>
                    </>
                  )}
                </div>
              )}
  
              <div style={{ marginBottom: '20px', marginTop: '10px', paddingRight: '110px' }}>
                {isEditing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="이름" style={{ padding: '10px', fontSize: '1.1rem', fontWeight: 'bold', border: '1px solid #ddd', borderRadius: '8px' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ fontSize: '1rem', color: '#536471' }}>@</span>
                      <input value={customId} onChange={(e) => setCustomId(e.target.value)} placeholder="아이디" style={{ padding: '10px', flex: 1, border: '1px solid #ddd', borderRadius: '8px' }} />
                    </div>
                    <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="자기소개" style={{ padding: '10px', height: '80px', border: '1px solid #ddd', borderRadius: '8px', resize: 'none' }} />
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: '900', margin: 0, color: '#222', lineHeight: '1.2' }}>{name}</h2>
                      {isAdmin && <BiCheckCircle size={20} color="#F4B400" title="관리자 계정" />}
                    </div>
                    <p style={{ color: '#666', margin: '2px 0 12px 0', fontSize: '0.9rem' }}>@{customId}</p>
                    <p style={{ fontSize: '0.95rem', lineHeight: '1.5', whiteSpace: 'pre-wrap', marginBottom: '12px', color: '#333' }}>
                      {bio || "자기소개를 입력해주세요."}
                    </p>
                    
                    <div style={{ display: 'flex', gap: '12px', color: '#888', fontSize: '0.9rem', marginTop: '10px' }}>
                       <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                         <BiListUl /> 
                         <span style={{ fontWeight: 'bold', color: '#333' }}>{myPosts.length}</span> 게시글
                       </span>
                       {isAdmin && (
                         <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#F4B400', fontWeight: 'bold' }}>
                           <BiCheckCircle /> 관리자
                         </span>
                       )}
                    </div>
                  </>
                )}
              </div>
  
              <div style={{ display: 'flex', borderBottom: '1px solid #eee', marginTop: '10px' }}>
                 <div className="tab-item" onClick={() => { setActiveTab('all'); setSelectedWeekFilter(null); }} style={{ borderBottom: activeTab === 'all' ? '3px solid #333' : '3px solid transparent', color: activeTab === 'all' ? '#333' : '#888' }}>
                   <BiListUl size={20} /> <span>전체 글</span>
                 </div>
                 <div className="tab-item" onClick={() => { setActiveTab('weekly'); setSelectedWeekFilter(null); }} style={{ borderBottom: activeTab === 'weekly' ? '3px solid #333' : '3px solid transparent', color: activeTab === 'weekly' ? '#333' : '#888' }}>
                   <BiFolder size={20} /> <span>주차별 기록</span>
                 </div>
              </div>
            </div>
  
            <div style={{ padding: '20px', backgroundColor: '#f9f9f9', minHeight: '300px' }}>
              
              {!loading && activeTab === 'weekly' && !selectedWeekFilter && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                  {weeks.map(week => (
                    <div key={week.id} onClick={() => setSelectedWeekFilter(week.id)} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '16px', cursor: 'pointer', border: '1px solid #eee', boxShadow: '0 2px 5px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      <BiFolder size={32} color="#1d9bf0" />
                      <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>{week.label}</span>
                      <span style={{ fontSize: '0.8rem', color: '#888' }}>{week.count}개의 기록</span>
                    </div>
                  ))}
                  {weeks.length === 0 && <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#888', padding: '20px' }}>기록이 없습니다.</p>}
                </div>
              )}
  
              {!loading && (activeTab === 'all' || selectedWeekFilter) && (
                <>
                  {selectedWeekFilter && (
                    <button onClick={() => setSelectedWeekFilter(null)} style={{ marginBottom: '15px', background: 'none', border: 'none', color: '#1d9bf0', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                      <BiArrowBack style={{ marginRight: '5px' }} /> 목록으로
                    </button>
                  )}
  
                  {displayPosts.length === 0 ? (
                    <p style={{ padding: '40px', textAlign: 'center', color: '#888' }}>작성된 글이 없습니다.</p>
                  ) : (
                    displayPosts.map(post => {
                      const firstUrl = extractFirstUrl(post.content);
                      
                      return (
                        <article key={post.id} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', position: 'relative', border: '1px solid #eee' }}>
                          <div style={{ display: 'flex', gap: '15px' }}>
                            <img src={post.authorPhoto || "/default-avatar.png"} style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #eee' }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                
                                {post.authorIsAdmin && <BiCheckCircle size={16} color="#F4B400" title="관리자" />} 
                                <span style={{ fontWeight: 'bold', fontSize: '1rem', color: '#333' }}>{post.authorName}</span>
                                
                                <span style={{ color: '#999', fontSize: '0.85rem' }}>· {post.weekLabel || post.weekId}</span>
                              </div>
                              <div style={{ whiteSpace: 'pre-wrap', marginBottom: '15px', lineHeight: '1.6', color: '#333' }}>
                                {renderContentWithLinks(post.content)}
                              </div>
                              
                              {/* 링크 프리뷰 추가 */}
                              {firstUrl && <LinkPreview url={firstUrl} />}

                              {post.imageUrl && (
                                <div style={{ marginTop: '15px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #f0f0f0', maxHeight: '500px', backgroundColor: '#f9f9f9' }}>
                                  <img src={post.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: '500px' }} />
                                </div>
                              )}
                            </div>
                          </div>
                          {isOwner && (
                            <button onClick={() => handleDeletePost(post.id)} style={{ position: 'absolute', top: '15px', right: '15px', border: 'none', background: 'none', color: '#ddd', cursor: 'pointer', padding: '5px' }}><BiTrash size={18} /></button>
                          )}
                        </article>
                      );
                    })
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <MobileNav onOpenWrite={() => setIsWriteModalOpen(true)} />
  
      {showCropper && (
        <ImageCropper imageSrc={cropImageSrc} aspect={cropType === 'avatar' ? 1 : 3} cropShape={cropType === 'avatar' ? 'round' : 'rect'} onCropComplete={onCropComplete} onClose={() => setShowCropper(false)} />
      )}
      
      {isWriteModalOpen && <WriteModal onClose={() => setIsWriteModalOpen(false)} />}
    </>
  );
}