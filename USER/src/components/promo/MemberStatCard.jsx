const MemberStatCard = ({ icon: Icon, iconColor, label, value, fullWidth }) => {
  return (
    <div
      className={`rounded-2xl bg-white border border-gray-200 shadow-sm p-4 ${
        fullWidth ? "col-span-2 flex items-center gap-4" : ""
      }`}
    >
      <Icon size={fullWidth ? 26 : 24} className={iconColor} strokeWidth={2} />

      <div className={fullWidth ? "" : "mt-3"}>
        <p className="text-xs text-gray-500 leading-tight">{label}</p>
        <p className="text-xl font-black text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
};

export default MemberStatCard;
