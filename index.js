import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from "./routes/AuthRoutes.js";
import cookieParser from "cookie-parser";
import { serviceRoutes } from "./routes/ServicesRoutes.js";
import { orderRoutes } from "./routes/OrderRoutes.js";
import { messageRoutes } from "./routes/MessageRoutes.js";
import { dashboardRoutes } from "./routes/DashboardRoutes.js";
// import { clerkMiddleware ,requireAuth } from '@clerk/express';

dotenv.config();

const app = express();

const port = process.env.PORT || 3000;

console.log("Applying CORS middleware");
app.use(cors({ origin: [process.env.CORS_ORIGIN], 
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
 }));

 

app.use(cookieParser());
app.use(express.json());
console.log("Applying Clerk middleware");
// app.use(clerkMiddleware());
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });


// Instead, protect only specific routes in route files
app.use("/api/users", authRoutes);
app.use("/api/services", /*requireAuth(),*/ serviceRoutes);
app.use("/api/orders",/*requireAuth(),*/  orderRoutes);
app.use("/api/messages",/*requireAuth(),*/  messageRoutes);
app.use("/api/dashboard", /*requireAuth(),*/ dashboardRoutes);

app.get('/', (req, res) => {
    res.status(200).json({ message: 'API is running' });
  });

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Global error handler triggered:", err.stack);
    res.status(500).send("Something went wrong!");
  });

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
