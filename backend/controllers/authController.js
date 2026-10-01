const jwt = require("jsonwebtoken");
const Driver = require("../models/Driver");
const Provider = require("../models/Provider");

const generateToken = (id, role) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is not defined in environment variables");
    }
    return jwt.sign(
        { id, role },
        secret,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );
};

// @desc    Register a new driver or provider
// @route   POST /api/auth/register
const register = async (req, res) => {
    try {
        const { name, email, password, phone, role, vehicle, serviceType } = req.body;
        const normalizedEmail = email ? email.toLowerCase().trim() : "";

        // 1. Easy input validation checks
        if (!name || name.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: "Please enter your full name"
            });
        }

        if (!normalizedEmail || !normalizedEmail.includes("@") || !normalizedEmail.includes(".")) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address with @"
            });
        }

        if (!password || password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long"
            });
        }

        // Clean phone to digits only (max 10)
        const cleanPhone = String(phone || "").replace(/\D/g, "");
        if (cleanPhone.length !== 10) {
            return res.status(400).json({
                success: false,
                message: "Phone number must be exactly 10 digits (numbers only)"
            });
        }

        // 2. Check if email already exists
        const existingDriver = await Driver.findOne({ email: normalizedEmail });
        const existingProvider = await Provider.findOne({ email: normalizedEmail });

        if (existingDriver || existingProvider) {
            return res.status(400).json({
                success: false,
                message: "Email is already registered"
            });
        }

        // 3. Create user according to role
        let user;
        if (role === "driver") {
            user = await Driver.create({
                name: name.trim(),
                email: normalizedEmail,
                password,
                phone: cleanPhone || phone.trim(),
                vehicle: vehicle || {},
                role: "driver"
            });
        } else {
            user = await Provider.create({
                name: name.trim(),
                email: normalizedEmail,
                password,
                phone: cleanPhone || phone.trim(),
                serviceType: serviceType || "ALL_ROUNDER",
                currentLocation: {
                    address: "Kharghar Highway Hub, Sector 4, Kharghar, Navi Mumbai",
                    lat: 19.0337,
                    lng: 73.0645
                },
                role: "provider"
            });
        }

        // 3. Generate auth token
        const token = generateToken(user._id, user.role);

        return res.status(201).json({
            success: true,
            message: `${role} registered successfully`,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                vehicle: user.vehicle,
                serviceType: user.serviceType,
                isAvailable: user.isAvailable
            }
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to register user"
        });
    }
};

// @desc    Login driver or provider
// @route   POST /api/auth/login
const login = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        const normalizedEmail = email ? email.toLowerCase().trim() : "";

        if (!normalizedEmail || !normalizedEmail.includes("@")) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address with @"
            });
        }

        if (!password) {
            return res.status(400).json({
                success: false,
                message: "Password is required"
            });
        }

        let user = null;

        // If role specified, search targeted model; otherwise search both
        if (role === "driver") {
            user = await Driver.findOne({ email: normalizedEmail });
        } else if (role === "provider") {
            user = await Provider.findOne({ email: normalizedEmail });
        } else {
            user = await Driver.findOne({ email: normalizedEmail });
            if (!user) {
                user = await Provider.findOne({ email: normalizedEmail });
            }
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const token = generateToken(user._id, user.role);

        return res.json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                vehicle: user.vehicle,
                serviceType: user.serviceType,
                isAvailable: user.isAvailable,
                currentLocation: user.currentLocation || {
                    address: "Kharghar Highway Hub, Sector 4, Kharghar, Navi Mumbai",
                    lat: 19.0337,
                    lng: 73.0645
                }
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to login",
            error: error.message
        });
    }
};

// @desc    Get currently authenticated user
// @route   GET /api/auth/me
const getMe = async (req, res) => {
    try {
        return res.json({
            success: true,
            user: req.user
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve user profile",
            error: error.message
        });
    }
};

module.exports = {
    register,
    login,
    getMe
};
