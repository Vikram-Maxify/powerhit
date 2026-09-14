import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import matkaIMG from "../assets/Home/matka.png";
import minesIMG from "../assets/Home/mines.png";
import tradingIMG from "../assets/Home/trading.png";
import wingoIMG from "../assets/Home/wingoo.png";

const PopularGamesCards = () => {
  const user = useSelector((state) => state.auth.user);

  const popularCards = [
    { id: 1, name: "Wingo", img: wingoIMG, to: "/wingo" },
    {
      id: 2,
      name: "Trading",
      img: tradingIMG,
      to: "https://lotterry.trade.marinclub.site/",
      external: true,
    },
    { id: 3, name: "Mines", img: minesIMG, to: "/mine-games" },
    { id: 4, name: "Matka", img: matkaIMG, to: "/matka/markets" },
  ];

  const cardClass =
    "relative aspect-square w-full overflow-hidden rounded-xl border border-[#e5c56b] bg-white shadow-[0_3px_8px_rgba(0,0,0,.12)] transition duration-200 group-hover:-translate-y-1 group-hover:shadow-[0_7px_16px_rgba(180,125,15,.22)] active:scale-[.98]";

  return (
    <section className="w-full px-4 py-3 sm:px-6">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[22px]">🔥</span>
          <h2 className="text-[20px] font-extrabold tracking-tight text-[#171717] sm:text-[24px]">
            POPULAR GAMES
          </h2>
        </div>
        <Link
          to="/games"
          className="flex items-center gap-1 text-sm font-bold text-[#c88b12] transition hover:text-[#a96f00] sm:text-base"
        >
          View All
          <span className="text-lg">›</span>
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-1 sm:gap-5">
        {popularCards.map((game) => {
          const isTrading = game.id === 2;
          const needsLogin = isTrading && !user;

          // External link (Trading)
          if (game.external && user) {
            return (
              <a
                key={game.id}
                href={game.to}
                target="_blank"
                rel="noopener noreferrer"
                className="group block w-full"
              >
                <div className={cardClass}>
                  <img
                    src={game.img}
                    alt={game.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              </a>
            );
          }

          // Login redirect (Trading + no user) ya internal links
          const linkTo = needsLogin ? "/login" : game.to;

          return (
            <Link
              key={game.id}
              to={linkTo}
              state={needsLogin ? { from: game.to } : undefined}
              className="group block w-full"
            >
              <div className={cardClass}>
                <img
                  src={game.img}
                  alt={game.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default PopularGamesCards;
