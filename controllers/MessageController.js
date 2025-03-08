import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient(); // ✅ Reuse Prisma instance

export const addMessage = async (req, res, next) => {
  try {
    if (!req.auth.userId || !req.body.recipientId || !req.params.orderId || !req.body.message) {
      return res.status(400).send("userId, recipientId, orderId, and message are required.");
    }

    // ✅ Fetch sender's correct user ID
    const sender = await prisma.user.findUnique({
      where: { clerkUserId: req.auth.userId },
    });

    if (!sender) {
      return res.status(400).send("Sender not found.");
    }

    const message = await prisma.message.create({
      data: {
        sender: { connect: { id: sender.id } }, // ✅ Connect using correct user ID
        recipient: { connect: { id: parseInt(req.body.recipientId) } },
        order: { connect: { id: parseInt(req.params.orderId) } },
        text: req.body.message,
      },
    });

    return res.status(201).json({ message });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
};

export const getMessages = async (req, res, next) => {
  try {
    if (!req.params.orderId || !req.auth.userId) {
      return res.status(400).send("Order id is required.");
    }

    // ✅ Fetch correct user ID
    const user = await prisma.user.findUnique({
      where: { clerkUserId: req.auth.userId },
    });

    if (!user) {
      return res.status(400).send("User not found.");
    }

    const messages = await prisma.message.findMany({
      where: { order: { id: parseInt(req.params.orderId) } },
      orderBy: { createdAt: "asc" },
    });

    await prisma.message.updateMany({
      where: { orderId: parseInt(req.params.orderId), recipientId: user.id },
      data: { isRead: true },
    });

    const order = await prisma.orders.findUnique({
      where: { id: parseInt(req.params.orderId) },
      include: { services: true },
    });

    if (!order) {
      return res.status(404).send("Order not found.");
    }

    let recipientId;
    if (order.buyerId === user.id) {
      recipientId = order.services.userId;
    } else if (order.services.userId === user.id) {
      recipientId = order.buyerId;
    }

    return res.status(200).json({ messages, recipientId });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
};

export const getUnreadMessages = async (req, res, next) => {
  try {
    if (!req.auth.userId) {
      return res.status(400).send("User id is required.");
    }

    // ✅ Fetch correct user ID
    const user = await prisma.user.findUnique({
      where: { clerkUserId: req.auth.userId },
    });

    if (!user) {
      return res.status(400).send("User not found.");
    }

    const messages = await prisma.message.findMany({
      where: { recipientId: user.id, isRead: false },
      include: { sender: true },
    });

    return res.status(200).json({ messages });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    if (!req.auth.userId || !req.params.messageId) {
      return res.status(400).send("User id and message Id are required.");
    }

    // ✅ Fetch correct user ID
    const user = await prisma.user.findUnique({
      where: { clerkUserId: req.auth.userId },
    });

    if (!user) {
      return res.status(400).send("User not found.");
    }

    await prisma.message.update({
      where: { id: parseInt(req.params.messageId) },
      data: { isRead: true },
    });

    return res.status(200).send("Message marked as read.");
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
};
