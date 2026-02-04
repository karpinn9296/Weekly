"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, db } from "@/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { BiLogoGoogle, BiArrowBack } from "react-icons/bi";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Firestore에 유저 정보가 없으면 저장 (회원가입 처리)
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: serverTimestamp(),
          customId: user.email?.split("@")[0] || "user", // 이메일 앞부분을 기본 ID로
          bio: "안녕하세요!",
          isAdmin: false,
        });
      }

      // 로그인 성공 시 메인으로 이동
      router.push("/");
    } catch (error) {
      console.error("Login failed", error);
      alert("로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#fff', padding: '20px' }}>
      
      <div style={{ width: '100%', maxWidth: '360px', textAlign: 'center' }}>
        {/* 로고 */}
        <img src="/logo.png" alt="Logo" style={{ width: '60px', marginBottom: '20px' }} />
        
        <h1 style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '10px', color: '#333' }}>
          지금 바로 시작하세요
        </h1>
        <p style={{ color: '#666', marginBottom: '40px' }}>
          나만의 주간 기록을 남기고 공유해보세요.
        </p>

        {/* 구글 로그인 버튼 */}
        <button 
          onClick={handleGoogleLogin} 
          disabled={loading}
          style={{ 
            width: '100%', 
            padding: '14px', 
            borderRadius: '30px', 
            border: '1px solid #ddd', 
            backgroundColor: 'white', 
            color: '#333', 
            fontSize: '1rem', 
            fontWeight: 'bold', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '10px',
            transition: '0.2s',
            boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
          }}
        >
          {loading ? "로그인 중..." : (
            <>
              <BiLogoGoogle size={24} color="#4285F4" />
              Google 계정으로 계속하기
            </>
          )}
        </button>

        <button 
          onClick={() => router.push("/")}
          style={{ marginTop: '20px', background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px', margin: '20px auto' }}
        >
          <BiArrowBack /> 홈으로 돌아가기
        </button>
      </div>
    </div>
  );
}