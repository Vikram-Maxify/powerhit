const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/authmodel");

const {
  sendResetPasswordOTP,
} = require("../utils/mailer.js");

const uploadToImgBB = require("../utils/uploadToImgBB");

// ======================================================
// COUNTRY CONFIGURATION
// ======================================================

const COUNTRY_CONFIG = {
  india: {
    name: "India",
    mobileLength: 10,
  },

  pakistan: {
    name: "Pakistan",
    mobileLength: 10,
  },

  bangladesh: {
    name: "Bangladesh",
    mobileLength: 10,
  },

  nepal: {
    name: "Nepal",
    mobileLength: 10,
  },

  uae: {
    name: "UAE",
    mobileLength: 9,
  },

  australia: {
    name: "Australia",
    mobileLength: 9,
  },
};

// ======================================================
// NORMALIZE COUNTRY
// ======================================================

const normalizeCountry = (country) => {
  const value = String(country || "")
    .trim()
    .toLowerCase();

  const aliases = {
    // INDIA
    india: "india",
    in: "india",
    ind: "india",

    // PAKISTAN
    pakistan: "pakistan",
    pk: "pakistan",
    pak: "pakistan",

    // BANGLADESH
    bangladesh: "bangladesh",
    bangla: "bangladesh",
    bd: "bangladesh",
    bng: "bangladesh",

    // NEPAL
    nepal: "nepal",
    np: "nepal",

    // UAE
    uae: "uae",
    ae: "uae",
    dubai: "uae",

    // AUSTRALIA
    australia: "australia",
    au: "australia",
    aus: "australia",
  };

  return aliases[value] || "";
};

// ======================================================
// GET COUNTRY FROM REQUEST
// ======================================================

const getRequestCountry = (req) => {
  const rawCountry =
    req.body?.country ||
    req.body?.countryCode ||
    req.body?.countryName ||
    req.params?.country ||
    req.query?.country ||
    req.query?.countryCode ||
    req.user?.country ||
    "";

  return normalizeCountry(rawCountry);
};

// ======================================================
// VALIDATE COUNTRY
// ======================================================

const validateCountry = (country) => {
  const normalized = normalizeCountry(country);

  if (!normalized) {
    return {
      valid: false,
      country: "",
      message:
        "Country is required. Supported countries are India, Pakistan, UAE, Australia, Bangladesh and Nepal.",
    };
  }

  if (!COUNTRY_CONFIG[normalized]) {
    return {
      valid: false,
      country: normalized,
      message:
        "Unsupported country. Supported countries are India, Pakistan, UAE, Australia, Bangladesh and Nepal.",
    };
  }

  return {
    valid: true,
    country: normalized,
  };
};

// ======================================================
// VALIDATE MOBILE
// Country code should NOT be included
// ======================================================

const validateMobile = (mobile, country) => {
  const normalizedCountry =
    normalizeCountry(country);

  const config =
    COUNTRY_CONFIG[normalizedCountry];

  if (!config) {
    return {
      valid: false,
      message:
        "Invalid country. Supported countries are India, Pakistan, UAE, Australia, Bangladesh and Nepal.",
    };
  }

  const cleanMobile = String(mobile || "")
    .replace(/\D/g, "");

  if (!cleanMobile) {
    return {
      valid: false,
      message: "Mobile number is required",
    };
  }

  if (
    cleanMobile.length !==
    config.mobileLength
  ) {
    return {
      valid: false,
      message:
        `Mobile number must be ${config.mobileLength} digits for ${config.name}`,
    };
  }

  return {
    valid: true,
    mobile: cleanMobile,
  };
};

// ======================================================
// GENERATE TOKEN
// ======================================================

const generateToken = (
  id,
  name,
  email,
  role
) => {
  return jwt.sign(
    {
      id,
      name,
      email,
      role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

// ======================================================
// GENERATE REFERRAL CODE
// ======================================================

const generateReferralCode = (name) => {
  const cleanName = String(name || "")
    .replace(/\s+/g, "")
    .substring(0, 4)
    .toUpperCase();

  const random = crypto
    .randomBytes(3)
    .toString("hex")
    .toUpperCase();

  return cleanName + random;
};

// ======================================================
// REGISTER
// ======================================================

const register = async (req, res) => {
  try {
    console.log("=================================");
    console.log("REGISTER REQUEST");
    console.log("BODY:", req.body);
    console.log(
      "RAW COUNTRY:",
      req.body?.country
    );
    console.log("=================================");

    let {
      name,
      email,
      mobile,
      password,
      referralCode,
    } = req.body;

    // ==================================================
    // COUNTRY
    // ==================================================

    const country =
      getRequestCountry(req);

    console.log(
      "NORMALIZED COUNTRY:",
      country
    );

    // ==================================================
    // COUNTRY VALIDATION
    // ==================================================

    const countryCheck =
      validateCountry(country);

    if (!countryCheck.valid) {
      return res.status(400).json({
        success: false,
        message: countryCheck.message,
      });
    }

    // ==================================================
    // REQUIRED FIELDS
    // ==================================================

    if (
      !name ||
      !email ||
      !mobile ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, mobile, password and country are required",
      });
    }

    name = String(name)
      .trim()
      .toLowerCase();

    email = String(email)
      .trim()
      .toLowerCase();

    mobile = String(mobile).trim();

    // ==================================================
    // NAME VALIDATION
    // ==================================================

    if (/\s/.test(name)) {
      return res.status(400).json({
        success: false,
        message:
          "Space is not allowed in name",
      });
    }

    // ==================================================
    // PASSWORD VALIDATION
    // ==================================================

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters",
      });
    }

    // ==================================================
    // MOBILE VALIDATION
    // ==================================================

    const mobileCheck =
      validateMobile(
        mobile,
        country
      );

    if (!mobileCheck.valid) {
      return res.status(400).json({
        success: false,
        message:
          mobileCheck.message,
      });
    }

    mobile = mobileCheck.mobile;

    // ==================================================
    // CHECK EXISTING USER
    // ==================================================

    const userExist =
      await User.findOne({
        $or: [
          { name },
          { email },
          { mobile },
        ],
      });

    if (userExist) {
      let message =
        "User already exists";

      if (userExist.name === name) {
        message =
          "Username already taken";
      } else if (
        userExist.email === email
      ) {
        message =
          "Email already registered";
      } else if (
        userExist.mobile === mobile
      ) {
        message =
          "Mobile number already registered";
      }

      return res.status(400).json({
        success: false,
        message,
      });
    }

    // ==================================================
    // REFERRAL
    // ==================================================

    let referrerUser = null;

    if (referralCode) {
      referralCode = String(
        referralCode
      )
        .trim()
        .toUpperCase();

      referrerUser =
        await User.findOne({
          referralCode,
        });

      if (!referrerUser) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid referral code",
        });
      }

      if (
        referrerUser.status ===
        "blocked"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Referrer account is blocked",
        });
      }
    }

    // ==================================================
    // HASH PASSWORD
    // ==================================================

    const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );

    // ==================================================
    // REFERRAL CODE
    // ==================================================

    let newReferralCode =
      generateReferralCode(name);

    // Avoid referral code collision
    let referralExists =
      await User.findOne({
        referralCode:
          newReferralCode,
      });

    while (referralExists) {
      newReferralCode =
        generateReferralCode(name);

      referralExists =
        await User.findOne({
          referralCode:
            newReferralCode,
        });
    }

    // ==================================================
    // CREATE USER
    // ==================================================

    const user =
      await User.create({
        name,
        email,
        mobile,
        password: hashedPassword,

        role: "user",

        // IMPORTANT
        // Always save normalized country
        country,

        referralCode:
          newReferralCode,

        referredBy:
          referralCode || null,

        referredByUser:
          referrerUser
            ? referrerUser._id
            : null,
      });

    // ==================================================
    // REFERRER STATS
    // ==================================================

    if (referrerUser) {
      await User.findByIdAndUpdate(
        referrerUser._id,
        {
          $inc: {
            totalReferrals: 1,
            referralEarning: 50,
          },
        }
      );
    }

    // ==================================================
    // TOKEN
    // ==================================================

    const token =
      generateToken(
        user._id,
        user.name,
        user.email,
        user.role
      );

    // ==================================================
    // COOKIE
    // ==================================================

    res.cookie(
      "token",
      token,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          "production",
        sameSite: "strict",
        maxAge:
          7 *
          24 *
          60 *
          60 *
          1000,
      }
    );

    // ==================================================
    // REMOVE PASSWORD
    // ==================================================

    const userObj =
      user.toObject();

    delete userObj.password;
    delete userObj.plainPassword;

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(201).json({
      success: true,
      message:
        "Registration successful",
      token,
      user: userObj,
    });
  } catch (error) {
    console.error(
      "REGISTER ERROR:",
      error
    );

    // ==================================================
    // DUPLICATE ERROR
    // ==================================================

    if (error.code === 11000) {
      const field =
        Object.keys(
          error.keyPattern || {}
        )[0];

      let message =
        "Duplicate field";

      if (field === "name") {
        message =
          "Username already taken";
      } else if (
        field === "email"
      ) {
        message =
          "Email already registered";
      } else if (
        field === "mobile"
      ) {
        message =
          "Mobile number already registered";
      } else if (
        field === "referralCode"
      ) {
        message =
          "Referral code already exists";
      }

      return res.status(400).json({
        success: false,
        message,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Internal Server Error",
    });
  }
};

// ======================================================
// LOGIN
// ======================================================

const login = async (req, res) => {
  try {
    let {
      mobile,
      password,
    } = req.body;

    if (!mobile || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Mobile and password are required",
      });
    }

    mobile = String(mobile)
      .replace(/\D/g, "");

    const user =
      await User.findOne({
        mobile,
      }).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found",
      });
    }

    if (
      user.status === "blocked"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been blocked",
      });
    }

    const isMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid mobile or password",
      });
    }

    const token =
      generateToken(
        user._id,
        user.name,
        user.email,
        user.role
      );

    const cookieName =
      user.role === "admin"
        ? "adminToken"
        : "token";

    res.cookie(
      cookieName,
      token,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          "production",
        sameSite: "strict",
        maxAge:
          7 *
          24 *
          60 *
          60 *
          1000,
      }
    );

    const userObj =
      user.toObject();

    delete userObj.password;
    delete userObj.plainPassword;

    return res.status(200).json({
      success: true,
      message:
        `${user.role} login successful`,
      token,
      role: user.role,
      user: userObj,
    });
  } catch (error) {
    console.error(
      "LOGIN ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Internal Server Error",
    });
  }
};

// ======================================================
// GET PROFILE
// ======================================================

const getProfile = async (
  req,
  res
) => {
  try {
    const user =
      await User.findById(
        req.user.id
      )
        .select(
          "-password -plainPassword"
        )
        .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        ...user,
        balance:
          user.balance,
        country:
          user.country || null,
      },
    });
  } catch (error) {
    console.error(
      "GET PROFILE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Internal Server Error",
    });
  }
};

// ======================================================
// UPDATE PROFILE
// ======================================================

const updateProfile = async (
  req,
  res
) => {
  try {
    const userId =
      req.user.id;

    const {
      fullName,
      email,
      mobile,
      city,
    } = req.body;

    const updateData = {};

    // ==================================================
    // NAME
    // ==================================================

    if (
      fullName !== undefined
    ) {
      const cleanName =
        String(fullName)
          .trim()
          .toLowerCase();

      if (/\s/.test(cleanName)) {
        return res.status(400).json({
          success: false,
          message:
            "Space is not allowed in name",
        });
      }

      updateData.name =
        cleanName;
    }

    // ==================================================
    // EMAIL
    // ==================================================

    if (
      email !== undefined
    ) {
      updateData.email =
        String(email)
          .trim()
          .toLowerCase();
    }

    // ==================================================
    // MOBILE
    // ==================================================

    if (
      mobile !== undefined
    ) {
      const currentUser =
        await User.findById(
          userId
        ).select("country");

      if (!currentUser) {
        return res.status(404).json({
          success: false,
          message:
            "User not found",
        });
      }

      const currentCountry =
        normalizeCountry(
          currentUser.country
        );

      const mobileCheck =
        validateMobile(
          mobile,
          currentCountry
        );

      if (!mobileCheck.valid) {
        return res.status(400).json({
          success: false,
          message:
            mobileCheck.message,
        });
      }

      updateData.mobile =
        mobileCheck.mobile;
    }

    // ==================================================
    // CITY
    // ==================================================

    if (
      city !== undefined
    ) {
      updateData.city =
        String(city).trim();
    }

    // ==================================================
    // PROFILE IMAGE
    // ==================================================

    if (req.file) {
      updateData.profilePic =
        await uploadToImgBB(
          req.file
        );
    }

    // ==================================================
    // UPDATE USER
    // ==================================================

    const updatedUser =
      await User.findByIdAndUpdate(
        userId,
        {
          $set: updateData,
        },
        {
          new: true,
          runValidators: true,
        }
      ).select(
        "-password -plainPassword"
      );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message:
          "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: req.file
        ? "Profile and image updated successfully"
        : "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error(
      "UPDATE PROFILE ERROR:",
      error
    );

    if (error.code === 11000) {
      const field =
        Object.keys(
          error.keyPattern || {}
        )[0];

      let message =
        "Duplicate field";

      if (field === "name") {
        message =
          "Username already taken";
      } else if (
        field === "email"
      ) {
        message =
          "Email already registered";
      } else if (
        field === "mobile"
      ) {
        message =
          "Mobile number already registered";
      }

      return res.status(400).json({
        success: false,
        message,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Internal Server Error",
    });
  }
};

// ======================================================
// LOGOUT
// ======================================================

const logout = async (
  req,
  res
) => {
  try {
    res.cookie(
      "token",
      "",
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          "production",
        sameSite: "strict",
        expires:
          new Date(0),
      }
    );

    res.cookie(
      "adminToken",
      "",
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          "production",
        sameSite: "strict",
        expires:
          new Date(0),
      }
    );

    return res.status(200).json({
      success: true,
      message:
        "Logout successful",
    });
  } catch (error) {
    console.error(
      "LOGOUT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Internal Server Error",
    });
  }
};

// ======================================================
// FORGOT PASSWORD
// ======================================================

const forgotPassword = async (
  req,
  res
) => {
  try {
    let { email } =
      req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message:
          "Email is required",
      });
    }

    email = String(email)
      .trim()
      .toLowerCase();

    const user =
      await User.findOne({
        email,
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found",
      });
    }

    if (
      user.status === "blocked"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been blocked",
      });
    }

    const otp = Math.floor(
      100000 +
        Math.random() * 900000
    ).toString();

    user.reset_otp = otp;

    user.reset_otp_expiry =
      new Date(
        Date.now() +
          5 * 60 * 1000
      );

    await user.save();

    const isSent =
      await sendResetPasswordOTP(
        user.email,
        otp
      );

    if (!isSent) {
      return res.status(500).json({
        success: false,
        message:
          "Failed to send OTP",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "OTP sent successfully to your email",
    });
  } catch (error) {
    console.error(
      "FORGOT PASSWORD ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Internal Server Error",
    });
  }
};

// ======================================================
// VERIFY OTP AND RESET PASSWORD
// ======================================================

const verifyOTPAndReset = async (
  req,
  res
) => {
  try {
    let {
      email,
      otp,
      newPassword,
    } = req.body;

    if (
      !email ||
      !otp ||
      !newPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Email, OTP and new password are required",
      });
    }

    email = String(email)
      .trim()
      .toLowerCase();

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters",
      });
    }

    const user =
      await User.findOne({
        email,
      }).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found",
      });
    }

    if (
      user.status === "blocked"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been blocked",
      });
    }

    if (
      !user.reset_otp ||
      user.reset_otp !==
        otp.toString()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid OTP",
      });
    }

    if (
      !user.reset_otp_expiry ||
      new Date() >
        new Date(
          user.reset_otp_expiry
        )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "OTP has expired",
      });
    }

    user.password =
      await bcrypt.hash(
        newPassword,
        10
      );

    user.plainPassword =
      newPassword;

    user.reset_otp = null;
    user.reset_otp_expiry =
      null;

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "Password reset successfully",
    });
  } catch (error) {
    console.error(
      "RESET PASSWORD ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Internal Server Error",
    });
  }
};

// ======================================================
// CHANGE PASSWORD
// ======================================================

const changePassword = async (
  req,
  res
) => {
  try {
    const {
      oldPassword,
      newPassword,
    } = req.body;

    if (
      !oldPassword ||
      !newPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Both passwords required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be at least 6 characters",
      });
    }

    const user =
      await User.findById(
        req.user.id
      ).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found",
      });
    }

    if (
      user.status === "blocked"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been blocked",
      });
    }

    const isMatch =
      await bcrypt.compare(
        oldPassword,
        user.password
      );

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message:
          "Old password incorrect",
      });
    }

    user.password =
      await bcrypt.hash(
        newPassword,
        10
      );

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "Password changed successfully",
    });
  } catch (error) {
    console.error(
      "CHANGE PASSWORD ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Server error",
    });
  }
};

// ======================================================
// GET ALL USERS
// ======================================================

const getAllUsers = async (
  req,
  res
) => {
  try {
    const users =
      await User.find({})
        .select(
          "-password -plainPassword"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error(
      "GET ALL USERS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch users.",
      error: error.message,
    });
  }
};

// ======================================================
// UPDATE USER STATUS
// ======================================================

const updateUserStatus = async (
  req,
  res
) => {
  try {
    const { userId } =
      req.params;

    const { status } =
      req.body;

    if (
      !["active", "blocked"].includes(
        status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Status must be active or blocked",
      });
    }

    const user =
      await User.findById(
        userId
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found",
      });
    }

    user.status = status;

    await user.save();

    const userResponse =
      user.toObject();

    delete userResponse.password;
    delete userResponse.plainPassword;

    return res.status(200).json({
      success: true,
      message:
        `User ${status} successfully`,
      user: userResponse,
    });
  } catch (error) {
    console.error(
      "UPDATE USER STATUS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Internal Server Error",
    });
  }
};

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  logout,
  forgotPassword,
  verifyOTPAndReset,
  changePassword,
  getAllUsers,
  updateUserStatus,

  // Export helpers if needed elsewhere
  normalizeCountry,
  validateMobile,
};