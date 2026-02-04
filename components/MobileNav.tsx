"use client";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { BiHomeCircle, BiUser, BiEdit, BiLogIn } from "react-icons/bi";

export default function MobileNav({ onOpenWrite }: { onOpenWrite: () => void }) {
  const { user, googleLogin } = useAuth();

  return (
    <div className="mobile-only" style={{
      position: 'fixed', bottom: 0, left: 0, width: '100%', 
      backgroundColor: 'white', borderTop: '1px solid #eee',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      padding: '12px 0', zIndex: 100, boxShadow: '0 -2px 10px rgba(0,0,0,0.03)'
    }}>
      {/* 홈 */}
      <Link href="/" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#333' }}>
        <BiHomeCircle size={24} />
        <span style={{ fontSize: '0.7rem', marginTop: '2px' }}>홈</span>
      </Link>

      {/* 글쓰기 (중앙 강조) */}
      {user && (
        <button 
          onClick={onOpenWrite}
          style={{ 
            background: '#333', color: 'white', border: 'none', borderRadius: '50%', 
            width: '45px', height: '45px', display: 'flex', justifyContent: 'center', alignItems: 'center',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)', marginBottom: '5px'
          }}
        >
          <BiEdit size={22} />
        </button>
      )}

      {/* 프로필 or 로그인 */}
        {user ? (
          // 기존: <Link href="/profile" ... >
          // 수정: 여기도 똑같이 user.uid를 붙여줍니다.
          <Link href={`/profile/${user.uid}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#333' }}>
            <img 
              src={user.photoURL || ''} 
              alt="프로필" 
              style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #ddd' }} 
            />
            <span style={{ fontSize: '0.7rem', marginTop: '2px' }}>프로필</span>
          </Link>
        ) : (
        <button onClick={googleLogin} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#333' }}>
          <BiLogIn size={24} />
          <span style={{ fontSize: '0.7rem', marginTop: '2px' }}>로그인</span>
        </button>
      )}
    </div>
  );
}