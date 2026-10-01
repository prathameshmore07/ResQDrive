const Provider = require("../models/Provider");

// 1. Get all available providers
const getAvailableProviders = async (req, res) => {
    try {
        const providers = await Provider.find({ isAvailable: true }).select("-password");
        return res.json({
            success: true,
            count: providers.length,
            providers
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to fetch providers"
        });
    }
};

// 2. Toggle provider availability (Online / Offline)
const updateAvailability = async (req, res) => {
    try {
        const { isAvailable } = req.body;

        const provider = await Provider.findByIdAndUpdate(
            req.user.id,
            { isAvailable },
            { new: true }
        ).select("-password");

        return res.json({
            success: true,
            message: "Availability updated successfully",
            provider
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to update availability"
        });
    }
};

// 3. Update provider location
const updateLocation = async (req, res) => {
    try {
        const { address, lat, lng } = req.body;

        const update = {};
        if (address) update["currentLocation.address"] = address;
        if (lat) update["currentLocation.lat"] = lat;
        if (lng) update["currentLocation.lng"] = lng;

        const provider = await Provider.findByIdAndUpdate(
            req.user.id,
            update,
            { new: true }
        ).select("-password");

        return res.json({
            success: true,
            message: "Location updated successfully",
            provider
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to update location"
        });
    }
};

module.exports = {
    getAvailableProviders,
    updateAvailability,
    updateLocation
};
