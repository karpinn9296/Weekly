"use client";
import { useState } from "react";
import { db } from "@/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore"; // doc, getDoc 추가
import { useAuth } from "@/context/AuthContext";
import { BiX, BiLoaderAlt, BiImageAdd } from "react-icons/bi";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { startOfWeek, addDays, getISOWeek, getYear } from "date-fns";

interface WriteModalProps {
  onClose: () => void;
}

export default function WriteModal({ onClose }: WriteModalProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // 주차 계산 함수 (목요일 기준)
  const getWeekInfo = (date: Date) => {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const thursday = addDays(weekStart, 3);
    const month = thursday.getMonth() + 1;
    const year = thursday.getFullYear();

    const firstDayOfMonth = new Date(year, month - 1, 1);
    let targetDate = new Date(firstDayOfMonth);
    while (targetDate.getDay() !== 4) {
      targetDate.setDate(targetDate.getDate() + 1);
    }
    const firstThursday = targetDate;
    const diffDate = thursday.getTime() - firstThursday.getTime();
    const weekNo = Math.floor(diffDate / (1000 * 60 * 60 * 24 * 7)) + 1;

    const weekId = `${getYear(thursday)}-W${getISOWeek(date)}`;
    const weekLabel = `${month}월 ${weekNo}주차`;

    return { weekId, weekLabel };
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    if (!user) return alert("로그인이 필요합니다.");

    setIsSubmitting(true);

    try {
      // 1. 이미지 업로드 처리
      let imageUrl = null;
      if (imageFile) {
        const storage = getStorage();
        const storageRef = ref(storage, `posts/${user.uid}/${Date.now()}_${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      // 2. 주차 정보 계산
      const { weekId, weekLabel } = getWeekInfo(new Date());

      // ★ 3. 관리자 여부 확인 (DB에서 최신 정보 가져오기)
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      const isAdmin = userDocSnap.exists() ? userDocSnap.data().isAdmin : false;

      // 4. 게시글 저장
      await addDoc(collection(db, "posts"), {
        content,
        imageUrl,
        createdAt: serverTimestamp(),
        uid: user.uid,
        authorName: user.displayName || "익명",
        authorPhoto: user.photoURL,
        authorIsAdmin: isAdmin, // ★ 확인된 실제 관리자 권한 저장
        weekId,
        weekLabel,
        likes: []
      });

      onClose();
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("업로드 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'white', width: '90%', maxWidth: '500px', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>로그 남기기</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <BiX size={24} />
          </button>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="이번 주는 어떤 일이 있었나요?"
          style={{ width: '100%', height: '150px', padding: '15px', borderRadius: '12px', border: '1px solid #eee', resize: 'none', fontSize: '1rem', outline: 'none', backgroundColor: '#f9f9f9' }}
        />

        {previewUrl && (
          <div style={{ marginTop: '15px', position: 'relative' }}>
            <img src={previewUrl} alt="Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '12px' }} />
            <button 
              onClick={() => { setImageFile(null); setPreviewUrl(null); }}
              style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <BiX />
            </button>
          </div>
        )}

        <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', color: '#1d9bf0', fontWeight: 'bold' }}>
            <BiImageAdd size={24} />
            <span style={{ fontSize: '0.9rem' }}>사진 추가</span>
            <input type="file" accept="image/*" hidden onChange={handleImageChange} />
          </label>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !content.trim()}
            style={{ 
              backgroundColor: content.trim() ? '#1d9bf0' : '#8ecdf8', 
              color: 'white', 
              padding: '10px 20px', 
              borderRadius: '20px', 
              border: 'none', 
              fontWeight: 'bold', 
              cursor: content.trim() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', gap: '5px'
            }}
          >
            {isSubmitting ? <><BiLoaderAlt className="spinner" /> 업로드 중...</> : "로깅하기"}
          </button>
        </div>

      </div>
      <style jsx>{`
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}