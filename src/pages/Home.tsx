import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { wpFetch, wpFetchPaged } from "../lib/wpCache";
import type { WPPost } from "../types/wordpress";
import Header from "../components/Header";

const BASE = "https://midcent.se/wp-json/wp/v2/posts";
const SERVICES = [
  { label: "Netflix",      color: "#E50914", terms: ["netflix"] },
  { label: "HBO Max",      color: "#6A0DAD", terms: ["hbo", "hbo max", "hbomax"] },
  { label: "Disney+",      color: "#1B4FBB", terms: ["disney+", "disney plus", "disneyplus", "disney+"] },
  { label: "Amazon Prime", color: "#1A6DB5", terms: ["amazon prime", "prime video", "amazon video"] },
  { label: "Apple TV+",    color: "#000000", terms: ["apple tv+", "apple tv plus", "appletv", "apple tv"] },
  { label: "Viaplay",      color: "#C1143C", terms: ["viaplay"] },
  { label: "Showtime",     color: "#B22222", terms: ["showtime"] },
];

function isBookReview(post: WPPost): boolean {
  return post.class_list?.includes("tag-bokrecension") ?? false;
}

const LIST_PARAMS = "categories=1&per_page=100&_embed=wp:featuredmedia";

async function fetchAll(): Promise<WPPost[]> {
  const page1url = `${BASE}?${LIST_PARAMS}&page=1`;
  const { data: page1, totalPages } = await wpFetchPaged<WPPost[]>(page1url);

  const rest = totalPages > 1
    ? await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, i) =>
          wpFetch<WPPost[]>(`${BASE}?${LIST_PARAMS}&page=${i + 2}`)
        )
      )
    : [];

  return [page1, ...rest].flat().filter(p => !isBookReview(p));
}

const NOW = Date.now();
const DAYS_30 = 30 * 24 * 60 * 60 * 1000;
const YEARS_5 = 5 * 365.25 * 24 * 60 * 60 * 1000;

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

export default function Home() {
  const [posts, setPosts] = useState<WPPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeServices, setActiveServices] = useState<Set<string>>(new Set());
  const [activeMonth, setActiveMonth] = useState<string | null>(null);

  function toggleService(label: string) {
    setActiveServices(prev => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }

  useEffect(() => {
    fetchAll().then((data) => {
      setPosts(data);
      setLoading(false);
    });
  }, []);

  const filtered = activeServices.size > 0
    ? posts.filter(p =>
        Array.from(activeServices).some(label =>
          matchesService(p, SERVICES.find(s => s.label === label)!.terms)
        )
      )
    : posts;

  const timePosts = filterByTime(filtered, activeMonth ?? "alla");
  const hero = timePosts[0];
  const rest = timePosts.slice(1);

  return (
    <>
      <Helmet>
        <title>Streaming — Midcent</title>
        <meta name="description" content="Bästa tips om film, serier och streaming för dig som vet vad du vill se." />
        <link rel="canonical" href="https://streaming.midcent.se" />
      </Helmet>

      <Header />

      <main>
        {loading && <div className="loading">Laddar...</div>}

        {hero && (
          <section className="hero">
            <Link to={`/${hero.slug}`}>
              {hero._embedded?.["wp:featuredmedia"]?.[0]?.source_url && (
                <img
                  src={hero._embedded["wp:featuredmedia"][0].source_url}
                  alt={hero._embedded["wp:featuredmedia"][0].alt_text}
                  className="hero-image"
                  fetchPriority="high"
                />
              )}
              <div className="hero-overlay">
                <span className="label">Streaming</span>
                <h1 dangerouslySetInnerHTML={{ __html: hero.title.rendered }} />
                <p dangerouslySetInnerHTML={{ __html: hero.excerpt.rendered }} />
              </div>
            </Link>
          </section>
        )}

        <div className="container">
          <div className="service-filters">
            {SERVICES.map(s => (
              <button
                key={s.label}
                className={`service-btn${activeServices.has(s.label) ? " active" : ""}`}
                style={{ background: s.color }}
                onClick={() => toggleService(s.label)}
              >
                {s.label}
              </button>
            ))}
            {activeServices.size > 0 && (
              <button className="service-btn clear-btn" onClick={() => setActiveServices(new Set())}>
                Rensa filter ✕
              </button>
            )}
          </div>

          <div className="month-filters">
            {TIME_FILTERS.map(f => (
              <button
                key={f.key}
                className={`month-btn${(activeMonth ?? "alla") === f.key ? " active" : ""}`}
                onClick={() => setActiveMonth(f.key === "alla" ? null : f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="grid">
            {rest.map((post) => {
              const image = post._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
              return (
                <Link to={`/${post.slug}`} key={post.id} className="card">
                  {image && <img src={image} alt={post._embedded?.["wp:featuredmedia"]?.[0]?.alt_text} className="card-image" loading="lazy" />}
                  <div className="card-body">
                    <h3 dangerouslySetInnerHTML={{ __html: post.title.rendered }} />
                    <p dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }} />
                  </div>
                </Link>
              );
            })}
          </div>
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
