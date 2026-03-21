import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { wpFetch, wpFetchPaged, wpGetCached } from "../lib/wpCache";
import { prefetch } from "../lib/prefetch";
import type { WPPost } from "../types/wordpress";
import Header from "../components/Header";
import { getCategoryConfig } from "../config/categories";
import type { ServiceFilter } from "../config/categories";

const config = getCategoryConfig();
const BASE = `https://midcent.se/wp-json/wp/v2/posts`;
const LIST_PARAMS = `categories=${config.wpCategoryId}&per_page=100&_embed=wp:featuredmedia`;
const PAGE1_URL = `${BASE}?${LIST_PARAMS}&page=1`;

function isExcluded(post: WPPost): boolean {
  if (!config.excludedTags?.length) return false;
  return post.class_list?.some(c => config.excludedTags!.includes(c)) ?? false;
}

// Fetch page 1 and return it immediately, then fetch remaining pages in background
async function fetchPage1(): Promise<{ posts: WPPost[]; totalPages: number }> {
  const { data: page1, totalPages } = await wpFetchPaged<WPPost[]>(PAGE1_URL);
  return { posts: page1.filter(p => !isExcluded(p)), totalPages };
}

async function fetchRemainingPages(totalPages: number): Promise<WPPost[]> {
  if (totalPages <= 1) return [];
  const pages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, i) =>
      wpFetch<WPPost[]>(`${BASE}?${LIST_PARAMS}&page=${i + 2}`)
    )
  );
  return pages.flat().filter(p => !isExcluded(p));
}

const NOW = Date.now();
const DAYS_30  = 30 * 24 * 60 * 60 * 1000;
const YEARS_5  = 5 * 365.25 * 24 * 60 * 60 * 1000;

const TIME_FILTERS = [
  { key: "alla",    label: "Alla" },
  { key: "nyheter", label: "Nyheter" },
  { key: "5ar",     label: "Senaste 5 åren" },
  { key: "aldre",   label: "Äldre" },
];

function filterByTime(posts: WPPost[], key: string): WPPost[] {
  if (key === "alla") return posts;
  return posts.filter(p => {
    const age = NOW - new Date(p.date).getTime();
    if (key === "nyheter") return age <= DAYS_30;
    if (key === "5ar")     return age <= YEARS_5;
    if (key === "aldre")   return age > YEARS_5;
    return true;
  });
}

function matchesService(post: WPPost, terms: string[]): boolean {
  const text = (post.title.rendered + " " + post.excerpt.rendered + " " + post.content.rendered).toLowerCase();
  return terms.some(t => text.includes(t.toLowerCase()));
}

function detectService(post: WPPost): ServiceFilter | null {
  if (!config.serviceFilters?.length) return null;
  return config.serviceFilters.find(s => matchesService(post, s.terms)) ?? null;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("sv-SE", { day: "numeric", month: "short", year: "numeric" });
}

export default function Home() {
  const [posts, setPosts] = useState<WPPost[]>(() => {
    const cached = wpGetCached<WPPost[]>(PAGE1_URL);
    return cached ? cached.filter(p => !isExcluded(p)) : [];
  });
  const [loading, setLoading] = useState(() => !wpGetCached<WPPost[]>(PAGE1_URL));
  const allServiceLabels = config.serviceFilters?.map(s => s.label) ?? [];
  const [activeServices, setActiveServices] = useState<Set<string>>(new Set(allServiceLabels));
  const [activeTime, setActiveTime] = useState<string | null>(null);

  function toggleService(label: string) {
    setActiveServices(prev => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }

  useEffect(() => {
    // Show page 1 as soon as it arrives, then silently load remaining pages
    fetchPage1().then(({ posts: page1Posts, totalPages }) => {
      setPosts(page1Posts);
      setLoading(false);
      fetchRemainingPages(totalPages).then(rest => {
        if (rest.length > 0) setPosts(prev => [...prev, ...rest]);
      });
    });
  }, []);

  // All selected or none selected = show everything. Partial selection = filter.
  const allSelected = activeServices.size === allServiceLabels.length || activeServices.size === 0;
  const filtered = allSelected
    ? posts
    : posts.filter(p =>
        Array.from(activeServices).some(label =>
          matchesService(p, config.serviceFilters!.find(s => s.label === label)!.terms)
        )
      );

  const timePosts  = filterByTime(filtered, activeTime ?? "alla");
  const hero       = timePosts[0];
  const topStories = timePosts.slice(1, 3);
  const latest     = timePosts.slice(3, 6);
  const listItems  = timePosts.slice(6, 10);
  const overflow   = timePosts.slice(10);

  return (
    <>
      <Helmet>
        <title>{config.metaTitle}</title>
        <meta name="description" content={config.metaDescription} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={config.canonicalUrl} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={config.canonicalUrl} />
        <meta property="og:site_name" content="Midcent" />
        <meta property="og:locale" content="sv_SE" />
        <meta property="og:title" content={config.metaTitle} />
        <meta property="og:description" content={config.metaDescription} />
        {config.ogImage && <meta property="og:image" content={config.ogImage} />}

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={config.metaTitle} />
        <meta name="twitter:description" content={config.metaDescription} />
        {config.ogImage && <meta name="twitter:image" content={config.ogImage} />}

        {/* JSON-LD — helps Google understand the site structure */}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": `${config.name} — Midcent`,
          "url": config.canonicalUrl,
          "description": config.metaDescription,
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://midcent.se/?s={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        })}</script>
      </Helmet>

      <Header />

      <main>
        {loading && (
          <div className="skeleton-wrap">
            <div className="skeleton skeleton-hero" />
            <div className="container">
              <div className="skeleton-grid">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="skeleton skeleton-card" />
                ))}
              </div>
            </div>
          </div>
        )}

        {hero && (
          <section className="hero">
            <a href={hero.link} onMouseEnter={() => prefetch(hero.link)} onTouchStart={() => prefetch(hero.link)}>
              {hero._embedded?.["wp:featuredmedia"]?.[0]?.source_url && (
                <img
                  src={hero._embedded["wp:featuredmedia"][0].source_url}
                  alt={hero._embedded["wp:featuredmedia"][0].alt_text}
                  className="hero-image"
                  fetchPriority="high"
                />
              )}
              <div className="hero-overlay">
                <div className="hero-meta">
                  <span className="label">{config.name}</span>
                  {detectService(hero) && (
                    <img
                      src={detectService(hero)!.logo}
                      alt={detectService(hero)!.label}
                      className="hero-service-logo"
                    />
                  )}
                </div>
                <h1 dangerouslySetInnerHTML={{ __html: hero.title.rendered }} />
                <p dangerouslySetInnerHTML={{ __html: hero.excerpt.rendered }} />
              </div>
            </a>
          </section>
        )}

        <div className="container">

          {/* Service filters — only shown for categories that have them (e.g. Streaming) */}
          {config.serviceFilters && config.serviceFilters.length > 0 && (
            <div className="service-filters">
              {config.serviceFilters.map(s => (
                <button
                  key={s.label}
                  className={`service-btn${activeServices.has(s.label) ? " active" : ""}`}
                  onClick={() => toggleService(s.label)}
                  title={s.label}
                >
                  <img src={s.logo} alt={s.label} />
                </button>
              ))}
              {!allSelected && (
                <button className="service-btn clear-btn" onClick={() => setActiveServices(new Set(allServiceLabels))}>
                  Rensa filter ✕
                </button>
              )}
            </div>
          )}

          <div className="month-filters">
            {TIME_FILTERS.map(f => (
              <button
                key={f.key}
                className={`month-btn${(activeTime ?? "alla") === f.key ? " active" : ""}`}
                onClick={() => setActiveTime(f.key === "alla" ? null : f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {topStories.length > 0 && (
            <section className="zone">
              <p className="section-heading">Populära</p>
              <div className="top-stories">
                {topStories.map(post => {
                  const image = post._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
                  const service = detectService(post);
                  return (
                    <a href={post.link} key={post.id} className="card-large" onMouseEnter={() => prefetch(post.link)} onTouchStart={() => prefetch(post.link)}>
                      <div className="card-img-wrap">
                        {image && <img src={image} alt={post._embedded?.["wp:featuredmedia"]?.[0]?.alt_text} className="card-image" loading="lazy" />}
                        {service && <span className="service-badge" style={{ background: service.color }}>{service.label}</span>}
                      </div>
                      <div className="card-body">
                        <h3 dangerouslySetInnerHTML={{ __html: post.title.rendered }} />
                        <p dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }} />
                      </div>
                    </a>
                  );
                })}
              </div>
            </section>
          )}

          {latest.length > 0 && (
            <section className="zone">
              <p className="section-heading">Nyheter</p>
              <div className="latest-grid">
                {latest.map(post => {
                  const image = post._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
                  const service = detectService(post);
                  return (
                    <a href={post.link} key={post.id} className="card" onMouseEnter={() => prefetch(post.link)} onTouchStart={() => prefetch(post.link)}>
                      <div className="card-img-wrap">
                        {image && <img src={image} alt={post._embedded?.["wp:featuredmedia"]?.[0]?.alt_text} className="card-image" loading="lazy" />}
                        {service && <span className="service-badge" style={{ background: service.color }}>{service.label}</span>}
                      </div>
                      <div className="card-body">
                        <h3 dangerouslySetInnerHTML={{ __html: post.title.rendered }} />
                        <p dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }} />
                      </div>
                    </a>
                  );
                })}
              </div>
            </section>
          )}

          {listItems.length > 0 && (
            <section className="zone">
              <p className="section-heading">Fler nyheter</p>
              <div className="list-cards">
                {listItems.map(post => {
                  const image = post._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
                  const service = detectService(post);
                  return (
                    <a href={post.link} key={post.id} className="card-list" onMouseEnter={() => prefetch(post.link)} onTouchStart={() => prefetch(post.link)}>
                      <div className="card-img-wrap">
                        {image && <img src={image} alt={post._embedded?.["wp:featuredmedia"]?.[0]?.alt_text} className="card-list-image" loading="lazy" />}
                        {service && <span className="service-badge" style={{ background: service.color }}>{service.label}</span>}
                      </div>
                      <div className="card-list-body">
                        <span className="card-list-date">{formatDate(post.date)}</span>
                        <h3 dangerouslySetInnerHTML={{ __html: post.title.rendered }} />
                        <p dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }} />
                      </div>
                    </a>
                  );
                })}
              </div>
            </section>
          )}

          {overflow.length > 0 && (
            <section className="zone">
              <p className="section-heading">Arkiv</p>
              <div className="grid">
                {overflow.map(post => {
                  const image = post._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
                  const service = detectService(post);
                  return (
                    <a href={post.link} key={post.id} className="card" onMouseEnter={() => prefetch(post.link)} onTouchStart={() => prefetch(post.link)}>
                      <div className="card-img-wrap">
                        {image && <img src={image} alt={post._embedded?.["wp:featuredmedia"]?.[0]?.alt_text} className="card-image" loading="lazy" />}
                        {service && <span className="service-badge" style={{ background: service.color }}>{service.label}</span>}
                      </div>
                      <div className="card-body">
                        <h3 dangerouslySetInnerHTML={{ __html: post.title.rendered }} />
                        <p dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }} />
                      </div>
                    </a>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>

      <footer className="site-footer">
        <div className="container">
          <p>© {new Date().getFullYear()} Midcent — <a href="https://midcent.se">midcent.se</a></p>
        </div>
      </footer>
    </>
  );
}
