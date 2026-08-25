import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "./api";

// ================= ADMIN LOGIN =================

export const adminLogin = createAsyncThunk(
  "adminAuth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/auth/login", credentials);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Login failed"
      );
    }
  }
);

// ================= ADMIN PROFILE =================

export const getAdminProfile = createAsyncThunk(
  "adminAuth/profile",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/auth/profile");
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load profile"
      );
    }
  }
);

// ================= UPDATE PROFILE =================

export const updateAdminProfile = createAsyncThunk(
  "adminAuth/updateProfile",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.put(
        "/auth/profile",
        payload
      );

      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        "Profile update failed"
      );
    }
  }
);

// ================= CHANGE PASSWORD =================

export const changeAdminPassword = createAsyncThunk(
  "adminAuth/changePassword",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.put(
        "/auth/change-password",
        payload
      );

      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        "Password change failed"
      );
    }
  }
);

// ================= GET ALL USERS =================

export const getAllUsers = createAsyncThunk(
  "adminAuth/getAllUsers",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/auth/admin/users"); // apna route likho

      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch users"
      );
    }
  }
);

// ================= UPDATE USER STATUS =================

export const updateUserStatus = createAsyncThunk(
  "adminAuth/updateUserStatus",
  async ({ userId, status }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(
        `/auth/admin/users/${userId}/status`,
        { status }
      );

      return {
        ...data,
        userId,
        status,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        "Failed to update user status"
      );
    }
  }
);

// ================= LOGOUT =================

export const adminLogout = createAsyncThunk(
  "adminAuth/logout",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/auth/logout");
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        "Logout failed"
      );
    }
  }
);

// ================= INITIAL STATE =================

const initialState = {
  loading: false,
  success: false,
  error: null,
  message: "",

  admin: null,

  users: [],      // ADD
  userCount: 0,   // ADD

  token: localStorage.getItem("adminToken") || null,

  isAuthenticated: !!localStorage.getItem("adminToken"),

  profileLoaded: false,

  isProfileLoading: false,
};

// ================= SLICE =================

const adminAuthSlice = createSlice({
  name: "adminAuth",

  initialState,

  reducers: {
    clearError: (state) => {
      state.error = null;
    },

    clearMessage: (state) => {
      state.message = "";
      state.success = false;
    },

    resetProfileLoaded: (state) => {
      state.profileLoaded = false;
    },

    resetAdminState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.message = "";

      state.admin = null;

      state.token = null;

      state.isAuthenticated = false;

      state.profileLoaded = false;

      state.isProfileLoading = false;

      localStorage.removeItem("adminToken");
    },
  },

  extraReducers: (builder) => {
    builder

      // ================= LOGIN =================

      .addCase(adminLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })

      .addCase(adminLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;

        state.admin = action.payload.user;

        state.token = action.payload.token;

        state.message = action.payload.message;

        state.isAuthenticated = true;

        state.profileLoaded = true;

        state.isProfileLoading = false;

        localStorage.setItem(
          "adminToken",
          action.payload.token
        );
      })

      .addCase(adminLogin.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      })

      // ================= GET PROFILE =================

      .addCase(getAdminProfile.pending, (state) => {
        state.loading = true;

        state.isProfileLoading = true;

        state.error = null;
      })

      .addCase(getAdminProfile.fulfilled, (state, action) => {
        state.loading = false;

        state.isProfileLoading = false;

        state.admin = action.payload;

        state.profileLoaded = true;

        state.error = null;
      })

      .addCase(getAdminProfile.rejected, (state, action) => {
        state.loading = false;

        state.isProfileLoading = false;

        state.error = action.payload.user;

        state.profileLoaded = true;

        const errorMessage =
          action.payload?.toLowerCase() || "";

        if (
          errorMessage.includes("unauthorized") ||
          errorMessage.includes("token") ||
          errorMessage.includes("invalid")
        ) {
          state.admin = null;

          state.token = null;

          state.isAuthenticated = false;

          localStorage.removeItem("adminToken");
        }
      })

      // ================= GET ALL USERS =================

      .addCase(getAllUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(getAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;

        state.users = action.payload.users;
        state.userCount = action.payload.count;
      })

      .addCase(getAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      })



      // ================= UPDATE PROFILE =================

      .addCase(updateAdminProfile.pending, (state) => {
        state.loading = true;

        state.error = null;

        state.success = false;
      })

      .addCase(updateAdminProfile.fulfilled, (state, action) => {
        state.loading = false;

        state.success = true;

        state.admin = action.payload.admin;

        state.message = action.payload.message;

        state.profileLoaded = true;

        state.error = null;
      })

      .addCase(updateAdminProfile.rejected, (state, action) => {
        state.loading = false;

        state.success = false;

        state.error = action.payload;
      })

      // ================= CHANGE PASSWORD =================

      .addCase(changeAdminPassword.pending, (state) => {
        state.loading = true;

        state.error = null;

        state.success = false;
      })

      .addCase(changeAdminPassword.fulfilled, (state, action) => {
        state.loading = false;

        state.success = true;

        state.message = action.payload.message;

        state.error = null;
      })

      .addCase(changeAdminPassword.rejected, (state, action) => {
        state.loading = false;

        state.success = false;

        state.error = action.payload;
      })

      // ================= UPDATE USER STATUS =================

      .addCase(updateUserStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(updateUserStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.message = action.payload.message;

        const index = state.users.findIndex(
          (user) => user._id === action.payload.userId
        );

        if (index !== -1) {
          state.users[index].status = action.payload.status;
        }
      })

      .addCase(updateUserStatus.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      })

      // ================= LOGOUT =================

      .addCase(adminLogout.pending, (state) => {
        state.loading = true;
      })

      .addCase(adminLogout.fulfilled, (state, action) => {
        state.loading = false;

        state.admin = null;

        state.token = null;

        state.isAuthenticated = false;

        state.profileLoaded = false;

        state.isProfileLoading = false;

        state.success = true;

        state.message = action.payload.message;

        localStorage.removeItem("adminToken");
      })

      .addCase(adminLogout.rejected, (state, action) => {
        state.loading = false;

        state.error = action.payload;

        state.admin = null;

        state.token = null;

        state.isAuthenticated = false;

        state.profileLoaded = false;

        state.isProfileLoading = false;

        localStorage.removeItem("adminToken");
      });
  },
});

// ================= EXPORT ACTIONS =================

export const {
  clearError,
  clearMessage,
  resetProfileLoaded,
  resetAdminState,
} = adminAuthSlice.actions;

// ================= EXPORT REDUCER =================

export default adminAuthSlice.reducer;