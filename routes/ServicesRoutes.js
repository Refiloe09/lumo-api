import { Router } from "express";
import {
  addService,
  checkServiceOrder,
  editService,
  getServiceData,
  getUserAuthServices,
  searchServices,
  addReview,
} from "../controllers/ServicesController.js";
import multer from "multer";


const upload = multer({ dest: "uploads/" });

export const serviceRoutes = Router();

serviceRoutes.post("/add", upload.array("images"), addService);
serviceRoutes.get("/get-user-services", getUserAuthServices);
serviceRoutes.get("/get-service-data/:serviceId", getServiceData);
serviceRoutes.put("/edit-service/:serviceId",  upload.array("images"), editService);
serviceRoutes.get("/search-services", searchServices);
serviceRoutes.post("/add-review",  addReview);
serviceRoutes.get("/check-service-order/:serviceId",  checkServiceOrder);
serviceRoutes.post("/add-review/:serviceId", addReview);