"use client";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { BiHome, BiEdit } from "react-icons/bi"; // BiBell 제거, BiEdit 사용

interface MobileNavProps {
  onOpenWrite: () => void;
  // onOpenNoti는 하단바에서 안 쓰므로 제거해도 됩니다 (props에서도 제외 가능)
  onOpenNoti?: () => void; 
  hasUnread?: boolean;
}

export default function MobileNav({ onOpenWrite }: MobileNavProps) {
  const { user } = useAuth();

  return (
    <div className="mobile-only" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '60px', backgroundColor: 'white', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-evenly', alignItems: 'center', zIndex: 100, paddingBottom: 'safe-area-inset-bottom' }}>
      
      {/* 1. 홈 버튼 */}
      <Link href="/" style={{ color: '#333', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <BiHome size={28} />
      </Link>
      
      {/* 2. 글쓰기 버튼 (PC와 유사한 검은색 스타일) */}
      <div 
        onClick={onOpenWrite} 
        style={{ 
          backgroundColor: '#333', 
          color: 'white', 
          padding: '10px 20px', 
          borderRadius: '30px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px', 
          cursor: 'pointer', 
          boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
          transform: 'translateY(-5px)' // 살짝 위로 띄워서 강조
        }}
      >
        <BiEdit size={20} />
      </div>

      {/* 3. 프로필 버튼 */}
      {user ? (
        <Link href={`/profile/${user.uid}`} style={{ padding: '10px' }}>
          <img 
            src={user.photoURL || '/default-avatar.png'} 
            alt="프로필" 
            style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #ddd' }} 
          />
        </Link>
      ) : (
        <Link href="/login" style={{ fontSize: '0.9rem', color: '#333', fontWeight: 'bold', padding: '10px' }}>
          로그인
        </Link>
      )}
    </div>
  );
}