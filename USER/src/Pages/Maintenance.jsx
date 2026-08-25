import { Clock, Coins, Home, MessageCircle, Wrench } from "lucide-react";
import { useEffect, useState } from "react";

const Maintenance = () => {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const glowShadow =
    "shadow-[0_4px_20px_-4px_rgba(251,191,36,0.25),0_2px_8px_-2px_rgba(251,146,60,0.15)]";
  const glowShadowSoft =
    "shadow-[0_2px_12px_-2px_rgba(251,191,36,0.18),0_1px_4px_-1px_rgba(251,146,60,0.10)]";

  return (
    <div className=" bg-gradient-to-b from-amber-50/40 via-orange-50/20 to-amber-50/40 flex items-center justify-center px-4 py-10">
      <div className="max-w-md w-full text-center">
        {/* WINZOX Brand */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            WINZOX
          </h1>
          <p className="text-[10px] text-gray-400 font-medium tracking-widest">
            PLAY • WIN • REPEAT
          </p>
        </div>

        {/* Signature: spinning coin inside a glowing ring */}
        <div className="relative w-36 h-36 mx-auto mb-8">
          {/* pulsing outer glow ring */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300/40 to-orange-400/40 blur-xl animate-pulse-slow" />
          {/* static ring */}
          <div
            className={`absolute inset-2 rounded-full bg-white border border-amber-200/60 ${glowShadow}`}
          />
          {/* spinning coin */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-16 h-16 rounded-full bg-gradient-to-b from-[#FFF19A] via-[#FFC928] to-[#D99200]
border border-[#FFD75A]
shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_2px_7px_rgba(210,145,0,0.45)] flex items-center justify-center"
              style={{
                animation: "spin-coin 2.4s linear infinite",
                transformStyle: "preserve-3d",
              }}
            >
              <Coins size={28} className="text-white" strokeWidth={2.2} />
            </div>
          </div>
          {/* wrench badge */}
          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-2 border border-amber-200/60 shadow-[0_2px_8px_-2px_rgba(251,191,36,0.3)]">
            <Wrench size={16} className="text-orange-600" strokeWidth={2.3} />
          </div>
        </div>

        {/* Headline */}
        <h2 className="text-xl font-black text-gray-900 mb-2">
          We're topping up the tables{dots}
        </h2>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          WINZOX is under scheduled maintenance. Your balance and bet history
          are safe — we'll be back shortly.
        </p>

        {/* Status card */}
        <div
          className={`bg-white rounded-2xl ${glowShadowSoft} border border-amber-200/40 p-4 mb-4 text-left`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="bg-amber-50 p-1.5 rounded-lg border border-amber-200/60">
                <Clock size={14} className="text-yellow-700" />
              </div>
              <span className="text-xs font-bold text-gray-700">
                Estimated time
              </span>
            </div>
            <span className="text-xs font-bold text-yellow-700">~45 mins</span>
          </div>

          {/* progress bar */}
          <div className="w-full h-2 bg-amber-50 rounded-full overflow-hidden border border-amber-200/40">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
              style={{ width: "68%" }}
            />
          </div>
          <p className="text-[9px] text-gray-400 mt-1.5 font-medium tracking-wide">
            68% COMPLETE
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <a
            href="/"
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-yellow-50 rounded-xl border border-yellow-200/60 text-yellow-700 font-bold text-sm shadow-[0_2px_8px_-2px_rgba(251,191,36,0.25)] hover:shadow-[0_4px_14px_-2px_rgba(251,191,36,0.4)] hover:bg-yellow-100 transition-all"
          >
            <Home size={15} />
            Back to Home
          </a>
          <a
            href="/support-chat"
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-b from-[#FFF19A] via-[#FFC928] to-[#D99200]
border border-[#FFD75A]
shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_2px_7px_rgba(210,145,0,0.45)] rounded-xl text-black font-bold text-sm"
          >
            <MessageCircle size={15} />
            Support
          </a>
        </div>

        {/* Footer */}
        <p className="mt-6 text-[10px] text-gray-400">
          Thanks for your patience — good things are worth the wait.
        </p>
      </div>

      <style>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.08); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2.6s ease-in-out infinite;
        }
        @keyframes spin-coin {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Maintenance;
