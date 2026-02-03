"use client";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { BiHomeCircle, BiLogIn, BiEdit } from "react-icons/bi";

export default function Sidebar({ onOpenWrite }: { onOpenWrite: () => void }) {
  const { user, googleLogin } = useAuth();

  return (
    // position: sticky로 변경하여 부모 영역 안에서만 따라오도록 설정
    <div style={{ position: 'sticky', top: 0, height: '100vh', padding: '30px 10px', display: 'flex', flexDirection: 'column' }}>
      
      {/* 로고 */}
      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '30px', paddingLeft: '10px', color: '#333' }}>
        Weekly
      </div>

      {/* 메뉴 */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Link href="/" style={{ 
          display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 15px', 
          fontSize: '1.1rem', fontWeight: '600', color: '#444', textDecoration: 'none',
          borderRadius: '12px', transition: 'background 0.2s'
        }}>
          <BiHomeCircle size={26} />
          <span>홈</span>
        </Link>
        
        {user ? (
          <Link href="/profile" style={{ 
            display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 15px', 
            fontSize: '1.1rem', fontWeight: '600', color: '#444', textDecoration: 'none',
            borderRadius: '12px'
          }}>
            <img 
              src={user.photoURL || ''} 
              alt="프로필" 
              style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #ddd' }} 
            />
            <span>내 프로필</span>
          </Link>
        ) : (
          <button 
            onClick={googleLogin}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 15px', 
              fontSize: '1.1rem', fontWeight: '600', color: '#444', 
              background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
              borderRadius: '12px'
            }}
          >
            <BiLogIn size={26} />
            <span>로그인</span>
          </button>
        )}
      </nav>

      {/* 로그 남기기 버튼 */}
      {user && (
        <button 
          onClick={onOpenWrite}
          style={{ 
            marginTop: '30px', 
            width: '100%', 
            padding: '15px 0', 
            borderRadius: '12px', 
            backgroundColor: '#333', 
            color: 'white', 
            border: 'none', 
            fontSize: '1rem', 
            fontWeight: 'bold', 
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.15)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
          }}
        >
          <BiEdit size={20} /> 로그 남기기
        </button>
      )}
    </div>
  );
}