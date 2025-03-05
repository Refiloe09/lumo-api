import { Router } from "express";

import {
  confirmOrder,
  createOrder,
  getBuyerOrders,
  getSellerOrders,
} from "../controllers/OrdersControllers.js";

export const orderRoutes = Router();

orderRoutes.post("/create", createOrder);
orderRoutes.put("/success", confirmOrder);
orderRoutes.get("/get-buyer-orders", getBuyerOrders);
orderRoutes.get("/get-seller-orders", getSellerOrders);