"use client";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { BiHome, BiPencil, BiBell } from "react-icons/bi";

interface MobileNavProps {
  onOpenWrite: () => void;
  onOpenNoti: () => void;
  hasUnread?: boolean; // ★ 추가
}

export default function MobileNav({ onOpenWrite, onOpenNoti, hasUnread = false }: MobileNavProps) {
  const { user } = useAuth();

  return (
    <div className="mobile-only" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '60px', backgroundColor: 'white', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 100 }}>
      
      <Link href="/" style={{ color: '#333', padding: '10px' }}>
        <BiHome size={24} />
      </Link>
      
      <div onClick={user ? onOpenNoti : undefined} style={{ cursor:'pointer', color: user ? '#333' : '#ddd', padding: '10px', position: 'relative' }}>
        <BiBell size={24} />
        {/* ★ 빨간 점 UI */}
        {user && hasUnread && (
           <span style={{ position: 'absolute', top: '10px', right: '12px', width: '6px', height: '6px', backgroundColor: '#f91880', borderRadius: '50%' }}></span>
        )}
      </div>

      <div onClick={onOpenWrite} style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#1d9bf0', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', cursor: 'pointer', marginBottom: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
        <BiPencil size={20} />
      </div>

      {user ? (
        <Link href={`/profile/${user.uid}`} style={{ padding: '10px' }}>
          <img src={user.photoURL || '/default-avatar.png'} alt="프로필" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #ddd' }} />
        </Link>
      ) : (
        <Link href="/login" style={{ fontSize: '0.8rem', color: '#333', fontWeight: 'bold', padding: '10px' }}>
          로그인
        </Link>
      )}
    </div>
  );
}