const jwt = require("jsonwebtoken");
const Driver = require("../models/Driver");
const Provider = require("../models/Provider");

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authentication failed: Bearer token is missing"
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication failed: Token not found"
            });
        }

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return res.status(500).json({
                success: false,
                message: "Server error: JWT_SECRET is not configured in environment variables"
            });
        }

        const decoded = jwt.verify(token, secret);

        // Fetch user from DB based on role in payload
        let user;
        if (decoded.role === "driver") {
            user = await Driver.findById(decoded.id).select("-password");
        } else if (decoded.role === "provider") {
            user = await Provider.findById(decoded.id).select("-password");
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User associated with token no longer exists"
            });
        }

        req.user = {
            id: user._id.toString(),
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
            },
            rawUser: user
        };

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Authentication failed: Invalid or expired token",
            error: error.message
        });
    }
};

module.exports = authMiddleware;
