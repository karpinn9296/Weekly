"use client";
import { useState, useEffect } from "react";
import { db, storage } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/context/AuthContext";
import { getISOWeek, getWeekOfMonth, getYear, getMonth } from "date-fns";
import { BiX, BiImageAdd } from "react-icons/bi";

export default function WriteModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // 붙여넣기 감지 핸들러
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const blob = items[i].getAsFile();
        if (blob) setFile(blob);
        e.preventDefault(); // 이미지가 텍스트로 들어가는 것 방지
        break;
      }
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !file) return;
    if (!user) return;
    setIsUploading(true);

    try {
      const now = new Date();
      const year = getYear(now);
      const month = getMonth(now) + 1; 
      const weekOfMonth = getWeekOfMonth(now); 
      const weekId = `${year}-${month}월-${weekOfMonth}주차`;

      let imageUrl = "";
      if (file) {
        const fileRef = ref(storage, `posts/${user.uid}/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, file);
        imageUrl = await getDownloadURL(fileRef);
      }

      await addDoc(collection(db, "posts"), {
        uid: user.uid,
        authorName: user.displayName,
        authorPhoto: user.photoURL,
        content: content,
        imageUrl: imageUrl,
        weekId: weekId,
        weekLabel: `${month}월 ${weekOfMonth}주차`,
        createdAt: serverTimestamp(),
      });

      onClose();
    } catch (e) {
      console.error(e);
      alert("업로드 실패");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(3px)'
    }} onClick={onClose}>
      <div 
        onClick={(e) => e.stopPropagation()} 
        style={{
          backgroundColor: 'white', width: '600px', maxWidth: '90%', borderRadius: '20px',
          padding: '25px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#333' }}>새로운 로그</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}><BiX size={28} /></button>
        </div>

        <div style={{ display: 'flex', gap: '15px' }}>
          <img src={user?.photoURL || ''} style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #eee' }} />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onPaste={handlePaste} // 붙여넣기 이벤트 연결
            placeholder="무슨 일이 있었나요? (이미지를 붙여넣을 수 있어요)"
            style={{ 
              flex: 1, height: '120px', border: 'none', resize: 'none', 
              fontSize: '1.1rem', outline: 'none', fontFamily: 'inherit', lineHeight: '1.5'
            }}
          />
        </div>

        {file && (
          <div style={{ marginLeft: '60px', marginTop: '10px', position: 'relative', width: 'fit-content' }}>
            <img src={URL.createObjectURL(file)} style={{ maxHeight: '250px', borderRadius: '12px', border: '1px solid #eee' }} />
            <button 
              onClick={() => setFile(null)}
              style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer' }}
            >
              <BiX />
            </button>
          </div>
        )}

        <hr style={{ border: 'none', borderTop: '1px solid #f0f0f0', margin: '20px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ cursor: 'pointer', color: '#555', padding: '10px', borderRadius: '50%', transition: 'background 0.2s' }}>
            <BiImageAdd size={24} />
            <input type="file" accept="image/*" onChange={(e) => e.target.files && setFile(e.target.files[0])} style={{ display: 'none' }} />
          </label>
          
          <button 
            onClick={handleSubmit}
            disabled={isUploading}
            style={{ 
              padding: '10px 24px', borderRadius: '20px', 
              backgroundColor: isUploading ? '#ccc' : '#333', color: 'white', 
              border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem'
            }}
          >
            {isUploading ? "게시 중..." : "게시하기"}
          </button>
        </div>
      </div>
    </div>
  );
}