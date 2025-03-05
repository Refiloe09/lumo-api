import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";

const prisma = new PrismaClient(); // ✅ Reuse Prisma instance
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // ✅ Use env variable for security

export const createOrder = async (req, res, next) => {
  try {
    if (!req.body.serviceId) {
      return res.status(400).send("Service ID is required.");
    }

    const { serviceId } = req.body;

    // ✅ Fetch correct user ID
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

    // ✅ Use Stripe Secret from Environment Variables
    const paymentIntent = await stripe.paymentIntents.create({
      amount: service.price * 100, // Convert to cents
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
    });

    await prisma.orders.create({
      data: {
        paymentIntent: paymentIntent.id,
        price: service.price,
        buyer: { connect: { id: user.id } }, // ✅ Connect using correct user ID
        service: { connect: { id: service.id } },
      },
    });

    return res.status(200).send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
};

export const confirmOrder = async (req, res, next) => {
  try {
    if (!req.body.paymentIntent) {
      return res.status(400).send("Payment Intent is required.");
    }

    await prisma.orders.update({
      where: { paymentIntent: req.body.paymentIntent },
      data: { isCompleted: true },
    });

    return res.status(200).json({ message: "Order confirmed" }); // ✅ Return success response
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
};

export const getBuyerOrders = async (req, res, next) => {
  try {
    // ✅ Fetch user by Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkUserId: req.auth.userId },
    });

    if (!user) {
      return res.status(400).send("User not found.");
    }

    const orders = await prisma.orders.findMany({
      where: { service: {createdBy:{ id: user.id,}, }, isCompleted: true, },
      include: { service: true },
    });

    return res.status(200).json({ orders });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
};

export const getSellerOrders = async (req, res, next) => {
  try {
    // ✅ Fetch seller's ID from Prisma
    const seller = await prisma.user.findUnique({
      where: { clerkUserId: req.auth.userId },
    });

    if (!seller) {
      return res.status(400).send("Seller not found.");
    }

    const orders = await prisma.orders.findMany({
      where: {
        service: {
          createdBy: {
            id: seller.id, // ✅ Use correct seller ID
          },
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
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
};
