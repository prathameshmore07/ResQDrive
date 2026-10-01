const AssistanceRequest = require("../models/AssistanceRequest");

// Verify driver owner or assigned provider has access
const requireRequestAccess = async (req, res, next) => {
    try {
        const { id } = req.params;
        const request = await AssistanceRequest.findById(id)
            .populate("driver", "name email phone vehicle")
            .populate("provider", "name email phone serviceType isAvailable");

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Assistance request not found"
            });
        }

        const isDriverOwner = request.driver && request.driver._id.toString() === req.user.id;
        const isAssignedProvider = request.provider && request.provider._id.toString() === req.user.id;

        // Providers are also allowed to view unassigned PENDING requests if they are browsing available jobs
        const isPendingUnassigned = req.user.role === "provider" && request.status === "PENDING";

        if (!isDriverOwner && !isAssignedProvider && !isPendingUnassigned) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: You are not authorized to view or access this request"
            });
        }

        req.assistanceRequest = request;
        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error verifying request authorization",
            error: error.message
        });
    }
};

// Verify only the assigned provider can update status
const requireAssignedProvider = async (req, res, next) => {
    try {
        const { id } = req.params;
        const request = await AssistanceRequest.findById(id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Assistance request not found"
            });
        }

        if (req.user.role !== "provider") {
            return res.status(403).json({
                success: false,
                message: "Forbidden: Only providers can update status"
            });
        }

        if (!request.provider || request.provider.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: You can only update requests assigned specifically to you"
            });
        }

        req.assistanceRequest = request;
        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error verifying assigned provider ownership",
            error: error.message
        });
    }
};

// Verify only the creator driver can modify or cancel request
const requireDriverOwnership = async (req, res, next) => {
    try {
        const { id } = req.params;
        const request = await AssistanceRequest.findById(id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Assistance request not found"
            });
        }

        if (req.user.role !== "driver" || request.driver.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: You can only manage requests created by you"
            });
        }

        req.assistanceRequest = request;
        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error verifying driver ownership",
            error: error.message
        });
    }
};

module.exports = {
    requireRequestAccess,
    requireAssignedProvider,
    requireDriverOwnership
};
