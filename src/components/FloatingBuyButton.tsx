"use client";

import { useEffect, useRef, useState } from "react";
import { scrollToSection } from "@/lib/scrollTo";

const TARGET_ID = "offers";

export default function FloatingBuyButton() {
  const [hidden, setHidden] = useState(false);
  const firedRef = useRef(false);

  useEffect(() => {
    const section = document.getElementById(TARGET_ID);
    if (!section) return;

    // Hide when the Offers section is meaningfully visible so the button never
    // covers the quantity controls. Use IntersectionObserver, not scroll events.
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setHidden(entry.isIntersecting);
      },
      { threshold: 0.2 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const handleClick = () => {
    // Jump to the Offers/quantity section via the existing Lenis smooth-scroll
    // helper. This does NOT open Salla checkout or create a cart.
    scrollToSection(`#${TARGET_ID}`);

    // Optionally fire a single TikTok ClickButton event (no product selected
    // yet, so no AddToCart / InitiateCheckout is sent from here).
    const ttq = (
      window as unknown as {
        ttq?: { track?: (e: string, p?: object) => void };
      }
    ).ttq;
    if (ttq && typeof ttq.track === "function") {
      ttq.track("ClickButton", { button: "floating_buy" });
      firedRef.current = true;
    }
  };

  return (
    <button
      type="button"
      className={`buy-fab${hidden ? " buy-fab--hidden" : ""}`}
      aria-label="انتقل إلى خيارات الشراء"
      onClick={handleClick}
    >
      <span className="buy-fab__inner">
        <svg
          className="buy-fab__icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M6 7h12l-1 13H7L6 7z" />
          <path d="M9 7a3 3 0 0 1 6 0" />
        </svg>
        <span className="buy-fab__label">اشتري الآن</span>
      </span>
    </button>
  );
}
