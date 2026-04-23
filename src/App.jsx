import HeroSection from "./components/HeroSection";
import SectionWrapper from "./components/SectionWrapper";

function App() {
  return (
    <main className="min-h-screen w-full bg-[#f5efe7] font-playfair flex items-start justify-center">
      <div className="relative w-full max-w-[425px] md:rounded-2xl md:shadow-2xl">
        <SectionWrapper>
          <HeroSection />
        </SectionWrapper>
      </div>
    </main>
  );
}

export default App;
