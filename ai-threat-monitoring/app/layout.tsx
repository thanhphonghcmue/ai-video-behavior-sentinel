import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SENTINEL AI | Hệ Thống Giám Sát Phân Tích Hành Vi & Đánh Giá Nguy Cơ Thời Gian Thực",
  description: "Hệ thống giám sát an ninh thông minh tích hợp thị giác máy tính và Google Gemini 2.5 Flash đa phương thức",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="antialiased min-h-screen bg-[#F4F6F8] text-[#111827]">
        {children}
      </body>
    </html>
  );
}
