const express = require("express");
const router = express.Router();
const {
    createRequest,
    getMyRequests,
    getRequestById,
    updateRequestStatus,
    acceptRequest,
    getPendingRequests,
    dispatchRequest,
    updateRequest,
    cancelRequest
} = require("../controllers/requestController");

const authMiddleware = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");
const {
    requireRequestAccess,
    requireAssignedProvider,
    requireDriverOwnership
} = require("../middleware/ownershipMiddleware");
const {
    validateAssistanceRequest,
    validateStatusUpdate
} = require("../middleware/validationMiddleware");

// All request routes require authentication
router.use(authMiddleware);

// Driver raises an assistance request
router.post("/", requireRole("driver"), validateAssistanceRequest, createRequest);

// Driver tracks own requests OR Provider views assigned requests
router.get("/my", getMyRequests);

// Provider browses pending unassigned queue
router.get("/pending", requireRole("provider"), getPendingRequests);

// Single request details (ownership protected)
router.get("/:id", requireRequestAccess, getRequestById);

// Assigned provider updates status workflow (ASSIGNED -> IN_PROGRESS -> COMPLETED)
router.patch("/:id/status", requireAssignedProvider, validateStatusUpdate, updateRequestStatus);

// Provider claims/accepts pending request
router.patch("/:id/accept", requireRole("provider"), acceptRequest);

// Dispatch request to nearest available provider (system/driver/admin)
router.post("/:id/dispatch", dispatchRequest);

// Driver modifies request details while still PENDING
router.put("/:id", requireDriverOwnership, updateRequest);

// Driver cancels pending request
router.delete("/:id", requireDriverOwnership, cancelRequest);

module.exports = router;
