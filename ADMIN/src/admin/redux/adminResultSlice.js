import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "./api";

// ================= DECLARE RESULT =================
export const declareResult = createAsyncThunk(
  "adminResult/declare",
  async (resultData, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/results/declare", resultData);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to declare result"
      );
    }
  }
);

// ================= GET ALL RESULTS (ADMIN) =================
export const getAdminResults = createAsyncThunk(
  "adminResult/getAll",
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/results", { params });
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to get results"
      );
    }
  }
);

// ================= GET RESULT STATS (ADMIN) =================
export const getAdminResultStats = createAsyncThunk(
  "adminResult/getStats",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/results/stats/overview");
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to get stats"
      );
    }
  }
);

// ================= GET RESULT BY ID =================
export const getResultById = createAsyncThunk(
  "adminResult/getById",
  async (resultId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/results/${resultId}`);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to get result details"
      );
    }
  }
);

// ================= INITIAL STATE =================
const initialState = {
  results: [],
  currentResult: null,
  stats: null,
  loading: false,
  error: null,
  message: "",
  success: false,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
};

// ================= SLICE =================
const adminResultSlice = createSlice({
  name: "adminResult",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearMessage: (state) => {
      state.message = "";
      state.success = false;
    },
    clearCurrentResult: (state) => {
      state.currentResult = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ========== DECLARE RESULT ==========
      .addCase(declareResult.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(declareResult.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.message = action.payload.message;
        state.results.unshift(action.payload.data.result);
        state.error = null;
      })
      .addCase(declareResult.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      })

      // ========== GET ALL RESULTS ==========
      .addCase(getAdminResults.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAdminResults.fulfilled, (state, action) => {
        state.loading = false;
        state.results = action.payload.data;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(getAdminResults.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ========== GET RESULT STATS ==========
      .addCase(getAdminResultStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAdminResultStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload.data;
        state.error = null;
      })
      .addCase(getAdminResultStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ========== GET RESULT BY ID ==========
      .addCase(getResultById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getResultById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentResult = action.payload.data;
        state.error = null;
      })
      .addCase(getResultById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearMessage, clearCurrentResult } = adminResultSlice.actions;
export default adminResultSlice.reducer;