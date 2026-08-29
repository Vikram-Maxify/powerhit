import { useEffect, useState } from "react";
import { socket } from "../services/socket";

const API =
  "http://localhost:5007/api/mine-games";

const TOTAL_CELLS = 36;

export default function MinesGame() {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const userId =
    localStorage.getItem("userId");

  /*
   * =====================================================
   * SOCKET
   * =====================================================
   */

  useEffect(() => {
    if (!userId) return;

    socket.emit(
      "join-user",
      userId
    );

    /*
     * ---------------------------------------------------
     * GAME UPDATE
     * ---------------------------------------------------
     */

    const handleUpdate = (data) => {
      setGame((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          ...data,
        };
      });

      /*
       * Win message
       */

      if (data.status === "won") {
        setMessage(
          `You won ₹${Number(
            data.virtualWin || 0
          ).toFixed(2)}`
        );
      }

      /*
       * Lost message
       */

      if (data.status === "lost") {
        setMessage(
          "💣 Mine hit! Game lost."
        );
      }
    };

    /*
     * ---------------------------------------------------
     * CASHOUT
     * ---------------------------------------------------
     */

    const handleCashout = (data) => {
      setGame((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          ...data,
        };
      });

      setMessage(
        `Cashout: ₹${Number(
          data.virtualWin || 0
        ).toFixed(2)}`
      );
    };

    socket.on(
      "mines-update",
      handleUpdate
    );

    socket.on(
      "mines-cashout",
      handleCashout
    );

    return () => {
      socket.off(
        "mines-update",
        handleUpdate
      );

      socket.off(
        "mines-cashout",
        handleCashout
      );
    };
  }, [userId]);

  /*
   * =====================================================
   * START GAME
   * =====================================================
   */

  const startGame = async () => {
    try {
      setLoading(true);
      setMessage("");

      const token =
        localStorage.getItem("token");

      /*
       * Game entry amount
       */
      const entryAmount = 100;

      const res = await fetch(
        `${API}/start`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            minesCount: 5,

            virtualStake:
              entryAmount,
          }),
        }
      );

      const data =
        await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to start game"
        );
      }

      /*
       * Set complete game state
       */

      setGame({
        ...data.game,

        balance:
          Number(data.balance || 0),

        entryAmount:
          Number(
            data.game.entryAmount ||
              data.game.virtualStake ||
              0
          ),
      });

      /*
       * Join game room
       */

      socket.emit(
        "join-mines-game",
        data.game.id
      );

      /*
       * New game / existing game message
       */

      if (data.existingGame) {
        setMessage(
          "Active game restored"
        );
      } else {
        setMessage(
          `₹${Number(
            data.game.entryAmount || 0
          ).toFixed(2)} entry deducted`
        );
      }
    } catch (error) {
      setMessage(
        error.message ||
          "Unable to start game"
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * =====================================================
   * REVEAL CELL
   * =====================================================
   */

  const reveal = async (cell) => {
    if (
      !game ||
      game.status !== "playing"
    ) {
      return;
    }

    if (
      game.openedCells?.includes(cell)
    ) {
      return;
    }

    try {
      setMessage("");

      const token =
        localStorage.getItem("token");

      const res = await fetch(
        `${API}/${game.id}/reveal`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            cell,
          }),
        }
      );

      const data =
        await res.json();

      if (!res.ok || !data.success) {
        setMessage(
          data.message ||
            "Unable to reveal cell"
        );

        return;
      }

      setGame((prev) => ({
        ...prev,

        ...data.result,

        /*
         * Preserve balance if backend
         * doesn't send it during normal play.
         */
        balance:
          data.result.balance ??
          prev.balance,
      }));

      if (
        data.result.status === "lost"
      ) {
        setMessage(
          "💣 Mine hit! You lost this game."
        );
      }

      if (
        data.result.status === "won"
      ) {
        setMessage(
          `🎉 You won ₹${Number(
            data.result.virtualWin || 0
          ).toFixed(2)}`
        );
      }
    } catch (error) {
      console.error(error);

      setMessage(
        "Unable to reveal cell"
      );
    }
  };

  /*
   * =====================================================
   * CASHOUT
   * =====================================================
   */

  const cashout = async () => {
    if (
      !game ||
      game.status !== "playing"
    ) {
      return;
    }

    if (
      Number(game.safeCells || 0) <= 0
    ) {
      setMessage(
        "Open at least one safe cell"
      );

      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const token =
        localStorage.getItem("token");

      const res = await fetch(
        `${API}/${game.id}/cashout`,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const data =
        await res.json();

      if (!res.ok || !data.success) {
        setMessage(
          data.message ||
            "Cashout failed"
        );

        return;
      }

      setGame((prev) => ({
        ...prev,

        ...data,

        balance:
          Number(
            data.balance ??
              prev.balance ??
              0
          ),

        entryAmount:
          Number(
            data.entryAmount ??
              prev.entryAmount ??
              prev.virtualStake ??
              0
          ),
      }));

      setMessage(
        `💰 You won ₹${Number(
          data.virtualWin || 0
        ).toFixed(2)}`
      );
    } catch (error) {
      console.error(error);

      setMessage(
        "Cashout failed"
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * =====================================================
   * CURRENT WIN CALCULATION
   * =====================================================
   */

  const currentWin =
    Number(
      game?.entryAmount ??
        game?.virtualStake ??
        0
    ) *
    Number(
      game?.multiplier || 1
    );

  /*
   * =====================================================
   * UI
   * =====================================================
   */

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4">
      <div className="max-w-md mx-auto">

        {/* =================================================
            HEADER
        ================================================= */}

        <h1 className="text-3xl font-bold text-center mb-4">
          💣 Mines
        </h1>

        {/* =================================================
            START
        ================================================= */}

        {!game && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">

            <div className="text-center mb-5">
              <div className="text-sm text-slate-400">
                Game Entry
              </div>

              <div className="text-3xl font-bold text-yellow-400">
                ₹100
              </div>

              <p className="text-xs text-slate-500 mt-2">
                Entry amount will be deducted
                from your balance.
              </p>
            </div>

            <button
              onClick={startGame}
              disabled={loading}
              className="
                w-full
                py-3
                rounded-xl
                bg-blue-600
                hover:bg-blue-500
                font-bold
                transition
                disabled:opacity-50
              "
            >
              {loading
                ? "Starting..."
                : "Start Game"}
            </button>

            {message && (
              <p className="text-center mt-4 text-yellow-400">
                {message}
              </p>
            )}
          </div>
        )}

        {/* =================================================
            GAME
        ================================================= */}

        {game && (
          <>
            {/* =============================================
                GAME INFO
            ============================================= */}

            <div className="grid grid-cols-3 gap-2 mb-3">

              {/* BALANCE */}

              <div className="
                bg-slate-900
                border
                border-slate-800
                rounded-xl
                p-3
              ">
                <div className="text-xs text-slate-400">
                  Balance
                </div>

                <div className="text-lg font-bold text-white">
                  ₹{Number(
                    game.balance || 0
                  ).toFixed(2)}
                </div>
              </div>

              {/* ENTRY */}

              <div className="
                bg-slate-900
                border
                border-slate-800
                rounded-xl
                p-3
              ">
                <div className="text-xs text-slate-400">
                  Game Entry
                </div>

                <div className="text-lg font-bold text-yellow-400">
                  ₹{Number(
                    game.entryAmount ??
                      game.virtualStake ??
                      0
                  ).toFixed(2)}
                </div>
              </div>

              {/* MULTIPLIER */}

              <div className="
                bg-slate-900
                border
                border-slate-800
                rounded-xl
                p-3
              ">
                <div className="text-xs text-slate-400">
                  Multiplier
                </div>

                <div className="text-lg font-bold text-green-400">
                  {Number(
                    game.multiplier || 1
                  ).toFixed(2)}
                  x
                </div>
              </div>
            </div>

            {/* =============================================
                SAFE + CURRENT WIN
            ============================================= */}

            <div className="
              bg-slate-900
              border
              border-slate-800
              rounded-xl
              p-4
              mb-4
            ">
              <div className="flex justify-between items-center">

                <div>
                  <div className="text-xs text-slate-400">
                    Safe Cells
                  </div>

                  <div className="text-xl font-bold">
                    {game.safeCells || 0}
                    /
                    {TOTAL_CELLS -
                      Number(
                        game.minesCount || 0
                      )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400">
                    Current Win
                  </div>

                  <div className="text-xl font-bold text-emerald-400">
                    ₹{currentWin.toFixed(2)}
                  </div>
                </div>

              </div>
            </div>

            {/* =============================================
                GRID
            ============================================= */}

            <div className="grid grid-cols-6 gap-2">

              {Array.from({
                length: TOTAL_CELLS,
              }).map((_, index) => {

                const opened =
                  game.openedCells?.includes(
                    index
                  );

                return (
                  <button
                    key={index}
                    disabled={
                      opened ||
                      game.status !==
                        "playing" ||
                      loading
                    }
                    onClick={() =>
                      reveal(index)
                    }
                    className={`
                      aspect-square
                      rounded-lg
                      font-bold
                      text-lg
                      transition
                      ${
                        opened
                          ? "bg-green-600 text-white"
                          : "bg-slate-800 hover:bg-slate-700"
                      }
                      ${
                        game.status !==
                          "playing"
                          ? "opacity-60"
                          : ""
                      }
                    `}
                  >
                    {opened
                      ? "💎"
                      : "?"}
                  </button>
                );
              })}
            </div>

            {/* =============================================
                CASHOUT
            ============================================= */}

            <button
              onClick={cashout}
              disabled={
                game.status !==
                  "playing" ||
                Number(
                  game.safeCells || 0
                ) <= 0 ||
                loading
              }
              className="
                w-full
                mt-4
                py-3
                rounded-xl
                bg-emerald-600
                hover:bg-emerald-500
                font-bold
                transition
                disabled:opacity-40
              "
            >
              {loading
                ? "Processing..."
                : `Cashout ₹${currentWin.toFixed(
                    2
                  )}`}
            </button>

            {/* =============================================
                GAME STATUS
            ============================================= */}

            {game.status !==
              "playing" && (
              <div className="
                mt-4
                rounded-xl
                p-4
                text-center
                bg-slate-900
                border
                border-slate-800
              ">

                {game.status ===
                  "lost" && (
                  <>
                    <div className="text-2xl mb-1">
                      💣
                    </div>

                    <div className="font-bold text-red-400">
                      Game Lost
                    </div>
                  </>
                )}

                {game.status ===
                  "won" && (
                  <>
                    <div className="text-2xl mb-1">
                      🎉
                    </div>

                    <div className="font-bold text-green-400">
                      You Won
                    </div>

                    <div className="text-xl font-bold mt-1">
                      ₹{Number(
                        game.virtualWin ||
                          0
                      ).toFixed(2)}
                    </div>
                  </>
                )}

                {game.status ===
                  "cashout" && (
                  <>
                    <div className="text-2xl mb-1">
                      💰
                    </div>

                    <div className="font-bold text-emerald-400">
                      Cashout Successful
                    </div>

                    <div className="text-xl font-bold mt-1">
                      ₹{Number(
                        game.virtualWin ||
                          0
                      ).toFixed(2)}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* =============================================
                NEW GAME
            ============================================= */}

            {game.status !==
              "playing" && (
              <button
                onClick={() => {
                  setGame(null);
                  setMessage("");
                }}
                className="
                  w-full
                  mt-3
                  py-3
                  rounded-xl
                  bg-blue-600
                  hover:bg-blue-500
                  font-bold
                  transition
                "
              >
                New Game
              </button>
            )}

            {/* =============================================
                MESSAGE
            ============================================= */}

            {message && (
              <p className="
                text-center
                mt-4
                text-yellow-400
                text-sm
              ">
                {message}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}