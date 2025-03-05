import { PrismaClient } from "@prisma/client";
import { existsSync, renameSync, unlinkSync } from "fs";

const prisma = new PrismaClient(); // ✅ Create a single Prisma instance

export const addService = async (req, res, next) => {
  try {
    if (req.files) {
      const fileKeys = Object.keys(req.files);
      const fileNames = [];
      fileKeys.forEach((file) => {
        const date = Date.now();
        renameSync(
          req.files[file].path,
          "uploads/" + date + req.files[file].originalname
        );
        fileNames.push(date + req.files[file].originalname);
      });

      if (req.query) {
        const {
          title,
          description,
          category,
          features,
          price,
          revisions,
          time,
          shortDesc,
        } = req.query;

        // ✅ Fetch correct user ID from Clerk User
        const user = await prisma.user.findUnique({
          where: { clerkUserId: req.auth.userId }, // ✅ Correct lookup
        });

        if (!user) {
          return res.status(400).send("User not found.");
        }

        await prisma.services.create({
          data: {
            title,
            description,
            deliveryTime: parseInt(time),
            category,
            features,
            price: parseInt(price),
            shortDesc,
            revisions: parseInt(revisions),
            createdBy: { connect: { id: user.id } }, // ✅ Connect using DB ID
            images: fileNames,
          },
        });

        return res.status(201).send("Successfully created the service.");
      }
    }
    return res.status(400).send("All properties should be required.");
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
};

export const getUserAuthServices = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkUserId: req.auth.userId }, // ✅ Correct lookup
      include: { services: true },
    });

    if (!user) {
      return res.status(400).send("User not found.");
    }

    return res.status(200).json({ services: user.services });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
};

export const getServiceData = async (req, res, next) => {
  try {
    const service = await prisma.services.findUnique({
      where: { id: parseInt(req.params.serviceId) },
      include: {
        reviews: {
          include: {
            reviewer: true,
          },
        },
        createdBy: true,
      },
    });

    if (!service) {
      return res.status(404).send("Service not found.");
    }

    const userWithServices = await prisma.user.findUnique({
      where: { id: service.createdBy.id },
      include: {
        services: {
          include: { reviews: true },
        },
      },
    });

    const totalReviews = userWithServices.services.reduce(
      (acc, service) => acc + service.reviews.length,
      0
    );

    const averageRating = (
      userWithServices.services.reduce(
        (acc, service) =>
          acc + service.reviews.reduce((sum, review) => sum + review.rating, 0),
        0
      ) / totalReviews
    ).toFixed(1);

    return res
      .status(200)
      .json({ service: { ...service, totalReviews, averageRating } });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
};

export const editService = async (req, res, next) => {
  try {
    if (req.files) {
      const fileKeys = Object.keys(req.files);
      const fileNames = [];
      fileKeys.forEach((file) => {
        const date = Date.now();
        renameSync(
          req.files[file].path,
          "uploads/" + date + req.files[file].originalname
        );
        fileNames.push(date + req.files[file].originalname);
      });

      const { title, description, category, features, price, revisions, time, shortDesc } = req.query;

      // ✅ Fetch correct user ID
      const user = await prisma.user.findUnique({
        where: { clerkUserId: req.auth.userId }, // ✅ Correct lookup
      });

      if (!user) {
        return res.status(400).send("User not found.");
      }

      const oldData = await prisma.services.findUnique({
        where: { id: parseInt(req.params.serviceId) },
      });

      await prisma.services.update({
        where: { id: parseInt(req.params.serviceId) },
        data: {
          title,
          description,
          deliveryTime: parseInt(time),
          category,
          features,
          price: parseInt(price),
          shortDesc,
          revisions: parseInt(revisions),
          createdBy: { connect: { id: user.id } }, // ✅ Correct reference
          images: fileNames,
        },
      });

      oldData?.images.forEach((image) => {
        if (existsSync(`uploads/${image}`)) unlinkSync(`uploads/${image}`);
      });

      return res.status(201).send("Successfully edited the service.");
    }

    return res.status(400).send("All properties should be required.");
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
};

export const searchServices = async (req, res, next) => {
  try {
    const services = await prisma.services.findMany(
      createSearchQuery(req.query.searchTerm, req.query.category)
    );

    return res.status(200).json({ services });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
};

const createSearchQuery = (searchTerm, category) => ({
  where: {
    OR: [
      searchTerm ? { title: { contains: searchTerm, mode: "insensitive" } } : {},
      category ? { category: { contains: category, mode: "insensitive" } } : {},
    ],
  },
  include: {
    reviews: { include: { reviewer: true } },
    createdBy: true,
  },
});

const checkOrder = async (userId, gigId) => {
  try {
    const prisma = new PrismaClient();
    const hasUserOrderedGig = await prisma.orders.findFirst({
      where: {
        buyerId: parseInt(userId),
        gigId: parseInt(gigId),
        isCompleted: true,
      },
    });
    return hasUserOrderedGig;
  } catch (err) {
    console.log(err);
  }
};

export const checkServiceOrder = async (req, res, next) => {
  try {
    if (req.userId && req.params.serviceId) {
      const hasUserOrderedService = await checkOrder(req.userId, req.params.serviceId);
      return res
        .status(200)
        .json({ hasUserOrderedService: hasUserOrderedService ? true : false });
    }
    return res.status(400).send("userId and serviceId is required.");
  } catch (err) {
    console.log(err);
    return res.status(500).send("Internal Server Error");
  }
};

export const addReview = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkUserId: req.auth.userId }, // ✅ Correct lookup
    });

    if (!user) {
      return res.status(400).send("User not found.");
    }

    if (!(await checkOrder(user.id, req.params.serviceId))) {
      return res.status(400).send("You need to purchase the service to add a review.");
    }

    const { reviewText, rating } = req.body;
    if (!reviewText || !rating) {
      return res.status(400).send("ReviewText and Rating are required.");
    }

    const newReview = await prisma.reviews.create({
      data: {
        rating,
        reviewText,
        reviewer: { connect: { id: user.id } },
        services: { connect: { id: parseInt(req.params.serviceId) } },
      },
      include: { reviewer: true },
    });

    return res.status(201).json({ newReview });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
};
