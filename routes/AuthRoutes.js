import { Router } from "express";
import { requireAuth } from "@clerk/express";
import { createUserIfNotExists } from "../controllers/AuthController.js";

const authRoutes = Router();


authRoutes.post("/sync-user", requireAuth(), createUserIfNotExists);

export default authRoutes;