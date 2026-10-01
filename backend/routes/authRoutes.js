const express = require("express");
const router = express.Router();
const { register, login, getMe } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const { validateAuthInput } = require("../middleware/validationMiddleware");

router.post("/register", validateAuthInput(true), register);
router.post("/login", validateAuthInput(false), login);
router.get("/me", authMiddleware, getMe);

module.exports = router;
