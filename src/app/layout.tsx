import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://retro-camera-ten.vercel.app/"),
  title: "Gemini Retro Camera",
  description: "Capture and edit photos with retro filters using AI.",
  keywords: ["retro camera", "photo app", "Next.js", "AI photography", "vintage filters"],
  authors: [{ name: "Rohit Khatri" }],
  creator: "Rohit Khatri",
  robots: "index, follow",
  openGraph: {
    title: "Gemini Retro Camera",
    description: "Capture and edit photos with retro filters using AI.",
    url: "https://retro-camera-ten.vercel.app/",
    siteName: "Gemini Retro Camera",
    images: [
      {
        url: "/favicon-32x32.png",
        width: 1200,
        height: 630,
        alt: "Gemini Retro Camera Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gemini Retro Camera",
    description: "Capture and edit photos with retro filters using AI.",
    images: ["/apple-touch-icon.png"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}