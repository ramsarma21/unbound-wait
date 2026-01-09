"use client";

import { useState } from "react";
import Image from "next/image";

export default function WaitlistPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notified, setNotified] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setNotified(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

    try {
      const response = await fetch(
        apiBase ? `${apiBase}/waitlist` : "/api/waitlist",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        }
      );

      if (!response.ok) {
        throw new Error("Request failed");
      }

      event.currentTarget.reset();
      setNotified(true);
    } catch (error) {
      // Keep optimistic "Notified!" even if the request errors.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="waitlist-page">
      <div className="waitlist-shell">
        <section className="waitlist-visual">
          <div className="logo-frame">
            <Image
              src="/unbounded.jpeg"
              alt="Unbounded"
              width={360}
              height={360}
              priority
            />
          </div>
        </section>
        <section className="waitlist-card">
          <p className="eyebrow">Unbounded</p>
          <h1>Join the waitlist</h1>
          <p className="lede">
            Be first to hear about launches, updates, and early access.
          </p>
          <form className="waitlist-form" onSubmit={handleSubmit}>
            <label className="field">
              <span>Email</span>
              <input
                name="email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                required
              />
            </label>
            <button className="primary" type="submit">
              {isSubmitting ? "Sending..." : notified ? "Notified!" : "Notify me"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
