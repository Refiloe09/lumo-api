import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createOrder = async (req, res, next) => {
  try {
    if (!req.body.serviceId) {
      return res.status(400).send("Service ID is required.");
    }

    const { serviceId } = req.body;

    const user = await prisma.user.findUnique({
      where: { clerkUserId: req.auth.userId },
    });

    if (!user) {
      return res.status(400).send("User not found.");
    }

    const service = await prisma.services.findUnique({
      where: { id: parseInt(serviceId) },
    });

    if (!service) {
      return res.status(400).send("Service not found.");
    }

    const order = await prisma.orders.create({
      data: {
        price: service.price,
        buyer: { connect: { id: user.id } },
        services: { connect: { id: service.id } },
        isCompleted: false, // Initially incomplete until confirmed
      },
    });

    return res.status(200).json({
      orderId: order.id, // Return the order ID instead of clientSecret
    });
  } catch (err) {
    console.error("Error creating order:", err);
    return res.status(500).send("Internal Server Error");
  }
};

export const confirmOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params; // Changed to use URL parameter
    const { contactEmail, contactPhone, notes } = req.body;

    if (!orderId || !contactEmail) {
      return res.status(400).send("Order ID and contact email are required.");
    }

    const order = await prisma.orders.update({
      where: { id: parseInt(orderId) },
      data: {
        isCompleted: true,
        contactEmail, // New fields to store contact info
        contactPhone,
        notes,
      },
      include: {
        services: true,
        buyer: true,
      },
    });

    return res.status(200).json({
      message: "Order confirmed",
      order: {
        id: order.id,
        serviceId: order.services.id,
        price: order.price,
        contactEmail: order.contactEmail,
        contactPhone: order.contactPhone,
        notes: order.notes,
      },
    });
  } catch (err) {
    console.error("Error confirming order:", err);
    return res.status(500).send("Internal Server Error");
  }
};

export const getBuyerOrders = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkUserId: req.auth.userId },
    });

    if (!user) {
      return res.status(400).send("User not found.");
    }

    const orders = await prisma.orders.findMany({
      where: { buyerId: user.id, isCompleted: true },
      include: { services: true },
    });

    return res.status(200).json({ orders });
  } catch (err) {
    console.error("Error fetching buyer orders:", err);
    return res.status(500).send("Internal Server Error");
  }
};

export const getSellerOrders = async (req, res, next) => {
  try {
    const seller = await prisma.user.findUnique({
      where: { clerkUserId: req.auth.userId },
    });

    if (!seller) {
      return res.status(400).send("Seller not found.");
    }

    const orders = await prisma.orders.findMany({
      where: {
        service: {
          createdBy: { id: seller.id },
        },
        isCompleted: true,
      },
      include: {
        service: true,
        buyer: true,
      },
    });

    return res.status(200).json({ orders });
  } catch (err) {
    console.error("Error fetching seller orders:", err);
    return res.status(500).send("Internal Server Error");
  }
};

export const getOrder = async (req, res, next) => {
  try {
    const order = await prisma.orders.findUnique({
      where: { id: parseInt(req.params.orderId) },
      include: {
        services: true,
        buyer: true,
      },
    });

    if (!order) {
      return res.status(404).send("Order not found.");
    }

    return res.status(200).json({
      order: {
        id: order.id,
        serviceId: order.serviceId,
        price: order.price,
        contactEmail: order.contactEmail,
        contactPhone: order.contactPhone,
        notes: order.notes,
      },
    });
  } catch (err) {
    console.error("Error fetching order:", err);
    return res.status(500).send("Internal Server Error");
  }
};