import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  RefreshCw,
  Search,
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Award,
  Clock,
  Wallet,
  Gamepad2,
} from "lucide-react";

import {
  fetchMinesHistory,
  updateGame,
} from "../redux/minesAdminSlice";

const MinesAdmin = () => {
  const dispatch = useDispatch();

  const {
    games = [],
    loading,
    error,
    lastUpdated,
  } = useSelector(
    (state) => state.minesAdmin
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const [selectedGame, setSelectedGame] =
    useState(null);

  /*
   * =====================================================
   * LOAD HISTORY
   * =====================================================
   */

  useEffect(() => {
    dispatch(fetchMinesHistory());
  }, [dispatch]);

  /*
   * =====================================================
   * SOCKET REALTIME UPDATES
   * =====================================================
   */

  useEffect(() => {
    const socket = window.socket;

    if (!socket) {
      return;
    }

    /*
     * ---------------------------------------------------
     * GAME CREATED
     * ---------------------------------------------------
     */

    const handleCreated = (data) => {
      dispatch(
        updateGame({
          ...data,

          _id: data.gameId,

          /*
           * Normalize fields coming from socket
           */

          virtualStake:
            Number(
              data.virtualStake ||
                data.entryAmount ||
                0
            ),

          entryAmount:
            Number(
              data.entryAmount ||
                data.virtualStake ||
                0
            ),

          virtualWin:
            Number(
              data.virtualWin || 0
            ),

          balanceAfter:
            Number(
              data.balanceAfter || 0
            ),

          status:
            data.status || "playing",
        })
      );

      /*
       * Fetch complete populated user data
       */

      dispatch(fetchMinesHistory());
    };

    /*
     * ---------------------------------------------------
     * GAME FINISHED
     * ---------------------------------------------------
     */

    const handleFinished = (data) => {
      dispatch(
        updateGame({
          ...data,

          _id: data.gameId,

          virtualStake:
            Number(
              data.virtualStake ||
                data.entryAmount ||
                0
            ),

          entryAmount:
            Number(
              data.entryAmount ||
                data.virtualStake ||
                0
            ),

          virtualWin:
            Number(
              data.virtualWin || 0
            ),

          balanceAfter:
            Number(
              data.balanceAfter || 0
            ),

          status:
            data.status,
        })
      );

      /*
       * Fetch again so populated user data and
       * all game fields remain accurate.
       */

      dispatch(fetchMinesHistory());
    };

    socket.on(
      "mines-game-created",
      handleCreated
    );

    socket.on(
      "mines-game-finished",
      handleFinished
    );

    return () => {
      socket.off(
        "mines-game-created",
        handleCreated
      );

      socket.off(
        "mines-game-finished",
        handleFinished
      );
    };
  }, [dispatch]);

  /*
   * =====================================================
   * SEARCH + FILTER
   * =====================================================
   */

  const filteredGames = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return games.filter((game) => {
      const username =
        game.user?.username ||
        game.user?.name ||
        "";

      const name =
        game.user?.name || "";

      const email =
        game.user?.email || "";

      const mobile =
        game.user?.mobile || "";

      const gameId =
        String(game._id || "");

      const matchesSearch =
        !searchValue ||
        username
          .toLowerCase()
          .includes(searchValue) ||
        name
          .toLowerCase()
          .includes(searchValue) ||
        email
          .toLowerCase()
          .includes(searchValue) ||
        mobile
          .toLowerCase()
          .includes(searchValue) ||
        gameId
          .toLowerCase()
          .includes(searchValue);

      const matchesStatus =
        statusFilter === "all" ||
        String(game.status)
          .toLowerCase() ===
          statusFilter.toLowerCase();

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    games,
    search,
    statusFilter,
  ]);

  /*
   * =====================================================
   * STATS
   * =====================================================
   */

  const stats = useMemo(() => {
    return {
      total: games.length,

      playing: games.filter(
        (game) =>
          game.status === "playing"
      ).length,

      won: games.filter(
        (game) =>
          game.status === "won"
      ).length,

      lost: games.filter(
        (game) =>
          game.status === "lost"
      ).length,

      cashout: games.filter(
        (game) =>
          game.status === "cashout"
      ).length,

      stake: games.reduce(
        (total, game) =>
          total +
          Number(
            game.virtualStake ||
              game.entryAmount ||
              0
          ),
        0
      ),

      win: games.reduce(
        (total, game) =>
          total +
          Number(
            game.virtualWin || 0
          ),
        0
      ),
    };
  }, [games]);

  /*
   * =====================================================
   * HELPERS
   * =====================================================
   */

  const formatMoney = (value) => {
    return `₹${Number(
      value || 0
    ).toFixed(2)}`;
  };

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    const parsed =
      new Date(date);

    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {
      return "-";
    }

    return parsed.toLocaleString(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };

  const statusClass = (status) => {
    switch (status) {
      case "playing":
        return (
          "bg-yellow-100 " +
          "text-yellow-700 " +
          "border-yellow-300"
        );

      case "won":
        return (
          "bg-green-100 " +
          "text-green-700 " +
          "border-green-300"
        );

      case "lost":
        return (
          "bg-red-100 " +
          "text-red-700 " +
          "border-red-300"
        );

      case "cashout":
        return (
          "bg-blue-100 " +
          "text-blue-700 " +
          "border-blue-300"
        );

      default:
        return (
          "bg-gray-100 " +
          "text-gray-700 " +
          "border-gray-300"
        );
    }
  };

  /*
   * =====================================================
   * RENDER
   * =====================================================
   */

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 md:p-6">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="
        flex
        flex-col
        lg:flex-row
        lg:items-center
        lg:justify-between
        gap-4
        mb-8
      ">
        <div>
          <h1 className="
            text-3xl
            md:text-4xl
            font-bold
            bg-gradient-to-r
            from-blue-600
            to-purple-600
            bg-clip-text
            text-transparent
          ">
            Mines Games
          </h1>

          <p className="
            text-gray-500
            text-sm
            mt-1
          ">
            Monitor all Mines games,
            entries, wins and results
            in real-time
          </p>
        </div>

        <div className="
          flex
          items-center
          gap-3
        ">
          {lastUpdated && (
            <span className="
              text-xs
              text-gray-400
              hidden
              md:block
            ">
              Updated{" "}
              {new Date(
                lastUpdated
              ).toLocaleTimeString()}
            </span>
          )}

          <button
            onClick={() =>
              dispatch(
                fetchMinesHistory()
              )
            }
            disabled={loading}
            className="
              flex
              items-center
              gap-2
              px-5
              py-2.5
              rounded-xl
              bg-white
              border
              border-gray-200
              hover:border-blue-400
              hover:shadow-md
              transition-all
              duration-200
              text-gray-700
              font-medium
              disabled:opacity-50
            "
          >
            <RefreshCw
              size={18}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>
        </div>
      </div>

      {/* =================================================
          STATS
      ================================================= */}

      <div className="
        grid
        grid-cols-2
        md:grid-cols-3
        xl:grid-cols-7
        gap-4
        mb-8
      ">
        <StatCard
          icon={
            <Users
              size={20}
              className="text-blue-500"
            />
          }
          title="Total Games"
          value={stats.total}
        />

        <StatCard
          icon={
            <Clock
              size={20}
              className="text-yellow-500"
            />
          }
          title="Playing"
          value={stats.playing}
        />

        <StatCard
          icon={
            <Award
              size={20}
              className="text-green-500"
            />
          }
          title="Won"
          value={stats.won}
        />

        <StatCard
          icon={
            <TrendingDown
              size={20}
              className="text-red-500"
            />
          }
          title="Lost"
          value={stats.lost}
        />

        <StatCard
          icon={
            <DollarSign
              size={20}
              className="text-blue-500"
            />
          }
          title="Cashout"
          value={stats.cashout}
        />

        <StatCard
          icon={
            <Gamepad2
              size={20}
              className="text-purple-500"
            />
          }
          title="Total Entry"
          value={formatMoney(
            stats.stake
          )}
        />

        <StatCard
          icon={
            <TrendingUp
              size={20}
              className="text-green-500"
            />
          }
          title="Total Win"
          value={formatMoney(
            stats.win
          )}
        />
      </div>

      {/* =================================================
          FILTERS
      ================================================= */}

      <div className="
        bg-white
        border
        border-gray-200
        rounded-2xl
        p-5
        mb-6
        shadow-sm
      ">
        <div className="
          flex
          flex-col
          md:flex-row
          gap-4
        ">

          {/* SEARCH */}

          <div className="
            relative
            flex-1
          ">
            <Search
              size={18}
              className="
                absolute
                left-4
                top-1/2
                -translate-y-1/2
                text-gray-400
              "
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="
                Search username, name,
                email, mobile or game ID...
              "
              className="
                w-full
                bg-gray-50
                border
                border-gray-200
                rounded-xl
                pl-11
                pr-4
                py-3
                outline-none
                focus:border-blue-400
                focus:ring-2
                focus:ring-blue-100
                transition-all
              "
            />
          </div>

          {/* STATUS */}

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
            className="
              bg-gray-50
              border
              border-gray-200
              rounded-xl
              px-5
              py-3
              outline-none
              focus:border-blue-400
              focus:ring-2
              focus:ring-blue-100
              transition-all
              min-w-[160px]
            "
          >
            <option value="all">
              All Status
            </option>

            <option value="playing">
              Playing
            </option>

            <option value="won">
              Won
            </option>

            <option value="lost">
              Lost
            </option>

            <option value="cashout">
              Cashout
            </option>
          </select>
        </div>
      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="
          bg-red-50
          border
          border-red-200
          text-red-600
          rounded-2xl
          p-4
          mb-6
        ">
          {error}
        </div>
      )}

      {/* =================================================
          TABLE
      ================================================= */}

      <div className="
        bg-white
        border
        border-gray-200
        rounded-2xl
        overflow-hidden
        shadow-sm
      ">
        <div className="overflow-x-auto">

          <table className="
            w-full
            min-w-[1500px]
          ">
            <thead className="
              bg-gray-50
              border-b
              border-gray-200
            ">
              <tr className="
                text-left
                text-xs
                uppercase
                tracking-wider
                text-gray-500
                font-semibold
              ">
                <th className="px-5 py-4">
                  User
                </th>

                <th className="px-5 py-4">
                  Game ID
                </th>

                <th className="px-5 py-4">
                  Mines
                </th>

                <th className="px-5 py-4">
                  Opened
                </th>

                <th className="px-5 py-4">
                  Multiplier
                </th>

                <th className="px-5 py-4">
                  Game Entry
                </th>

                <th className="px-5 py-4">
                  Virtual Win
                </th>

                <th className="px-5 py-4">
                  Balance After
                </th>

                <th className="px-5 py-4">
                  Status
                </th>

                <th className="px-5 py-4">
                  Created
                </th>

                <th className="px-5 py-4">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="
              divide-y
              divide-gray-100
            ">
              {loading &&
              games.length === 0 ? (
                <tr>
                  <td
                    colSpan="11"
                    className="
                      text-center
                      py-16
                      text-gray-400
                    "
                  >
                    <div className="
                      flex
                      flex-col
                      items-center
                      gap-2
                    ">
                      <RefreshCw
                        size={32}
                        className="
                          animate-spin
                          text-blue-500
                        "
                      />

                      <span>
                        Loading Mines
                        games...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredGames.length ===
                0 ? (
                <tr>
                  <td
                    colSpan="11"
                    className="
                      text-center
                      py-16
                      text-gray-400
                    "
                  >
                    No Mines games found
                  </td>
                </tr>
              ) : (
                filteredGames.map(
                  (game) => {
                    const username =
                      game.user?.username ||
                      game.user?.name ||
                      "Unknown";

                    const entryAmount =
                      Number(
                        game.entryAmount ??
                          game.virtualStake ??
                          0
                      );

                    const virtualWin =
                      Number(
                        game.virtualWin ||
                          0
                      );

                    /*
                     * Balance after can come from
                     * game record/socket.
                     *
                     * If not available, show -
                     * instead of guessing.
                     */

                    const balanceAfter =
                      game.balanceAfter;

                    return (
                      <tr
                        key={game._id}
                        className="
                          hover:bg-gray-50
                          transition-colors
                          duration-150
                        "
                      >

                        {/* USER */}

                        <td className="
                          px-5
                          py-4
                        ">
                          <div className="
                            font-medium
                            text-gray-900
                          ">
                            {username}
                          </div>

                          <div className="
                            text-xs
                            text-gray-400
                          ">
                            {game.user?.email ||
                              "-"}
                          </div>

                          {game.user?.mobile && (
                            <div className="
                              text-xs
                              text-gray-400
                              mt-0.5
                            ">
                              {game.user.mobile}
                            </div>
                          )}
                        </td>

                        {/* GAME ID */}

                        <td className="
                          px-5
                          py-4
                        ">
                          <span className="
                            font-mono
                            text-xs
                            text-gray-500
                            bg-gray-50
                            px-2
                            py-1
                            rounded
                          ">
                            {String(
                              game._id
                            ).slice(-10)}
                          </span>
                        </td>

                        {/* MINES */}

                        <td className="
                          px-5
                          py-4
                        ">
                          <span className="
                            text-red-600
                            font-bold
                          ">
                            {game.minesCount}
                          </span>

                          <span className="
                            text-gray-400
                          ">
                            {" / "}
                            {game.totalCells ||
                              36}
                          </span>
                        </td>

                        {/* OPENED */}

                        <td className="
                          px-5
                          py-4
                        ">
                          <span className="
                            font-bold
                          ">
                            {game.safeCells ??
                              game.openedCells
                                ?.length ??
                              0}
                          </span>

                          <span className="
                            text-gray-400
                          ">
                            {" / "}

                            {(game.totalCells ||
                              36) -
                              Number(
                                game.minesCount ||
                                  0
                              )}
                          </span>
                        </td>

                        {/* MULTIPLIER */}

                        <td className="
                          px-5
                          py-4
                        ">
                          <span className="
                            font-bold
                            text-purple-600
                          ">
                            {Number(
                              game.multiplier ||
                                1
                            ).toFixed(2)}
                            x
                          </span>
                        </td>

                        {/* ENTRY */}

                        <td className="
                          px-5
                          py-4
                        ">
                          <div className="
                            font-bold
                            text-orange-600
                          ">
                            {formatMoney(
                              entryAmount
                            )}
                          </div>

                          <div className="
                            text-xs
                            text-gray-400
                            mt-0.5
                          ">
                            deducted
                          </div>
                        </td>

                        {/* WIN */}

                        <td className="
                          px-5
                          py-4
                        ">
                          <span className="
                            text-green-600
                            font-bold
                          ">
                            {formatMoney(
                              virtualWin
                            )}
                          </span>
                        </td>

                        {/* BALANCE AFTER */}

                        <td className="
                          px-5
                          py-4
                        ">
                          {balanceAfter !==
                            undefined &&
                          balanceAfter !==
                            null ? (
                            <div className="
                              flex
                              items-center
                              gap-1.5
                            ">
                              <Wallet
                                size={15}
                                className="
                                  text-blue-500
                                "
                              />

                              <span className="
                                font-bold
                                text-blue-600
                              ">
                                {formatMoney(
                                  balanceAfter
                                )}
                              </span>
                            </div>
                          ) : (
                            <span className="
                              text-gray-400
                            ">
                              -
                            </span>
                          )}
                        </td>

                        {/* STATUS */}

                        <td className="
                          px-5
                          py-4
                        ">
                          <span
                            className={`
                              inline-flex
                              px-3
                              py-1
                              rounded-full
                              border
                              text-xs
                              font-semibold
                              capitalize
                              ${statusClass(
                                game.status
                              )}
                            `}
                          >
                            {game.status}
                          </span>
                        </td>

                        {/* CREATED */}

                        <td className="
                          px-5
                          py-4
                          text-sm
                          text-gray-500
                        ">
                          {formatDate(
                            game.createdAt
                          )}
                        </td>

                        {/* ACTION */}

                        <td className="
                          px-5
                          py-4
                        ">
                          <button
                            onClick={() =>
                              setSelectedGame(
                                game
                              )
                            }
                            className="
                              px-4
                              py-2
                              rounded-xl
                              bg-blue-50
                              text-blue-600
                              border
                              border-blue-200
                              hover:bg-blue-100
                              hover:border-blue-300
                              transition-all
                              text-sm
                              font-medium
                            "
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    );
                  }
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =================================================
          DETAILS MODAL
      ================================================= */}

      {selectedGame && (
        <GameDetailsModal
          game={selectedGame}
          onClose={() =>
            setSelectedGame(null)
          }
          formatMoney={formatMoney}
          formatDate={formatDate}
        />
      )}
    </div>
  );
};

/* =========================================================
   STAT CARD
========================================================= */

const StatCard = ({
  icon,
  title,
  value,
}) => {
  return (
    <div className="
      bg-white
      border
      border-gray-200
      rounded-2xl
      p-5
      shadow-sm
      hover:shadow-md
      transition-shadow
      duration-200
    ">
      <div className="
        flex
        items-center
        gap-2
        mb-2
      ">
        {icon}

        <p className="
          text-xs
          text-gray-500
          font-medium
        ">
          {title}
        </p>
      </div>

      <p className="
        text-2xl
        font-bold
        text-gray-900
      ">
        {value}
      </p>
    </div>
  );
};

/* =========================================================
   GAME DETAILS MODAL
========================================================= */

const GameDetailsModal = ({
  game,
  onClose,
  formatMoney,
  formatDate,
}) => {
  const openedCells =
    game.openedCells || [];

  const minePositions =
    game.minePositions || [];

  const totalCells =
    game.totalCells || 36;

  const entryAmount =
    Number(
      game.entryAmount ??
        game.virtualStake ??
        0
    );

  const virtualWin =
    Number(
      game.virtualWin || 0
    );

  return (
    <div className="
      fixed
      inset-0
      z-50
      bg-black/50
      backdrop-blur-sm
      flex
      items-center
      justify-center
      p-4
    ">
      <div className="
        bg-white
        rounded-3xl
        w-full
        max-w-5xl
        max-h-[90vh]
        overflow-y-auto
        shadow-2xl
      ">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="
          sticky
          top-0
          z-10
          bg-white
          border-b
          border-gray-200
          px-6
          py-5
          flex
          items-center
          justify-between
          rounded-t-3xl
        ">
          <div>
            <h2 className="
              text-2xl
              font-bold
              text-gray-900
            ">
              Game Details
            </h2>

            <p className="
              text-xs
              text-gray-400
              font-mono
              mt-1
            ">
              {game._id}
            </p>
          </div>

          <button
            onClick={onClose}
            className="
              p-2
              rounded-xl
              hover:bg-gray-100
              transition-colors
            "
          >
            <X
              size={22}
              className="
                text-gray-500
              "
            />
          </button>
        </div>

        <div className="p-6">

          {/* =================================================
              GAME INFO
          ================================================= */}

          <div className="
            grid
            grid-cols-2
            md:grid-cols-4
            gap-4
            mb-6
          ">
            <Detail
              label="Status"
              value={
                <span
                  className={`
                    inline-flex
                    px-2.5
                    py-1
                    rounded-full
                    border
                    text-xs
                    capitalize
                    ${statusClass(
                      game.status
                    )}
                  `}
                >
                  {game.status}
                </span>
              }
            />

            <Detail
              label="Mines"
              value={
                game.minesCount
              }
            />

            <Detail
              label="Safe Cells"
              value={
                game.safeCells || 0
              }
            />

            <Detail
              label="Multiplier"
              value={`${Number(
                game.multiplier || 1
              ).toFixed(2)}x`}
            />

            <Detail
              label="Game Entry"
              value={
                <span className="
                  text-orange-600
                ">
                  {formatMoney(
                    entryAmount
                  )}
                </span>
              }
            />

            <Detail
              label="Virtual Win"
              value={
                <span className="
                  text-green-600
                ">
                  {formatMoney(
                    virtualWin
                  )}
                </span>
              }
            />

            <Detail
              label="Balance After"
              value={
                game.balanceAfter !==
                  undefined &&
                game.balanceAfter !==
                  null
                  ? formatMoney(
                      game.balanceAfter
                    )
                  : "-"
              }
            />

            <Detail
              label="Created"
              value={formatDate(
                game.createdAt
              )}
            />

            <Detail
              label="Finished"
              value={formatDate(
                game.finishedAt
              )}
            />
          </div>

          {/* =================================================
              PLAYER INFORMATION
          ================================================= */}

          <div className="mb-6">
            <h3 className="
              text-sm
              font-semibold
              text-gray-700
              mb-3
            ">
              Player Information
            </h3>

            <div className="
              bg-gray-50
              border
              border-gray-200
              rounded-2xl
              p-5
            ">
              <div className="
                grid
                md:grid-cols-4
                gap-4
              ">
                <Detail
                  label="Username"
                  value={
                    game.user?.username ||
                    game.user?.name ||
                    "-"
                  }
                />

                <Detail
                  label="Name"
                  value={
                    game.user?.name ||
                    "-"
                  }
                />

                <Detail
                  label="Email"
                  value={
                    game.user?.email ||
                    "-"
                  }
                />

                <Detail
                  label="Mobile"
                  value={
                    game.user?.mobile ||
                    "-"
                  }
                />
              </div>
            </div>
          </div>

          {/* =================================================
              GRID
          ================================================= */}

          <div className="mb-6">
            <div className="
              flex
              items-center
              justify-between
              mb-4
              gap-3
              flex-wrap
            ">
              <h3 className="
                text-sm
                font-semibold
                text-gray-700
              ">
                Game Grid
              </h3>

              <div className="
                flex
                gap-4
                text-xs
                text-gray-500
              ">
                <span>
                  🟩 Safe
                </span>

                <span>
                  💣 Mine
                </span>

                <span>
                  ⬜ Unopened
                </span>
              </div>
            </div>

            <div className="
              grid
              grid-cols-6
              gap-2
              max-w-md
              bg-gray-50
              p-4
              rounded-2xl
              border
              border-gray-200
            ">
              {Array.from({
                length: totalCells,
              }).map(
                (_, index) => {
                  const isMine =
                    minePositions.includes(
                      index
                    );

                  const isOpened =
                    openedCells.includes(
                      index
                    );

                  let className =
                    "aspect-square rounded-lg " +
                    "flex items-center " +
                    "justify-center " +
                    "text-sm font-bold " +
                    "transition-all duration-200 " +
                    "border-2 ";

                  if (isMine) {
                    className +=
                      "bg-red-50 " +
                      "border-red-300 " +
                      "text-red-500";
                  } else if (
                    isOpened
                  ) {
                    className +=
                      "bg-green-50 " +
                      "border-green-300 " +
                      "text-green-500";
                  } else {
                    className +=
                      "bg-white " +
                      "border-gray-200 " +
                      "text-gray-300";
                  }

                  return (
                    <div
                      key={index}
                      className={
                        className
                      }
                    >
                      {isMine
                        ? "💣"
                        : isOpened
                        ? "✓"
                        : index + 1}
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* =================================================
              OPENED CELLS
          ================================================= */}

          <div className="mb-6">
            <h3 className="
              text-sm
              font-semibold
              text-gray-700
              mb-3
            ">
              Opened Cells
            </h3>

            <div className="
              flex
              flex-wrap
              gap-2
            ">
              {openedCells.length ===
              0 ? (
                <span className="
                  text-gray-400
                  text-sm
                ">
                  No cells opened
                </span>
              ) : (
                openedCells.map(
                  (cell) => (
                    <span
                      key={cell}
                      className="
                        px-3
                        py-1.5
                        rounded-xl
                        bg-green-50
                        border
                        border-green-200
                        text-green-600
                        text-sm
                        font-medium
                      "
                    >
                      Cell {cell}
                    </span>
                  )
                )
              )}
            </div>
          </div>

          {/* =================================================
              MINE POSITIONS
          ================================================= */}

          <div>
            <h3 className="
              text-sm
              font-semibold
              text-gray-700
              mb-3
            ">
              Mine Positions
            </h3>

            <div className="
              flex
              flex-wrap
              gap-2
            ">
              {minePositions.length ===
              0 ? (
                <span className="
                  text-gray-400
                  text-sm
                ">
                  Mine positions
                  unavailable
                </span>
              ) : (
                minePositions.map(
                  (cell) => (
                    <span
                      key={cell}
                      className="
                        px-3
                        py-1.5
                        rounded-xl
                        bg-red-50
                        border
                        border-red-200
                        text-red-600
                        text-sm
                        font-medium
                      "
                    >
                      Cell {cell}
                    </span>
                  )
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   STATUS CLASS FOR MODAL
========================================================= */

const statusClass = (status) => {
  switch (status) {
    case "playing":
      return (
        "bg-yellow-100 " +
        "text-yellow-700 " +
        "border-yellow-300"
      );

    case "won":
      return (
        "bg-green-100 " +
        "text-green-700 " +
        "border-green-300"
      );

    case "lost":
      return (
        "bg-red-100 " +
        "text-red-700 " +
        "border-red-300"
      );

    case "cashout":
      return (
        "bg-blue-100 " +
        "text-blue-700 " +
        "border-blue-300"
      );

    default:
      return (
        "bg-gray-100 " +
        "text-gray-700 " +
        "border-gray-300"
      );
  }
};

/* =========================================================
   DETAIL
========================================================= */

const Detail = ({
  label,
  value,
}) => {
  return (
    <div>
      <p className="
        text-xs
        text-gray-400
        font-medium
        uppercase
        tracking-wider
        mb-1
      ">
        {label}
      </p>

      <p className="
        text-sm
        font-semibold
        text-gray-900
        break-all
      ">
        {value}
      </p>
    </div>
  );
};

export default MinesAdmin;