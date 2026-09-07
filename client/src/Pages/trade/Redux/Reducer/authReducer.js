import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api";

export const loginUser = createAsyncThunk(
  "user/login",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.post("/login", formData, {
        withCredentials: true, // ✅ Allows sending and receiving cookies
      });

      const data = response.data;
      console.log(data, "user");

      // ✅ Store token in localStorage (Not recommended for auth security)
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Something went wrong" }
      );
    }
  }
);

export const Register = createAsyncThunk(
  "user/signup",
  async (fromData, { rejectWithValue }) => {
    try {
      const response = await api.post("/signup", fromData, {
        withCredentials: true, // ✅ Allows sending and receiving cookies
      });

      const data = response.data;
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      console.log(data, "user");

      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Something went wrong" }
      );
    }
  }
);

export const getUser = createAsyncThunk(
  "user/get-user",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/getuser", {
        withCredentials: true,
      });
      const data = response.data;
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Something went wrong" }
      );
    }
  }
);
export const getadmin = createAsyncThunk(
  "user/adminget",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/adminget", {
        withCredentials: true,
      });
      const data = response.data;
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Something went wrong" }
      );
    }
  }
);

export const ForgetPass = createAsyncThunk(
  "user/forget",
  async (fromData, { rejectWithValue }) => {
    try {
      const response = await api.post("/forgotpassword", fromData, {
        withCredentials: true, // ✅ Allows sending and receiving cookies
      });

      const data = response.data;
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      console.log(data, "user");

      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Something went wrong" }
      );
    }
  }
);
export const SendOtp = createAsyncThunk(
  "user/sendotp",
  async (email, { rejectWithValue }) => {
    try {
      const response = await api.post("/sendotp", email, {
        withCredentials: true, // ✅ Allows sending and receiving cookies
      });

      const data = response.data;

      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Something went wrong" }
      );
    }
  }
);

export const updateUser = createAsyncThunk(
  "user/update-user",
  async (fromData, { rejectWithValue }) => {
    try {
      const response = await api.put("/update-user", fromData, {
        withCredentials: true,
      });

      const data = response.data;

      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Something went wrong" }
      );
    }
  }
);
export const Logout = createAsyncThunk(
  "user/logout",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/logout", {
        withCredentials: true,
      });

      const data = response.data;

      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Something went wrong" }
      );
    }
  }
);

export const postSupport = createAsyncThunk(
  "support/postSupport",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.post("/support", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Initial state
const initialState = {
  user: null,
  userInfo: null,
  loading: false,
  error: null,
  singleadmin: null,
  useraddress: null,
  userDetail: null,
  admininfo: null,
  message: null,
};

// User slice
const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder

      // Login user
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.data;
        state.userInfo = action.payload.data;
        console.log("User Info:", state.userInfo);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(Register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(Register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.data;
        state.userInfo = action.payload.data;
        console.log("User Info:", state.userInfo);
      })
      .addCase(Register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get user by ID
      .addCase(getUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUser.fulfilled, (state, action) => {
        state.loading = false;
        state.userInfo = action.payload.userInfo;
      })
      .addCase(getUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get user by ID
      .addCase(getadmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getadmin.fulfilled, (state, action) => {
        state.loading = false;
        state.admininfo = action.payload.data;
      })
      .addCase(getadmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Support
      .addCase(postSupport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(postSupport.fulfilled, (state, action) => {
        state.loading = false;
        state.support = action.payload;
      })
      .addCase(postSupport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = userSlice.actions;

export default userSlice.reducer;
