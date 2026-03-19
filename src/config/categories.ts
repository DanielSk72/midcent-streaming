// Central config — one entry per category subdomain.
// To add a new category: add a DNS CNAME, add a custom domain in Cloudflare Pages,
// then add an entry here. The app will automatically serve that category.

export interface ServiceFilter {
  label: string;
  color: string;
  terms: string[]; // keywords matched against post title/excerpt/content
}

export interface CategoryConfig {
  wpCategoryId: number;
  name: string;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  excludedTags?: string[];       // WP class_list values to exclude
  serviceFilters?: ServiceFilter[]; // Optional — only for categories that need them
}

export const CATEGORIES: Record<string, CategoryConfig> = {
  'streaming.midcent.se': {
    wpCategoryId: 1,
    name: 'Streaming',
    metaTitle: 'Streaming — Midcent',
    metaDescription: 'Bästa tips om film, serier och streaming för dig som vet vad du vill se.',
    canonicalUrl: 'https://streaming.midcent.se',
    excludedTags: ['tag-bokrecension', 'tag-ljudbocker', 'tag-musikrecension'],
    serviceFilters: [
      { label: 'Netflix',      color: '#E50914', terms: ['netflix'] },
      { label: 'HBO Max',      color: '#6A0DAD', terms: ['hbo', 'hbo max', 'hbomax'] },
      { label: 'Disney+',      color: '#1B4FBB', terms: ['disney+', 'disney plus', 'disneyplus'] },
      { label: 'Amazon Prime', color: '#1A6DB5', terms: ['amazon prime', 'prime video', 'amazon video'] },
      { label: 'Apple TV+',    color: '#000000', terms: ['apple tv+', 'apple tv plus', 'appletv', 'apple tv'] },
      { label: 'Viaplay',      color: '#C1143C', terms: ['viaplay'] },
      { label: 'Showtime',     color: '#B22222', terms: ['showtime'] },
    ],
  },

  'ekonomi.midcent.se': {
    wpCategoryId: 7,
    name: 'Ekonomi',
    metaTitle: 'Ekonomi — Midcent',
    metaDescription: 'Privatekonomi, investeringar och ekonominyheter för dig som är 45+.',
    canonicalUrl: 'https://ekonomi.midcent.se',
  },

  'halsa.midcent.se': {
    wpCategoryId: 19,
    name: 'Hälsa',
    metaTitle: 'Hälsa — Midcent',
    metaDescription: 'Hälsotips, träning och välmående för dig som är 45+.',
    canonicalUrl: 'https://halsa.midcent.se',
  },

  'teknik.midcent.se': {
    wpCategoryId: 8,
    name: 'Teknik',
    metaTitle: 'Teknik — Midcent',
    metaDescription: 'Tekniknyheter, gadgets och digitala tjänster för dig som är 45+.',
    canonicalUrl: 'https://teknik.midcent.se',
  },

  'fritid.midcent.se': {
    wpCategoryId: 11,
    name: 'Fritid',
    metaTitle: 'Fritid — Midcent',
    metaDescription: 'Fritidstips, hobbies och aktiviteter för dig som är 45+.',
    canonicalUrl: 'https://fritid.midcent.se',
  },

  'samhalle.midcent.se': {
    wpCategoryId: 13,
    name: 'Samhälle',
    metaTitle: 'Samhälle — Midcent',
    metaDescription: 'Samhällsnyheter och debatt för dig som är 45+.',
    canonicalUrl: 'https://samhalle.midcent.se',
  },

  'mat.midcent.se': {
    wpCategoryId: 25,
    name: 'Mat & Dryck',
    metaTitle: 'Mat & Dryck — Midcent',
    metaDescription: 'Matrecept, restauranger och dryckestips för dig som är 45+.',
    canonicalUrl: 'https://mat.midcent.se',
  },

  'resa.midcent.se': {
    wpCategoryId: 20,
    name: 'Resa',
    metaTitle: 'Resa — Midcent',
    metaDescription: 'Resetips, destinationer och reseinspirantion för dig som är 45+.',
    canonicalUrl: 'https://resa.midcent.se',
  },
};

// Falls back to streaming config when running locally (localhost)
export function getCategoryConfig(): CategoryConfig {
  const hostname = window.location.hostname;
  return CATEGORIES[hostname] ?? CATEGORIES['streaming.midcent.se'];
}
