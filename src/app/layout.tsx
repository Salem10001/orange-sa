import type { Metadata } from 'next';
import { Tajawal } from 'next/font/google';
import LenisProvider from '@/components/animations/LenisProvider';
import TextReveal from '@/components/animations/TextReveal';
import ImageReveal from '@/components/animations/ImageReveal';
import LocaleScope from '@/components/animations/LocaleScope';
import { I18nProvider } from '@/i18n/I18nProvider';
import WhatsAppButton from '@/components/WhatsAppButton';
import FloatingBuyButton from '@/components/FloatingBuyButton';
import Script from 'next/script';
import './globals.css';

const TIKTOK_PIXEL_ID = 'D5SARARC77U2HKOKSEDG';

// Official TikTok Pixel base + single init. Guarded so React re-renders never
// re-load the SDK or fire a second PageView.
const tiktokPixel = `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments)))}};ttq.methods.forEach(function(e){ttq.setAndDefer(ttq,e)});ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]={sdkid:e,lib:i};var r=d.createElement("script");r.async=!0;r.src=i+"?sdkid="+e+"&lib="+t;var s=d.getElementsByTagName("script")[0];s.parentNode.insertBefore(r,s);var u=w[t]=w[t]||[];u.methods=ttq.methods;u.load=ttq.load;u._i=ttq._i};if(!w._ttqLoaded){ttq.load("${TIKTOK_PIXEL_ID}");w._ttqLoaded=!0}if(!w._ttqPageFired){ttq.page();w._ttqPageFired=!0}}(window,document,"ttq");`;

const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '700', '800'],
  variable: '--font-tajawal',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://lp.orange-sa.com'),
  title: 'Mini Orange — Big power, pocket size',
  description: '5000mAh portable charger with 20W fast charging and no cable.',
  icons: {
    icon: '/assets/logo.svg',
  },
  alternates: {
    canonical: '/',
    languages: {
      en: '/',
      ar: '/',
      'x-default': '/',
    },
  },
  openGraph: {
    title: 'Mini Orange — Big power, pocket size',
    description: 'Portable power for your phone and daily devices, small enough for your pocket.',
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['ar_AR'],
  },
};

// Runs before paint: applies the saved locale's dir/lang so there is no
// flash or layout shift (CLS) when Arabic was previously selected.
const localeBootstrap = {
  __html:
    "(function(){try{var l=localStorage.getItem('locale')||'ar';document.documentElement.lang=l;document.documentElement.dir=l==='ar'?'rtl':'ltr';}catch(e){document.documentElement.lang='ar';document.documentElement.dir='rtl';}})();",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`${tajawal.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={localeBootstrap} />
      </head>
      <body>
        <I18nProvider>
          <LocaleScope>
            <LenisProvider>{children}</LenisProvider>
            <WhatsAppButton />
            <FloatingBuyButton />
            <TextReveal />
            <ImageReveal />
          </LocaleScope>
        </I18nProvider>
        <Script
          id="tiktok-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: tiktokPixel }}
        />
      </body>
    </html>
  );
}
