import {
  ChevronRight,
  ClipboardList,
  Trophy,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import MemberStatCard from "./MemberStatCard";

const stats = [
  {
    icon: Users,
    iconColor: "text-violet-500",
    label: "Total Members\nJoined",
    value: "1,246",
  },
  {
    icon: UserPlus,
    iconColor: "text-blue-500",
    label: "Total Members\nFirst Deposit",
    value: "856",
  },
  {
    icon: Users,
    iconColor: "text-green-500",
    label: "1st Level Members",
    value: "642",
  },
  {
    icon: Users,
    iconColor: "text-orange-500",
    label: "2nd Level Members",
    value: "398",
  },
  {
    icon: Users,
    iconColor: "text-pink-500",
    label: "3rd Level Members",
    value: "206",
  },
  {
    icon: Trophy,
    iconColor: "text-amber-500",
    label: "Total Betting\nCommission",
    value: "₹45,780",
  },
];

const recentMembers = [
  { phone: "+91 98765 43210", level: 1, time: "10 min ago" },
  { phone: "+91 87654 32109", level: 2, time: "25 min ago" },
  { phone: "+91 76543 21098", level: 1, time: "45 min ago" },
  { phone: "+91 65432 10987", level: 3, time: "1 hour ago" },
  { phone: "+91 54321 09876", level: 2, time: "2 hour ago" },
];

const levelBadge = {
  1: "border-amber-400 text-amber-500",
  2: "border-gray-300 text-gray-500",
  3: "border-amber-400 text-amber-500",
};

const JoinedMembers = () => {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-black text-amber-500 tracking-wide">
        OVERVIEW
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <MemberStatCard key={s.label} {...s} />
        ))}

        <MemberStatCard
          icon={Wallet}
          iconColor="text-green-500"
          label="Total Recharge Commission"
          value="₹78,320"
          fullWidth
        />
      </div>

      {/* Recent Joined Members */}
      <div className="rounded-3xl bg-white border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-amber-500 tracking-wide">
            RECENT JOINED MEMBERS
          </h3>
          <button className="text-xs font-bold text-amber-500">View All</button>
        </div>

        <div className="space-y-4">
          {recentMembers.map((m, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-800">
                {m.phone}
              </span>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${levelBadge[m.level]}`}
                >
                  Level {m.level}
                </span>
                <span className="text-xs text-gray-400 w-16 text-right">
                  {m.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-3xl bg-white border border-gray-200 shadow-sm p-5">
        <h3 className="text-sm font-black text-amber-500 tracking-wide mb-4">
          SUMMARY
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Total Betting Commission
            </span>
            <span className="text-sm font-black text-gray-900">₹45,780</span>
          </div>
          <div className="h-px bg-gray-100" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Total Recharge Commission
            </span>
            <span className="text-sm font-black text-gray-900">₹78,320</span>
          </div>
        </div>
      </div>

      <button className="w-full flex items-center justify-between rounded-2xl bg-amber-50 border border-amber-300 p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-400 flex items-center justify-center">
            <ClipboardList size={16} className="text-white" />
          </div>
          <span className="text-sm font-bold text-amber-600">
            Promo Terms &amp; Conditions
          </span>
        </div>
        <ChevronRight size={18} className="text-amber-500" />
      </button>
    </div>
  );
};

export default JoinedMembers;
