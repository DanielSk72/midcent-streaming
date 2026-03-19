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
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
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
          {/* Search toggle button — top right, shows X when open */}
          <button
            className="nav-search-btn"
            onClick={() => { setSearchOpen(o => !o); setQuery(""); }}
            aria-label="Sök"
          >
            {searchOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Search dropdown panel — full width, below header bar */}
      {searchOpen && (
        <div className="search-dropdown">
          <form onSubmit={handleSearch} className="search-dropdown-form">
            <input
              ref={searchInputRef}
              className="search-dropdown-input"
              type="search"
              placeholder="Sök Midcent .."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Escape" && setSearchOpen(false)}
            />
            <button type="submit" className="search-dropdown-submit" aria-label="Sök">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
          </form>
        </div>
      )}

      <nav className={`site-nav${open ? " nav-open" : ""}`}>
        <div className="container nav-inner">
          <ul className="nav-list">
            {NAV.map(item => (
              <li key={item.label}>
                <a href={item.href} onClick={() => setOpen(false)}>{item.label}</a>
              </li>
            ))}
          </ul>
          {/* Desktop search — button + expanding input at right end of nav */}
          <div className={`nav-search desktop-search${searchOpen ? " nav-search--open" : ""}`}>
            <form onSubmit={handleSearch} className="nav-search-form">
              <input
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
              onClick={() => { setSearchOpen(o => !o); setQuery(""); }}
              aria-label="Sök"
            >
              {searchOpen ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}
