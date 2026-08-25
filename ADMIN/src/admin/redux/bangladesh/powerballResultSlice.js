import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../api";

// ==========================================
// Create Powerball Result
// ==========================================
export const createPowerballResult = createAsyncThunk(
  "bangladeshPowerballResult/create",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post(
        "/admin/bangladesh/powerball-results/create",
        data
      );

      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ||
          err.message ||
          "Something went wrong."
      );
    }
  }
);

// ==========================================
// Get All Results
// ==========================================
export const getAllPowerballResults = createAsyncThunk(
  "bangladeshPowerballResult/getAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get(
        "/admin/bangladesh/powerball-results"
      );

      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ||
          err.message ||
          "Something went wrong."
      );
    }
  }
);

// ==========================================
// Get Result By ID
// ==========================================
export const getPowerballResultById = createAsyncThunk(
  "bangladeshPowerballResult/getById",
  async (id, { rejectWithValue }) => {
    try {
      if (!id) {
        return rejectWithValue("Result ID is required.");
      }

      const res = await api.get(
        `/admin/bangladesh/powerball-results/${id}`
      );

      return res.data.result;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ||
          err.message ||
          "Something went wrong."
      );
    }
  }
);

// ==========================================
// Delete Result
// ==========================================
export const deletePowerballResult = createAsyncThunk(
  "bangladeshPowerballResult/delete",
  async (id, { rejectWithValue }) => {
    try {
      if (!id) {
        return rejectWithValue("Result ID is required.");
      }

      await api.delete(
        `/admin/bangladesh/powerball-results/${id}`
      );

      return id;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ||
          err.message ||
          "Something went wrong."
      );
    }
  }
);

// ==========================================
// Get All Pending Games
// ==========================================
export const getAllPendingGames = createAsyncThunk(
  "bangladeshPowerballResult/getAllPendingGames",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get(
        "/admin/bangladesh/powerball-results/pending-games/all"
      );

      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ||
          err.message ||
          "Something went wrong."
      );
    }
  }
);

// ==========================================
// Get Pending Game by Player ID
// ==========================================
export const getPendingGameByPlayerId = createAsyncThunk(
  "bangladeshPowerballResult/getPendingGame",
  async (playerId, { rejectWithValue }) => {
    try {
      if (!playerId) {
        return rejectWithValue("Player ID is required.");
      }

      const res = await api.get(
        `/admin/bangladesh/powerball-results/pending-game/${playerId}`
      );

      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ||
          err.message ||
          "Something went wrong."
      );
    }
  }
);

// ==========================================
// Get Game Pool Details by Pool ID
// ==========================================
export const getGamePoolDetails = createAsyncThunk(
  "bangladeshPowerballResult/getGamePoolDetails",
  async (poolId, { rejectWithValue }) => {
    try {
      if (!poolId) {
        return rejectWithValue("Pool ID is required.");
      }

      const res = await api.get(
        `/admin/bangladesh/powerball-results/game-pool/${poolId}`
      );

      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ||
          err.message ||
          "Something went wrong."
      );
    }
  }
);

// ==========================================
// Slice
// ==========================================
const bangladeshPowerballResultSlice = createSlice({
  name: "bangladeshPowerballResult",

  initialState: {
    results: [],
    result: null,

    pendingGames: [],

    selectedGame: null,
    selectedPool: null,
    selectedDrawNo: null,

    loading: false,
    createLoading: false,
    deleteLoading: false,
    pendingGamesLoading: false,

    success: false,
    error: null,
    message: "",
  },

  reducers: {
    // ==========================================
    // CLEAR POWERBALL RESULT STATE
    // ==========================================
    clearPowerballResultState: (state) => {
      state.loading = false;
      state.createLoading = false;
      state.deleteLoading = false;
      state.pendingGamesLoading = false;

      state.success = false;
      state.error = null;
      state.message = "";

      state.result = null;
    },

    // ==========================================
    // CLEAR PENDING GAMES
    // ==========================================
    clearPendingGames: (state) => {
      state.pendingGames = [];
      state.selectedDrawNo = null;
      state.selectedGame = null;
      state.selectedPool = null;
      state.pendingGamesLoading = false;
    },

    // ==========================================
    // CLEAR SELECTED GAME
    // ==========================================
    clearSelectedGame: (state) => {
      state.selectedGame = null;
      state.selectedDrawNo = null;
    },

    // ==========================================
    // CLEAR SELECTED POOL
    // ==========================================
    clearSelectedPool: (state) => {
      state.selectedPool = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // ==========================================
      // CREATE
      // ==========================================
      .addCase(
        createPowerballResult.pending,
        (state) => {
          state.createLoading = true;
          state.error = null;
          state.success = false;
          state.message = "";
        }
      )

      .addCase(
        createPowerballResult.fulfilled,
        (state, action) => {
          state.createLoading = false;
          state.success = true;

          state.message =
            action.payload?.message ||
            "Powerball result created successfully.";

          const newResult =
            action.payload?.result;

          if (newResult) {
            const exists = state.results.some(
              (item) =>
                item._id === newResult._id
            );

            if (!exists) {
              state.results.unshift(newResult);
            }
          }

          state.pendingGames = [];
          state.selectedDrawNo = null;
          state.selectedGame = null;
          state.selectedPool = null;
        }
      )

      .addCase(
        createPowerballResult.rejected,
        (state, action) => {
          state.createLoading = false;
          state.success = false;

          state.error =
            action.payload ||
            "Failed to create Powerball result.";
        }
      )

      // ==========================================
      // GET ALL
      // ==========================================
      .addCase(
        getAllPowerballResults.pending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )

      .addCase(
        getAllPowerballResults.fulfilled,
        (state, action) => {
          state.loading = false;
          state.error = null;

          state.results = Array.isArray(
            action.payload?.results
          )
            ? action.payload.results
            : [];
        }
      )

      .addCase(
        getAllPowerballResults.rejected,
        (state, action) => {
          state.loading = false;

          state.error =
            action.payload ||
            "Failed to fetch Powerball results.";
        }
      )

      // ==========================================
      // GET BY ID
      // ==========================================
      .addCase(
        getPowerballResultById.pending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )

      .addCase(
        getPowerballResultById.fulfilled,
        (state, action) => {
          state.loading = false;
          state.error = null;

          state.result = action.payload || null;
        }
      )

      .addCase(
        getPowerballResultById.rejected,
        (state, action) => {
          state.loading = false;

          state.error =
            action.payload ||
            "Failed to fetch Powerball result.";

          state.result = null;
        }
      )

      // ==========================================
      // DELETE
      // ==========================================
      .addCase(
        deletePowerballResult.pending,
        (state) => {
          state.deleteLoading = true;
          state.error = null;
        }
      )

      .addCase(
        deletePowerballResult.fulfilled,
        (state, action) => {
          state.deleteLoading = false;
          state.error = null;

          state.results = state.results.filter(
            (item) =>
              item._id !== action.payload
          );

          if (
            state.result?._id ===
            action.payload
          ) {
            state.result = null;
          }

          state.pendingGames = [];
          state.selectedDrawNo = null;
          state.selectedGame = null;
          state.selectedPool = null;
        }
      )

      .addCase(
        deletePowerballResult.rejected,
        (state, action) => {
          state.deleteLoading = false;

          state.error =
            action.payload ||
            "Failed to delete Powerball result.";
        }
      )

      // ==========================================
      // GET ALL PENDING GAMES
      // ==========================================
      .addCase(
        getAllPendingGames.pending,
        (state) => {
          state.pendingGamesLoading = true;
          state.error = null;
        }
      )

      .addCase(
        getAllPendingGames.fulfilled,
        (state, action) => {
          state.pendingGamesLoading = false;
          state.error = null;

          state.pendingGames = Array.isArray(
            action.payload?.games
          )
            ? action.payload.games
            : [];
        }
      )

      .addCase(
        getAllPendingGames.rejected,
        (state, action) => {
          state.pendingGamesLoading = false;

          state.error =
            action.payload ||
            "Failed to fetch pending games.";

          state.pendingGames = [];
        }
      )

      // ==========================================
      // GET PENDING GAME BY PLAYER ID
      // ==========================================
      .addCase(
        getPendingGameByPlayerId.pending,
        (state) => {
          state.pendingGamesLoading = true;
          state.error = null;
        }
      )

      .addCase(
        getPendingGameByPlayerId.fulfilled,
        (state, action) => {
          state.pendingGamesLoading = false;
          state.error = null;

          state.selectedGame =
            action.payload?.game || null;

          if (action.payload?.game) {
            state.selectedDrawNo =
              action.payload.game.drawNo;
          } else {
            state.selectedDrawNo = null;
          }
        }
      )

      .addCase(
        getPendingGameByPlayerId.rejected,
        (state, action) => {
          state.pendingGamesLoading = false;

          state.error =
            action.payload ||
            "Failed to fetch pending game.";

          state.selectedGame = null;
          state.selectedDrawNo = null;
        }
      )

      // ==========================================
      // GET GAME POOL DETAILS
      // ==========================================
      .addCase(
        getGamePoolDetails.pending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )

      .addCase(
        getGamePoolDetails.fulfilled,
        (state, action) => {
          state.loading = false;
          state.error = null;

          state.selectedPool =
            action.payload?.pool || null;
        }
      )

      .addCase(
        getGamePoolDetails.rejected,
        (state, action) => {
          state.loading = false;

          state.error =
            action.payload ||
            "Failed to fetch game pool details.";

          state.selectedPool = null;
        }
      );
  },
});

// ==========================================
// ACTIONS
// ==========================================
export const {
  clearPowerballResultState,
  clearPendingGames,
  clearSelectedGame,
  clearSelectedPool,
} =
  bangladeshPowerballResultSlice.actions;

// ==========================================
// SELECTORS
// ==========================================
export const selectBangladeshPowerballResults = (
  state
) =>
  state.bangladeshPowerballResult?.results || [];

export const selectBangladeshPowerballResult = (
  state
) =>
  state.bangladeshPowerballResult?.result || null;

export const selectBangladeshPendingGames = (
  state
) =>
  state.bangladeshPowerballResult
    ?.pendingGames || [];

export const selectBangladeshSelectedGame = (
  state
) =>
  state.bangladeshPowerballResult
    ?.selectedGame || null;

export const selectBangladeshSelectedPool = (
  state
) =>
  state.bangladeshPowerballResult
    ?.selectedPool || null;

export const selectBangladeshSelectedDrawNo = (
  state
) =>
  state.bangladeshPowerballResult
    ?.selectedDrawNo || null;

export const selectBangladeshPowerballLoading = (
  state
) =>
  state.bangladeshPowerballResult?.loading ||
  false;

export const selectBangladeshPowerballCreateLoading = (
  state
) =>
  state.bangladeshPowerballResult
    ?.createLoading || false;

export const selectBangladeshPowerballDeleteLoading = (
  state
) =>
  state.bangladeshPowerballResult
    ?.deleteLoading || false;

export const selectBangladeshPendingGamesLoading = (
  state
) =>
  state.bangladeshPowerballResult
    ?.pendingGamesLoading || false;

export const selectBangladeshPowerballSuccess = (
  state
) =>
  state.bangladeshPowerballResult?.success ||
  false;

export const selectBangladeshPowerballError = (
  state
) =>
  state.bangladeshPowerballResult?.error || null;

export const selectBangladeshPowerballMessage = (
  state
) =>
  state.bangladeshPowerballResult?.message || "";

// ==========================================
// REDUCER
// ==========================================
export default bangladeshPowerballResultSlice.reducer;