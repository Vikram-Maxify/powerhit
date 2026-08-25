import { Copy } from "lucide-react";
import { useSelector } from "react-redux";
import SocialShare from "./SocialShare";

const ReferralCard = () => {
  const { user } = useSelector((state) => state.auth);
  const baseUrl = window.location.origin;
  const referralLink = `${baseUrl}/register/?ref=${user?.referralCode || "alex777"}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      const btn = document.getElementById("copyBtn");
      const originalText = btn.innerHTML;
      btn.innerHTML =
        '<span class="flex items-center gap-1.5"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg> Copied</span>';
      setTimeout(() => {
        btn.innerHTML = originalText;
      }, 2000);
    } catch (error) {
      console.error("Failed to copy: ", error);
      const textArea = document.createElement("textarea");
      textArea.value = referralLink;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
      } catch (err) {
        alert("Failed to copy link. Please copy manually.");
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="rounded-3xl bg-white border border-gray-200 shadow-sm p-5">
      <p className="text-sm font-semibold text-gray-800 mb-2">
        Your Referral Link
      </p>

      <div className="rounded-xl bg-gray-50 border border-gray-200 p-1.5 flex items-center gap-2">
        <input
          readOnly
          value={referralLink}
          className="flex-1 bg-transparent outline-none text-sm text-gray-600 font-medium min-w-0 truncate pl-2"
        />

        <button
          id="copyBtn"
          onClick={copyLink}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-b from-[#FFF19A] via-[#FFC928] to-[#D99200]
border border-[#FFD75A]
shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_2px_7px_rgba(210,145,0,0.45)] px-4 py-2 text-sm font-bold text-black active:scale-95 transition-all whitespace-nowrap"
        >
          Copy
          <Copy size={14} />
        </button>
      </div>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-400 font-medium">or share via</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <SocialShare />
    </div>
  );
};

export default ReferralCard;
