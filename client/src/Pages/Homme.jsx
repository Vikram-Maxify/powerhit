import CountriesSection from "../components/CountriesSection";
import FeatureBar from "../components/FeatureBar";
import Herosection from "../components/Herosection";
import PopularGames from "../components/PopularGames";
import StatsSection2 from "../components/StatsSection2";
import TopWinners from "../components/TopWinners";
import Footer from "../Pages/Footer";
import PopularGamesCards from "./PopularGamesCards";
import PowerballPublicResult from "./PowerballPublicResult";
import PublicBidResults from "./PublicBidResults";

const Homme = () => {
  return (
    <main className="pb-11 md:pb-0">
      <Herosection />
      {/* <StatsSection /> */}
      <PopularGamesCards />
      <PublicBidResults />
      <PopularGames />
      <PowerballPublicResult />
      <FeatureBar />
      <TopWinners />
      <StatsSection2 />
      <CountriesSection />
      <Footer />
    </main>
  );
};

export default Homme;
