const NAV = [
  { label: "Ekonomi",      href: "https://midcent.se/midcentekonomi/" },
  { label: "Hälsa",        href: "https://midcent.se/midcenthalsa/" },
  { label: "Teknik",       href: "https://midcent.se/midcentteknik/" },
  { label: "Fritid",       href: "https://midcent.se/midcentfritid/" },
  { label: "Samhälle",     href: "https://midcent.se/midcentsamhalle/" },
  { label: "Underhållning",href: "https://midcent.se/midcentunderhallning/" },
  { label: "Mat & Dryck",  href: "https://midcent.se/midcentmat-och-dryck/" },
  { label: "Resa",         href: "https://midcent.se/midcentres/" },
  { label: "Om oss",       href: "https://midcent.se/om-oss/" },
];

export default function Header() {
  return (
    <header className="site-header">
      <div className="header-top">
        <div className="container header-top-inner">
          <a href="https://midcent.se" className="logo">
            <img src="https://midcent.se/wp-content/uploads/New-Midcent-Logo-135.webp" alt="Midcent" className="logo-img" />
          </a>
        </div>
      </div>
      <nav className="site-nav">
        <div className="container">
          <ul className="nav-list">
            {NAV.map(item => (
              <li key={item.label}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}
