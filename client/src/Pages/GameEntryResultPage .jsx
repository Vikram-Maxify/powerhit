import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  CircleX,
  Clock,
  DollarSign,
  Eye,
  Gamepad2,
  Heart,
  Info,
  Loader2,
  Percent,
  Plus,
  Target,
  Trash2,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  deleteGameEntry,
  getMyGameEntries,
  resetGameEntryState,
} from "../redux/slices/gameEntrySlice";

// ================= POPUP COMPONENT =================
const EntryDetailsPopup = ({
  isOpen,
  onClose,
  entry,
  loading,
  error,
  onDelete,
}) => {
  if (!isOpen) return null;

  const checkNumberMatch = (gameNumbers, winningNumbers) => {
    if (!winningNumbers || !winningNumbers.numbers || !gameNumbers) return null;

    const matches = gameNumbers.numbers.filter(
      (num) => winningNumbers.numbers && winningNumbers.numbers.includes(num),
    );

    const powerballMatch = gameNumbers.powerball === winningNumbers.powerball;

    return {
      matches: matches.length,
      powerballMatch,
      isWinner: matches.length >= 3 || (matches.length >= 2 && powerballMatch),
    };
  };

  const getGameStatistics = (games, winningNumbers, resultDeclared) => {
    if (!resultDeclared || !games || !winningNumbers) {
      return { total: 0, won: 0, lost: 0, pending: games?.length || 0 };
    }

    let won = 0;
    let lost = 0;

    games.forEach((game) => {
      const result = checkNumberMatch(game, winningNumbers);
      if (result?.isWinner) {
        won++;
      } else {
        lost++;
      }
    });

    return {
      total: games.length,
      won,
      lost,
      pending: 0,
    };
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: "bg-amber-500",
      Active: "bg-amber-500",
      Completed: "bg-emerald-500",
      Cancelled: "bg-red-500",
      Won: "bg-amber-500",
      Lost: "bg-red-500",
      Open: "bg-amber-500",
    };
    return colors[status] || "bg-gray-400";
  };

  const getStatusIcon = (status) => {
    const icons = {
      Pending: Clock,
      Active: Loader2,
      Completed: CheckCircle2,
      Cancelled: CircleX,
      Won: Trophy,
      Lost: Heart,
      Open: Loader2,
    };
    return icons[status] || Info;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full border border-gray-100 shadow-xl">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-amber-100 border-t-amber-500"></div>
            </div>
            <p className="text-sm text-gray-400 mt-4 font-medium">
              Loading entry details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-gray-100 shadow-xl">
          <div className="text-center">
            <div className="text-red-400 flex justify-center mb-3">
              <AlertCircle className="w-10 h-10" />
            </div>
            <h3 className="text-base font-bold text-gray-800 mb-1.5">Error</h3>
            <p className="text-sm text-gray-500 mb-5">
              {typeof error === "string" ? error : "Something went wrong"}
            </p>
            <button
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-gray-100 shadow-xl">
          <div className="text-center">
            <div className="text-gray-300 flex justify-center mb-3">
              <Info className="w-10 h-10" />
            </div>
            <h3 className="text-base font-bold text-gray-800 mb-1.5">
              No Entry Found
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              The requested entry could not be found.
            </p>
            <button
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const status = entry.poolStatus || entry.playerStatus || "Pending";
  const drawNo = entry.drawNo || "N/A";
  const totalAmount = entry.totalAmount || 0;
  const totalPlayers = entry.totalPlayers || 0;
  const games = entry.games || [];
  const winningNumbers = entry.winningNumbers || {
    numbers: [],
    powerball: null,
  };
  const resultDeclared = entry.resultDeclared || false;
  const StatusIcon = getStatusIcon(status);

  const stats = getGameStatistics(games, winningNumbers, resultDeclared);

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto relative border border-gray-100 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="sticky top-0 float-right m-3 w-9 h-9 bg-white rounded-full shadow-sm hover:bg-gray-50 transition flex items-center justify-center text-gray-500 hover:text-gray-700 z-10 border border-gray-100"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-5 pt-0 pb-8">
          <div className="bg-gray-50/60 rounded-2xl p-5 mb-4 border border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-amber-500" />
                Entry #{drawNo}
              </h2>
              <div
                className={`px-3 py-1.5 rounded-full text-white font-semibold text-xs mt-2 sm:mt-0 flex items-center gap-1.5 ${getStatusColor(status)}`}
              >
                <StatusIcon className="w-3 h-3" />
                {status}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
              <div className="bg-white rounded-xl p-3 border border-gray-100">
                <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> Amount
                </div>
                <div className="font-bold text-gray-900 text-sm mt-0.5">
                  ${totalAmount.toFixed(2)}
                </div>
              </div>
              <div className="bg-white rounded-xl p-3 border border-gray-100">
                <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide flex items-center gap-1">
                  <Users className="w-3 h-3" /> Players
                </div>
                <div className="font-bold text-gray-900 text-sm mt-0.5">
                  {totalPlayers}
                </div>
              </div>
              <div className="bg-white rounded-xl p-3 border border-gray-100">
                <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide flex items-center gap-1">
                  <Gamepad2 className="w-3 h-3" /> Games
                </div>
                <div className="font-bold text-gray-900 text-sm mt-0.5">
                  {stats.total}
                </div>
              </div>
              <div className="bg-white rounded-xl p-3 border border-gray-100">
                <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Created
                </div>
                <div className="font-bold text-gray-900 text-xs mt-0.5">
                  {entry.createdAt
                    ? new Date(entry.createdAt).toLocaleDateString()
                    : "N/A"}
                </div>
              </div>
            </div>

            {resultDeclared && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
                <div className="bg-white rounded-xl p-3.5 text-center border border-amber-100">
                  <Trophy className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                  <div className="text-xl font-bold text-gray-900">
                    {stats.won}
                  </div>
                  <div className="text-[11px] text-gray-400 font-medium">
                    Won
                  </div>
                </div>
                <div className="bg-white rounded-xl p-3.5 text-center border border-red-100">
                  <Heart className="w-5 h-5 text-red-400 mx-auto mb-1" />
                  <div className="text-xl font-bold text-gray-900">
                    {stats.lost}
                  </div>
                  <div className="text-[11px] text-gray-400 font-medium">
                    Lost
                  </div>
                </div>
                <div className="bg-white rounded-xl p-3.5 text-center border border-gray-100">
                  <Percent className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                  <div className="text-xl font-bold text-gray-900">
                    {stats.total > 0
                      ? Math.round((stats.won / stats.total) * 100)
                      : 0}
                    %
                  </div>
                  <div className="text-[11px] text-gray-400 font-medium">
                    Win Rate
                  </div>
                </div>
              </div>
            )}

            {!resultDeclared && (
              <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-3 mb-3 text-center">
                <div className="text-amber-700 font-semibold text-sm flex items-center justify-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Results pending - check back later
                </div>
              </div>
            )}

            {entry.currencyDetails && (
              <div className="bg-white rounded-xl p-3 mb-3 border border-gray-100">
                <div className="text-[10px] text-gray-400 mb-1.5 font-semibold uppercase tracking-wide">
                  Currency Details
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                  <span>
                    <strong className="text-gray-800">USD:</strong> $
                    {entry.currencyDetails.usdAmount}
                  </span>
                  <span>
                    <strong className="text-gray-800">Local:</strong>{" "}
                    {entry.currencyDetails.localCurrency}{" "}
                    {entry.currencyDetails.localAmount}
                  </span>
                  <span>
                    <strong className="text-gray-800">Rate:</strong> 1 USD ={" "}
                    {entry.currencyDetails.exchangeRate}{" "}
                    {entry.currencyDetails.localCurrency}
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 justify-end">
              <button
                className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition flex items-center gap-1.5 justify-center"
                onClick={onClose}
              >
                <X className="w-3.5 h-3.5" /> Close
              </button>
              <button
                className="px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition flex items-center gap-1.5 justify-center"
                onClick={() => onDelete(entry.poolId)}
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>

          {resultDeclared &&
            winningNumbers &&
            winningNumbers.numbers &&
            winningNumbers.numbers.length > 0 && (
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-5 mb-4 text-white shadow-sm">
                <h3 className="text-sm font-bold text-center mb-3 flex items-center justify-center gap-1.5 uppercase tracking-wide">
                  <Target className="w-4 h-4" /> Winning Numbers
                </h3>
                <div className="flex justify-center items-center gap-2 flex-wrap">
                  {winningNumbers.numbers.map((num) => (
                    <div
                      key={num}
                      className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold border border-white/30"
                    >
                      {num}
                    </div>
                  ))}
                  <div className="px-3.5 py-2 bg-white/20 rounded-full text-xs font-bold border border-white/30 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> PB: {winningNumbers.powerball}
                  </div>
                </div>
                {entry.updatedAt && (
                  <div className="text-center mt-2.5 opacity-80 text-[11px]">
                    Results declared:{" "}
                    {new Date(entry.updatedAt).toLocaleString()}
                  </div>
                )}
              </div>
            )}

          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-1.5">
              <Gamepad2 className="w-4 h-4 text-amber-500" />
              Game Results
              <span className="text-xs font-normal text-gray-400 ml-1">
                ({stats.total} games • {stats.won} won • {stats.lost} lost)
              </span>
            </h3>

            {!games || games.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-400 bg-gray-50/70 rounded-xl border border-dashed border-gray-200">
                <Info className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                No games found for this entry
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {games.map((game, index) => {
                  const matchResult = resultDeclared
                    ? checkNumberMatch(game, winningNumbers)
                    : null;
                  const isWinner = matchResult?.isWinner || false;
                  const matchedCount = matchResult?.matches || 0;
                  const powerballMatch = matchResult?.powerballMatch || false;

                  return (
                    <div
                      key={index}
                      className={`rounded-2xl p-4 border transition-all ${
                        !resultDeclared
                          ? "bg-gray-50/60 border-gray-100"
                          : isWinner
                            ? "bg-amber-50/60 border-amber-200"
                            : "bg-gray-50/60 border-gray-100"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2.5">
                        <span className="text-sm font-semibold text-gray-800">
                          Game #{game.gameNo || index + 1}
                        </span>
                        {resultDeclared && (
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold text-white flex items-center gap-1 ${
                              isWinner ? "bg-amber-500" : "bg-gray-400"
                            }`}
                          >
                            {isWinner ? (
                              <Trophy className="w-2.5 h-2.5" />
                            ) : (
                              <Heart className="w-2.5 h-2.5" />
                            )}
                            {isWinner ? "Winner" : "Lost"}
                          </span>
                        )}
                        {!resultDeclared && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500 text-white flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" /> Pending
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-2.5">
                        {game.numbers?.map((num) => {
                          const isMatched =
                            resultDeclared &&
                            winningNumbers?.numbers?.includes(num);
                          return (
                            <div
                              key={num}
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                                isMatched
                                  ? "bg-amber-500 text-white"
                                  : "bg-white text-gray-600 border border-gray-200"
                              }`}
                            >
                              {num}
                            </div>
                          );
                        })}
                        <div
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 ${
                            resultDeclared &&
                            winningNumbers?.powerball === game.powerball
                              ? "bg-amber-500 text-white"
                              : "bg-white text-gray-600 border border-gray-200"
                          }`}
                        >
                          <Zap className="w-2.5 h-2.5" /> PB: {game.powerball}
                        </div>
                      </div>

                      {resultDeclared && matchResult && (
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap gap-2 text-[11px]">
                            <span className="bg-white px-2.5 py-1 rounded-full border border-gray-100 flex items-center gap-1">
                              <Target className="w-2.5 h-2.5" /> Matches:{" "}
                              <strong
                                className={
                                  matchedCount > 0
                                    ? "text-amber-600"
                                    : "text-gray-500"
                                }
                              >
                                {matchedCount}/7
                              </strong>
                            </span>
                            <span className="bg-white px-2.5 py-1 rounded-full border border-gray-100 flex items-center gap-1">
                              <Zap className="w-2.5 h-2.5" /> Powerball:{" "}
                              <strong
                                className={
                                  powerballMatch
                                    ? "text-amber-600"
                                    : "text-red-500"
                                }
                              >
                                {powerballMatch ? "Hit" : "Miss"}
                              </strong>
                            </span>
                          </div>

                          {isWinner && (
                            <div className="mt-1.5 p-3 bg-amber-100/70 rounded-xl text-center text-xs font-semibold text-amber-800 border border-amber-200">
                              <Trophy className="w-3.5 h-3.5 inline-block mr-1.5" />
                              Congratulations! You won!
                              <div className="text-[11px] font-normal text-amber-700 mt-0.5">
                                Estimated Prize: $
                                {(
                                  (totalAmount * 0.7) /
                                    games.filter((g) => {
                                      const r = checkNumberMatch(
                                        g,
                                        winningNumbers,
                                      );
                                      return r?.isWinner;
                                    }).length || 1
                                ).toFixed(2)}
                              </div>
                            </div>
                          )}

                          {!isWinner && matchedCount > 0 && (
                            <div className="mt-1.5 p-2 bg-white/70 rounded-lg text-center text-[11px] text-gray-500 border border-gray-100">
                              You matched {matchedCount} number
                              {matchedCount !== 1 ? "s" : ""}
                              {powerballMatch && " and the Powerball"}
                              {matchedCount === 1 &&
                                !powerballMatch &&
                                " - Need at least 2 matches or 1 + Powerball to win"}
                            </div>
                          )}

                          {!isWinner && matchedCount === 0 && (
                            <div className="mt-1.5 p-2 bg-white/70 rounded-lg text-center text-[11px] text-gray-400 border border-gray-100">
                              No matches this time. Better luck next time!
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {resultDeclared && stats.total > 0 && (
            <div className="mt-4 p-4 bg-gray-50/60 rounded-xl border border-gray-100">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-amber-500" /> Overall
                Summary
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="bg-white rounded-lg p-2.5 text-center border border-gray-100">
                  <span className="text-gray-400 block text-[10px]">
                    Total Games
                  </span>
                  <span className="font-bold text-gray-900 text-sm">
                    {stats.total}
                  </span>
                </div>
                <div className="bg-white rounded-lg p-2.5 text-center border border-gray-100">
                  <span className="text-gray-400 block text-[10px]">Won</span>
                  <span className="font-bold text-emerald-600 text-sm">
                    {stats.won}
                  </span>
                </div>
                <div className="bg-white rounded-lg p-2.5 text-center border border-gray-100">
                  <span className="text-gray-400 block text-[10px]">Lost</span>
                  <span className="font-bold text-red-500 text-sm">
                    {stats.lost}
                  </span>
                </div>
                <div className="bg-white rounded-lg p-2.5 text-center border border-gray-100">
                  <span className="text-gray-400 block text-[10px]">
                    Win Rate
                  </span>
                  <span className="font-bold text-amber-600 text-sm">
                    {Math.round((stats.won / stats.total) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ================= DELETE CONFIRMATION POPUP =================
const DeleteConfirmationPopup = ({ isOpen, onClose, onConfirm, entryId }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-sm w-full p-6 border border-gray-100 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="text-red-400 flex justify-center mb-3">
            <Trash2 className="w-10 h-10" />
          </div>
          <h3 className="text-base font-bold text-gray-800 mb-1.5">
            Confirm Delete
          </h3>
          <p className="text-sm text-gray-500 mb-0.5">
            Are you sure you want to delete this entry?
          </p>
          <p className="text-xs text-red-500 font-semibold mb-5">
            This action cannot be undone.
          </p>

          <div className="flex gap-2.5 justify-center">
            <button
              className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition flex items-center gap-1.5"
              onClick={onClose}
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
            <button
              className="px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition flex items-center gap-1.5"
              onClick={() => onConfirm(entryId)}
            >
              <Trash2 className="w-3.5 h-3.5" /> Yes, Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ================= MAIN PAGE COMPONENT =================
const GameEntryResultPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { entries, loading, error } = useSelector(
    (state) => state.indiaGameEntry,
  );

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showEntryModal, setShowEntryModal] = useState(false);

  useEffect(() => {
    dispatch(getMyGameEntries());

    return () => {
      dispatch(resetGameEntryState());
    };
  }, [dispatch]);

  const handleDelete = async (entryId) => {
    setDeleteId(entryId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await dispatch(deleteGameEntry(deleteId));
      setShowDeleteModal(false);
      setDeleteId(null);
      setShowEntryModal(false);
      setSelectedEntry(null);
      dispatch(getMyGameEntries());
    }
  };

  const handleEntryClick = (entry) => {
    setSelectedEntry(entry);
    setShowEntryModal(true);
  };

  const handleCloseModal = () => {
    setShowEntryModal(false);
    setSelectedEntry(null);
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: "bg-amber-500",
      Active: "bg-amber-500",
      Completed: "bg-emerald-500",
      Cancelled: "bg-red-500",
      Won: "bg-amber-500",
      Lost: "bg-red-500",
      Open: "bg-amber-500",
    };
    return colors[status] || "bg-gray-400";
  };

  const getStatusIcon = (status) => {
    const icons = {
      Pending: Clock,
      Active: Loader2,
      Completed: CheckCircle2,
      Cancelled: CircleX,
      Won: Trophy,
      Lost: Heart,
      Open: Loader2,
    };
    return icons[status] || Info;
  };

  const renderEntriesList = () => {
    if (!entries || entries.length === 0) {
      return (
        <div className="text-center py-14 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-gray-300 flex justify-center mb-3">
            <Gamepad2 className="w-12 h-12" />
          </div>
          <p className="text-sm text-gray-400 font-medium">
            No game entries found
          </p>
          <button
            className="mt-5 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition flex items-center gap-1.5 mx-auto"
            onClick={() => navigate("/create-game-entry")}
          >
            <Plus className="w-4 h-4" /> Create New Entry
          </button>
        </div>
      );
    }

    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-amber-500" /> My Game Entries
          </h2>
          <span className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold flex items-center gap-1 border border-amber-100">
            <Gamepad2 className="w-3 h-3" /> {entries.length} entries
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {entries.map((entry) => {
            const status = entry.poolStatus || entry.playerStatus || "Pending";
            const entryId = entry.poolId;
            const isResultDeclared = entry.resultDeclared || false;
            const games = entry.games || [];
            const winningNumbers = entry.winningNumbers || {
              numbers: [],
              powerball: null,
            };
            const StatusIcon = getStatusIcon(status);

            let wonCount = 0;
            let lostCount = 0;
            if (isResultDeclared && games.length > 0) {
              games.forEach((game) => {
                const matches = game.numbers.filter(
                  (num) =>
                    winningNumbers.numbers &&
                    winningNumbers.numbers.includes(num),
                );
                const powerballMatch =
                  game.powerball === winningNumbers.powerball;
                if (
                  matches.length >= 3 ||
                  (matches.length >= 2 && powerballMatch)
                ) {
                  wonCount++;
                } else {
                  lostCount++;
                }
              });
            }

            return (
              <div
                key={entryId}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm shadow-gray-100 hover:shadow-md hover:shadow-gray-100 transition-shadow cursor-pointer p-4"
                onClick={() => handleEntryClick(entry)}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-sm font-bold text-gray-800 flex items-center gap-1">
                    <Target className="w-3.5 h-3.5 text-amber-500" /> Draw #
                    {entry.drawNo || "N/A"}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-semibold text-white flex items-center gap-1 ${getStatusColor(status)}`}
                  >
                    <StatusIcon className="w-2.5 h-2.5" /> {status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-gray-50/70 rounded-lg p-2 text-center border border-gray-100">
                    <div className="text-[9px] text-gray-400 font-semibold flex items-center justify-center gap-0.5">
                      <DollarSign className="w-2.5 h-2.5" /> Amount
                    </div>
                    <div className="font-bold text-gray-800 text-xs mt-0.5">
                      ${(entry.totalAmount || 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-gray-50/70 rounded-lg p-2 text-center border border-gray-100">
                    <div className="text-[9px] text-gray-400 font-semibold flex items-center justify-center gap-0.5">
                      <Users className="w-2.5 h-2.5" /> Players
                    </div>
                    <div className="font-bold text-gray-800 text-xs mt-0.5">
                      {entry.totalPlayers || 0}
                    </div>
                  </div>
                  <div className="bg-gray-50/70 rounded-lg p-2 text-center border border-gray-100">
                    <div className="text-[9px] text-gray-400 font-semibold flex items-center justify-center gap-0.5">
                      <Gamepad2 className="w-2.5 h-2.5" /> Games
                    </div>
                    <div className="font-bold text-gray-800 text-xs mt-0.5">
                      {entry.games?.length || 0}
                    </div>
                  </div>
                </div>

                {isResultDeclared && (
                  <div className="mb-3 flex gap-1.5 text-[10px] justify-center">
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full font-semibold flex items-center gap-1 border border-amber-100">
                      <Trophy className="w-2.5 h-2.5" /> {wonCount}
                    </span>
                    <span className="px-2.5 py-1 bg-red-50 text-red-600 rounded-full font-semibold flex items-center gap-1 border border-red-100">
                      <Heart className="w-2.5 h-2.5" /> {lostCount}
                    </span>
                    <span className="px-2.5 py-1 bg-gray-50 text-gray-600 rounded-full font-semibold flex items-center gap-1 border border-gray-100">
                      <Percent className="w-2.5 h-2.5" />{" "}
                      {Math.round(
                        (wonCount / (wonCount + lostCount || 1)) * 100,
                      )}
                      %
                    </span>
                  </div>
                )}

                {!entry.resultDeclared && (
                  <div className="mb-3 px-2.5 py-2 bg-amber-50/70 rounded-lg text-[11px] text-amber-700 text-center font-medium border border-amber-100 flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" /> Results pending...
                  </div>
                )}

                <button
                  className="w-full mt-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEntryClick(entry);
                  }}
                >
                  <Eye className="w-3.5 h-3.5" /> View Results{" "}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-amber-50/50 via-white to-white overflow-hidden">
      {/* Decorative background orbs */}
      <div className="pointer-events-none absolute -top-24 -right-20 w-72 h-72 bg-amber-200/30 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -left-24 w-64 h-64 bg-yellow-200/25 rounded-full blur-3xl" />

      <div className="relative px-4 sm:px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md shadow-amber-200 mb-3">
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Game Entry Results
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              View and manage all your game entries
            </p>
          </div>

          {error && !showEntryModal && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl mb-5 flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {typeof error === "string" ? error : "Something went wrong"}
            </div>
          )}

          {renderEntriesList()}

          <EntryDetailsPopup
            isOpen={showEntryModal}
            onClose={handleCloseModal}
            entry={selectedEntry}
            loading={loading}
            error={error}
            onDelete={handleDelete}
          />

          <DeleteConfirmationPopup
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={confirmDelete}
            entryId={deleteId}
          />
        </div>
      </div>
    </div>
  );
};

export default GameEntryResultPage;
