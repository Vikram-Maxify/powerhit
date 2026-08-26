import { format } from "date-fns";
import { useEffect } from "react";
import { FaCrown } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  fetchPublicBidResults,
  selectPublicBidResults,
} from "../redux/slices/publicBidSlice";

const getGameTypeLabel = (type) => {
  const labels = {
    single: "Single",
    jodi: "Jodi",
    panna: "Panna",
    "half-sangam": "Half Sangam",
    "full-sangam": "Full Sangam",
    "last-digit": "Last Digit",
    "first-digit": "First Digit",
  };
  return labels[type] || type;
};

const LiveResults = () => {
  const dispatch = useDispatch();
  const { results, pagination, loading, error, filters } = useSelector(
    selectPublicBidResults,
  );

  useEffect(() => {
    dispatch(fetchPublicBidResults(filters));
  }, [dispatch, filters, pagination.page]);

  // sirf latest 5 dikha rahe hain card row me (image jaisa)
  const liveMarkets = results.slice(0, 5);

  return (
    <div className="bg-gradient-to-b from-amber-50/50 via-white to-white px-3 py-4">
      <div className="max-w-md mx-auto rounded-2xl border border-amber-200 shadow-sm bg-white overflow-hidden">
        {/* Top dots indicator */}
        <div className="flex justify-center gap-1 pt-3">
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <span className="w-1 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Live Results Banner */}
        <div className="flex justify-center -mt-2 mb-1 z-50">
          <div className="flex items-center gap-1.5 bg-black px-5 py-2 rounded-full shadow-md">
            <span className="text-sm">🔥</span>
            <span
              className="text-[13px] font-extrabold tracking-wide bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 bg-clip-text text-transparent"
              style={{ WebkitTextStroke: "0.3px rgba(217,119,6,0.3)" }}
            >
              LIVE RESULTS
            </span>
          </div>
        </div>

        <div className="px-4 pt-4 pb-2">
          {/* Matka Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start gap-2">
              <FaCrown className="text-amber-500 text-lg mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-gray-900 leading-tight">
                  MATKA RESULTS
                </h3>
                <p className="text-[11px] text-gray-400 leading-tight">
                  Live updates from all main markets
                </p>
              </div>
            </div>
            <Link
              to={"/publicresult"}
              className="text-[11px] font-bold text-black px-3 py-1.5 rounded-lg shrink-0
  bg-gradient-to-b from-[#FFF19A] via-[#FFC928] to-[#D99200]
  border border-[#FFD75A]
  shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_2px_7px_rgba(210,145,0,0.45)]"
            >
              View All
            </Link>
          </div>

          {/* Matka Cards (from publicBidSlice reducer) */}
          {loading && results.length === 0 ? (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="min-w-[100px] h-28 rounded-xl bg-gray-100 animate-pulse shrink-0"
                />
              ))}
            </div>
          ) : error ? (
            <p className="text-xs text-red-500">{error}</p>
          ) : liveMarkets.length === 0 ? (
            <p className="text-xs text-gray-400">No results found</p>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
              {liveMarkets.map((bid) => (
                <div
                  key={bid._id}
                  className="min-w-[100px] shrink-0 snap-start border border-gray-100 rounded-xl px-2.5 py-2.5 text-center"
                >
                  {/* Market name — highlighted at top */}
                  <p className="text-[11px] font-bold text-amber-600 uppercase truncate">
                    {bid.marketId?.name || "N/A"}
                  </p>

                  {/* Game type — small badge below market name */}
                  <span className="inline-block text-[9px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full mt-1 mb-1">
                    {getGameTypeLabel(bid.gameType)}
                  </span>

                  <p className="text-[10px] text-gray-400 mb-1.5">
                    {format(new Date(bid.createdAt), "hh:mm a")}
                  </p>

                  <div className="flex items-center justify-center gap-1 mb-1.5">
                    {String(bid.resultNumber || bid.number)
                      .split("")
                      .map((digit, idx) => (
                        <span
                          key={idx}
                          className="text-lg font-extrabold text-gray-900"
                        >
                          {digit}
                        </span>
                      ))}
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                    <span className="text-[10px] font-semibold text-green-600">
                      LIVE
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveResults;
