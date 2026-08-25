import { Trophy } from "lucide-react";

const BetBonus = () => {
  return (
    <div className="mt-6">

      <div className="bg-white rounded-3xl shadow border border-gray-100 p-6">

        <div className="flex items-center gap-4">

          <div className="w-16 h-16 rounded-2xl bg-green-500 flex items-center justify-center">

            <Trophy
              size={28}
              className="text-white"
            />

          </div>

          <div>

            <h2 className="text-xl font-bold">
              Betting Bonus
            </h2>

            <p className="text-gray-500">
              Earn commission whenever your referrals place bets.
            </p>

          </div>

        </div>

        <div className="mt-8 rounded-2xl bg-green-50 p-6 text-center">

          <h1 className="text-5xl font-bold text-green-600">
            1%
          </h1>

          <p className="mt-2 text-gray-600">
            Commission on every valid bet.
          </p>

        </div>

      </div>

    </div>
  );
};

export default BetBonus;