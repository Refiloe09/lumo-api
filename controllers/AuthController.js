import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createUserIfNotExists = async (req, res) => {
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

    res.json(user);
  } catch (error) {
    console.error("User sync error:", error);
    res.status(500).json({ error: error.message });
}
};
