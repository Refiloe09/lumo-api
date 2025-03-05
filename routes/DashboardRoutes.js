import { Router } from "express";

import { getSellerData } from "../controllers/DashboardController.js";

export const dashboardRoutes = Router();

dashboardRoutes.get("/seller", getSellerData);