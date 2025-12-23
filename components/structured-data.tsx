import { generateStructuredData, structuredDataToHtml } from "@/lib/seo-engine";

/**
 * StructuredData component for embedding JSON-LD in page head
 * Requirements: 5.3
 * - Includes structured data (JSON-LD) for rich search results when rendering pages
 */
export function StructuredData() {
  // Generate WebSite structured data for the main application
  const websiteData = generateStructuredData({
    type: "WebSite",
    pageInfo: {
      title: "Media Downloader",
      description: "ดาวน์โหลดวิดีโอจาก YouTube และ TikTok ในรูปแบบ MP3 และ MP4 พร้อมเลือกความละเอียด ฟรี ไม่ต้องติดตั้งโปรแกรม",
      path: "/",
      type: "website",
    },
  });

  // Generate SoftwareApplication structured data
  const softwareData = generateStructuredData({
    type: "SoftwareApplication",
    pageInfo: {
      title: "Media Downloader",
      description: "Free online tool to download videos from YouTube and TikTok in MP3 and MP4 formats with quality selection",
      path: "/",
      type: "website",
    },
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareData),
        }}
      />
    </>
  );
}
