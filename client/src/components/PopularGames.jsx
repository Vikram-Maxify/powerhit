import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const games = [
  // MATKA
  {
    title: "WORLD WIDE",
    name: "MATKA",
    image: "https://i.ibb.co/jPm1b0df/card-1.png",
    link: "/matka",
    bg: "from-purple-500 to-violet-400",
  },

  // COUNTRIES
  {
    title: "UAE",
    name: "POWERBALL",
    image: "https://i.ibb.co/bRHBMCM9/card-2.png",
    link: "/powerhit",
    bg: "from-lime-500 to-green-400",
  },
  {
    title: "BANGLADESH",
    name: "POWERBALL",
    image: "https://i.ibb.co/B2CJ9CB0/card-3.png",
    link: "/powerhit",
    bg: "from-orange-500 to-yellow-400",
  },
  {
    title: "PAKISTAN",
    name: "POWERBALL",
    image: "https://i.ibb.co/Kx2qtpjk/card-4.png",
    link: "/powerhit",
    bg: "from-pink-500 to-rose-400",
  },
  {
    title: "INDIA",
    name: "POWERBALL",
    image: "https://i.ibb.co/jPm1b0df/card-1.png",
    link: "/powerhit",
    bg: "from-blue-500 to-cyan-400",
  },
  {
    title: "NEPAL",
    name: "POWERBALL",
    image: "https://i.ibb.co/bRHBMCM9/card-2.png",
    link: "/powerhit",
    bg: "from-indigo-500 to-blue-400",
  },
  {
    title: "AUSTRALIA",
    name: "POWERBALL",
    image: "https://i.ibb.co/B2CJ9CB0/card-3.png",
    link: "/powerhit",
    bg: "from-red-500 to-orange-400",
  },
];

export default function PopularGames() {
  const [showAll, setShowAll] = useState(false);

  // First 4 cards initially, all cards after View All
  const displayGames = showAll ? games : games.slice(0, 4);

  const getGameLink = (game) => {
    // MATKA
    if (game.link === "/matka") {
      return "/matka";
    }

    // Country-wise Powerball
    return `/powerhit?country=${encodeURIComponent(
      game.title.toLowerCase()
    )}`;
  };

  return (
    <section className="py-6 md:py-12">
      <div className="max-w-8xl mx-auto px-3 md:px-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔥</span>

            <h2 className="text-lg md:text-2xl font-bold uppercase text-gray-800">
              Popular Games
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            className="border border-gray-300 rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-gray-100 transition-all"
          >
            {showAll ? "View Less" : "View All"}
          </button>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-4 gap-5 mr-3">
          {displayGames.map((game, index) => (
            <Link
              key={`${game.title}-${index}`}
              to={getGameLink(game)}
              className="group relative rounded-xl overflow-hidden bg-white block"
              style={{
                height: "150px",
                width: "120%",
              }}
            >
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{
                  backgroundImage: `url(${game.image})`,
                }}
              />

              {/* Bottom Content */}
              <div className="absolute bottom-0 left-0 right-0 z-10 p-2.5">
                <div className="text-center text-white mb-1">
                  <p className="text-[8px] font-bold uppercase tracking-wider text-yellow-400/80">
                    {game.title}
                  </p>

                  <h3 className="font-extrabold text-[11px] leading-tight drop-shadow-lg">
                    {game.name}
                  </h3>
                </div>

                <div className="w-full inline-flex items-center justify-center gap-1 bg-white/15 backdrop-blur-sm border border-white/30 text-white font-semibold rounded-lg px-2 py-1.5 text-[9px] transition-all duration-300 group-hover:scale-105">
                  <span>PLAY</span>

                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}