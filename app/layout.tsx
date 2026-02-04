import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Metadata, Viewport } from "next"; // Viewport 추가

export const metadata: Metadata = {
  title: "Weekly",
  description: "",
  manifest: "/manifest.json", // 매니페스트 연결
  icons: {
    icon: "/icon-192x192.png",
    apple: "/icon-192x192.png", // 아이폰용 아이콘
  },
};

// 뷰포트 설정 (모바일 확대 방지 등)
export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // 앱처럼 보이게 확대 금지
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      {/* style에 overflowX: 'hidden' 추가 */}
      <body style={{ margin: 0, padding: 0, backgroundColor: '#f5f7f8', overflowX: 'hidden' }}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}