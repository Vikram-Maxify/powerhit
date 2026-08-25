import { Wallet, Users, Coins } from "lucide-react";

const levels = [
  {
    level: "Level 1",
    percent: "20%",
    color: "bg-yellow-400",
    icon: Wallet,
  },
  {
    level: "Level 2",
    percent: "3%",
    color: "bg-blue-500",
    icon: Users,
  },
  {
    level: "Level 3",
    percent: "2%",
    color: "bg-purple-500",
    icon: Coins,
  },
];

const RechargeBonus = () => {
  return (
    <div className="mt-6 space-y-4">

      {levels.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.level}
            className="bg-white rounded-3xl shadow border border-gray-100 p-5"
          >
            <div className="flex items-center justify-between">

              <div className="flex items-center gap-4">

                <div
                  className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center`}
                >
                  <Icon size={24} className="text-white" />
                </div>

                <div>
                  <h3 className="font-bold text-lg">
                    {item.level}
                  </h3>

                  <p className="text-sm text-gray-500">
                    Recharge Commission
                  </p>
                </div>

              </div>

              <span className="text-2xl font-bold text-green-600">
                {item.percent}
              </span>

            </div>
          </div>
        );
      })}

    </div>
  );
};

export default RechargeBonus;