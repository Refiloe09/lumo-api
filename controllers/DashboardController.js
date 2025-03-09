// import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient(); // ✅ Reuse Prisma instance
import prisma from "../prisma/client.js";

export const getSellerData = async (req, res, next) => {
  try {
    if (!req.auth.userId) {
      return res.status(400).send("User id is required.");
    }

    // ✅ Fetch correct seller ID
    const seller = await prisma.user.findUnique({
      where: { clerkUserId: req.auth.userId },
    });

    if (!seller) {
      return res.status(400).send("Seller not found.");
    }

    const services = await prisma.services.count({ where: { userId: seller.id } });

    const {
      _count: { id: orders },
    } = await prisma.orders.aggregate({
      where: {
        isCompleted: true,
        service: {
          createdBy: {
            id: seller.id,
          },
        },
      },
      _count: {
        id: true,
      },
    });

    const unreadMessages = await prisma.message.count({
      where: {
        recipientId: seller.id,
        isRead: false,
      },
    });

    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisYear = new Date(today.getFullYear(), 0, 1);

    const {
      _sum: { price: revenue },
    } = await prisma.orders.aggregate({
      where: {
        service: {
          createdBy: {
            id: seller.id,
          },
        },
        isCompleted: true,
        createdAt: {
          gte: thisYear,
        },
      },
      _sum: {
        price: true,
      },
    });

    const {
      _sum: { price: dailyRevenue },
    } = await prisma.orders.aggregate({
      where: {
        service: {
          createdBy: {
            id: seller.id,
          },
        },
        isCompleted: true,
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
      _sum: {
        price: true,
      },
    });

    const {
      _sum: { price: monthlyRevenue },
    } = await prisma.orders.aggregate({
      where: {
        service: {
          createdBy: {
            id: seller.id,
          },
        },
        isCompleted: true,
        createdAt: {
          gte: thisMonth,
        },
      },
      _sum: {
        price: true,
      },
    });

    return res.status(200).json({
      dashboardData: {
        orders,
        services,
        unreadMessages,
        dailyRevenue: dailyRevenue || 0,
        monthlyRevenue: monthlyRevenue || 0,
        revenue: revenue || 0,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
};
