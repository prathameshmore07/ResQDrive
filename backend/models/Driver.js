const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const driverSchema = new mongoose.Schema(
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
            trim: true
        },
        vehicle: {
            make: { type: String, default: "" },
            model: { type: String, default: "" },
            licensePlate: { type: String, default: "" }
        },
        role: {
            type: String,
            default: "driver",
            enum: ["driver"]
        }
    },
    {
        timestamps: true
    }
);

// Hash password before saving
driverSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
driverSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Driver", driverSchema);
