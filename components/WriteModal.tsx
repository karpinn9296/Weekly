"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { addDoc, collection } from "firebase/firestore";
import { db, storage } from "@/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { BiImageAdd, BiX, BiLoaderAlt } from "react-icons/bi";

interface WriteModalProps {
  onClose: () => void;
}

export default function WriteModal({ onClose }: WriteModalProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !imageFile) return;
    if (!user) return;

    setIsSubmitting(true);
    try {
      // 주차 계산
      const now = new Date();
      const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
      const pastDays = (now.getTime() - firstDayOfYear.getTime()) / 86400000;
      const weekNum = Math.ceil((pastDays + firstDayOfYear.getDay() + 1) / 7);
      const weekLabel = `${now.getMonth() + 1}월 ${Math.ceil(now.getDate() / 7)}주차`;
      const weekId = `${now.getFullYear()}-W${weekNum}`;

      let imageUrl = "";
      if (imageFile) {
        const storageRef = ref(storage, `posts/${user.uid}/${Date.now()}_${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, "posts"), {
        content,
        imageUrl,
        createdAt: now,
        uid: user.uid,
        authorName: user.displayName || "이름 없음",
        authorPhoto: user.photoURL || "",
        authorIsAdmin: false, // 추후 프로필 수정 시 일괄 업데이트됨
        weekId,
        weekLabel,
      });

      onClose();
    } catch (error) {
      console.error(error);
      alert("업로드 실패");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'white', width: '90%', maxWidth: '500px', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '90vh', overflowY: 'auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>기록 남기기</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><BiX size={24} /></button>
        </div>

        {/* 입력창 */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="이번 주는 어떤 일이 있었나요? (URL을 입력하면 게시글에서 자동으로 카드가 생성됩니다)"
          style={{ width: '100%', height: '150px', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', resize: 'none', fontSize: '1rem', fontFamily: 'inherit' }}
        />

        {/* 이미지 미리보기 (업로드할 사진만 표시) */}
        {imagePreview && (
           <div style={{ marginTop: '5px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd', position: 'relative' }}>
             <img src={imagePreview} alt="preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }} />
             <button onClick={() => { setImageFile(null); setImagePreview(""); }} style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.6)', color: 'white', borderRadius: '50%', border: 'none', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BiX /></button>
           </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
          <label style={{ cursor: 'pointer', color: '#1d9bf0', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <BiImageAdd size={24} />
            <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>사진 추가</span>
            <input type="file" accept="image/*" hidden onChange={handleImageChange} />
          </label>

          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting || (!content.trim() && !imageFile)}
            style={{ 
              padding: '10px 24px', borderRadius: '20px', border: 'none', 
              backgroundColor: isSubmitting || (!content.trim() && !imageFile) ? '#ccc' : '#1d9bf0', 
              color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'
            }}
          >
            {isSubmitting && <BiLoaderAlt className="spinner" />}
            기록하기
          </button>
        </div>

      </div>
      
      <style jsx>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spinner { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}