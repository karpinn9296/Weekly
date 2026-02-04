"use client";
import { useEffect, useState } from "react";
import { db } from "@/firebase";
import { collection, query, where, orderBy, onSnapshot, writeBatch, getDocs } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { BiX, BiHeart } from "react-icons/bi";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface NotificationModalProps {
  onClose: () => void;
}

export default function NotificationModal({ onClose }: NotificationModalProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);

  // 1. 알림 목록 불러오기
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "notifications"),
      where("recipientUid", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotis = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(newNotis);
    });
    return () => unsubscribe();
  }, [user]);

  // ★ 2. 창이 열리면 '읽지 않은 알림'을 모두 '읽음'으로 변경 (배치 업데이트)
  useEffect(() => {
    if (!user) return;

    const markAsRead = async () => {
      // 안 읽은 것만 가져오기
      const q = query(
        collection(db, "notifications"),
        where("recipientUid", "==", user.uid),
        where("read", "==", false)
      );
      
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const batch = writeBatch(db);
        snapshot.docs.forEach((doc) => {
          batch.update(doc.ref, { read: true });
        });
        await batch.commit(); // 한 번에 업데이트 (빨간 점 사라짐)
      }
    };

    markAsRead();
  }, [user]);

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
      <div style={{ backgroundColor: 'white', width: '90%', maxWidth: '400px', borderRadius: '16px', padding: '20px', maxHeight: '80vh', overflowY: 'auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>알림</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><BiX size={24} /></button>
        </div>

        {notifications.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#888', padding: '20px' }}>새로운 알림이 없습니다.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {notifications.map((noti) => (
              <li key={noti.id} style={{ display: 'flex', gap: '10px', padding: '10px', borderBottom: '1px solid #eee', alignItems: 'center', backgroundColor: noti.read ? 'white' : '#f0f9ff' }}>
                <div style={{ position: 'relative' }}>
                  <img src={noti.senderPhoto || "/default-avatar.png"} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                  {noti.type === 'like' && (
                    <div style={{ position: 'absolute', bottom: -2, right: -2, backgroundColor: '#f91880', borderRadius: '50%', padding: '3px', display:'flex' }}>
                      <BiHeart size={10} color="white" />
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem' }}>
                    <strong>{noti.senderName}</strong>님이 회원님의 기록을 좋아합니다.
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '4px' }}>
                    {noti.createdAt?.seconds ? format(new Date(noti.createdAt.seconds * 1000), "M월 d일 a h:mm", { locale: ko }) : "방금 전"}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}