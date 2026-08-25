const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/authmodel");

const {
    sendResetPasswordOTP,
} = require("../utils/mailer.js");

const uploadToImgBB = require("../utils/uploadToImgBB");

// ======================================================
// GENERATE TOKEN
// ======================================================

const generateToken = (id, name, email, role) => {
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
    const random = crypto
        .randomBytes(3)
        .toString("hex")
        .toUpperCase();

    return (
        name
            .replace(/\s+/g, "")
            .substring(0, 4)
            .toUpperCase() + random
    );
};

// ======================================================
// MOBILE NUMBER CONFIGURATION
// Country code is NOT included in mobile field
// ======================================================

const MOBILE_LENGTH = {
    india: 10,
    pakistan: 10,
    canada: 10,
    nepal: 10,
    uae: 9,
    australia: 9,
};

// ======================================================
// NORMALIZE COUNTRY
// ======================================================

const normalizeCountry = (country) => {
    return String(country || "")
        .trim()
        .toLowerCase();
};

// ======================================================
// VALIDATE MOBILE NUMBER
// ======================================================

const validateMobile = (mobile, country) => {
    const normalizedCountry = normalizeCountry(country);

    // Remove spaces, +, -, brackets, etc.
    const cleanMobile = String(mobile || "").replace(/\D/g, "");

    const requiredLength =
        MOBILE_LENGTH[normalizedCountry];

    if (!requiredLength) {
        return {
            valid: false,
            message:
                "Invalid country. Supported countries are India, Pakistan, UAE, Australia, Canada and Nepal.",
        };
    }

    if (!cleanMobile) {
        return {
            valid: false,
            message: "Mobile number is required",
        };
    }

    // Country code is NOT allowed in mobile field.
    if (cleanMobile.length !== requiredLength) {
        return {
            valid: false,
            message: `Mobile number must be ${requiredLength} digits for ${normalizedCountry}`,
        };
    }

    return {
        valid: true,
        mobile: cleanMobile,
    };
};

// ======================================================
// REGISTER
// ======================================================

const register = async (req, res) => {
    try {
        let {
            name,
            email,
            mobile,
            password,
            country,
            referralCode,
        } = req.body;

        // ================= VALIDATION =================

        if (!name || !email || !mobile || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        name = name.trim().toLowerCase();
        email = email.trim().toLowerCase();
        mobile = mobile.trim();
        country = normalizeCountry(country);

        // ================= NAME VALIDATION =================

        if (/\s/.test(name)) {
            return res.status(400).json({
                success: false,
                message: "Space is not allowed in name",
            });
        }

        // ================= PASSWORD VALIDATION =================

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must be at least 6 characters",
            });
        }

        // ================= MOBILE VALIDATION =================

        const mobileCheck = validateMobile(
            mobile,
            country
        );

        if (!mobileCheck.valid) {
            return res.status(400).json({
                success: false,
                message: mobileCheck.message,
            });
        }

        mobile = mobileCheck.mobile;

        // ================= CHECK EXISTING USER =================

        const userExist = await User.findOne({
            $or: [
                { name },
                { email },
                { mobile },
            ],
        });

        if (userExist) {
            let message = "User already exists";

            if (userExist.name === name) {
                message = "Username already taken";
            } else if (userExist.email === email) {
                message = "Email already registered";
            } else if (userExist.mobile === mobile) {
                message = "Mobile number already registered";
            }

            return res.status(400).json({
                success: false,
                message,
            });
        }

        // ================= REFERRAL =================

        let referrerUser = null;

        if (referralCode) {
            referralCode = referralCode
                .trim()
                .toUpperCase();

            referrerUser = await User.findOne({
                referralCode,
            });

            if (!referrerUser) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid referral code",
                });
            }

            if (referrerUser.status === "blocked") {
                return res.status(403).json({
                    success: false,
                    message:
                        "Referrer account is blocked",
                });
            }
        }

        // ================= HASH PASSWORD =================

        const hashedPassword = await bcrypt.hash(
            password,
            10
        );

        // ================= REFERRAL CODE =================

        const newReferralCode =
            generateReferralCode(name);

        // ================= CREATE USER =================

        const user = await User.create({
            name,
            email,
            mobile,
            password: hashedPassword,

            role: "user",

            country: country || null,

            referralCode: newReferralCode,

            referredBy: referralCode || null,

            referredByUser: referrerUser
                ? referrerUser._id
                : null,
        });

        // ================= REFERRER STATS =================

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

        // ================= TOKEN =================

        const token = generateToken(
            user._id,
            user.name,
            user.email,
            user.role
        );

        // ================= COOKIE =================

        res.cookie("token", token, {
            httpOnly: true,
            secure:
                process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge:
                7 * 24 * 60 * 60 * 1000,
        });

        // ================= REMOVE PASSWORD =================

        const userObj = user.toObject();

        delete userObj.password;
        delete userObj.plainPassword;

        // ================= RESPONSE =================

        return res.status(201).json({
            success: true,
            message: "Registration successful",
            token,
            user: userObj,
        });

    } catch (error) {
        if (error.code === 11000) {
            const field =
                Object.keys(
                    error.keyPattern || {}
                )[0];

            let message = "Duplicate field";

            if (field === "name") {
                message = "Username already taken";
            } else if (field === "email") {
                message = "Email already registered";
            } else if (field === "mobile") {
                message = "Mobile number already registered";
            } else if (field === "referralCode") {
                message =
                    "Referral code already exists";
            }

            return res.status(400).json({
                success: false,
                message,
            });
        }

        console.error(
            "REGISTER ERROR:",
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

        // Only digits
        mobile = mobile
            .toString()
            .replace(/\D/g, "");

        const user = await User.findOne({
            mobile,
        }).select("+password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (user.status === "blocked") {
            return res.status(403).json({
                success: false,
                message:
                    "Your account has been blocked",
            });
        }

        const isMatch = await bcrypt.compare(
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

        const token = generateToken(
            user._id,
            user.name,
            user.email,
            user.role
        );

        const cookieName =
            user.role === "admin"
                ? "adminToken"
                : "token";

        res.cookie(cookieName, token, {
            httpOnly: true,
            secure:
                process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge:
                7 * 24 * 60 * 60 * 1000,
        });

        const userObj = user.toObject();

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
// NO CURRENCY CONVERSION
// ======================================================

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(
            req.user.id
        )
            .select("-password -plainPassword")
            .lean();

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            user: {
                ...user,

                // Exact database balance
                balance: user.balance,

                // Country unchanged
                country: user.country || null,
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

const updateProfile = async (req, res) => {
    try {
        console.log(
            "REQ.FILE:",
            req.file
        );

        console.log(
            "REQ.BODY:",
            req.body
        );

        const userId = req.user.id;

        const {
            fullName,
            email,
            mobile,
            city,
        } = req.body;

        const updateData = {};

        // ================= NAME =================

        if (fullName !== undefined) {
            const cleanName =
                fullName.trim().toLowerCase();

            if (/\s/.test(cleanName)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Space is not allowed in name",
                });
            }

            updateData.name = cleanName;
        }

        // ================= EMAIL =================

        if (email !== undefined) {
            updateData.email =
                email.trim().toLowerCase();
        }

        // ================= MOBILE =================

        if (mobile !== undefined) {
            // Get user's country from DB
            const currentUser =
                await User.findById(userId)
                    .select("country");

            if (!currentUser) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            const mobileCheck =
                validateMobile(
                    mobile,
                    currentUser.country
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

        // ================= CITY =================

        if (city !== undefined) {
            updateData.city =
                city.trim();
        }

        // ==========================================
        // PROFILE IMAGE
        // ==========================================

        if (req.file) {
            console.log(
                "Uploading profile image..."
            );

            updateData.profilePic =
                await uploadToImgBB(
                    req.file
                );

            console.log(
                "IMGBB URL:",
                updateData.profilePic
            );
        }

        // ==========================================
        // UPDATE USER
        // ==========================================

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
            )
                .select(
                    "-password -plainPassword"
                );

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
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

        // ================= DUPLICATE ERROR =================

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
            } else if (field === "email") {
                message =
                    "Email already registered";
            } else if (field === "mobile") {
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

const logout = async (req, res) => {
    try {
        res.cookie("token", "", {
            httpOnly: true,
            secure:
                process.env.NODE_ENV === "production",
            sameSite: "strict",
            expires: new Date(0),
        });

        res.cookie("adminToken", "", {
            httpOnly: true,
            secure:
                process.env.NODE_ENV === "production",
            sameSite: "strict",
            expires: new Date(0),
        });

        return res.status(200).json({
            success: true,
            message: "Logout successful",
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

const forgotPassword = async (req, res) => {
    try {
        let { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }

        email = email
            .trim()
            .toLowerCase();

        const user = await User.findOne({
            email,
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (user.status === "blocked") {
            return res.status(403).json({
                success: false,
                message:
                    "Your account has been blocked",
            });
        }

        // ================= GENERATE OTP =================

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

        // ================= SEND OTP =================

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
// VERIFY OTP & RESET PASSWORD
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

        email = email
            .trim()
            .toLowerCase();

        // ================= PASSWORD VALIDATION =================

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must be at least 6 characters",
            });
        }

        // ================= FIND USER =================

        const user =
            await User.findOne({
                email,
            }).select("+password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (user.status === "blocked") {
            return res.status(403).json({
                success: false,
                message:
                    "Your account has been blocked",
            });
        }

        // ================= VERIFY OTP =================

        if (
            !user.reset_otp ||
            user.reset_otp !==
            otp.toString()
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP",
            });
        }

        // ================= CHECK EXPIRY =================

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

        // ================= UPDATE PASSWORD =================

        user.password =
            await bcrypt.hash(
                newPassword,
                10
            );

        user.plainPassword =
            newPassword;

        // ================= CLEAR OTP =================

        user.reset_otp = null;
        user.reset_otp_expiry = null;

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
                message: "User not found",
            });
        }

        if (user.status === "blocked") {
            return res.status(403).json({
                success: false,
                message:
                    "Your account has been blocked",
            });
        }

        // ================= CHECK OLD PASSWORD =================

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

        // ================= UPDATE PASSWORD =================

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

        // ================= VALIDATION =================

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

        // ================= FIND USER =================

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

        // ================= UPDATE STATUS =================

        user.status = status;

        await user.save();

        // ================= RESPONSE =================

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
};