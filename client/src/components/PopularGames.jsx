import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const games = [
  {
    title: "WORLD WIDE",
    name: "MATKA",
    image: "https://i.ibb.co/jPm1b0df/card-1.png",
    link: "/matka",
    bg: "from-purple-500 to-violet-400",
  },
  {
    title: "Australia",
    name: "POWERBALL",
    image: "https://i.ibb.co/bRHBMCM9/card-2.png",
    link: "/powerhit",
    bg: "from-lime-500 to-green-400",
  },
  {
    title: "INDIA",
    name: "POWERBALL",
    image: "https://i.ibb.co/B2CJ9CB0/card-3.png",
    link: "/powerhit",
    bg: "from-orange-500 to-yellow-400",
  },
  {
    title: "NEPAL",
    name: "POWERBALL",
    image: "https://i.ibb.co/Kx2qtpjk/card-4.png",
    link: "/powerhit",
    bg: "from-pink-500 to-rose-400",
  },
  {
    title: "USA",
    name: "POWERBALL",
    image: "https://i.ibb.co/jPm1b0df/card-1.png",
    link: "/powerhit",
    bg: "from-blue-500 to-cyan-400",
  },
  {
    title: "UK",
    name: "LOTTO",
    image: "https://i.ibb.co/bRHBMCM9/card-2.png",
    link: "/powerhit",
    bg: "from-indigo-500 to-blue-400",
  },
  {
    title: "CANADA",
    name: "LOTTO MAX",
    image: "https://i.ibb.co/B2CJ9CB0/card-3.png",
    link: "/powerhit",
    bg: "from-red-500 to-orange-400",
  },
  {
    title: "JAPAN",
    name: "LOTO 7",
    image: "https://i.ibb.co/Kx2qtpjk/card-4.png",
    link: "/powerhit",
    bg: "from-emerald-500 to-green-400",
  },
];

export default function PopularGames() {
  const [showAll, setShowAll] = useState(false);

  // Show first 4 cards initially, all 8 when showAll is true
  const displayGames = showAll ? games : games.slice(0, 4);
  const totalGames = games.length;

  // Function to generate link with query parameter
  const getGameLink = (game) => {
    // If it's a powerhit game, add country as query parameter
    if (game.link === "/powerhit" || game.link === "/matka") {
      return `${game.link}?country=${game.title.toLowerCase()}`;
    }
    return game.link;
  };

  return (
    <section className="py-6 md:py-12 ">
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
            onClick={() => setShowAll(!showAll)}
            className="border border-gray-300 rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-gray-100"
          >
            {showAll ? "View Less" : "View All"}
          </button>
        </div>

        {/* Cards Grid - 4 columns on all devices */}
        <div className="grid grid-cols-4 gap-5 mr-3">
          {displayGames.slice(0, 4).map((game, index) => (
            <Link
              key={index}
              to={getGameLink(game)}
              className="group relative rounded-xl overflow-hidden bg-white block"
              style={{ height: "150px", width: "120%" }}
            >
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url(${game.image})` }}
              />

              {/* Bottom Content */}
              <div className="absolute bottom-0 left-0 right-0 z-10 p-2.5">
                <div className="text-center text-white mb-1">
                  <p className="text-[8px] font-bold uppercase tracking-wider text-yellow-400/80">
                    {game.title?.split(" ")[0] || "GAME"}
                  </p>
                  <h3 className="font-extrabold text-[11px] leading-tight drop-shadow-lg">
                    {game.name}
                  </h3>
                </div>

                <button className="w-full inline-flex items-center justify-center gap-1 bg-white/15 backdrop-blur-sm border border-white/30 text-white font-semibold rounded-lg px-2 py-1.5 text-[9px] transition-all duration-300 hover:bg-white/25 hover:border-white/50 group-hover:scale-105">
                  <span>PLAY</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </section>
  );
}
