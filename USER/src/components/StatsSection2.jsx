import {
  Users,
  Gamepad2,
  Trophy,
  Wifi,
  TrendingUp,
} from "lucide-react";

const stats = [
  {
    icon: Users,
    value: "1,240",
    label: "Today's Winners",
    color: "text-green-500",
    bgColor: "bg-green-100",
  },
  {
    icon: Gamepad2,
    value: "32,500",
    label: "Games Played",
    color: "text-purple-500",
    bgColor: "bg-purple-100",
  },
  {
    icon: Trophy,
    value: "96%",
    label: "Winning Rate",
    color: "text-sky-500",
    bgColor: "bg-sky-100",
  },
  {
    icon: Wifi,
    value: "5,420",
    label: "Online Users",
    color: "text-orange-500",
    bgColor: "bg-orange-100",
  },
];

export default function StatsSection2() {
  return (
    <section className="px-4 md:px-8 py-6 bg-[#f8f9fb]">
      {/* Heading */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>

          <div>
            <h2 className="text-lg md:text-2xl font-bold uppercase text-gray-900">
              Live Stats
            </h2>
            <p className="text-[11px] text-gray-500">
              Real-time platform metrics
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-3 py-1">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-xs font-semibold text-green-600">LIVE</span>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-4">
          {stats.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={index}
                className={`group relative flex flex-col items-center justify-center
                px-2 py-4 md:py-6 transition-all duration-300 hover:bg-gray-50
                ${
                  index !== stats.length - 1
                    ? "border-r border-gray-200"
                    : ""
                }`}
              >
                {/* Icon */}
                <div
                  className={`w-9 h-9 md:w-12 md:h-12 rounded-full ${item.bgColor}
                  flex items-center justify-center transition-all duration-300
                  group-hover:scale-110`}
                >
                  <Icon
                    className={`${item.color} w-5 h-5 md:w-6 md:h-6`}
                  />
                </div>

                {/* Value */}
                <h3
                  className={`mt-2 text-[15px] md:text-2xl font-extrabold text-gray-900 transition-colors duration-300 ${item.color}`}
                >
                  {item.value}
                </h3>

                {/* Label */}
                <p className="mt-1 text-[10px] md:text-sm text-gray-500 text-center leading-tight font-medium">
                  {item.label}
                </p>

                {/* Bottom Hover Line */}
                <div
                  className={`absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-300 ${
                    item.color === "text-green-500"
                      ? "bg-green-500"
                      : item.color === "text-purple-500"
                      ? "bg-purple-500"
                      : item.color === "text-sky-500"
                      ? "bg-sky-500"
                      : "bg-orange-500"
                  }`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
    </section>
  );
}