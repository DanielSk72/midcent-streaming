import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { wpFetch } from "../lib/wpCache";
import type { WPPost } from "../types/wordpress";
import Header from "../components/Header";

const RELATED_API = "https://midcent.se/wp-json/wp/v2/posts?per_page=8&_embed=wp:featuredmedia";
// Reuse the same URL the home page caches — no extra network request if already visited
const SIMILAR_API  = "https://midcent.se/wp-json/wp/v2/posts?categories=1&per_page=100&_embed=wp:featuredmedia&page=1";

const STOP = new Set(["och", "i", "på", "att", "som", "en", "ett", "är", "av", "med", "den", "det", "de", "för", "till", "om", "men", "han", "hon", "vi", "nu", "från", "the", "a", "an", "of", "in", "to", "and", "is"]);

function score(post: WPPost, words: string[]): number {
  const text = post.title.rendered.toLowerCase();
  return words.filter(w => text.includes(w)).length;
}

function getSimilar(pool: WPPost[], currentSlug: string, title: string): WPPost[] {
  const words = title.toLowerCase().split(/\s+/).filter(w => w.length > 3 && !STOP.has(w));
  return pool
    .filter(p => p.slug !== currentSlug)
    .map(p => ({ p, s: score(p, words) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 3)
    .map(x => x.p);
}

export default function PostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<WPPost | null>(null);
  const [related, setRelated] = useState<WPPost[]>([]);
  const [similar, setSimilar] = useState<WPPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    Promise.all([
      wpFetch<WPPost[]>(`https://midcent.se/wp-json/wp/v2/posts?slug=${slug}&_embed`),
      wpFetch<WPPost[]>(RELATED_API),
      wpFetch<WPPost[]>(SIMILAR_API),
    ]).then(([postData, relatedData, similarPool]) => {
      const p = postData[0] ?? null;
      setPost(p);
      setRelated(relatedData.filter(r => r.slug !== slug));
      if (p) setSimilar(getSimilar(similarPool, slug, p.title.rendered.replace(/<[^>]+>/g, "")));
      setLoading(false);
    });
  }, [slug]);

  if (loading) return <div className="loading">Laddar...</div>;
  if (!post) return <div className="loading">Hittades inte.</div>;

  const image = post._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
  const plainTitle = post.title.rendered.replace(/<[^>]+>/g, "");
  const plainExcerpt = post.excerpt.rendered.replace(/<[^>]+>/g, "");

  return (
    <>
      <Helmet>
        <title>{plainTitle} — Midcent Streaming</title>
        <meta name="description" content={plainExcerpt} />
        <meta property="og:title" content={plainTitle} />
        <meta property="og:description" content={plainExcerpt} />
        <meta property="og:type" content="article" />
        {image && <meta property="og:image" content={image} />}
        <link rel="canonical" href={`https://streaming.midcent.se/${slug}`} />
      </Helmet>

      <Header />

      <main className="post-layout container">
        <article className="post-main">
          <Link to="/" className="back">← Streaming</Link>
          {image && <img src={image} alt={plainTitle} className="post-image" fetchPriority="high" />}
          <h1 dangerouslySetInnerHTML={{ __html: post.title.rendered }} />
          <div className="post-body" dangerouslySetInnerHTML={{ __html: post.content.rendered }} />
          <a href={post.link} className="read-more" target="_blank" rel="noopener noreferrer">
            <span>Läs mer på Midcent</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>

          {similar.length > 0 && (
            <section className="similar-posts">
              <h2 className="similar-heading">Liknande artiklar</h2>
              <div className="similar-grid">
                {similar.map(p => {
                  const img = p._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
                  return (
                    <Link to={`/${p.slug}`} key={p.id} className="similar-card">
                      {img && <img src={img} alt={p.title.rendered.replace(/<[^>]+>/g, "")} className="similar-img" loading="lazy" />}
                      <div className="similar-body">
                        <h3 dangerouslySetInnerHTML={{ __html: p.title.rendered }} />
                        <p dangerouslySetInnerHTML={{ __html: p.excerpt.rendered }} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </article>

        <aside className="post-sidebar">
          <h2 className="sidebar-heading">Mer från Midcent</h2>
          <div className="sidebar-posts">
            {related.map(p => {
              const img = p._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
              return (
                <a key={p.id} href={p.link} className="sidebar-card" target="_blank" rel="noopener noreferrer">
                  {img && <img src={img} alt={p.title.rendered.replace(/<[^>]+>/g, "")} className="sidebar-img" loading="lazy" />}
                  <div className="sidebar-card-body">
                    <span dangerouslySetInnerHTML={{ __html: p.title.rendered }} />
                    <p dangerouslySetInnerHTML={{ __html: p.excerpt.rendered }} />
                  </div>
                </a>
              );
            })}
          </div>
        </aside>
      </main>

      <footer className="site-footer">
        <div className="container">
          <p>© {new Date().getFullYear()} Midcent — <a href="https://midcent.se">midcent.se</a></p>
        </div>
      </footer>
    </>
  );
}
