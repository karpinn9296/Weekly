import "./globals.css"; // <--- 이 줄이 반드시 있어야 합니다!
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "Weekly Log",
  description: "우리들의 주간 기록",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}