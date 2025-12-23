/**
 * Sitemap API Endpoint
 * GET /sitemap.xml
 * Returns XML sitemap for SEO
 * 
 * Requirements: 5.2
 */

import { NextResponse } from 'next/server';
import { generateSitemap } from '@/lib/seo-engine';

export async function GET() {
  try {
    // Generate sitemap XML
    const sitemap = generateSitemap();
    
    // Return XML response with appropriate headers
    return new NextResponse(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
    
  } catch (error) {
    console.error('Sitemap generation error:', error);
    
    return new NextResponse('Error generating sitemap', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}
