import Link from "next/link";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { adminCookieName, isAdminCredentialsConfigured, isValidAdminSession } from "@/lib/admin-auth";
import { getGalleryItems } from "@/lib/gallery";
import AdminGallery from "./admin-gallery";
import AdminLogin from "./admin-login";

export default function AdminPage() {
  return (
    <main className="site-shell admin-shell">
      <header className="site-header">
        <Link className="wordmark" href="/">
          forma<span>.</span>
        </Link>
        <p className="header-note">Collection management</p>
        <Link className="admin-link" href="/">
          <span aria-hidden="true">←</span>
          View gallery
        </Link>
      </header>

      <section className="admin-intro">
        <p className="eyebrow"><span /> THE BACK OFFICE</p>
        <h1>Add a new <em>find.</em></h1>
        <p>Give your next piece a name, set its price, and let it take its place in the collection.</p>
      </section>

      <Suspense fallback={<div className="gallery-loading admin-loading">Loading your collection…</div>}>
        <AdminContents />
      </Suspense>

      <footer className="site-footer">
        <Link className="wordmark" href="/">forma<span>.</span></Link>
        <p>Good things are meant to be shared.</p>
        <span>FORMA · COLLECTION MANAGEMENT</span>
      </footer>
    </main>
  );
}

async function AdminContents() {
  const credentialsConfigured = isAdminCredentialsConfigured();
  const cookieStore = await cookies();
  const token = cookieStore.get(adminCookieName)?.value;
  if (!credentialsConfigured || !isValidAdminSession(token)) {
    return <AdminLogin credentialsConfigured={credentialsConfigured} />;
  }

  const items = await getGalleryItems();
  return <AdminGallery initialItems={items} />;
}
