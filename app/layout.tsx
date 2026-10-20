import type { Metadata, Viewport } from "next";
import "./globals.css";
import TimerProvider from "./components/TimerProvider";

export const metadata: Metadata = {
  title: "Photo Hunt Kebun Raya — IO UINSA",
  // ... (sisanya biarkan sama)
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#065f46",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased">
        <div className="flex flex-col h-[100dvh] max-w-[480px] mx-auto bg-gray-50 relative overflow-hidden shadow-2xl md:h-screen">
          <TimerProvider>
            {children}
          </TimerProvider>
        </div>
      </body>
    </html>
  );
}