const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const providerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: 6
        },
        phone: {
            type: String,
            required: [true, "Phone number is required"],
            trim: true,
            maxlength: 10
        },
        serviceType: {
            type: String,
            enum: [
                "TOWING",
                "TIRE",
                "TIRE_REPAIR",
                "BATTERY",
                "BATTERY_SERVICE",
                "LOCKOUT",
                "LOCK_OUT",
                "FUEL",
                "FUEL_DELIVERY",
                "MECHANIC",
                "MECHANICAL",
                "ALL_ROUNDER"
            ],
            default: "ALL_ROUNDER"
        },
        isAvailable: {
            type: Boolean,
            default: true
        },
        currentLocation: {
            address: { type: String, default: "Kharghar Highway Hub, Sector 4, Kharghar, Navi Mumbai" },
            lat: { type: Number, default: 19.0337 },
            lng: { type: Number, default: 73.0645 }
        },
        role: {
            type: String,
            default: "provider",
            enum: ["provider"]
        }
    },
    {
        timestamps: true
    }
);

// Hash password before saving
providerSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
providerSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Provider", providerSchema);
