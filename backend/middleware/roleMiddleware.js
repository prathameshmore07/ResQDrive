// Role-based authorization middleware
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated"
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Forbidden: Access restricted to [${allowedRoles.join(", ")}]. Current role: '${req.user.role}'`
            });
        }

        next();
    };
};

module.exports = { requireRole };
