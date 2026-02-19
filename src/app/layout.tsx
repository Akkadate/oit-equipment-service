import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-prompt",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ระบบแสดงสถานะอุปกรณ์ห้องเรียน | OIT NBK",
  description:
    "ระบบบริหารจัดการและตรวจสอบอุปกรณ์ในห้องเรียน สำนักเทคโนโลยีสารสนเทศ มหาวิทยาลัยนอร์ทกรุงเทพ",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "OIT Equipment",
    startupImage: "/icons/icon-512x512.png",
  },
  icons: {
    apple: [
      { url: "/icons/icon-192x192.png", sizes: "192x192" },
      { url: "/icons/icon-512x512.png", sizes: "512x512" },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={prompt.variable}>
      <body className="font-prompt antialiased">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
