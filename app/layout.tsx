import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { generateMetaTags, getSiteConfig } from "@/lib/seo-engine";
import { StructuredData } from "@/components/structured-data";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Generate SEO meta tags using the SEO engine
const siteConfig = getSiteConfig();
const metaTags = generateMetaTags({
  title: "Media Downloader",
  description: "ดาวน์โหลดวิดีโอจาก YouTube และ TikTok ในรูปแบบ MP3 และ MP4 พร้อมเลือกความละเอียด ฟรี ไม่ต้องติดตั้งโปรแกรม",
  path: "/",
  type: "website",
  keywords: ["youtube downloader", "tiktok downloader", "mp3 converter", "mp4 download", "video downloader", "ดาวน์โหลดวิดีโอ"],
});

/**
 * Next.js Metadata API configuration
 * Requirements: 5.1, 5.4, 5.5
 * - Generates appropriate meta tags including title, description, and keywords
 * - Provides Open Graph and Twitter Card meta tags for social media sharing
 * - Ensures all pages have canonical URLs to prevent duplicate content
 */
export const metadata: Metadata = {
  // Basic meta tags
  title: {
    default: metaTags.title,
    template: `%s | ${siteConfig.siteName}`,
  },
  description: metaTags.description,
  keywords: metaTags.keywords,
  
  // Canonical URL
  metadataBase: new URL(siteConfig.siteUrl),
  alternates: {
    canonical: metaTags.canonical,
  },
  
  // Open Graph meta tags for social media sharing
  openGraph: {
    title: metaTags.ogTitle,
    description: metaTags.ogDescription,
    url: metaTags.ogUrl,
    siteName: siteConfig.siteName,
    images: [
      {
        url: metaTags.ogImage,
        width: 1200,
        height: 630,
        alt: "Media Downloader - YouTube & TikTok Video Downloader",
      },
    ],
    locale: "th_TH",
    type: "website",
  },
  
  // Twitter Card meta tags
  twitter: {
    card: "summary_large_image",
    title: metaTags.twitterTitle,
    description: metaTags.twitterDescription,
    images: [metaTags.twitterImage],
    creator: siteConfig.twitterHandle,
  },
  
  // Additional SEO meta tags
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  
  // Icons
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  
  // Verification (can be configured via environment variables)
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
  },
};

/**
 * Viewport configuration for mobile-friendly rendering
 * Requirements: 6.2
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <head>
        <StructuredData />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
