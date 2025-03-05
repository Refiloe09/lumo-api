import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from "./routes/AuthRoutes.js";
import cookieParser from "cookie-parser";
import { serviceRoutes } from "./routes/ServicesRoutes.js";
import { orderRoutes } from "./routes/OrderRoutes.js";
import { messageRoutes } from "./routes/MessageRoutes.js";
import { dashboardRoutes } from "./routes/DashboardRoutes.js";
import { requireAuth } from '@clerk/express';

dotenv.config();

const app = express();

const port = process.env.PORT || 3000;

app.use(cors({ origin: [process.env.CORS_ORIGIN], 
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
 }));

 
 app.use("/uploads", express.static("uploads"));
app.use(cookieParser());
app.use(express.json());

// Instead, protect only specific routes in route files
app.use("/api/users", authRoutes);
app.use("/api/services", requireAuth(), serviceRoutes);
app.use("/api/orders", requireAuth(), orderRoutes);
app.use("/api/messages", requireAuth(), messageRoutes);
app.use("/api/dashboard", requireAuth(), dashboardRoutes);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
