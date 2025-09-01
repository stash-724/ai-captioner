// src/routes/user.routes.js
import { Router } from "express";
import { registerUser, loginUser } from "../controllers/user.controller.js";

const router = Router();

// Register
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);

export default router;
