import type { Metadata } from "next";
import "./styles/globals.scss";

export const metadata: Metadata = {
  title: "NextChat Simple - 简洁的聊天界面",
  description: "基于 NextChat UI 的简化版聊天应用",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
