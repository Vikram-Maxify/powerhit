import { Gift, Link2, Trophy, Users } from "lucide-react";

const tabs = [
  { id: "link", title: "My Link", icon: Link2 },
  { id: "members", title: "Joined Members", icon: Users },
  { id: "recharge", title: "Recharge Bonus", icon: Gift },
  { id: "bet", title: "Bet Bonus", icon: Trophy },
];

const PromoTabs = ({ activeTab, setActiveTab }) => {
  return (
    <div className="grid grid-cols-4 gap-2.5">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1.5 rounded-2xl py-3 px-1 transition-all duration-200 border ${
              isActive
                ? "bg-gradient-to-b from-[#FFF19A] via-[#FFC928] to-[#D99200] border border-[#FFD75A] shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_2px_7px_rgba(210,145,0,0.45)] text-black"
                : "bg-white border-gray-200 text-gray-700"
            }`}
          >
            <Icon size={19} strokeWidth={2} />
            <span className="text-[10.5px] font-semibold text-center leading-tight">
              {tab.title}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default PromoTabs;
