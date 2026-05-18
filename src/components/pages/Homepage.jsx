import LandingPage from "../heroSection/LandingPage";
import VoiceCommandsBanner from "../heroSection/VoiceCommandsBanner";
import WhyChooseSecureNotes from "../heroSection/WhyChooseSecureNotes";
import SecurityPrioritySection from "../heroSection/SecurityPrioritySection";
import RoleBasedAccessSection from "../heroSection/RoleBasedAccessSection";
import LatestPostsSection from "../heroSection/LatestPostsSection";
import TestimonialsSection from "../heroSection/TestimonialsSection";
import CTASection from "../heroSection/CTASection";
import Footer from "../footer/Footer";
import Header from "../header/Header";

const Homepage = () => {
  return (
    <>
      <Header />
      <LandingPage />
      <VoiceCommandsBanner />
      <WhyChooseSecureNotes />
      <SecurityPrioritySection />
      <RoleBasedAccessSection />
      <LatestPostsSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </>
  );
};

export default Homepage;
