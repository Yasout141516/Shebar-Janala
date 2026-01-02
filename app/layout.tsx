// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "শেবার জানালা - ইউনিয়ন পরিষদ সেবা ও স্বচ্ছতা পোর্টাল",
  description: "ইউনিয়ন পরিষদের স্বচ্ছতা ও জবাবদিহিতা নিশ্চিত করার প্ল্যাটফর্ম",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}