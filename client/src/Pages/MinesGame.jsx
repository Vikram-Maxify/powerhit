import { useEffect, useState } from "react";
import { socket } from "../services/socket";

const API = "http://localhost:5007/api/mine-games";

export default function MinesGame() {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (userId) {
      socket.emit("join-user", userId);
    }

    const handleUpdate = (data) => {
      setGame((prev) => ({
        ...prev,
        ...data,
      }));
    };

    const handleCashout = (data) => {
      setGame((prev) => ({
        ...prev,
        ...data,
      }));

      setMessage(
        `Cashout: ${data.virtualWin} virtual coins`
      );
    };

    socket.on("mines-update", handleUpdate);
    socket.on("mines-cashout", handleCashout);

    return () => {
      socket.off("mines-update", handleUpdate);
      socket.off("mines-cashout", handleCashout);
    };
  }, [userId]);

  const startGame = async () => {
    try {
      setLoading(true);
      setMessage("");

      const token = localStorage.getItem("token");

      const res = await fetch(`${API}/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          minesCount: 5,
          virtualStake: 100,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      setGame(data.game);

      socket.emit(
        "join-mines-game",
        data.game.id
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const reveal = async (cell) => {
    if (!game || game.status !== "playing") return;

    if (game.openedCells?.includes(cell)) return;

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${API}/${game.id}/reveal`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ cell }),
        }
      );

      const data = await res.json();

      if (!data.success) {
        setMessage(data.message);
        return;
      }

      setGame((prev) => ({
        ...prev,
        ...data.result,
      }));
    } catch (error) {
      setMessage("Unable to reveal cell");
    }
  };

  const cashout = async () => {
    if (!game || game.status !== "playing") return;

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${API}/${game.id}/cashout`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!data.success) {
        setMessage(data.message);
        return;
      }

      setGame((prev) => ({
        ...prev,
        ...data,
      }));

      setMessage(
        `You won ${data.virtualWin} virtual coins`
      );
    } catch {
      setMessage("Cashout failed");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-center mb-4">
          💣 Mines
        </h1>

        {!game && (
          <button
            onClick={startGame}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-blue-600 font-bold"
          >
            {loading ? "Starting..." : "Start Game"}
          </button>
        )}

        {game && (
          <>
            <div className="flex justify-between mb-4">
              <div>
                <div className="text-sm text-slate-400">
                  Multiplier
                </div>
                <div className="text-xl font-bold">
                  {game.multiplier}x
                </div>
              </div>

              <div>
                <div className="text-sm text-slate-400">
                  Safe
                </div>
                <div className="text-xl font-bold">
                  {game.safeCells}/
                  {36 - game.minesCount}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-2">
              {Array.from({ length: 36 }).map(
                (_, index) => {
                  const opened =
                    game.openedCells?.includes(index);

                  return (
                    <button
                      key={index}
                      disabled={
                        opened ||
                        game.status !== "playing"
                      }
                      onClick={() => reveal(index)}
                      className={`
                        aspect-square rounded-lg
                        font-bold text-lg
                        ${
                          opened
                            ? "bg-green-600"
                            : "bg-slate-800 hover:bg-slate-700"
                        }
                      `}
                    >
                      {opened ? "💎" : "?"}
                    </button>
                  );
                }
              )}
            </div>

            <button
              onClick={cashout}
              disabled={
                game.status !== "playing" ||
                game.safeCells <= 0
              }
              className="w-full mt-4 py-3 rounded-xl bg-emerald-600 font-bold disabled:opacity-40"
            >
              Cashout
            </button>

            {game.status !== "playing" && (
              <button
                onClick={startGame}
                className="w-full mt-3 py-3 rounded-xl bg-blue-600 font-bold"
              >
                New Game
              </button>
            )}

            {message && (
              <p className="text-center mt-4 text-yellow-400">
                {message}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}