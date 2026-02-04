"use client";
import Link from "next/link";
import { BiX } from "react-icons/bi";

interface LikesListModalProps {
  likes: any[]; // 좋아요 누른 유저 정보 배열 ({uid, photoURL, displayName})
  onClose: () => void;
}

export default function LikesListModal({ likes, onClose }: LikesListModalProps) {
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000 }}>
      <div style={{ backgroundColor: 'white', width: '90%', maxWidth: '360px', borderRadius: '16px', padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>좋아요 한 사람</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><BiX size={24} /></button>
        </div>

        {likes.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#888', padding: '20px' }}>아직 좋아요가 없습니다.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {likes.map((user: any, index: number) => (
              <li key={user.uid || index} style={{ borderBottom: '1px solid #eee' }}>
                <Link href={`/profile/${user.uid}`} onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', textDecoration: 'none', color: '#333' }}>
                  <img src={user.photoURL || "/default-avatar.png"} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #eee' }} />
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{user.displayName || "알 수 없는 사용자"}</div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}