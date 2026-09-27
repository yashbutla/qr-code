export interface URLCleanResult {
  originalUrl: string;
  cleanUrl: string;
  originalLength: number;
  cleanLength: number;
  optimizationPercent: number;
  error?: string;
  isAmazon?: boolean;
  shortUrl?: string;
}

const TRACKING_PARAMS = [
  'qid', 'ref', 'rnid', 'xpid', 'dc', 'language', 'ds',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'tag', 'sr'
];

const AMAZON_SEARCH_KEEP_PARAMS = [
  'i', 'k', 'rh', 'n', 'p_6', 'p_n_feature_three_browse-bin'
];

export function cleanUrl(inputUrl: string): URLCleanResult {
  let urlObj: URL;
  try {
    // Basic validation / protocol prefix insertion
    let urlString = inputUrl.trim();
    if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
      urlString = 'https://' + urlString;
    }
    urlObj = new URL(urlString);
  } catch (e) {
    return {
      originalUrl: inputUrl,
      cleanUrl: '',
      originalLength: inputUrl.length,
      cleanLength: 0,
      optimizationPercent: 0,
      error: 'Invalid URL format'
    };
  }

  const hostname = urlObj.hostname;
  const isAmazon = hostname.includes('amazon.');
  
  if (isAmazon) {
    // Handle Amazon product links
    const dpMatch = urlObj.pathname.match(/(?:dp|gp\/product)\/([A-Z0-9]+)/i);
    if (dpMatch && dpMatch[1]) {
      const asin = dpMatch[1];
      urlObj.pathname = `/dp/${asin}`;
      urlObj.search = '';
    } else if (urlObj.pathname.endsWith('/s') || urlObj.pathname.includes('/s/')) {
      // Handle Amazon search links, strip everything except the keep params
      const keptParams = new URLSearchParams();
      urlObj.pathname = '/s';
      
      // Amazon specifically: if 'k' (keyword) is present, we can often simplify 'rh'
      // But we'll stick to the core required params for now
      urlObj.searchParams.forEach((val, key) => {
        if (AMAZON_SEARCH_KEEP_PARAMS.includes(key)) {
          keptParams.set(key, val);
        }
      });
      urlObj.search = keptParams.toString();
    } else {
      // General Amazon page, strip known trackers
      TRACKING_PARAMS.forEach(param => urlObj.searchParams.delete(param));
    }
  } else {
    // Regular URL: strip known tracking params
    TRACKING_PARAMS.forEach(param => urlObj.searchParams.delete(param));
  }

  let cleanUrl = urlObj.toString();
  
  // ULTRA CLEAN: Remove protocol and www. by default for maximum simplicity
  cleanUrl = cleanUrl.replace(/^https?:\/\/(www\.)?/, "");

  // Strip trailing slashes
  if (cleanUrl.endsWith('/')) {
    cleanUrl = cleanUrl.slice(0, -1);
  }

  // Remove common visual noise
  cleanUrl = cleanUrl.replace(/%3A/g, ':').replace(/%2C/g, ',');
  
  const originalLength = inputUrl.length;
  const cleanLength = cleanUrl.length;
  
  let optimizationPercent = 0;
  if (originalLength > cleanLength) {
    optimizationPercent = Math.round(((originalLength - cleanLength) / originalLength) * 100);
  }

  return {
    originalUrl: inputUrl,
    cleanUrl,
    originalLength,
    cleanLength,
    optimizationPercent,
    isAmazon
  };
}
