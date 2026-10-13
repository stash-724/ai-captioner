// src/routes/user.routes.js
import { Router } from "express";
import { registerUser, loginUser, deleteAccount } from "../controllers/user.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

// Register
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);

// Delete own account (and posts)
router.delete("/me", protect, deleteAccount);

export default router;
