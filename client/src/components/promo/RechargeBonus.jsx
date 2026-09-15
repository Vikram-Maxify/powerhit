import { Coins, Users, Wallet } from "lucide-react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { getReferralLevels } from "../../redux/slices/referralLevelSlice";

const levelStyles = [
  {
    color: "bg-yellow-400",
    icon: Wallet,
  },
  {
    color: "bg-blue-500",
    icon: Users,
  },
  {
    color: "bg-purple-500",
    icon: Coins,
  },
];

const RechargeBonus = () => {
  const dispatch = useDispatch();

  const { levels, loading, error } = useSelector(
    (state) => state.referralLevel,
  );

  useEffect(() => {
    dispatch(getReferralLevels());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="mt-6 space-y-4">
        <div className="bg-white rounded-3xl shadow border border-gray-100 p-5 text-center text-gray-500">
          Loading referral levels...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 space-y-4">
        <div className="bg-white rounded-3xl shadow border border-red-100 p-5 text-center text-red-500">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {levels
        .filter((item) => item.status)
        .map((item, index) => {
          const style = levelStyles[index % levelStyles.length];
          const Icon = style.icon;

          return (
            <div
              key={item._id || item.level}
              className="bg-white rounded-3xl shadow border border-gray-100 p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl ${style.color} flex items-center justify-center`}
                  >
                    <Icon size={24} className="text-white" />
                  </div>

                  <div>
                    <h3 className="font-bold text-lg">Level {item.level}</h3>

                    <p className="text-sm text-gray-500">Recharge Commission</p>
                  </div>
                </div>

                <span className="text-2xl font-bold text-green-600">
                  {item.percentage}%
                </span>
              </div>
            </div>
          );
        })}
    </div>
  );
};

export default RechargeBonus;
