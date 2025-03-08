import { Router } from "express";
import {
  confirmOrder,
  createOrder,
  getBuyerOrders,
  getSellerOrders,
  getOrder,
} from "../controllers/OrdersControllers.js";

export const orderRoutes = Router();

orderRoutes.post("/create", createOrder);
orderRoutes.put("/confirm/:orderId", confirmOrder); // Changed to PUT with orderId in URL
orderRoutes.get("/get-buyer-orders", getBuyerOrders);
orderRoutes.get("/get-seller-orders", getSellerOrders);
orderRoutes.get("/:orderId", getOrder);