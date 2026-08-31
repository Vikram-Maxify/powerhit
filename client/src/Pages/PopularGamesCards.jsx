import { Link } from "react-router-dom";

const PopularGamesCards = () => {
  const popularCards = [
    {
      id: 1,
      name: "Wingo",
      img: "https://i.ibb.co/TMX48QXQ/Chat-GPT-Image-Aug-29-2026-05-26-35-PM-1.png",
      to: "/wingo",
    },
    {
      id: 2,
      name: "Trading",
      img: "https://i.ibb.co/B5ZYHtbf/Chat-GPT-Image-Aug-29-2026-05-26-35-PM-2.png",
      to: "/trading",
    },
    {
      id: 3,
      name: "Mines",
      img: "https://i.ibb.co/D0JmTQV/Chat-GPT-Image-Aug-29-2026-05-26-35-PM-3.png",
      to: "/mine-games",
    },
    {
      id: 4,
      name: "Matka",
      img: "https://i.ibb.co/zhN1HmZY/Chat-GPT-Image-Aug-29-2026-05-26-35-PM-4.png",
      to: "/matka/markets",
    },
  ];

  return (
    <section className="w-full px-4 py-3 sm:px-6">
      {/* Header */}
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

      {/* Games */}
      <div className="grid grid-cols-4 gap-1 sm:gap-5">
        {popularCards.map((game) => (
          <Link key={game.id} to={game.to} className="group block w-full">
            {/* Image */}
            <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-[#e5c56b] bg-white shadow-[0_3px_8px_rgba(0,0,0,.12)] transition duration-200 group-hover:-translate-y-1 group-hover:shadow-[0_7px_16px_rgba(180,125,15,.22)] active:scale-[.98]">
              <img
                src={game.img}
                alt={game.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Game name */}
          </Link>
        ))}
      </div>
    </section>
  );
};

export default PopularGamesCards;
