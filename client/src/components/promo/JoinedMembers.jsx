import {
  ChevronRight,
  ClipboardList,
  Trophy,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getProfile } from "../../redux/slices/authSlice"; // path apne project ke hisaab se adjust kar lena
import MemberStatCard from "./MemberStatCard";

const levelBadge = {
  1: "border-amber-400 text-amber-500",
  2: "border-gray-300 text-gray-500",
  3: "border-amber-400 text-amber-500",
};

// ================= DATE FORMAT HELPER =================
const formatDateTime = (dateString) => {
  const date = new Date(dateString);

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatAmount = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const JoinedMembers = () => {
  const dispatch = useDispatch();
  const { referralStats, recentJoinedMembers, profileLoaded } = useSelector(
    (state) => state.auth,
  );

  useEffect(() => {
    if (!profileLoaded) {
      dispatch(getProfile());
    }
  }, [dispatch, profileLoaded]);

  const stats = [
    {
      icon: Users,
      iconColor: "text-violet-500",
      label: "Total Members\nJoined",
      value: referralStats?.totalMembersJoined ?? 0,
    },
    {
      icon: UserPlus,
      iconColor: "text-blue-500",
      label: "Total Members\nFirst Deposit",
      value: referralStats?.totalMembersFirstDeposit ?? 0,
    },
    {
      icon: Users,
      iconColor: "text-green-500",
      label: "1st Level Members",
      value: referralStats?.level1Count ?? 0,
    },
    {
      icon: Users,
      iconColor: "text-orange-500",
      label: "2nd Level Members",
      value: referralStats?.level2Count ?? 0,
    },
    {
      icon: Users,
      iconColor: "text-pink-500",
      label: "3rd Level Members",
      value: referralStats?.level3Count ?? 0,
    },
    {
      icon: Trophy,
      iconColor: "text-amber-500",
      label: "Total Betting\nCommission",
      value: formatAmount(referralStats?.totalBettingCommission),
    },
  ];

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
          value={formatAmount(referralStats?.referralEarning)}
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
          {recentJoinedMembers?.length ? (
            recentJoinedMembers.map((m) => (
              <div key={m.userId} className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-800">
                  ID: {m.userId}
                </span>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${levelBadge[m.level]}`}
                  >
                    Level {m.level}
                  </span>
                  <span className="text-xs text-gray-400 w-16 text-right">
                    {formatDateTime(m.joinedAt)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-400">No members joined yet.</p>
          )}
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
            <span className="text-sm font-black text-gray-900">
              {formatAmount(referralStats?.totalBettingCommission)}
            </span>
          </div>
          <div className="h-px bg-gray-100" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Total Recharge Commission
            </span>
            <span className="text-sm font-black text-gray-900">
              {formatAmount(referralStats?.totalRechargeCommission)}
            </span>
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
