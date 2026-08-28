'use client';

import { useEffect } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';

// Global image reveal: wraps every content image in an outer/inner pair and
// plays the classic opposing-slide reveal on scroll.
export default function ImageReveal() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      const viewportH = window.innerHeight;
      const imgs = Array.from(
        document.querySelectorAll<HTMLImageElement>('img')
      ).filter((img) => {
        if (img.closest('.promo')) return false;
        if (img.closest('nav') || img.closest('.navbar') || img.closest('.salla-footer')) return false;
        if (img.closest('[data-no-reveal]')) return false;
        if (img.classList.contains('problem-product-image')) return false;
        if (img.closest('.problem-product-scale')) return false;
        // Skip above-fold images — they're already visible, avoid DOM
        // mutation and ScrollTrigger overhead on the critical LCP area.
        const rect = img.getBoundingClientRect();
        if (rect.top < viewportH && rect.bottom > 0) return false;
        return true;
      });

      imgs.forEach((img) => {
        let inner = img.parentElement;
        let revealOuter: HTMLElement | null = null;
        let container: HTMLElement | null = null;

        if (inner && inner.classList.contains('img-reveal-inner')) {
          // Already wrapped (e.g. React StrictMode re-mount) — reuse it.
          revealOuter = inner.parentElement;
          container = revealOuter ? revealOuter.parentElement : null;
        } else {
          container = img.parentElement;
          if (!container) return;
          revealOuter = document.createElement('div');
          revealOuter.className = 'img-reveal-outer';
          inner = document.createElement('div');
          inner.className = 'img-reveal-inner';
          const cs = getComputedStyle(container);
          if (cs.position === 'static') container.style.position = 'relative';
          container.style.overflow = 'hidden';
          container.insertBefore(revealOuter, container.firstChild);
          revealOuter.appendChild(inner);
          inner.appendChild(img);
        }

        if (!revealOuter || !inner || !container) return;

        // Some images (e.g. the menu cards) have a CSS `transition: transform`
        // for their hover zoom. That transition fights gsap's transform tween
        // and leaves the reveal looking unfinished (stalled partway). Disable
        // it during the reveal, then restore it and clear gsap's inline
        // transform on completion so the hover zoom keeps working.
        const imgEl = img;
        const prevTransition = imgEl.style.transition;
        imgEl.style.transition = 'none';

        const tl = gsap.timeline({
          scrollTrigger: { trigger: container, start: 'top 88%', once: true },
          onComplete: () => {
            if (prevTransition) {
              imgEl.style.transition = prevTransition;
            } else {
              imgEl.style.removeProperty('transition');
            }
          },
        });
        tl.from(revealOuter, { yPercent: 100, duration: 1.3, ease: 'expo.inOut', clearProps: 'transform' }, 0)
          .from(inner, { yPercent: -100, duration: 1.3, ease: 'expo.inOut', clearProps: 'transform' }, 0)
          .from(imgEl, { y: 100, duration: 1.3, ease: 'expo.inOut', clearProps: 'transform' }, 0);
      });

      ScrollTrigger.refresh();
    });

    return () => ctx.revert();
  }, []);

  return null;
}
