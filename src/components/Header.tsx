import { useState, useRef, useEffect } from "react";

const NAV = [
  { label: "Ekonomi",           href: "https://midcent.se/midcentekonomi/" },
  { label: "Hälsa",             href: "https://midcent.se/midcenthalsa/" },
  { label: "Teknik",            href: "https://midcent.se/midcentteknik/" },
  { label: "Fritid",            href: "https://midcent.se/midcentfritid/" },
  { label: "Samhälle",          href: "https://midcent.se/midcentsamhalle/" },
  { label: "Underhållning ∨",   href: "https://midcent.se/midcentunderhallning/" },
  { label: "Mat & Dryck",       href: "https://midcent.se/midcentmat-och-dryck/" },
  { label: "Res",               href: "https://midcent.se/midcentres/" },
  { label: "Om oss",            href: "https://midcent.se/om-oss/" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  function handleSearch(e: { preventDefault(): void }) {
    e.preventDefault();
    const term = query.trim();
    if (term) window.location.href = `https://midcent.se/?s=${encodeURIComponent(term)}`;
  }

  return (
    <header className="site-header">
      <div className="header-top">
        <div className="container header-top-inner">
          <button className="hamburger" onClick={() => setOpen(o => !o)} aria-label="Meny">
            <span className={`ham-line${open ? " open" : ""}`} />
            <span className={`ham-line${open ? " open" : ""}`} />
            <span className={`ham-line${open ? " open" : ""}`} />
          </button>
          <a href="https://midcent.se" className="logo">
            <img src="https://midcent.se/wp-content/uploads/New-Midcent-Logo-135.webp" alt="Midcent" className="logo-img" />
          </a>
          <a href="https://streaming.midcent.se" className="streaming-btn">Streaming</a>
        </div>
      </div>
      <nav className={`site-nav${open ? " nav-open" : ""}`}>
        <div className="container nav-inner">
          <ul className="nav-list">
            {NAV.map(item => (
              <li key={item.label}>
                <a href={item.href} onClick={() => setOpen(false)}>{item.label}</a>
              </li>
            ))}
          </ul>
          <div className={`nav-search${searchOpen ? " nav-search--open" : ""}`}>
            <form onSubmit={handleSearch} className="nav-search-form">
              <input
                ref={inputRef}
                className="nav-search-input"
                type="search"
                placeholder="Sök på Midcent…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Escape" && setSearchOpen(false)}
              />
            </form>
            <button
              className="nav-search-btn"
              onClick={() => setSearchOpen(o => !o)}
              aria-label="Sök"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}
