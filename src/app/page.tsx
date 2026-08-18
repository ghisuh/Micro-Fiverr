import Link from "next/link";

const categories = [
  ["✦", "Design", "Brand, product & web"],
  ["⌘", "Development", "Websites & software"],
  ["◉", "Marketing", "Growth & strategy"],
  ["Aa", "Writing", "Words that move people"],
];

export default function HomePage() {
  return (
    <main className="home-shell">
      <section className="hero wrap">
        <div className="hero-copy">
          <div className="eyebrow">Independent talent, thoughtfully matched</div>
          <h1>Big ideas.<br /><em>Beautifully done.</em></h1>
          <p>Find exceptional people for the work that matters—without the noise, the endless scrolling, or the guesswork.</p>
          <div className="hero-actions">
            <Link href="/gigs" className="button button-dark button-large">Explore services <span>↗</span></Link>
            <Link href="/signup" className="text-link">Start selling <span>→</span></Link>
          </div>
          <div className="trust-row">
            <div className="avatar-stack" aria-hidden="true"><i>AM</i><i>JL</i><i>SK</i></div>
            <p><strong>4.9 average rating</strong><br />from 2,000+ happy projects</p>
          </div>
        </div>

        <div className="hero-visual" aria-label="Featured service">
          <div className="orb orb-one" /><div className="orb orb-two" />
          <article className="featured-card">
            <div className="card-art">
              <span className="available-pill">● Available this week</span>
              <div className="art-window"><span /><span /><span /></div>
            </div>
            <div className="featured-body">
              <div><p className="card-kicker">FEATURED · WEB DESIGN</p><h2>I&apos;ll craft a website people remember.</h2></div>
              <div className="seller-row"><div className="seller-avatar">G</div><div><strong>Ghisuh Na</strong><span>Top independent · 5.0 ★</span></div><b>from $320</b></div>
            </div>
          </article>
          <div className="floating-note note-one"><b>48h</b><span>avg. response</span></div>
          <div className="floating-note note-two"><b>✓</b><span>Project protected</span></div>
        </div>
      </section>

      <section className="category-section wrap">
        <div className="section-heading"><div><span>WHAT DO YOU NEED?</span><h2>Start with a direction.</h2></div><Link href="/gigs">View all services →</Link></div>
        <div className="category-grid">
          {categories.map(([icon, title, copy]) => <Link href={`/gigs?tag=${title.toLowerCase()}`} className="category-card" key={title}><span className="category-icon">{icon}</span><div><h3>{title}</h3><p>{copy}</p></div><b>↗</b></Link>)}
        </div>
      </section>

      <section className="promise-section">
        <div className="wrap promise-grid">
          <div><span className="eyebrow light">The micro promise</span><h2>Less marketplace.<br />More momentum.</h2></div>
          <div className="promise-list">
            <article><b>01</b><div><h3>Quality, made visible.</h3><p>Clear portfolios, real reviews, and straightforward packages. Know exactly who you&apos;re hiring.</p></div></article>
            <article><b>02</b><div><h3>Protected from hello to done.</h3><p>Your payment stays secure until the work is delivered and you&apos;re ready to approve it.</p></div></article>
            <article><b>03</b><div><h3>Built for getting things done.</h3><p>Simple messages, clear milestones, and no platform clutter between you and great work.</p></div></article>
          </div>
        </div>
      </section>
    </main>
  );
}
