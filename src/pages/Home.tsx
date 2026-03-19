import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { wpFetch } from "../lib/wpCache";
import type { WPPost } from "../types/wordpress";

const BASE = "https://midcent.se/wp-json/wp/v2/posts";
const SERVICES = [
  { label: "Netflix",      color: "#E50914", search: "netflix" },
  { label: "HBO Max",      color: "#6A0DAD", search: "hbo" },
  { label: "Disney+",      color: "#1B4FBB", search: "disney" },
  { label: "Amazon Prime", color: "#1A6DB5", search: "amazon prime" },
  { label: "Apple TV+",    color: "#000000", search: "apple tv" },
  { label: "Viaplay",      color: "#C1143C", search: "viaplay" },
  { label: "Showtime",     color: "#B22222", search: "showtime" },
];

function isBookReview(post: WPPost): boolean {
  return post.class_list?.includes("tag-bokrecension") ?? false;
}

async function fetchAll(): Promise<WPPost[]> {
  const posts = await wpFetch<WPPost[]>(`${BASE}?categories=1&per_page=100&_embed`);
  return posts.filter(p => !isBookReview(p));
}

function matchesService(post: WPPost, service: string): boolean {
  const text = (post.title.rendered + " " + post.excerpt.rendered + " " + post.content.rendered).toLowerCase();
  return text.includes(service.toLowerCase());
}

export default function Home() {
  const [posts, setPosts] = useState<WPPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    fetchAll().then((data) => {
      setPosts(data);
      setLoading(false);
    });
  }, []);

  const filtered = active
    ? posts.filter(p => matchesService(p, SERVICES.find(s => s.label === active)!.search))
    : posts;

  const [hero, ...rest] = filtered;

  return (
    <>
      <Helmet>
        <title>Streaming — Midcent</title>
        <meta name="description" content="Bästa tips om film, serier och streaming för dig som vet vad du vill se." />
        <link rel="canonical" href="https://streaming.midcent.se" />
      </Helmet>

      <header className="site-header">
        <div className="container">
          <a href="https://midcent.se" className="logo"><img src="https://midcent.se/wp-content/uploads/New-Midcent-Logo-135.webp" alt="Midcent" className="logo-img" /></a>
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

          <div className="grid">
            {rest.map((post) => {
              const image = post._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
              return (
                <Link to={`/${post.slug}`} key={post.id} className="card">
                  {image && <img src={image} alt={post._embedded?.["wp:featuredmedia"]?.[0]?.alt_text} className="card-image" />}
                  <div className="card-body">
                    <h2 dangerouslySetInnerHTML={{ __html: post.title.rendered }} />
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
