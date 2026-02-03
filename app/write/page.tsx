"use client";
import { useState } from "react";
import { db, storage } from "@/firebase"; // firebase.ts에서 storage도 import 필요
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getISOWeek, getYear } from "date-fns";

export default function WritePage() {
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !file) return; // 내용이나 파일 둘 중 하나는 있어야 함
    if (!user) return;
    
    setIsUploading(true);

    try {
      let imageUrl = "";

      // 1. 이미지가 있다면 Storage에 먼저 업로드
      if (file) {
        const fileRef = ref(storage, `posts/${user.uid}/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, file);
        imageUrl = await getDownloadURL(fileRef);
      }

      // 2. DB에 글 저장 (이미지 URL 포함)
      const now = new Date();
      const weekId = `${getYear(now)}-W${getISOWeek(now)}`;

      await addDoc(collection(db, "posts"), {
        uid: user.uid,
        authorName: user.displayName,
        authorPhoto: user.photoURL,
        content: content,
        imageUrl: imageUrl, // 이미지 URL 저장
        weekId: weekId,
        createdAt: serverTimestamp(),
      });

      router.push("/"); // 메인으로 이동
    } catch (e) {
      console.error("Error adding document: ", e);
      alert("업로드 실패..");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>소식 남기기</h2>
      
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="이번 주 무슨 일이 있었나요?"
        style={{ width: '100%', height: '150px', padding: '15px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '1rem', resize: 'none' }}
      />
      
      {/* 이미지 미리보기 */}
      {file && (
        <div style={{ marginTop: '10px' }}>
          <p style={{ fontSize: '0.8rem', color: '#666' }}>첨부된 사진:</p>
          <img src={URL.createObjectURL(file)} alt="preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />
        </div>
      )}

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <label style={{ 
            flex: 1, padding: '15px', background: '#eee', borderRadius: '12px', 
            textAlign: 'center', cursor: 'pointer', color: '#333' 
        }}>
          📷 사진 선택
          <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
        </label>

        <button 
          onClick={handleSubmit}
          disabled={isUploading}
          style={{ 
            flex: 2, padding: '15px', background: isUploading ? '#ccc' : '#0070f3', 
            color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold' 
          }}
        >
          {isUploading ? "업로드 중..." : "올리기"}
        </button>
      </div>
    </div>
  );
}