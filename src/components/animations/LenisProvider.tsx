"use client";

import { ReactNode, useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function LenisProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
    const lenis = new Lenis({
      duration: isTouchDevice ? 0.8 : 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: isTouchDevice ? 0.85 : 1,
      touchMultiplier: 1,
      infinite: false,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const update = (time: number) => {
      lenis.raf(time * 1000);
    };

    const refresh = () => {
      ScrollTrigger.refresh();
    };

    // Recalculate ScrollTrigger positions after responsive layout changes
    // (orientation change, browser-zoom breakpoint switches, etc.).
    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => ScrollTrigger.refresh(), 200);
    };

    const handleScrollTo = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      lenis.scrollTo(customEvent.detail, {
        duration: 1.2,
        offset: 0,
      });
    };

    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    window.addEventListener("load", refresh);
    window.addEventListener("resize", handleResize);
    window.addEventListener("lenis-scroll-to", handleScrollTo);

    requestAnimationFrame(refresh);

    return () => {
      gsap.ticker.remove(update);
      window.removeEventListener("load", refresh);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("lenis-scroll-to", handleScrollTo);
      clearTimeout(resizeTimer);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
