// import { PrismaClient } from "@prisma/client";
import prisma from "../prisma/client.js";

// const prisma = new PrismaClient();

export const createUserIfNotExists = async (req, res) => {
  console.log('createUserIfNotExists called with:', req.body);
  try {
    
    const { userId, email } = req.body; // Clerk User ID

    if (!userId || !email) {
      console.error("❌ Missing userId or email:", { userId, email });
      return res.status(400).json({ error: "userId and email are required" });
    }

    let user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { 
          clerkUserId: userId,  // 🔥 FIXED: Explicitly pass `clerkUserId`
          email,
        },
      });
    }
    console.log('User sync attempt for:', { userId, email });
    res.json(user);
  } catch (error) {
    console.error("User sync error:", error);
    res.status(500).json({ error: error.message });
}
};
