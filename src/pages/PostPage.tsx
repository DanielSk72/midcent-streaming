import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { wpFetch } from "../lib/wpCache";
import type { WPPost } from "../types/wordpress";

const RELATED_API = "https://midcent.se/wp-json/wp/v2/posts?per_page=8&_embed&_fields=id,slug,link,title,excerpt,_embedded";

export default function PostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<WPPost | null>(null);
  const [related, setRelated] = useState<WPPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    Promise.all([
      wpFetch<WPPost[]>(`https://midcent.se/wp-json/wp/v2/posts?slug=${slug}&_embed`),
      wpFetch<WPPost[]>(RELATED_API),
    ]).then(([postData, relatedData]) => {
      setPost(postData[0] ?? null);
      setRelated(relatedData.filter(p => p.slug !== slug));
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

      <main className="post-layout container">
        <article className="post-main">
          <Link to="/" className="back">← Streaming</Link>
          {image && <img src={image} alt={plainTitle} className="post-image" />}
          <h1 dangerouslySetInnerHTML={{ __html: post.title.rendered }} />
          <div className="post-body" dangerouslySetInnerHTML={{ __html: post.content.rendered }} />
          <a href={post.link} className="read-more" target="_blank" rel="noopener noreferrer">
            Läs mer på Midcent →
          </a>
        </article>

        <aside className="post-sidebar">
          <h2 className="sidebar-heading">Mer från Midcent</h2>
          <div className="sidebar-posts">
            {related.map(p => {
              const img = p._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
              return (
                <a key={p.id} href={p.link} className="sidebar-card" target="_blank" rel="noopener noreferrer">
                  {img && <img src={img} alt={p.title.rendered.replace(/<[^>]+>/g, "")} className="sidebar-img" />}
                  <span dangerouslySetInnerHTML={{ __html: p.title.rendered }} />
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
