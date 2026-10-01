const express = require("express");
const router = express.Router();
const {
    getAvailableProviders,
    updateAvailability,
    updateLocation
} = require("../controllers/providerController");

const authMiddleware = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");

router.use(authMiddleware);

// Get list of available providers
router.get("/available", getAvailableProviders);

// Provider toggle availability (Available / Offline)
router.patch("/availability", requireRole("provider"), updateAvailability);

// Provider updates location
router.patch("/location", requireRole("provider"), updateLocation);

module.exports = router;
