/**
 * SEO Engine Service
 * Handles generation of meta tags, structured data, sitemap, and SEO optimizations
 */

export interface PageInfo {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: 'website' | 'article' | 'video';
  keywords?: string[];
}

export interface MetaTags {
  title: string;
  description: string;
  keywords: string[];
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogType: string;
  ogUrl: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  canonical: string;
}

export interface JsonLd {
  '@context': 'https://schema.org';
  '@type': 'WebSite' | 'VideoObject' | 'Article' | 'SoftwareApplication';
  name: string;
  description: string;
  url: string;
}

interface SiteConfig {
  siteName: string;
  siteUrl: string;
  defaultImage: string;
  defaultKeywords: readonly string[];
  twitterHandle: string;
}

/**
 * Validates and normalizes a URL, returning fallback if invalid
 */
function validateSiteUrl(url: string | undefined, fallback: string): string {
  if (!url) return fallback;
  try {
    new URL(url);
    return url.replace(/\/$/, ''); // normalize trailing slash
  } catch {
    console.warn(`Invalid NEXT_PUBLIC_SITE_URL: ${url}, using fallback`);
    return fallback;
  }
}

const DEFAULT_FALLBACK_URL = 'https://media-downloader.newsrefac.com';

// Default site configuration - uses environment variables with fallbacks
const DEFAULT_SITE_CONFIG: SiteConfig = {
  siteName: process.env.NEXT_PUBLIC_SITE_NAME || 'Media Downloader',
  siteUrl: validateSiteUrl(process.env.NEXT_PUBLIC_SITE_URL, DEFAULT_FALLBACK_URL),
  defaultImage: process.env.NEXT_PUBLIC_OG_IMAGE || '/og-image.png',
  defaultKeywords: ['media downloader', 'youtube downloader', 'tiktok downloader', 'mp3', 'mp4', 'video download'],
  twitterHandle: process.env.NEXT_PUBLIC_TWITTER_HANDLE || '@mediadownloader',
};

/**
 * Generates the canonical URL for a given path
 * @param path - The page path (e.g., '/about', '/download')
 * @returns The full canonical URL
 */
export function generateCanonicalUrl(path: string): string {
  // Normalize path to ensure it starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Remove trailing slash except for root
  const cleanPath = normalizedPath === '/' ? '' : normalizedPath.replace(/\/$/, '');
  
  return `${DEFAULT_SITE_CONFIG.siteUrl}${cleanPath}`;
}


/**
 * Generates complete meta tags for a page
 * Includes title, description, keywords, Open Graph tags, Twitter Card tags, and canonical URL
 * 
 * @param pageInfo - Information about the page
 * @returns MetaTags object with all SEO meta tags
 * 
 * Requirements: 5.1, 5.4, 5.5
 * - Generates appropriate meta tags including title, description, and keywords
 * - Provides Open Graph and Twitter Card meta tags for social media sharing
 * - Ensures all pages have canonical URLs to prevent duplicate content
 */
export function generateMetaTags(pageInfo: PageInfo): MetaTags {
  const {
    title,
    description,
    path,
    image,
    type = 'website',
    keywords = [],
  } = pageInfo;

  // Combine page-specific keywords with default keywords
  const allKeywords = [...new Set([...keywords, ...DEFAULT_SITE_CONFIG.defaultKeywords])];
  
  // Generate full title with site name
  const fullTitle = `${title} | ${DEFAULT_SITE_CONFIG.siteName}`;
  
  // Use provided image or default
  const imageUrl = image || `${DEFAULT_SITE_CONFIG.siteUrl}${DEFAULT_SITE_CONFIG.defaultImage}`;
  
  // Generate canonical URL
  const canonical = generateCanonicalUrl(path);
  
  // Map page type to Open Graph type
  const ogType = type === 'video' ? 'video.other' : type;

  return {
    title: fullTitle,
    description,
    keywords: allKeywords,
    ogTitle: fullTitle,
    ogDescription: description,
    ogImage: imageUrl,
    ogType,
    ogUrl: canonical,
    twitterCard: 'summary_large_image',
    twitterTitle: fullTitle,
    twitterDescription: description,
    twitterImage: imageUrl,
    canonical,
  };
}

export interface MetaTagsValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates that meta tags contain all required fields
 * @param metaTags - The meta tags to validate
 * @returns Validation result with specific error messages
 */
export function validateMetaTags(metaTags: MetaTags): MetaTagsValidationResult {
  const errors: string[] = [];
  const requiredFields: (keyof MetaTags)[] = [
    'title',
    'description',
    'keywords',
    'ogTitle',
    'ogDescription',
    'ogImage',
    'twitterCard',
    'twitterTitle',
    'twitterDescription',
    'canonical',
  ];

  for (const field of requiredFields) {
    const value = metaTags[field];
    if (value === undefined || value === null) {
      errors.push(`Missing required field: ${field}`);
    } else if (typeof value === 'string' && value.trim() === '') {
      errors.push(`Empty value for field: ${field}`);
    } else if (Array.isArray(value) && value.length === 0) {
      errors.push(`Empty array for field: ${field}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Generates meta tags as HTML string for injection into page head
 * @param metaTags - The meta tags object
 * @returns HTML string with all meta tags
 */
export function metaTagsToHtml(metaTags: MetaTags): string {
  const lines: string[] = [];

  // Basic meta tags
  lines.push(`<title>${escapeHtml(metaTags.title)}</title>`);
  lines.push(`<meta name="description" content="${escapeHtml(metaTags.description)}" />`);
  lines.push(`<meta name="keywords" content="${escapeHtml(metaTags.keywords.join(', '))}" />`);
  
  // Canonical URL
  lines.push(`<link rel="canonical" href="${escapeHtml(metaTags.canonical)}" />`);
  
  // Open Graph tags
  lines.push(`<meta property="og:title" content="${escapeHtml(metaTags.ogTitle)}" />`);
  lines.push(`<meta property="og:description" content="${escapeHtml(metaTags.ogDescription)}" />`);
  lines.push(`<meta property="og:image" content="${escapeHtml(metaTags.ogImage)}" />`);
  lines.push(`<meta property="og:type" content="${escapeHtml(metaTags.ogType)}" />`);
  lines.push(`<meta property="og:url" content="${escapeHtml(metaTags.ogUrl)}" />`);
  
  // Twitter Card tags
  lines.push(`<meta name="twitter:card" content="${escapeHtml(metaTags.twitterCard)}" />`);
  lines.push(`<meta name="twitter:title" content="${escapeHtml(metaTags.twitterTitle)}" />`);
  lines.push(`<meta name="twitter:description" content="${escapeHtml(metaTags.twitterDescription)}" />`);
  lines.push(`<meta name="twitter:image" content="${escapeHtml(metaTags.twitterImage)}" />`);

  return lines.join('\n');
}

/**
 * Escapes HTML special characters to prevent XSS
 * @param str - The string to escape
 * @returns Escaped string safe for HTML attributes
 */
export function escapeHtml(str: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  
  return str.replace(/[&<>"']/g, (char) => htmlEscapes[char] || char);
}

/**
 * Validates if a string is a valid URL
 * @param url - The URL string to validate
 * @returns true if the URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets the default site configuration
 * Useful for accessing site-wide SEO settings
 * @returns Immutable copy of the default site configuration object
 */
export function getSiteConfig(): Readonly<SiteConfig> {
  return Object.freeze({ ...DEFAULT_SITE_CONFIG });
}

// ============================================================================
// Sitemap Generation
// ============================================================================

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

/**
 * Default public pages for the sitemap
 */
const DEFAULT_PUBLIC_PAGES: SitemapUrl[] = [
  { loc: '/', changefreq: 'daily', priority: 1.0 },
  { loc: '/youtube', changefreq: 'weekly', priority: 0.9 },
  { loc: '/tiktok', changefreq: 'weekly', priority: 0.9 },
  { loc: '/about', changefreq: 'monthly', priority: 0.5 },
  { loc: '/privacy', changefreq: 'monthly', priority: 0.3 },
  { loc: '/terms', changefreq: 'monthly', priority: 0.3 },
];

/**
 * Escapes special XML characters in a string
 * @param str - The string to escape
 * @returns XML-safe string
 */
export function escapeXml(str: string): string {
  const xmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
  };
  
  return str.replace(/[&<>"']/g, (char) => xmlEscapes[char] || char);
}

/**
 * Validates a sitemap URL entry
 * @param url - The sitemap URL entry to validate
 * @returns true if the entry is valid
 */
export function isValidSitemapUrl(url: SitemapUrl): boolean {
  // loc is required and must be a non-empty string
  if (!url.loc || typeof url.loc !== 'string' || url.loc.trim() === '') {
    return false;
  }
  
  // priority must be between 0.0 and 1.0 if provided
  if (url.priority !== undefined) {
    if (typeof url.priority !== 'number' || url.priority < 0 || url.priority > 1) {
      return false;
    }
  }
  
  // changefreq must be a valid value if provided
  const validChangefreqs = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];
  if (url.changefreq !== undefined && !validChangefreqs.includes(url.changefreq)) {
    return false;
  }
  
  // lastmod must be a valid ISO date string if provided
  if (url.lastmod !== undefined) {
    const date = new Date(url.lastmod);
    if (isNaN(date.getTime())) {
      return false;
    }
  }
  
  return true;
}

/**
 * Generates a single URL entry for the sitemap
 * @param url - The sitemap URL entry
 * @returns XML string for the URL entry
 */
function generateUrlEntry(url: SitemapUrl): string {
  const fullUrl = url.loc.startsWith('http') 
    ? url.loc 
    : `${DEFAULT_SITE_CONFIG.siteUrl}${url.loc.startsWith('/') ? url.loc : `/${url.loc}`}`;
  
  const lines: string[] = ['  <url>'];
  lines.push(`    <loc>${escapeXml(fullUrl)}</loc>`);
  
  if (url.lastmod) {
    lines.push(`    <lastmod>${escapeXml(url.lastmod)}</lastmod>`);
  }
  
  if (url.changefreq) {
    lines.push(`    <changefreq>${escapeXml(url.changefreq)}</changefreq>`);
  }
  
  if (url.priority !== undefined) {
    lines.push(`    <priority>${url.priority.toFixed(1)}</priority>`);
  }
  
  lines.push('  </url>');
  return lines.join('\n');
}

/**
 * Generates a valid XML sitemap containing all public pages
 * 
 * @param additionalUrls - Optional additional URLs to include in the sitemap
 * @returns Valid XML sitemap string
 * 
 * Requirements: 5.2
 * - Provides a valid XML sitemap with all public pages when the website is crawled
 */
export function generateSitemap(additionalUrls: SitemapUrl[] = []): string {
  // Combine default pages with additional URLs
  const allUrls = [...DEFAULT_PUBLIC_PAGES, ...additionalUrls];
  
  // Filter out invalid URLs
  const validUrls = allUrls.filter(isValidSitemapUrl);
  
  // Generate XML
  const xmlLines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];
  
  for (const url of validUrls) {
    xmlLines.push(generateUrlEntry(url));
  }
  
  xmlLines.push('</urlset>');
  
  return xmlLines.join('\n');
}

/**
 * Validates that a sitemap XML string is well-formed
 * @param sitemap - The sitemap XML string to validate
 * @returns Validation result with specific error messages
 */
export interface SitemapValidationResult {
  valid: boolean;
  errors: string[];
  urlCount: number;
}

export function validateSitemap(sitemap: string): SitemapValidationResult {
  const errors: string[] = [];
  let urlCount = 0;
  
  // Check XML declaration
  if (!sitemap.startsWith('<?xml version="1.0"')) {
    errors.push('Missing or invalid XML declaration');
  }
  
  // Check urlset element with correct namespace
  if (!sitemap.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')) {
    errors.push('Missing or invalid urlset element with sitemap namespace');
  }
  
  // Check closing urlset tag
  if (!sitemap.includes('</urlset>')) {
    errors.push('Missing closing urlset tag');
  }
  
  // Count URL entries
  const urlMatches = sitemap.match(/<url>/g);
  urlCount = urlMatches ? urlMatches.length : 0;
  
  // Each <url> must have a <loc>
  const locMatches = sitemap.match(/<loc>/g);
  const locCount = locMatches ? locMatches.length : 0;
  
  if (urlCount !== locCount) {
    errors.push(`URL count (${urlCount}) does not match loc count (${locCount})`);
  }
  
  // Check that all URLs have closing tags
  const closingUrlMatches = sitemap.match(/<\/url>/g);
  const closingUrlCount = closingUrlMatches ? closingUrlMatches.length : 0;
  
  if (urlCount !== closingUrlCount) {
    errors.push('Mismatched url opening and closing tags');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    urlCount,
  };
}


// ============================================================================
// Structured Data (JSON-LD) Generation
// ============================================================================

export interface WebSiteJsonLd {
  '@context': 'https://schema.org';
  '@type': 'WebSite';
  name: string;
  description: string;
  url: string;
  potentialAction?: {
    '@type': 'SearchAction';
    target: string;
    'query-input': string;
  };
}

export interface SoftwareApplicationJsonLd {
  '@context': 'https://schema.org';
  '@type': 'SoftwareApplication';
  name: string;
  description: string;
  url: string;
  applicationCategory: string;
  operatingSystem: string;
  offers?: {
    '@type': 'Offer';
    price: string;
    priceCurrency: string;
  };
}

export interface VideoObjectJsonLd {
  '@context': 'https://schema.org';
  '@type': 'VideoObject';
  name: string;
  description: string;
  url: string;
  thumbnailUrl?: string;
  duration?: string;
  uploadDate?: string;
  contentUrl?: string;
}

export interface BreadcrumbJsonLd {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: Array<{
    '@type': 'ListItem';
    position: number;
    name: string;
    item: string;
  }>;
}

export type StructuredData = WebSiteJsonLd | SoftwareApplicationJsonLd | VideoObjectJsonLd | BreadcrumbJsonLd;

export interface StructuredDataOptions {
  type: 'WebSite' | 'SoftwareApplication' | 'VideoObject' | 'BreadcrumbList';
  pageInfo: PageInfo;
  videoInfo?: {
    thumbnailUrl?: string;
    duration?: string;
    uploadDate?: string;
    contentUrl?: string;
  };
  breadcrumbs?: Array<{ name: string; path: string }>;
}

/**
 * Generates structured data (JSON-LD) for a page
 * 
 * @param options - Options for generating structured data
 * @returns JSON-LD object conforming to schema.org specifications
 * 
 * Requirements: 5.3
 * - Includes structured data (JSON-LD) for rich search results when rendering pages
 */
export function generateStructuredData(options: StructuredDataOptions): StructuredData {
  const { type, pageInfo, videoInfo, breadcrumbs } = options;
  const fullUrl = generateCanonicalUrl(pageInfo.path);

  switch (type) {
    case 'WebSite':
      return generateWebSiteJsonLd(pageInfo, fullUrl);
    case 'SoftwareApplication':
      return generateSoftwareApplicationJsonLd(pageInfo, fullUrl);
    case 'VideoObject':
      return generateVideoObjectJsonLd(pageInfo, fullUrl, videoInfo);
    case 'BreadcrumbList':
      return generateBreadcrumbJsonLd(breadcrumbs || []);
    default:
      return generateWebSiteJsonLd(pageInfo, fullUrl);
  }
}

/**
 * Generates WebSite JSON-LD structured data
 */
function generateWebSiteJsonLd(pageInfo: PageInfo, url: string): WebSiteJsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: pageInfo.title || DEFAULT_SITE_CONFIG.siteName,
    description: pageInfo.description,
    url,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${DEFAULT_SITE_CONFIG.siteUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generates SoftwareApplication JSON-LD structured data
 */
function generateSoftwareApplicationJsonLd(pageInfo: PageInfo, url: string): SoftwareApplicationJsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: pageInfo.title || DEFAULT_SITE_CONFIG.siteName,
    description: pageInfo.description,
    url,
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };
}

/**
 * Generates VideoObject JSON-LD structured data
 */
function generateVideoObjectJsonLd(
  pageInfo: PageInfo,
  url: string,
  videoInfo?: StructuredDataOptions['videoInfo']
): VideoObjectJsonLd {
  const jsonLd: VideoObjectJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: pageInfo.title,
    description: pageInfo.description,
    url,
  };

  if (videoInfo?.thumbnailUrl) {
    jsonLd.thumbnailUrl = videoInfo.thumbnailUrl;
  }
  if (videoInfo?.duration) {
    jsonLd.duration = videoInfo.duration;
  }
  if (videoInfo?.uploadDate) {
    jsonLd.uploadDate = videoInfo.uploadDate;
  }
  if (videoInfo?.contentUrl) {
    jsonLd.contentUrl = videoInfo.contentUrl;
  }

  return jsonLd;
}

/**
 * Generates BreadcrumbList JSON-LD structured data
 */
function generateBreadcrumbJsonLd(breadcrumbs: Array<{ name: string; path: string }>): BreadcrumbJsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem' as const,
      position: index + 1,
      name: crumb.name,
      item: generateCanonicalUrl(crumb.path),
    })),
  };
}

/**
 * Converts structured data to a script tag for embedding in HTML
 * @param data - The structured data object
 * @returns HTML script tag with JSON-LD
 */
export function structuredDataToHtml(data: StructuredData): string {
  return `<script type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n</script>`;
}

/**
 * Validates that structured data contains required schema.org properties
 * @param data - The structured data to validate
 * @returns Validation result with specific error messages
 */
export interface StructuredDataValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateStructuredData(data: StructuredData): StructuredDataValidationResult {
  const errors: string[] = [];

  // Check required @context
  if (data['@context'] !== 'https://schema.org') {
    errors.push('Invalid or missing @context - must be "https://schema.org"');
  }

  // Check required @type
  const validTypes = ['WebSite', 'SoftwareApplication', 'VideoObject', 'BreadcrumbList'];
  if (!data['@type'] || !validTypes.includes(data['@type'])) {
    errors.push(`Invalid or missing @type - must be one of: ${validTypes.join(', ')}`);
  }

  // Type-specific validation
  switch (data['@type']) {
    case 'WebSite':
    case 'SoftwareApplication':
    case 'VideoObject': {
      const typedData = data as WebSiteJsonLd | SoftwareApplicationJsonLd | VideoObjectJsonLd;
      if (!typedData.name || typedData.name.trim() === '') {
        errors.push('Missing or empty required property: name');
      }
      if (!typedData.description || typedData.description.trim() === '') {
        errors.push('Missing or empty required property: description');
      }
      if (!typedData.url || typedData.url.trim() === '') {
        errors.push('Missing or empty required property: url');
      }
      break;
    }
    case 'BreadcrumbList': {
      const breadcrumbData = data as BreadcrumbJsonLd;
      if (!Array.isArray(breadcrumbData.itemListElement)) {
        errors.push('Missing or invalid itemListElement array');
      } else {
        breadcrumbData.itemListElement.forEach((item, index) => {
          if (item['@type'] !== 'ListItem') {
            errors.push(`Item ${index + 1}: Invalid @type - must be "ListItem"`);
          }
          if (typeof item.position !== 'number' || item.position < 1) {
            errors.push(`Item ${index + 1}: Invalid position - must be a positive number`);
          }
          if (!item.name || item.name.trim() === '') {
            errors.push(`Item ${index + 1}: Missing or empty name`);
          }
          if (!item.item || item.item.trim() === '') {
            errors.push(`Item ${index + 1}: Missing or empty item URL`);
          }
        });
      }
      break;
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates that a string is valid JSON
 * @param jsonString - The JSON string to validate
 * @returns true if the string is valid JSON
 */
export function isValidJson(jsonString: string): boolean {
  try {
    JSON.parse(jsonString);
    return true;
  } catch {
    return false;
  }
}


// ============================================================================
// Performance Optimizations
// ============================================================================

export interface CacheHeadersConfig {
  maxAge: number;
  staleWhileRevalidate?: number;
  public?: boolean;
  immutable?: boolean;
}

/**
 * Default cache configurations for different asset types
 */
export const CACHE_CONFIGS = {
  // Static assets like images, fonts - cache for 1 year
  static: {
    maxAge: 31536000, // 1 year in seconds
    public: true,
    immutable: true,
  },
  // HTML pages - short cache with revalidation
  html: {
    maxAge: 0,
    staleWhileRevalidate: 60,
    public: true,
  },
  // API responses - no cache by default
  api: {
    maxAge: 0,
    public: false,
  },
  // JavaScript and CSS bundles - cache for 1 year (versioned)
  bundles: {
    maxAge: 31536000,
    public: true,
    immutable: true,
  },
} as const;

/**
 * Generates Cache-Control header value based on configuration
 * 
 * @param config - Cache configuration options
 * @returns Cache-Control header value string
 * 
 * Requirements: 6.3
 * - Implements proper caching headers for static resources when serving assets
 */
export function generateCacheHeaders(config: CacheHeadersConfig): string {
  const directives: string[] = [];

  // Public or private
  if (config.public) {
    directives.push('public');
  } else {
    directives.push('private');
  }

  // Max age
  directives.push(`max-age=${config.maxAge}`);

  // Stale while revalidate
  if (config.staleWhileRevalidate !== undefined && config.staleWhileRevalidate > 0) {
    directives.push(`stale-while-revalidate=${config.staleWhileRevalidate}`);
  }

  // Immutable (for versioned assets)
  if (config.immutable) {
    directives.push('immutable');
  }

  return directives.join(', ');
}

/**
 * Gets appropriate cache headers for a given file path
 * @param filePath - The file path or URL
 * @returns Cache-Control header value
 */
export function getCacheHeadersForPath(filePath: string): string {
  const extension = filePath.split('.').pop()?.toLowerCase() || '';

  // Static assets
  const staticExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico', 'woff', 'woff2', 'ttf', 'eot'];
  if (staticExtensions.includes(extension)) {
    return generateCacheHeaders(CACHE_CONFIGS.static);
  }

  // JavaScript and CSS bundles
  const bundleExtensions = ['js', 'css'];
  if (bundleExtensions.includes(extension)) {
    return generateCacheHeaders(CACHE_CONFIGS.bundles);
  }

  // HTML pages
  if (extension === 'html' || extension === '') {
    return generateCacheHeaders(CACHE_CONFIGS.html);
  }

  // API routes
  if (filePath.includes('/api/')) {
    return generateCacheHeaders(CACHE_CONFIGS.api);
  }

  // Default to HTML config
  return generateCacheHeaders(CACHE_CONFIGS.html);
}

/**
 * Validates that cache headers contain required directives
 * @param headers - The Cache-Control header value
 * @returns Validation result
 */
export interface CacheHeadersValidationResult {
  valid: boolean;
  hasMaxAge: boolean;
  hasPublicOrPrivate: boolean;
  errors: string[];
}

export function validateCacheHeaders(headers: string): CacheHeadersValidationResult {
  const errors: string[] = [];
  const directives = headers.split(',').map(d => d.trim().toLowerCase());

  const hasMaxAge = directives.some(d => d.startsWith('max-age='));
  const hasPublic = directives.includes('public');
  const hasPrivate = directives.includes('private');
  const hasPublicOrPrivate = hasPublic || hasPrivate;

  if (!hasMaxAge) {
    errors.push('Missing max-age directive');
  }

  if (!hasPublicOrPrivate) {
    errors.push('Missing public or private directive');
  }

  if (hasPublic && hasPrivate) {
    errors.push('Cannot have both public and private directives');
  }

  return {
    valid: errors.length === 0,
    hasMaxAge,
    hasPublicOrPrivate,
    errors,
  };
}

// ============================================================================
// Lazy Loading
// ============================================================================

export interface LazyLoadingConfig {
  loading: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
  fetchPriority?: 'high' | 'low' | 'auto';
}

/**
 * Default lazy loading configurations
 */
export const LAZY_LOADING_CONFIGS = {
  // Below-the-fold images
  belowFold: {
    loading: 'lazy' as const,
    decoding: 'async' as const,
    fetchPriority: 'low' as const,
  },
  // Above-the-fold critical images
  aboveFold: {
    loading: 'eager' as const,
    decoding: 'async' as const,
    fetchPriority: 'high' as const,
  },
  // Thumbnails and non-critical images
  thumbnail: {
    loading: 'lazy' as const,
    decoding: 'async' as const,
    fetchPriority: 'auto' as const,
  },
} as const;

/**
 * Generates lazy loading attributes for an image element
 * 
 * @param config - Lazy loading configuration
 * @returns Object with HTML attributes for lazy loading
 * 
 * Requirements: 6.4
 * - Lazy-loads images and non-critical resources while loading pages
 */
export function generateLazyLoadingAttributes(config: LazyLoadingConfig): Record<string, string> {
  const attributes: Record<string, string> = {
    loading: config.loading,
  };

  if (config.decoding) {
    attributes.decoding = config.decoding;
  }

  if (config.fetchPriority) {
    attributes.fetchpriority = config.fetchPriority;
  }

  return attributes;
}

/**
 * Generates lazy loading attributes as an HTML string
 * @param config - Lazy loading configuration
 * @returns HTML attribute string
 */
export function lazyLoadingAttributesToString(config: LazyLoadingConfig): string {
  const attrs = generateLazyLoadingAttributes(config);
  return Object.entries(attrs)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');
}

/**
 * Determines if an image should be lazy loaded based on its position
 * @param isAboveFold - Whether the image is above the fold
 * @param isCritical - Whether the image is critical for LCP
 * @returns Lazy loading configuration
 */
export function getLazyLoadingConfig(isAboveFold: boolean, isCritical: boolean = false): LazyLoadingConfig {
  if (isCritical || isAboveFold) {
    return LAZY_LOADING_CONFIGS.aboveFold;
  }
  return LAZY_LOADING_CONFIGS.belowFold;
}

/**
 * Validates that lazy loading attributes are properly set
 * @param attributes - The lazy loading attributes
 * @returns Validation result
 */
export interface LazyLoadingValidationResult {
  valid: boolean;
  hasLoadingAttribute: boolean;
  errors: string[];
}

export function validateLazyLoadingAttributes(attributes: Record<string, string>): LazyLoadingValidationResult {
  const errors: string[] = [];

  const hasLoadingAttribute = 'loading' in attributes;
  if (!hasLoadingAttribute) {
    errors.push('Missing loading attribute');
  } else {
    const validLoadingValues = ['lazy', 'eager'];
    if (!validLoadingValues.includes(attributes.loading)) {
      errors.push(`Invalid loading value: ${attributes.loading}. Must be "lazy" or "eager"`);
    }
  }

  if ('decoding' in attributes) {
    const validDecodingValues = ['async', 'sync', 'auto'];
    if (!validDecodingValues.includes(attributes.decoding)) {
      errors.push(`Invalid decoding value: ${attributes.decoding}. Must be "async", "sync", or "auto"`);
    }
  }

  if ('fetchpriority' in attributes) {
    const validPriorityValues = ['high', 'low', 'auto'];
    if (!validPriorityValues.includes(attributes.fetchpriority)) {
      errors.push(`Invalid fetchpriority value: ${attributes.fetchpriority}. Must be "high", "low", or "auto"`);
    }
  }

  return {
    valid: errors.length === 0,
    hasLoadingAttribute,
    errors,
  };
}
