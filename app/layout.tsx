import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Photo Hunt Kebun Raya — IO UINSA",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#5c94fc", // Warna langit biru
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased">
        {/* Container Utama (Frame HP) */}
        <div className="flex flex-col h-[100dvh] max-w-[480px] mx-auto bg-white relative overflow-hidden shadow-2xl md:h-screen mario-bg">
          
          {/* BACKGROUND SUPER MARIO */}
          <div className="mario-clouds"></div>
          <div className="mario-hills"></div>
          <div className="mario-ground"></div>
          
          {/* KONTEN APLIKASI (Diberi z-index biar di atas background) */}
          <div className="relative z-10 flex flex-col h-full bg-transparent">
            {children}
          </div>

        </div>
      </body>
    </html>
  );
}
