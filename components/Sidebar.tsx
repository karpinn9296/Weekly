"use client";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { BiHome, BiEdit, BiBell } from "react-icons/bi";

interface SidebarProps {
  onOpenWrite: () => void;
  onOpenNoti: () => void;
  hasUnread?: boolean; // ★ 추가
}

export default function Sidebar({ onOpenWrite, onOpenNoti, hasUnread = false }: SidebarProps) {
  const { user } = useAuth();

  return (
    <div style={{ padding: '20px', height: '100vh', position: 'sticky', top: 0, display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ marginBottom: '30px', paddingLeft: '10px' }}>
        <Link href="/">
          <img src="/logo.png" alt="Weekly Log" style={{ height: '40px', objectFit: 'contain', cursor: 'pointer' }} />
        </Link>
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 15px', fontSize: '1.2rem', fontWeight: 'bold', color: '#333', textDecoration: 'none', borderRadius: '12px' }}>
          <BiHome size={26} /> <span>홈</span>
        </Link>

        {user && (
          <div 
            onClick={onOpenNoti} 
            style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 15px', fontSize: '1.2rem', fontWeight: 'bold', color: '#333', textDecoration: 'none', borderRadius: '12px', cursor: 'pointer', position: 'relative' }}
          >
            <div style={{ position: 'relative' }}>
              <BiBell size={26} />
              {/* ★ 빨간 점 UI */}
              {hasUnread && <span style={{ position: 'absolute', top: 0, right: 0, width: '8px', height: '8px', backgroundColor: '#f91880', borderRadius: '50%', border: '1px solid white' }}></span>}
            </div>
            <span>알림</span>
          </div>
        )}

        {user ? (
          <Link href={`/profile/${user.uid}`} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 15px', fontSize: '1.2rem', fontWeight: 'bold', color: '#333', textDecoration: 'none', borderRadius: '12px' }}>
             <img src={user.photoURL || '/default-avatar.png'} alt="프로필" style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #ddd' }} />
             <span>내 프로필</span>
          </Link>
        ) : (
          <Link href="/login" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 15px', fontSize: '1.2rem', fontWeight: 'bold', color: '#333', textDecoration: 'none', borderRadius: '12px' }}>
            로그인
          </Link>
        )}

        {user && (
          <button 
            onClick={onOpenWrite}
            style={{ marginTop: '30px', width: '100%', padding: '15px 0', borderRadius: '12px', backgroundColor: '#333', color: 'white', border: 'none', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <BiEdit size={20} /> 로그 남기기
          </button>
        )}

      </nav>
    </div>
  );
}