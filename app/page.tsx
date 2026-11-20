import Image from "next/image";
import Link from "next/link";
import { io } from "next/cache";
import { Suspense } from "react";
import { getGalleryItems } from "@/lib/gallery";

export default function Home() {
  return (
    <main className="site-shell">
      <header className="site-header">
        <Link className="wordmark" href="/" aria-label="Forma home">
          forma<span>.</span>
        </Link>
        <p className="header-note">A little gallery of lovely things</p>
        <Link className="admin-link" href="/admin">
          <span className="admin-link-dot" />
          Admin
          <span aria-hidden="true">↗</span>
        </Link>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><span /> THE OBJECT EDIT · NO. 01</p>
          <h1>Good things,<br /><em>found.</em></h1>
          <p className="hero-description">
            A considered collection of pieces worth keeping. Browse the latest
            finds, all gathered in one place.
          </p>
          <a className="text-link" href="#gallery">
            Explore the collection <span aria-hidden="true">↓</span>
          </a>
        </div>
        <div className="hero-aside" aria-hidden="true">
          <span className="hero-aside-mark">f.</span>
          <span className="hero-aside-caption">CURATED WITH CARE<br />MADE TO BE KEPT</span>
          <span className="hero-aside-line" />
        </div>
        <span className="hero-index">01 — 26</span>
      </section>

      <Suspense fallback={<section className="collection-section"><div className="gallery-loading">Gathering the collection…</div></section>}>
        <CollectionSection />
      </Suspense>

      <footer className="site-footer">
        <Link className="wordmark" href="/">forma<span>.</span></Link>
        <p>Good things are meant to be shared.</p>
        <span>FORMA · OBJECTS TO KEEP</span>
      </footer>
    </main>
  );
}

async function CollectionSection() {
  await io();
  const items = await getGalleryItems();

  if (items.length === 0) {
    return (
      <section className="collection-section" id="gallery">
        <div className="section-heading">
          <div>
            <p className="eyebrow">THE COLLECTION</p>
            <h2>Pieces with a point of view</h2>
          </div>
          <p className="collection-count">00 <span>OBJECTS</span></p>
        </div>
        <div className="empty-gallery">
          <span className="empty-mark" aria-hidden="true">✳</span>
          <p className="empty-kicker">A FRESH CANVAS</p>
          <h3>The first find is yours to add.</h3>
          <p>Upload an image, give it a name, and a price, and it will appear here.</p>
          <Link className="button button-dark" href="/admin">
            Add the first piece <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="collection-section" id="gallery">
      <div className="section-heading">
        <div>
          <p className="eyebrow">THE COLLECTION</p>
          <h2>Pieces with a point of view</h2>
        </div>
        <p className="collection-count">
          {String(items.length).padStart(2, "0")} <span>OBJECTS</span>
        </p>
      </div>
      <div className="gallery-grid">
        {items.map((item, index) => (
          <article className="gallery-card" key={item.id}>
            <div className="gallery-image-wrap">
              <Image
                className="gallery-image"
                src={item.imageUrl}
                alt={item.name}
                fill
                sizes="(max-width: 700px) 100vw, (max-width: 1050px) 50vw, 33vw"
              />
              <span className="image-index">{String(index + 1).padStart(2, "0")}</span>
            </div>
            <div className="card-details">
              <h3>{item.name}</h3>
              <p className="price">{formatPrice(item.price)}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(price);
}
