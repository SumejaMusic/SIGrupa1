import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import HowItWorksSection from '../components/HowItWorksSection';
import BenefitsSection from '../components/BenefitsSection';
import DoctorsSection from '../components/DoctorsSection';
import CtaBanner from '../components/CtaBanner';
import Footer from '../components/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <HowItWorksSection />
      <BenefitsSection />
      <DoctorsSection />
      <CtaBanner />
      <Footer />
    </div>
  );
}
