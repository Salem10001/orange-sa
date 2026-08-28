import Navbar from '@/components/layout/Navbar';
import Hero from '@/components/sections/Hero';
import Problem from '@/components/sections/Problem';
import Safety from '@/components/sections/Safety';
import HowItWorks from '@/components/sections/HowItWorks';
import Makers from '@/components/sections/Makers';
import PromoBand from '@/components/sections/PromoBand';
import Comparison from '@/components/sections/Comparison';
import Reviews from '@/components/sections/Reviews';
import Offers from '@/components/sections/Offers';
import Faq from '@/components/sections/Faq';
import Footer from '@/components/sections/Footer';

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Problem />
      <HowItWorks />
      <Safety />
      <Makers />
      <PromoBand />
      <Comparison />
      <Reviews />
      <Offers />
      <Faq />
      <Footer />
    </>
  );
}
