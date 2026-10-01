const AssistanceRequest = require("../models/AssistanceRequest");
const Provider = require("../models/Provider");

// Haversine distance calculator between two GPS coordinates (in km)
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371; // Earth radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Find the nearest available provider in MongoDB
async function findNearestAvailableProvider(lat, lng) {
    const availableProviders = await Provider.find({ isAvailable: true });
    if (!availableProviders || availableProviders.length === 0) return null;
    if (!lat || !lng) return availableProviders[0];

    let nearest = null;
    let minDistance = Infinity;

    for (const provider of availableProviders) {
        const pLat = provider.currentLocation?.lat || 19.0337;
        const pLng = provider.currentLocation?.lng || 73.0645;
        const dist = calculateHaversineDistance(lat, lng, pLat, pLng);
        if (dist < minDistance) {
            minDistance = dist;
            nearest = provider;
        }
    }
    return nearest;
}

// @desc    Raise a new assistance request (Driver)
// @route   POST /api/requests
const createRequest = async (req, res) => {
    try {
        const { issueType, location, description, vehicleDetails, autoDispatch } = req.body;

        let assignedProviderId = null;
        let initialStatus = "PENDING";
        let initialNote = "Request submitted and waiting for nearby roadside provider";

        // Auto-dispatch option: find and assign nearest available provider immediately
        if (autoDispatch) {
            const nearest = await findNearestAvailableProvider(location?.lat, location?.lng);
            if (nearest) {
                assignedProviderId = nearest._id;
                initialStatus = "ASSIGNED";
                initialNote = `Automatically dispatched to nearest available provider: ${nearest.name}`;
                await Provider.findByIdAndUpdate(nearest._id, { isAvailable: false });
            }
        }

        const newRequest = new AssistanceRequest({
            driver: req.user.id,
            provider: assignedProviderId,
            issueType,
            location,
            description: description || "",
            vehicleDetails: vehicleDetails || (req.user.rawUser && req.user.rawUser.vehicle) || {},
            status: initialStatus,
            statusHistory: [
                {
                    status: initialStatus,
                    timestamp: new Date(),
                    updatedByRole: assignedProviderId ? "system" : "driver",
                    updatedById: req.user.id,
                    note: initialNote
                }
            ]
        });

        const savedRequest = await newRequest.save();

        const populated = await AssistanceRequest.findById(savedRequest._id)
            .populate("driver", "name email phone vehicle")
            .populate("provider", "name email phone serviceType isAvailable currentLocation");

        return res.status(201).json({
            success: true,
            message: assignedProviderId
                ? `Assistance request created and dispatched to nearest provider.`
                : "Assistance request created. Waiting for nearest available provider.",
            request: populated
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to create assistance request",
            error: error.message
        });
    }
};

// @desc    Get requests belonging to authenticated user (Driver's raised requests OR Provider's assigned requests)
// @route   GET /api/requests/my
const getMyRequests = async (req, res) => {
    try {
        let filter = {};

        if (req.user.role === "driver") {
            filter = { driver: req.user.id };
        } else if (req.user.role === "provider") {
            filter = { provider: req.user.id };
        }

        const requests = await AssistanceRequest.find(filter)
            .populate("driver", "name email phone vehicle")
            .populate("provider", "name email phone serviceType isAvailable currentLocation")
            .sort({ createdAt: -1 });

        return res.json({
            success: true,
            count: requests.length,
            requests
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch user requests",
            error: error.message
        });
    }
};

// @desc    Get a single assistance request by ID (Driver owner or assigned Provider)
// @route   GET /api/requests/:id
const getRequestById = async (req, res) => {
    try {
        // req.assistanceRequest is attached by requireRequestAccess middleware
        return res.json({
            success: true,
            request: req.assistanceRequest
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch request",
            error: error.message
        });
    }
};

// @desc    Update request status (Assigned Provider only)
// @route   PATCH /api/requests/:id/status
const updateRequestStatus = async (req, res) => {
    try {
        const { status, note } = req.body;
        const request = req.assistanceRequest; // Attached by requireAssignedProvider

        const oldStatus = request.status;

        // Workflow state machine validation
        const validTransitions = {
            PENDING: ["ASSIGNED", "CANCELLED"],
            ASSIGNED: ["IN_PROGRESS", "CANCELLED"],
            IN_PROGRESS: ["COMPLETED", "CANCELLED"],
            COMPLETED: [],
            CANCELLED: []
        };

        if (!validTransitions[oldStatus].includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status workflow transition: Cannot move from ${oldStatus} to ${status}`
            });
        }

        request.status = status;
        request.statusHistory.push({
            status,
            timestamp: new Date(),
            updatedByRole: "provider",
            updatedById: req.user.id,
            note: note || `Status updated from ${oldStatus} to ${status}`
        });

        await request.save();

        // If request is completed or cancelled, free the provider's availability
        if (status === "COMPLETED" || status === "CANCELLED") {
            await Provider.findByIdAndUpdate(req.user.id, { isAvailable: true });
        }

        const updated = await AssistanceRequest.findById(request._id)
            .populate("driver", "name email phone vehicle")
            .populate("provider", "name email phone serviceType isAvailable currentLocation");

        return res.json({
            success: true,
            message: `Request status updated to ${status}`,
            request: updated
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to update request status",
            error: error.message
        });
    }
};

// @desc    Provider accepts / claims an unassigned pending request
// @route   PATCH /api/requests/:id/accept
const acceptRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const request = await AssistanceRequest.findById(id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Request not found"
            });
        }

        if (request.status !== "PENDING" && request.provider) {
            return res.status(400).json({
                success: false,
                message: "This request has already been assigned to another provider"
            });
        }

        request.provider = req.user.id;
        request.status = "ASSIGNED";
        request.statusHistory.push({
            status: "ASSIGNED",
            timestamp: new Date(),
            updatedByRole: "provider",
            updatedById: req.user.id,
            note: `Provider ${req.user.name} accepted the request`
        });

        await request.save();

        // Mark provider as currently busy
        await Provider.findByIdAndUpdate(req.user.id, { isAvailable: false });

        const populated = await AssistanceRequest.findById(request._id)
            .populate("driver", "name email phone vehicle")
            .populate("provider", "name email phone serviceType isAvailable currentLocation");

        return res.json({
            success: true,
            message: "Request successfully accepted and assigned to you",
            request: populated
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to accept request",
            error: error.message
        });
    }
};

// @desc    Get all pending unassigned requests (Queue for providers, sorted by proximity if provider coords available)
// @route   GET /api/requests/pending
const getPendingRequests = async (req, res) => {
    try {
        const pending = await AssistanceRequest.find({ status: "PENDING" })
            .populate("driver", "name email phone vehicle")
            .sort({ createdAt: -1 });

        // If provider has GPS coordinates, sort by nearest distance
        const providerLat = req.user?.currentLocation?.lat;
        const providerLng = req.user?.currentLocation?.lng;

        let sortedRequests = pending;
        if (providerLat && providerLng) {
            sortedRequests = [...pending].sort((a, b) => {
                const distA = calculateHaversineDistance(
                    providerLat,
                    providerLng,
                    a.location?.lat || 19.0337,
                    a.location?.lng || 73.0645
                );
                const distB = calculateHaversineDistance(
                    providerLat,
                    providerLng,
                    b.location?.lat || 19.0337,
                    b.location?.lng || 73.0645
                );
                return distA - distB;
            });
        }

        return res.json({
            success: true,
            count: sortedRequests.length,
            requests: sortedRequests
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch pending requests",
            error: error.message
        });
    }
};

// @desc    Dispatch request to nearest available provider (Express & MongoDB nearest-dispatch engine)
// @route   POST /api/requests/:id/dispatch
const dispatchRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const request = await AssistanceRequest.findById(id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Assistance request not found"
            });
        }

        if (request.status !== "PENDING") {
            return res.status(400).json({
                success: false,
                message: `Cannot dispatch request with status '${request.status}'`
            });
        }

        const nearest = await findNearestAvailableProvider(request.location?.lat, request.location?.lng);
        if (!nearest) {
            return res.status(404).json({
                success: false,
                message: "No available roadside assistance providers found currently in the area"
            });
        }

        request.provider = nearest._id;
        request.status = "ASSIGNED";
        request.statusHistory.push({
            status: "ASSIGNED",
            timestamp: new Date(),
            updatedByRole: "system",
            note: `System dispatched to nearest available provider: ${nearest.name}`
        });

        await request.save();
        await Provider.findByIdAndUpdate(nearest._id, { isAvailable: false });

        const populated = await AssistanceRequest.findById(request._id)
            .populate("driver", "name email phone vehicle")
            .populate("provider", "name email phone serviceType isAvailable currentLocation");

        return res.json({
            success: true,
            message: `Request successfully dispatched to nearest provider: ${nearest.name}`,
            request: populated
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to dispatch request",
            error: error.message
        });
    }
};

// @desc    Update request details (Driver owner while still PENDING)
// @route   PUT /api/requests/:id
const updateRequest = async (req, res) => {
    try {
        const request = req.assistanceRequest; // Attached by requireDriverOwnership

        if (request.status !== "PENDING") {
            return res.status(400).json({
                success: false,
                message: "Cannot modify request after it has been assigned or processed"
            });
        }

        const { issueType, location, description, vehicleDetails } = req.body;

        if (issueType) request.issueType = issueType;
        if (location) request.location = location;
        if (description !== undefined) request.description = description;
        if (vehicleDetails) request.vehicleDetails = vehicleDetails;

        await request.save();

        const updated = await AssistanceRequest.findById(request._id)
            .populate("driver", "name email phone vehicle");

        return res.json({
            success: true,
            message: "Request updated successfully",
            request: updated
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to update request",
            error: error.message
        });
    }
};

// @desc    Cancel request (Driver owner while still PENDING)
// @route   DELETE /api/requests/:id
const cancelRequest = async (req, res) => {
    try {
        const request = req.assistanceRequest; // Attached by requireDriverOwnership

        if (request.status === "COMPLETED") {
            return res.status(400).json({
                success: false,
                message: "Cannot cancel a request that is already completed"
            });
        }

        request.status = "CANCELLED";
        request.statusHistory.push({
            status: "CANCELLED",
            timestamp: new Date(),
            updatedByRole: "driver",
            updatedById: req.user.id,
            note: "Cancelled by driver"
        });

        await request.save();

        // If a provider was assigned, free them
        if (request.provider) {
            await Provider.findByIdAndUpdate(request.provider, { isAvailable: true });
        }

        return res.json({
            success: true,
            message: "Request cancelled successfully"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to cancel request",
            error: error.message
        });
    }
};

module.exports = {
    createRequest,
    getMyRequests,
    getRequestById,
    updateRequestStatus,
    acceptRequest,
    getPendingRequests,
    dispatchRequest,
    updateRequest,
    cancelRequest
};
