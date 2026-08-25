import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../api";

// ==========================================
// Create Powerball Result
// ==========================================
export const createPowerballResult = createAsyncThunk(
  "indiaPowerballResult/create",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post("/admin/india/powerball-results/create", data);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Something went wrong."
      );
    }
  }
);

// ==========================================
// Get All Results
// ==========================================
export const getAllPowerballResults = createAsyncThunk(
  "indiaPowerballResult/getAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/admin/india/powerball-results");
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Something went wrong."
      );
    }
  }
);

// ==========================================
// Get Result By ID
// ==========================================
export const getPowerballResultById = createAsyncThunk(
  "indiaPowerballResult/getById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`/admin/india/powerball-results/${id}`);
      return res.data.result;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Something went wrong."
      );
    }
  }
);

// ==========================================
// Delete Result
// ==========================================
export const deletePowerballResult = createAsyncThunk(
  "indiaPowerballResult/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/india/powerball-results/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Something went wrong."
      );
    }
  }
);

// ==========================================
// Get All Pending Games
// ==========================================
export const getAllPendingGames = createAsyncThunk(
  "indiaPowerballResult/getAllPendingGames",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get(
        "/admin/india/powerball-results/pending-games/all"
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Something went wrong."
      );
    }
  }
);

// ==========================================
// Get Pending Game by Player ID
// ==========================================
export const getPendingGameByPlayerId = createAsyncThunk(
  "indiaPowerballResult/getPendingGame",
  async (playerId, { rejectWithValue }) => {
    try {
      const res = await api.get(
        `/admin/india/powerball-results/pending-game/${playerId}`
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Something went wrong."
      );
    }
  }
);

// ==========================================
// Get Game Pool Details by Pool ID
// ==========================================
export const getGamePoolDetails = createAsyncThunk(
  "indiaPowerballResult/getGamePoolDetails",
  async (poolId, { rejectWithValue }) => {
    try {
      const res = await api.get(
        `/admin/india/powerball-results/game-pool/${poolId}`
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Something went wrong."
      );
    }
  }
);

// ==========================================
// Slice
// ==========================================
const indiaPowerballResultSlice = createSlice({
  name: "indiaPowerballResult",

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

    clearPendingGames: (state) => {
      state.pendingGames = [];
      state.selectedDrawNo = null;
      state.selectedGame = null;
      state.selectedPool = null;
      state.pendingGamesLoading = false;
    },

    clearSelectedGame: (state) => {
      state.selectedGame = null;
    },

    clearSelectedPool: (state) => {
      state.selectedPool = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // =============================
      // CREATE
      // =============================
      .addCase(createPowerballResult.pending, (state) => {
        state.createLoading = true;
        state.error = null;
        state.success = false;
      })

      .addCase(createPowerballResult.fulfilled, (state, action) => {
        state.createLoading = false;
        state.success = true;
        state.message = action.payload.message;

        state.results.unshift(action.payload.result);

        state.pendingGames = [];
        state.selectedDrawNo = null;
        state.selectedGame = null;
        state.selectedPool = null;
      })

      .addCase(createPowerballResult.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload;
      })

      // =============================
      // GET ALL
      // =============================
      .addCase(getAllPowerballResults.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(getAllPowerballResults.fulfilled, (state, action) => {
        state.loading = false;
        state.results = action.payload.results || [];
      })

      .addCase(getAllPowerballResults.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // =============================
      // GET BY ID
      // =============================
      .addCase(getPowerballResultById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(getPowerballResultById.fulfilled, (state, action) => {
        state.loading = false;
        state.result = action.payload;
      })

      .addCase(getPowerballResultById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // =============================
      // DELETE
      // =============================
      .addCase(deletePowerballResult.pending, (state) => {
        state.deleteLoading = true;
        state.error = null;
      })

      .addCase(deletePowerballResult.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.results = state.results.filter(
          (item) => item._id !== action.payload
        );

        state.pendingGames = [];
        state.selectedDrawNo = null;
        state.selectedGame = null;
        state.selectedPool = null;
      })

      .addCase(deletePowerballResult.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.payload;
      })

      // =============================
      // GET ALL PENDING GAMES
      // =============================
      .addCase(getAllPendingGames.pending, (state) => {
        state.pendingGamesLoading = true;
        state.error = null;
      })

      .addCase(getAllPendingGames.fulfilled, (state, action) => {
        state.pendingGamesLoading = false;
        state.pendingGames = action.payload.games || [];
      })

      .addCase(getAllPendingGames.rejected, (state, action) => {
        state.pendingGamesLoading = false;
        state.error = action.payload;
        state.pendingGames = [];
      })

      // =============================
      // GET PENDING GAME BY PLAYER ID
      // =============================
      .addCase(getPendingGameByPlayerId.pending, (state) => {
        state.pendingGamesLoading = true;
        state.error = null;
      })

      .addCase(getPendingGameByPlayerId.fulfilled, (state, action) => {
        state.pendingGamesLoading = false;
        state.selectedGame = action.payload.game;

        if (action.payload.game) {
          state.selectedDrawNo = action.payload.game.drawNo;
        }
      })

      .addCase(getPendingGameByPlayerId.rejected, (state, action) => {
        state.pendingGamesLoading = false;
        state.error = action.payload;
        state.selectedGame = null;
      })

      // =============================
      // GET GAME POOL DETAILS
      // =============================
      .addCase(getGamePoolDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(getGamePoolDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedPool = action.payload.pool;
      })

      .addCase(getGamePoolDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.selectedPool = null;
      });
  },
});

export const {
  clearPowerballResultState,
  clearPendingGames,
  clearSelectedGame,
  clearSelectedPool,
} = indiaPowerballResultSlice.actions;

export default indiaPowerballResultSlice.reducer;
