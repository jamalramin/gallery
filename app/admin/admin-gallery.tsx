"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { GalleryItem } from "@/lib/gallery";

type Props = {
  initialItems: GalleryItem[];
};

export default function AdminGallery({ initialItems }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError("");
    setIsSaving(true);

    try {
      const formData = new FormData(form);
      const response = await fetch("/api/gallery", {
        method: "POST",
        body: formData,
      });
      const result: { item?: GalleryItem; error?: string } = await response.json();

      if (!response.ok || !result.item) {
        setError(result.error ?? "Could not save this item. Please try again.");
        return;
      }

      const item = result.item;
      setItems((currentItems) => [item, ...currentItems]);
      form.reset();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSignOut() {
    setIsSigningOut(true);
    setError("");
    try {
      const response = await fetch("/api/admin/logout", { method: "POST" });
      if (!response.ok) {
        setError("Could not sign out. Please try again.");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="admin-content">
      <section className="upload-panel">
        <div className="panel-heading">
          <span className="panel-number">01</span>
          <div>
            <p className="eyebrow">NEW OBJECT</p>
            <h2>Item details</h2>
          </div>
        </div>

        <form className="upload-form" onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="item-name">Name</label>
          <input
            id="item-name"
            name="name"
            type="text"
            placeholder="e.g. Studio ceramic vase"
            maxLength={80}
            required
          />

          <label className="field-label" htmlFor="item-price">Price</label>
          <div className="price-input">
            <span aria-hidden="true">$</span>
            <input
              id="item-price"
              name="price"
              type="number"
              min="0.01"
              max="9999999999.99"
              step="0.01"
              placeholder="0.00"
              required
            />
            <span className="currency-note">USD</span>
          </div>

          <label className="field-label" htmlFor="item-image">Image</label>
          <label className="file-drop" htmlFor="item-image">
            <span className="upload-icon" aria-hidden="true">↑</span>
            <span className="file-drop-title">Choose an image to upload</span>
            <span className="file-drop-note">JPEG, PNG, WebP or GIF · up to 5 MB</span>
            <input
              id="item-image"
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              required
            />
          </label>

          {error && <p className="form-error" role="alert">{error}</p>}

          <button className="button button-dark submit-button" type="submit" disabled={isSaving}>
            {isSaving ? "Adding to collection…" : "Add to collection"}
            <span aria-hidden="true">{isSaving ? "…" : "↗"}</span>
          </button>
        </form>
        <p className="storage-note">Your items are saved and shown in the public gallery.</p>
      </section>

      <section className="inventory-panel">
        <div className="inventory-heading">
          <div>
            <p className="eyebrow">IN THE GALLERY</p>
            <h2>Current collection</h2>
          </div>
          <div className="inventory-actions">
            <button className="sign-out-button" onClick={handleSignOut} type="button" disabled={isSigningOut}>
              {isSigningOut ? "Signing out…" : "Sign out"}
            </button>
            <span className="inventory-count">{String(items.length).padStart(2, "0")}</span>
          </div>
        </div>
        {items.length > 0 ? (
          <div className="inventory-list">
            {items.map((item) => (
              <article className="inventory-item" key={item.id}>
                <div className="inventory-thumb">
                  <Image src={item.imageUrl} alt="" fill sizes="64px" />
                </div>
                <div className="inventory-info">
                  <h3>{item.name}</h3>
                  <p>{formatPrice(item.price)}</p>
                </div>
                <span className="inventory-status"><span /> LIVE</span>
              </article>
            ))}
          </div>
        ) : (
          <div className="inventory-empty">
            <span aria-hidden="true">✳</span>
            <p>Your collection is waiting for its first piece.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(price);
}
