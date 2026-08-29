import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import mineBlastSound from "../assets/faah.mp3";
import {
  cashoutMines,
  resetMinesGame,
  revealMine,
  startMinesGame,
  syncMinesSocketCashout,
  syncMinesSocketUpdate,
} from "../redux/slices/minesSlice";
import { socket } from "../services/socket";

const TOTAL_CELLS = 36;

export default function MinesGame() {
  const dispatch = useDispatch();

  const { game, loading, message } = useSelector((state) => state.mines);

  const [betAmount, setBetAmount] = useState("50");
  const [amountError, setAmountError] = useState("");
  const [explosion, setExplosion] = useState(false);
  const [explosionCell, setExplosionCell] = useState(null);

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId) return;

    socket.emit("join-user", userId);

    const handleUpdate = (data) => {
      dispatch(syncMinesSocketUpdate(data));
    };

    const handleCashout = (data) => {
      dispatch(syncMinesSocketCashout(data));
    };

    socket.on("mines-update", handleUpdate);
    socket.on("mines-cashout", handleCashout);

    return () => {
      socket.off("mines-update", handleUpdate);
      socket.off("mines-cashout", handleCashout);
    };
  }, [userId, dispatch]);

  useEffect(() => {
    if (game?.status !== "lost") return;

    if (explosionCell === null) {
      setExplosion(true);
    }
  }, [game?.status, explosionCell]);

  const startGame = async () => {
    if (betAmount === "" || betAmount.trim?.() === "") {
      setAmountError("Please select or enter a game amount first.");
      return;
    }

    const amount = Number(betAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setAmountError("Please enter a valid game amount.");
      return;
    }

    setAmountError("");

    dispatch(
      startMinesGame({
        minesCount: 20,
        virtualStake: amount,
      }),
    ).then((action) => {
      if (startMinesGame.fulfilled.match(action)) {
        socket.emit("join-mines-game", action.payload.game.id);
      }
    });
  };

  const playMineSound = () => {
    try {
      const audio = new Audio(mineBlastSound);

      audio.preload = "auto";
      audio.volume = 1;

      const promise = audio.play();

      if (promise?.catch) {
        promise.catch((error) => {
          console.warn("Mine sound playback was blocked:", error);
        });
      }
    } catch (error) {
      console.error("Mine sound error:", error);
    }
  };

  const triggerMineExplosion = (cell) => {
    setExplosionCell(cell);
    setExplosion(true);
    playMineSound();
  };

  const reveal = (cell) => {
    if (!game || game.status !== "playing") return;
    if (game.openedCells?.includes(cell)) return;

    dispatch(
      revealMine({
        gameId: game.id,
        cell,
      }),
    ).then((action) => {
      if (
        revealMine.fulfilled.match(action) &&
        action.payload?.result?.status === "lost"
      ) {
        triggerMineExplosion(cell);
      }
    });
  };

  const cashout = () => {
    if (!game || game.status !== "playing") return;

    if (Number(game.safeCells || 0) <= 0) {
      return;
    }

    dispatch(
      cashoutMines({
        gameId: game.id,
      }),
    );
  };

  const currentWin =
    Number(game?.entryAmount ?? game?.virtualStake ?? 0) *
    Number(game?.multiplier || 1);

  const money = (value) => `₹${Number(value || 0).toFixed(2)}`;

  const coveredTile =
    "group relative aspect-square overflow-hidden rounded-[13px] " +
    "border-[2px] border-[#9b6508] " +
    "bg-gradient-to-br from-[#fff0b4] via-[#dca72e] to-[#8e5a08] " +
    "shadow-[inset_0_2px_2px_rgba(255,255,255,.8),inset_0_-6px_9px_rgba(76,39,0,.38),0_3px_5px_rgba(0,0,0,.42)] " +
    "transition-all duration-150 " +
    "hover:-translate-y-[1px] hover:brightness-110 hover:shadow-[inset_0_2px_2px_rgba(255,255,255,.9),inset_0_-5px_8px_rgba(76,39,0,.32),0_5px_9px_rgba(0,0,0,.45)] " +
    "active:translate-y-[2px]";

  const renderCoveredRock = () => (
    <>
      <span className="absolute inset-[6px] rounded-[9px] bg-[linear-gradient(135deg,rgba(255,248,205,.45),transparent_30%,rgba(92,55,5,.18)_57%,rgba(255,225,126,.28))]" />
      <span className="absolute left-[12%] top-[10%] h-[42%] w-[52%] rounded-[40%] bg-white/20 blur-[7px]" />
      <span className="absolute -left-[10%] bottom-[8%] h-[45%] w-[70%] rotate-[17deg] rounded-[50%] bg-[#8c5b0d]/15 blur-[3px]" />
      <span className="absolute right-[7%] top-[27%] h-[24%] w-[28%] rotate-[35deg] bg-[#f6d56f]/30 [clip-path:polygon(50%_0,100%_35%,75%_100%,15%_80%,0_30%)]" />
      <span className="absolute bottom-[7%] right-[14%] h-[25%] w-[34%] -rotate-[20deg] bg-[#b87d17]/35 [clip-path:polygon(20%_0,100%_30%,75%_100%,0_72%)]" />
    </>
  );

  const renderOpenTile = (isMine) => {
    const isBlastedMine = isMine && explosion && explosionCell !== null;

    return (
      <div
        className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-[13px] border-[2px] transition-all duration-300 ${
          isBlastedMine
            ? "border-[#ff3b16] bg-gradient-to-br from-[#ffb02e] via-[#d93416] to-[#4a0905] shadow-[inset_0_2px_4px_rgba(255,255,255,.55),inset_0_-8px_14px_rgba(45,0,0,.65),0_0_18px_rgba(255,72,20,.65)]"
            : isMine
              ? "border-[#65140d] bg-gradient-to-br from-[#4b1712] via-[#2a0d0a] to-[#130807]"
              : "border-[#5d461d] bg-gradient-to-br from-[#40371f] via-[#29261b] to-[#171712]"
        } shadow-[inset_0_2px_3px_rgba(255,255,255,.12),inset_0_-7px_12px_rgba(0,0,0,.75),0_3px_6px_rgba(0,0,0,.55)]`}
      >
        {isBlastedMine && (
          <span className="absolute inset-0 z-[1] animate-pulse bg-[radial-gradient(circle_at_center,rgba(255,245,180,.82)_0%,rgba(255,111,0,.58)_25%,rgba(190,25,5,.45)_55%,transparent_80%)]" />
        )}

        <span className="absolute inset-[5px] z-[2] rounded-[9px] bg-black/20" />

        <span
          className="absolute inset-0 z-[2] opacity-80"
          style={{
            background: `
              linear-gradient(58deg,
                transparent 47%,
                rgba(255,255,255,.20) 48%,
                rgba(0,0,0,.55) 49%,
                transparent 51%
              ),
              linear-gradient(122deg,
                transparent 45%,
                rgba(255,255,255,.14) 46%,
                rgba(0,0,0,.6) 48%,
                transparent 50%
              ),
              linear-gradient(18deg,
                transparent 55%,
                rgba(0,0,0,.55) 56%,
                transparent 58%
              ),
              linear-gradient(150deg,
                transparent 62%,
                rgba(255,255,255,.10) 63%,
                rgba(0,0,0,.6) 65%,
                transparent 67%
              )
            `,
          }}
        />

        <span
          className="absolute left-1/2 top-1/2 z-[2] h-[55%] w-[55%] -translate-x-1/2 -translate-y-1/2 rotate-45 opacity-40"
          style={{
            clipPath:
              "polygon(50% 0%, 62% 35%, 100% 50%, 63% 64%, 50% 100%, 37% 64%, 0% 50%, 38% 35%)",
            background:
              "linear-gradient(135deg, rgba(255,255,255,.18), rgba(0,0,0,.65))",
          }}
        />

        <span className="absolute left-[20%] top-[25%] z-[3] h-[45%] w-[2px] rotate-[38deg] bg-black/60" />
        <span className="absolute right-[22%] top-[20%] z-[3] h-[42%] w-[2px] -rotate-[48deg] bg-black/60" />
        <span className="absolute bottom-[20%] left-[32%] z-[3] h-[38%] w-[2px] rotate-[72deg] bg-white/10" />

        <span className="relative z-10 text-3xl drop-shadow-[0_3px_4px_rgba(0,0,0,.8)] sm:text-4xl">
          {isMine ? "💣" : "💎"}
        </span>

        <span className="pointer-events-none absolute inset-0 z-[4] rounded-[11px] shadow-[inset_0_0_18px_rgba(0,0,0,.65)]" />
      </div>
    );
  };

  return (
    <>
      <style>{`
        @keyframes minesScreenShake {
          0%, 100% { transform: translate3d(0, 0, 0); }
          8% { transform: translate3d(-9px, 3px, 0) rotate(-0.3deg); }
          16% { transform: translate3d(10px, -4px, 0) rotate(0.3deg); }
          25% { transform: translate3d(-8px, -3px, 0); }
          34% { transform: translate3d(8px, 3px, 0); }
          44% { transform: translate3d(-6px, 1px, 0); }
          55% { transform: translate3d(6px, -2px, 0); }
          68% { transform: translate3d(-4px, 1px, 0); }
          82% { transform: translate3d(3px, -1px, 0); }
        }

        @keyframes blastCore {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(.1);
          }
          8% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(.55);
          }
          17% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.05);
          }
          28% {
            opacity: .95;
            transform: translate(-50%, -50%) scale(.9);
          }
          100% {
            opacity: .18;
            transform: translate(-50%, -50%) scale(1.35);
          }
        }

        @keyframes blastGlow {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(.1);
          }
          15% { opacity: .95; }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(2);
          }
        }

        @keyframes blastRing {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(.2);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(2.2);
          }
        }

        @keyframes debrisBurst {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(.2) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform:
              translate(
                calc(-50% + var(--dx)),
                calc(-50% + var(--dy))
              )
              scale(var(--scale))
              rotate(var(--rot));
          }
        }

        @keyframes smokePuff {
          0% {
            opacity: .65;
            transform: translate(-50%, -50%) scale(.35);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1.7);
          }
        }

        .mines-screen-shake {
          animation: minesScreenShake 1.15s cubic-bezier(.36,.07,.19,.97) both;
        }

        .blast-core {
          animation: blastCore 1.05s ease-out forwards;
        }

        .blast-glow {
          animation: blastGlow 1.2s ease-out forwards;
        }

        .blast-ring {
          animation: blastRing 1s ease-out forwards;
        }

        .debris {
          animation: debrisBurst 900ms cubic-bezier(.12,.72,.2,1) forwards;
        }

        .smoke-puff {
          animation: smokePuff 1.2s ease-out forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .mines-screen-shake,
          .blast-core,
          .blast-glow,
          .blast-ring,
          .debris,
          .smoke-puff {
            animation: none !important;
          }
        }
      `}</style>

      <div
        className={`min-h-screen bg-[#f8f3e7] text-[#30230e] px-3 py-4 sm:px-5 ${
          explosion ? "mines-screen-shake" : ""
        }`}
      >
        <div className="mx-auto w-full max-w-5xl">
          {/* Title */}
          <div className="relative mb-5 flex items-center justify-center">
            <div className="absolute h-px w-full bg-gradient-to-r from-transparent via-[#c89528] to-transparent" />
            <div className="relative flex items-center gap-2 rounded-full border border-[#b97d0c] bg-gradient-to-r from-[#fff7d8] via-[#e6b842] to-[#fff7d8] px-6 py-2 shadow-[0_3px_9px_rgba(123,78,4,.2)]">
              <span>⛏️</span>
              <h1 className="text-xl font-black tracking-wide text-[#4b3109] sm:text-2xl">
                MINING GAME
              </h1>
              <span>⛏️</span>
            </div>
          </div>

          {game && (
            <>
              {/* Stats */}
              <div className="mb-4 grid grid-cols-3 gap-2 sm:gap-3">
                <div className="rounded-xl border border-[#d9b35e] bg-white/90 p-3 text-center shadow-sm">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#8a744e]">
                    Total Mines
                  </p>
                  <p className="mt-1 text-xl font-black text-[#8f5c07]">
                    {game.minesCount || 15}
                  </p>
                </div>
                <div className="rounded-xl border border-[#d9b35e] bg-white/90 p-3 text-center shadow-sm">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#8a744e]">
                    Current Reward
                  </p>
                  <p className="mt-1 text-xl font-black text-[#9a6a08]">
                    {money(currentWin)}
                  </p>
                </div>
                <div className="rounded-xl border border-[#d9b35e] bg-white/90 p-3 text-center shadow-sm">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#8a744e]">
                    Safe Cells
                  </p>
                  <p className="mt-1 text-xl font-black text-[#3d7950]">
                    {game.safeCells || 0}/
                    {TOTAL_CELLS - Number(game.minesCount || 0)}
                  </p>
                </div>
              </div>

              {/* Game info */}
              <div className="mb-3 flex items-center justify-between rounded-xl border border-[#d8b158] bg-[#fffaf0] px-3 py-2 shadow-sm sm:px-5">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-[#8b7754]">
                    Entry
                  </span>
                  <p className="font-black text-[#5d3e08]">
                    {money(game.entryAmount ?? game.virtualStake)}
                  </p>
                </div>
                <div className="text-center">
                  <span className="text-[9px] uppercase tracking-wider text-[#8b7754]">
                    Multiplier
                  </span>
                  <p className="font-black text-[#a66d08]">
                    {Number(game.multiplier || 1).toFixed(2)}x
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase tracking-wider text-[#8b7754]">
                    Win
                  </span>
                  <p className="font-black text-[#3d7950]">
                    {money(currentWin)}
                  </p>
                </div>
              </div>

              {/* 6 x 6 board */}
              <section className="relative rounded-[22px] border border-[#b27b12] bg-gradient-to-b from-[#fffaf0] to-[#eee2c7] p-2.5 shadow-[0_8px_24px_rgba(96,60,5,.18)] sm:p-4">
                <div className="mb-3 flex items-center justify-between rounded-xl border border-[#d1a643] bg-[#241b0e] px-3 py-2 text-[#f9d979]">
                  <span className="text-[10px] font-bold uppercase tracking-[.18em]">
                    6 × 6 Mine Field
                  </span>
                  <span className="text-[10px] text-[#e8d8b2]">
                    Find gold • avoid mines
                  </span>
                </div>

                <div className="relative grid grid-cols-6 gap-1.5 sm:gap-2.5">
                  {Array.from({ length: TOTAL_CELLS }).map((_, index) => {
                    const opened = game.openedCells?.includes(index);
                    const isMine = game.minePositions?.includes(index);

                    return (
                      <button
                        key={index}
                        disabled={
                          opened || game.status !== "playing" || loading
                        }
                        onClick={() => reveal(index)}
                        aria-label={`Mine cell ${index + 1}`}
                        className={`${opened ? "" : coveredTile} ${
                          !opened && game.status !== "playing"
                            ? "opacity-60"
                            : ""
                        }`}
                      >
                        {opened ? renderOpenTile(isMine) : renderCoveredRock()}
                      </button>
                    );
                  })}

                  {/* Explosion overlay - only visual effects, no pointer-events-none on parent */}
                  {explosion &&
                    explosionCell !== null &&
                    game?.status === "lost" && (
                      <>
                        {/* Blast effects - pointer-events-none */}
                        <div
                          className="pointer-events-none absolute inset-0 z-[60]"
                          aria-live="assertive"
                          aria-label="Mine hit"
                        >
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,190,70,.12),transparent_52%)]" />

                          <div
                            className="absolute grid grid-cols-6 grid-rows-6 gap-1.5 sm:gap-2.5"
                            style={{
                              inset: "0",
                              padding: "0",
                            }}
                          >
                            <div
                              className="relative flex items-center justify-center"
                              style={{
                                gridColumn: (explosionCell % 6) + 1,
                                gridRow: Math.floor(explosionCell / 6) + 1,
                              }}
                            >
                              <span className="blast-ring absolute left-1/2 top-1/2 h-[78%] w-[78%] rounded-full border-[5px] border-[#ffd34e] shadow-[0_0_24px_10px_rgba(255,111,0,.5)]" />
                              <span className="smoke-puff absolute left-1/2 top-1/2 h-[88%] w-[88%] rounded-full bg-[radial-gradient(circle,rgba(55,35,22,.65),rgba(28,20,15,.3)_55%,transparent_72%)] blur-[3px]" />
                              <span className="blast-glow absolute left-1/2 top-1/2 h-[95%] w-[95%] rounded-full bg-[radial-gradient(circle,#fffbd5_0%,#ffd23d_18%,#ff8a00_40%,#ed3b16_62%,transparent_73%)] blur-[2px]" />
                              <span
                                className="blast-core absolute left-1/2 top-1/2 h-[78%] w-[78%] overflow-visible rounded-full"
                                style={{
                                  background:
                                    "radial-gradient(circle at 50% 50%, #fffbd5 0%, #ffd447 16%, #ff8b13 38%, #e33b16 59%, rgba(113,17,8,.8) 68%, transparent 70%)",
                                  clipPath:
                                    "polygon(50% 0%, 59% 17%, 72% 7%, 76% 25%, 94% 24%, 84% 40%, 100% 50%, 83% 59%, 94% 75%, 75% 76%, 72% 94%, 58% 83%, 50% 100%, 41% 83%, 25% 94%, 24% 76%, 6% 75%, 17% 59%, 0% 50%, 17% 40%, 6% 24%, 24% 25%, 28% 7%, 41% 17%)",
                                }}
                              />
                              <span
                                className="blast-core absolute left-1/2 top-1/2 h-[35%] w-[35%] rounded-full"
                                style={{
                                  background:
                                    "radial-gradient(circle, #ffffff 0%, #fff4a8 28%, #ffcf3a 55%, #ff7512 100%)",
                                  filter: "blur(1px)",
                                }}
                              />
                              <span className="absolute left-1/2 top-1/2 z-[25] -translate-x-1/2 -translate-y-1/2 text-2xl drop-shadow-[0_3px_5px_rgba(0,0,0,.9)] sm:text-3xl">
                                💣
                              </span>
                              {[
                                ["-92px", "-72px", "10px", "38deg", "#ffd65b"],
                                ["82px", "-78px", "8px", "-54deg", "#9b6a20"],
                                ["-112px", "-8px", "7px", "74deg", "#e24b1e"],
                                ["108px", "18px", "11px", "-35deg", "#ffb72e"],
                                ["-75px", "91px", "9px", "-70deg", "#6f4b25"],
                                ["76px", "96px", "7px", "45deg", "#f06b20"],
                                ["-38px", "-108px", "6px", "22deg", "#ffe58a"],
                                ["35px", "116px", "10px", "-30deg", "#c53d18"],
                                ["-128px", "48px", "6px", "88deg", "#d79b2c"],
                                ["132px", "-42px", "8px", "-72deg", "#ffcf4a"],
                                ["-18px", "128px", "5px", "54deg", "#8d6125"],
                                ["22px", "-130px", "7px", "-42deg", "#ed4b1a"],
                              ].map(([dx, dy, scale, rot, color], index) => (
                                <span
                                  key={index}
                                  className="debris absolute left-1/2 top-1/2 rounded-[2px] shadow-[0_0_5px_rgba(255,170,40,.55)]"
                                  style={{
                                    "--dx": dx,
                                    "--dy": dy,
                                    "--scale": scale === "5px" ? "0.9" : "1.15",
                                    "--rot": rot,
                                    width: scale,
                                    height: scale,
                                    background: color,
                                    animationDelay: `${index * 18}ms`,
                                  }}
                                />
                              ))}
                              <span className="absolute left-1/2 top-1/2 h-[52%] w-[52%] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-black/45 bg-black/25 shadow-[inset_0_4px_8px_rgba(0,0,0,.75),0_0_12px_rgba(0,0,0,.5)]" />
                            </div>
                          </div>
                        </div>

                        {/* MINE HIT Popup and Button - Outside pointer-events-none */}
                        <div className="absolute left-1/2 top-1/2 z-[70] flex w-[min(82%,320px)] -translate-x-1/2 -translate-y-1/2 flex-col items-center">
                          {/* Popup */}
                          <div className="mb-3 w-full rounded-2xl border-2 border-[#ffb62b] bg-gradient-to-r from-[#1a0d08] via-[#3d1a0e] to-[#1a0d08] px-6 py-2.5 text-center shadow-[0_8px_30px_rgba(0,0,0,.5),0_0_40px_rgba(255,120,0,.2)] animate-pulse">
                            <div className="flex items-center justify-center gap-2">
                              <span className="h-2 w-2 animate-pulse rounded-full bg-[#ff4a2f] shadow-[0_0_10px_#ff4a2f]" />
                              <p className="text-sm font-black tracking-[.15em] text-[#ffe18a]">
                                💥 MINE HIT
                              </p>
                              <span className="h-2 w-2 animate-pulse rounded-full bg-[#ff4a2f] shadow-[0_0_10px_#ff4a2f]" />
                            </div>
                            <p className="text-[9px] font-bold uppercase tracking-[.2em] text-white/60">
                              Game Over • Start a New Game
                            </p>
                          </div>

                          {/* New Game Button - Clean and Clickable */}
                          <button
                            type="button"
                            onClick={() => {
                              setExplosion(false);
                              setExplosionCell(null);
                              dispatch(resetMinesGame());
                            }}
                            className="group relative w-full overflow-hidden rounded-2xl border-2 border-[#b78a32] bg-gradient-to-r from-[#2d2416] via-[#4a3518] to-[#2d2416] px-6 py-3.5 font-bold text-[#ffe39a] shadow-[0_4px_20px_rgba(0,0,0,.3)] transition-all duration-300 hover:scale-[1.02] hover:border-[#dba444] hover:shadow-[0_8px_35px_rgba(183,138,50,.4)] active:scale-[0.97] cursor-pointer"
                          >
                            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            <span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#b78a32]/20 via-[#dba444]/10 to-[#b78a32]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            <div className="relative flex items-center justify-center gap-3">
                              <span className="text-lg group-hover:rotate-180 transition-transform duration-500">
                                🔄
                              </span>
                              <span className="text-sm font-bold tracking-wide sm:text-base">
                                START NEW GAME
                              </span>
                              <span className="text-lg group-hover:translate-x-1 transition-transform duration-300">
                                →
                              </span>
                            </div>

                            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#dba444] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </button>
                        </div>
                      </>
                    )}
                </div>
              </section>

              {/* Controls */}
              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1.5fr_1fr]">
                <button
                  type="button"
                  onClick={cashout}
                  disabled={
                    game.status !== "playing" ||
                    Number(game.safeCells || 0) <= 0 ||
                    loading
                  }
                  className="rounded-2xl border-2 border-[#9c6708] bg-gradient-to-b from-[#ffe58a] via-[#d99d1c] to-[#a86c08] px-4 py-3 text-lg font-black text-[#392304] shadow-[inset_0_2px_2px_rgba(255,255,255,.7),0_5px_10px_rgba(92,57,3,.25)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading
                    ? "PROCESSING..."
                    : `💰 CASHOUT ${money(currentWin)}`}
                </button>
              </div>

              {game.status !== "playing" && !explosion && (
                <div className="mt-4 rounded-2xl border border-[#d6ad58] bg-white/90 p-5 text-center shadow-sm">
                  {game.status === "lost" && (
                    <>
                      <div className="text-4xl">💣</div>
                      <div className="mt-1 font-black text-[#b63224]">
                        GAME LOST
                      </div>
                    </>
                  )}

                  {game.status === "won" && (
                    <>
                      <div className="text-4xl">🏆</div>
                      <div className="mt-1 font-black text-[#3d7950]">
                        YOU WON!
                      </div>
                      <div className="mt-1 text-2xl font-black text-[#9a6808]">
                        {money(game.virtualWin)}
                      </div>
                    </>
                  )}

                  {game.status === "cashout" && (
                    <>
                      <div className="text-4xl">💰</div>
                      <div className="mt-1 font-black text-[#3d7950]">
                        CASHOUT SUCCESSFUL
                      </div>
                      <div className="mt-1 text-2xl font-black text-[#9a6808]">
                        {money(game.virtualWin)}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Extra New Game button when not explosion state */}
              {game.status !== "playing" && !explosion && (
                <button
                  type="button"
                  onClick={() => {
                    setExplosion(false);
                    setExplosionCell(null);
                    dispatch(resetMinesGame());
                  }}
                  className="mt-3 w-full rounded-xl border border-[#b78a32] bg-[#2d2416] py-3 font-bold text-[#ffe39a] transition hover:bg-[#40331f]"
                >
                  🔄 NEW GAME
                </button>
              )}

              {message && (
                <p className="mt-4 text-center text-sm font-semibold text-[#9a6808]">
                  {message}
                </p>
              )}
            </>
          )}

          {/* Start screen */}
          {!game && (
            <section className="overflow-hidden rounded-[24px] border border-[#c99a37] bg-white/90 shadow-[0_10px_35px_rgba(103,68,9,.15)]">
              <div className="bg-gradient-to-r from-[#2c2111] via-[#4b350f] to-[#2c2111] px-5 py-4 text-center">
                <p className="text-xs font-bold uppercase tracking-[.3em] text-[#f2d47d]">
                  TREASURE HUNT
                </p>
                <h2 className="mt-1 text-2xl font-black text-white">
                  6 × 6 MINING FIELD
                </h2>
              </div>

              <div className="p-5">
                <div className="mb-5 grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-[#dfc078] bg-[#fff9ea] p-3 text-center">
                    <div className="text-2xl">💎</div>
                    <p className="mt-1 text-[10px] font-bold text-[#765f35]">
                      FIND Diamond
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#dfc078] bg-[#fff9ea] p-3 text-center">
                    <div className="text-2xl">⛏️</div>
                    <p className="mt-1 text-[10px] font-bold text-[#765f35]">
                      MINE TILES
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#dfc078] bg-[#fff9ea] p-3 text-center">
                    <div className="text-2xl">💣</div>
                    <p className="mt-1 text-[10px] font-bold text-[#765f35]">
                      AVOID MINES
                    </p>
                  </div>
                </div>

                <p className="mb-2 text-[10px] font-semibold text-[#8b7754]">
                  Enter any amount or choose a quick amount
                </p>

                <div className="mb-4 grid grid-cols-4 gap-2">
                  {[10, 50, 100, 500].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => {
                        setBetAmount(amount);
                        setAmountError("");
                      }}
                      className={`rounded-xl border py-2.5 text-sm font-black transition ${
                        Number(betAmount) === amount
                          ? "border-[#9a6609] bg-gradient-to-b from-[#ffe18a] to-[#c88d15] text-[#3d2804] shadow-sm"
                          : "border-[#d7bf8a] bg-[#fffaf0] text-[#6b5837] hover:border-[#b78a32]"
                      }`}
                    >
                      ₹{amount}
                    </button>
                  ))}
                </div>

                <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-[#7b6848]">
                  Game Amount
                </label>

                <div className="mb-3 flex items-center overflow-hidden rounded-xl border-2 border-[#c79532] bg-[#fffdf7] shadow-inner">
                  <span className="px-4 text-lg font-black text-[#a36b08]">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={betAmount}
                    onChange={(e) => {
                      // Allow the user to completely clear the field.
                      // Do not convert "" to 0 while typing.
                      const value = e.target.value;
                      setBetAmount(value);

                      if (value !== "" && Number(value) > 0) {
                        setAmountError("");
                      }
                    }}
                    onBlur={() => {
                      // Keep an intentionally empty field empty.
                      // Start Mining handles the required-field validation.
                      if (
                        betAmount !== "" &&
                        (!Number.isFinite(Number(betAmount)) ||
                          Number(betAmount) < 1)
                      ) {
                        setBetAmount("");
                      }
                    }}
                    className="min-w-0 flex-1 bg-transparent py-3 pr-3 text-lg font-black text-[#4f3507] outline-none"
                    aria-label="Game amount"
                  />
                </div>

                {amountError && (
                  <p className="mb-3 text-center text-xs font-bold text-[#c73525]">
                    {amountError}
                  </p>
                )}

                <button
                  type="button"
                  onClick={startGame}
                  disabled={loading}
                  className="w-full rounded-2xl border-2 border-[#9c6708] bg-gradient-to-b from-[#ffe58a] via-[#d99d1c] to-[#a86c08] py-4 text-lg font-black text-[#392304] shadow-[inset_0_2px_2px_rgba(255,255,255,.7),0_6px_12px_rgba(92,57,3,.25)] transition hover:brightness-105 disabled:opacity-50"
                >
                  {loading ? "STARTING..." : "⛏️ START MINING"}
                </button>

                {message && (
                  <p className="mt-4 text-center text-sm font-semibold text-[#9a6808]">
                    {message}
                  </p>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
