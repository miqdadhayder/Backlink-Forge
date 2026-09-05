import React from "react";
import Header from "@/components/bf/Header";
import Hero from "@/components/bf/Hero";
import BacklinkTool from "@/components/bf/BacklinkTool";
import GapPromo from "@/components/bf/gap/GapPromo";
import SitemapPromo from "@/components/bf/sitemap/SitemapPromo";
import HowItWorks from "@/components/bf/HowItWorks";
import Stats from "@/components/bf/Stats";
import Pricing from "@/components/bf/Pricing";
import Footer from "@/components/bf/Footer";

export default function Home() {
  const scrollTo = (id) => () => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <Hero onStart={scrollTo("tool")} onSeeHowItWorks={scrollTo("how-it-works")} />
        <BacklinkTool />
        <section id="gap-finder"><GapPromo /></section>
        <SitemapPromo />
        <HowItWorks />
        <Stats />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}