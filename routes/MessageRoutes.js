import { Router } from "express";

import {
  addMessage,
  getMessages,
  getUnreadMessages,
  markAsRead,
} from "../controllers/MessageController.js";

export const messageRoutes = Router();

messageRoutes.post("/add-message/:orderId", addMessage);
messageRoutes.get("/get-messages/:orderId", getMessages);
messageRoutes.get("/unread-messages", getUnreadMessages);
messageRoutes.put("/mark-as-read/:messageId", markAsRead);