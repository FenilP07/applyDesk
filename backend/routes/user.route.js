import express from "express";
import rateLimit from "express-rate-limit";
import {
  googleSignIn,
  refresh,
  logout,
  me,
} from "../controllers/user.controller.js";
import { isLoggedIn } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/google", googleSignIn);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", isLoggedIn, me);


export default router;
