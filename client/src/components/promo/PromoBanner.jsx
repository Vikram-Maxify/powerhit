const PromoBanner = () => {
  return (
    <div className="rounded-3xl bg-white border border-gray-200 shadow-sm p-6 flex items-center justify-between gap-4 overflow-hidden">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 leading-snug">
          Share your link and
        </h2>
        <h2 className="text-2xl font-black text-amber-500 leading-snug">
          EARN BIG REWARDS!
        </h2>
      </div>

      <img
        src="https://i.ibb.co/8gXCwzjp/wallet.png"
        alt="Gift rewards"
        className="w-28 h-28 md:w-32 md:h-32 object-contain flex-shrink-0"
      />
    </div>
  );
};

export default PromoBanner;
