import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { wpFetch } from "../lib/wpCache";
import type { WPPost } from "../types/wordpress";

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

async function fetchAll(): Promise<WPPost[]> {
  let page = 1;
  const all: WPPost[] = [];
  while (true) {
    const batch = await wpFetch<WPPost[]>(
      `${BASE}?categories=1&per_page=100&page=${page}&_embed`
    );
    if (!batch.length) break;
    all.push(...batch);
    if (batch.length < 100) break;
    page++;
  }
  return all.filter(p => !isBookReview(p));
}

function monthKey(date: string) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [year, month] = key.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleString("sv-SE", { month: "long", year: "numeric" });
}

function groupByMonth(posts: WPPost[]): Array<{ key: string; label: string; posts: WPPost[] }> {
  const map = new Map<string, WPPost[]>();
  for (const post of posts) {
    const key = monthKey(post.date);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(post);
  }
  return Array.from(map.entries()).map(([key, posts]) => ({ key, label: monthLabel(key), posts }));
}

function matchesService(post: WPPost, terms: string[]): boolean {
  const text = (post.title.rendered + " " + post.excerpt.rendered + " " + post.content.rendered).toLowerCase();
  return terms.some(t => text.includes(t.toLowerCase()));
}

export default function Home() {
  const [posts, setPosts] = useState<WPPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<string | null>(null);
  const [activeMonth, setActiveMonth] = useState<string | null>(null);

  useEffect(() => {
    fetchAll().then((data) => {
      setPosts(data);
      setLoading(false);
    });
  }, []);

  const filtered = active
    ? posts.filter(p => matchesService(p, SERVICES.find(s => s.label === active)!.terms))
    : posts;

  const months = groupByMonth(filtered);
  const hero = filtered[0];

  const visibleMonths = activeMonth
    ? months.filter(m => m.key === activeMonth)
    : months;

  return (
    <>
      <Helmet>
        <title>Streaming — Midcent</title>
        <meta name="description" content="Bästa tips om film, serier och streaming för dig som vet vad du vill se." />
        <link rel="canonical" href="https://streaming.midcent.se" />
      </Helmet>

      <header className="site-header">
        <div className="container">
          <a href="https://midcent.se" className="logo">
            <img src="https://midcent.se/wp-content/uploads/New-Midcent-Logo-135.webp" alt="Midcent" className="logo-img" />
          </a>
          <nav>
            <a href="https://midcent.se/underhallning">Underhållning</a>
            <a href="https://midcent.se">Till sajten</a>
          </nav>
        </div>
      </header>

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
            <button
              className={`service-btn${active === null ? " active" : ""}`}
              style={{ background: "#555" }}
              onClick={() => setActive(null)}
            >
              Alla
            </button>
            {SERVICES.map(s => (
              <button
                key={s.label}
                className={`service-btn${active === s.label ? " active" : ""}`}
                style={{ background: s.color }}
                onClick={() => setActive(active === s.label ? null : s.label)}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="month-filters">
            <button
              className={`month-btn${activeMonth === null ? " active" : ""}`}
              onClick={() => setActiveMonth(null)}
            >
              Alla månader
            </button>
            {months.map(m => (
              <button
                key={m.key}
                className={`month-btn${activeMonth === m.key ? " active" : ""}`}
                onClick={() => setActiveMonth(activeMonth === m.key ? null : m.key)}
              >
                {m.label}
              </button>
            ))}
          </div>

          {visibleMonths.map(({ key, label, posts: monthPosts }) => (
            <div key={key} className="month-section">
              <h2 className="month-heading">{label}</h2>
              <div className="grid">
                {monthPosts.map((post) => {
                  const image = post._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
                  return (
                    <Link to={`/${post.slug}`} key={post.id} className="card">
                      {image && <img src={image} alt={post._embedded?.["wp:featuredmedia"]?.[0]?.alt_text} className="card-image" />}
                      <div className="card-body">
                        <h3 dangerouslySetInnerHTML={{ __html: post.title.rendered }} />
                        <p dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
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
