const VALID_ISSUE_TYPES = [
    "FLAT_TIRE",
    "BATTERY_DEAD",
    "ENGINE_FAILURE",
    "FUEL_DELIVERY",
    "TOWING",
    "LOCK_OUT",
    "OTHER"
];

const VALID_STATUSES = ["PENDING", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

// Validate request body when creating assistance request
const validateAssistanceRequest = (req, res, next) => {
    const { issueType, location } = req.body;
    const errors = [];

    if (!issueType || typeof issueType !== "string") {
        errors.push("issueType is required and must be a string");
    } else if (!VALID_ISSUE_TYPES.includes(issueType)) {
        errors.push(`Invalid issueType. Allowed values: ${VALID_ISSUE_TYPES.join(", ")}`);
    }

    if (!location) {
        errors.push("location object or address is required");
    } else if (typeof location === "string") {
        if (!location.trim()) {
            errors.push("location address cannot be empty");
        } else {
            // Auto convert string location to structured object
            req.body.location = { address: location.trim() };
        }
    } else if (typeof location === "object") {
        if (!location.address || typeof location.address !== "string" || !location.address.trim()) {
            errors.push("location.address is required and must be a non-empty string");
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: "Validation failed for assistance request",
            errors
        });
    }

    next();
};

// Validate status update input from provider
const validateStatusUpdate = (req, res, next) => {
    const { status } = req.body;

    if (!status || typeof status !== "string") {
        return res.status(400).json({
            success: false,
            message: "Status field is required and must be a string"
        });
    }

    const upperStatus = status.toUpperCase();

    if (!VALID_STATUSES.includes(upperStatus)) {
        return res.status(400).json({
            success: false,
            message: `Invalid status '${status}'. Allowed statuses: ${VALID_STATUSES.join(", ")}`
        });
    }

    // Attach sanitized status
    req.body.status = upperStatus;
    next();
};

// Validate auth input for register and login
const validateAuthInput = (isRegister = false) => {
    return (req, res, next) => {
        const { email, password, name, phone, role } = req.body;
        const errors = [];

        if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push("A valid email address is required");
        }

        if (!password || typeof password !== "string" || password.length < 6) {
            errors.push("Password is required and must be at least 6 characters");
        }

        if (isRegister) {
            if (!name || typeof name !== "string" || !name.trim()) {
                errors.push("Name is required");
            }
            if (!phone || typeof phone !== "string" || !phone.trim()) {
                errors.push("Phone number is required");
            }
            if (!role || !["driver", "provider"].includes(role)) {
                errors.push("Role must be either 'driver' or 'provider'");
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Authentication validation failed",
                errors
            });
        }

        next();
    };
};

module.exports = {
    validateAssistanceRequest,
    validateStatusUpdate,
    validateAuthInput,
    VALID_ISSUE_TYPES,
    VALID_STATUSES
};
