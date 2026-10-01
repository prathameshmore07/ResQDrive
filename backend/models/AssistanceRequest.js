const mongoose = require("mongoose");

const assistanceRequestSchema = new mongoose.Schema(
    {
        driver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Driver",
            required: [true, "Driver reference is required"]
        },
        provider: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Provider",
            default: null
        },
        issueType: {
            type: String,
            required: [true, "Issue type is required"],
            enum: {
                values: [
                    "FLAT_TIRE",
                    "BATTERY_DEAD",
                    "ENGINE_FAILURE",
                    "FUEL_DELIVERY",
                    "TOWING",
                    "LOCK_OUT",
                    "OTHER"
                ],
                message: "{VALUE} is not a valid issue type"
            }
        },
        location: {
            address: {
                type: String,
                required: [true, "Location address is required"],
                trim: true
            },
            city: {
                type: String,
                default: "",
                trim: true
            },
            lat: {
                type: Number,
                default: null
            },
            lng: {
                type: Number,
                default: null
            }
        },
        description: {
            type: String,
            default: "",
            trim: true
        },
        vehicleDetails: {
            make: { type: String, default: "" },
            model: { type: String, default: "" },
            licensePlate: { type: String, default: "" }
        },
        status: {
            type: String,
            enum: ["PENDING", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
            default: "PENDING"
        },
        statusHistory: [
            {
                status: {
                    type: String,
                    required: true
                },
                timestamp: {
                    type: Date,
                    default: Date.now
                },
                updatedByRole: {
                    type: String,
                    enum: ["driver", "provider", "system"]
                },
                updatedById: {
                    type: mongoose.Schema.Types.ObjectId
                },
                note: {
                    type: String,
                    default: ""
                }
            }
        ]
    },
    {
        timestamps: true
    }
);

// Helpful index for fast queries on driver, provider, and status
assistanceRequestSchema.index({ driver: 1, createdAt: -1 });
assistanceRequestSchema.index({ provider: 1, status: 1 });

module.exports = mongoose.model("AssistanceRequest", assistanceRequestSchema);
