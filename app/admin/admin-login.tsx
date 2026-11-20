"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Props = {
  credentialsConfigured: boolean;
};

export default function AdminLogin({ credentialsConfigured }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.get("username"),
          password: formData.get("password"),
        }),
      });
      const result: { error?: string } = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Could not sign in. Please try again.");
        return;
      }

      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="login-wrap">
      <div className="login-card">
        <span className="login-lock" aria-hidden="true">⌑</span>
        <p className="eyebrow">PRIVATE AREA</p>
        <h2>{credentialsConfigured ? "Welcome back." : "One last setup."}</h2>
        {credentialsConfigured ? (
          <>
            <p className="login-description">Enter your admin credentials to manage the collection.</p>
            <form className="upload-form" onSubmit={handleSubmit}>
              <label className="field-label" htmlFor="admin-username">Username</label>
              <input
                autoComplete="username"
                id="admin-username"
                name="username"
                type="text"
                required
              />
              <label className="field-label" htmlFor="admin-password">Password</label>
              <input
                autoComplete="current-password"
                id="admin-password"
                name="password"
                type="password"
                required
              />
              {error && <p className="form-error" role="alert">{error}</p>}
              <button className="button button-dark submit-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Signing in…" : "Sign in"}
                <span aria-hidden="true">↗</span>
              </button>
            </form>
          </>
        ) : (
          <p className="login-description">
            Set <code>GALARY_ADMIN_USERNAME</code> and <code>GALARY_ADMIN_PASSWORD</code> in your{" "}
            <code>.env.local</code> file, then restart the server to enable admin access.
          </p>
        )}
      </div>
    </section>
  );
}
