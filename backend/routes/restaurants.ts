import { Router } from "express";

import prisma from "../src/db/prisma";

const router = Router();

type RestaurantPayload = {
  name?: string;
  cuisine?: string;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
  notes?: string;
  rating?: number | string | null;
  visitedAt?: string | Date | null;
  userId?: string;
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

function parseOptionalDate(value: RestaurantPayload["visitedAt"]) {
  if (!value) {
    return undefined;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function parseOptionalRating(value: RestaurantPayload["rating"]) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const rating = Number(value);
  return Number.isNaN(rating) ? undefined : rating;
}

router.post("/", async (req, res) => {
  try {
    const {
      name,
      cuisine,
      city,
      state,
      country,
      address,
      notes,
      rating,
      visitedAt,
      userId,
    } = req.body as RestaurantPayload;

    if (!name) {
      return res.status(400).json({
        message: "Restaurant name is required",
      });
    }

    if (!userId) {
      return res.status(400).json({
        message: "User Id is required",
      });
    }

    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        cuisine,
        city,
        state,
        country,
        address,
        notes,
        rating: parseOptionalRating(rating),
        visitedAt: parseOptionalDate(visitedAt),
        userId,
      },
    });

    return res.status(201).json({
      message: "Restaurant created successfully",
      data: restaurant,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong",
      error: errorMessage(error),
    });
  }
});

router.patch("/:restaurantId", async (req, res) => {
  try {
    const {
      name,
      cuisine,
      city,
      state,
      country,
      address,
      notes,
      rating,
      visitedAt,
    } = req.body as RestaurantPayload;

    const existingRestaurant = await prisma.restaurant.findUnique({
      where: {
        id: req.params.restaurantId,
      },
    });

    if (!existingRestaurant) {
      return res.status(404).json({
        message: "Restaurant not found",
      });
    }

    const restaurant = await prisma.restaurant.update({
      where: {
        id: req.params.restaurantId,
      },
      data: {
        name,
        cuisine,
        city,
        state,
        country,
        address,
        notes,
        rating: parseOptionalRating(rating),
        visitedAt: parseOptionalDate(visitedAt),
      },
    });

    res.status(200).json({
      message: "Restaurant updated successfully",
      data: restaurant,
    });
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong",
      error: errorMessage(error),
    });
  }
});

/* GET All Restaurants by Users. */
router.get("/", async (req, res) => {
  const userId =
    typeof req.query.userId === "string" ? req.query.userId : undefined;

  console.log("query userId::: ", userId);

  try {
    const restaurants = await prisma.restaurant.findMany({
      where: userId ? { userId } : undefined,
    });

    return res.status(200).json({
      message: "Restaurant fetched successfully",
      data: restaurants,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong",
      error: errorMessage(error),
    });
  }
});

export default router;
