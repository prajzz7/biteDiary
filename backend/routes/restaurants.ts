import { Router } from "express";

import prisma from "../src/db/prisma";

import type { Prisma } from "@prisma/client";

const router = Router();

class BadRequestError extends Error {}

type RestaurantPayload = {
  name?: string;
  cuisine?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  address?: string | null;
  notes?: string | null;
  rating?: number | string | null;
  visitedAt?: string | Date | null;
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

function parseNullableDate(value: RestaurantPayload["visitedAt"]) {
  if (value === null || value === "") {
    return null;
  }

  return parseOptionalDate(value);
}

function parseNullableRating(value: RestaurantPayload["rating"]) {
  if (value === null || value === "") {
    return null;
  }

  return parseOptionalRating(value);
}

function parseOptionalRating(value: RestaurantPayload["rating"]) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const rating = Number(value);

  if (
    !Number.isFinite(rating) ||
    rating < 0 ||
    rating > 10 ||
    !Number.isInteger(rating * 2)
  ) {
    throw new BadRequestError("Rating must be between 0 and 10 in 0.5 steps.");
  }

  return rating;
}

function getQueryString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

router.post("/", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const {
      name,
      cuisine,
      city,
      state,
      country,
      address,
      notes,
      // rating,
      // visitedAt,
    } = req.body as RestaurantPayload;

    if (!name) {
      return res.status(400).json({
        message: "Restaurant name is required",
      });
    }

    // const parsedRating = parseOptionalRating(rating);

    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        cuisine,
        city,
        state,
        country,
        address,
        notes,
        // rating: parsedRating,
        // visitedAt: parseOptionalDate(visitedAt),
        userId: req.user.id,
      },
    });

    return res.status(201).json({
      message: "Restaurant created successfully",
      data: restaurant,
    });
  } catch (error) {
    if (error instanceof BadRequestError) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Something went wrong",
      error: errorMessage(error),
    });
  }
});

router.patch("/:restaurantId", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const {
      name,
      cuisine,
      city,
      state,
      country,
      address,
      notes,
      // rating,
      // visitedAt,
    } = req.body as RestaurantPayload;

    const existingRestaurant = await prisma.restaurant.findFirst({
      where: {
        id: req.params.restaurantId,
        userId: req.user.id,
      },
    });

    if (!existingRestaurant) {
      return res.status(404).json({
        message: "Restaurant not found",
      });
    }

    // const parsedRating = parseNullableRating(rating);
    // const parsedVisitedAt = parseNullableDate(visitedAt);

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
        // rating: parsedRating,
        // visitedAt: parsedVisitedAt,
      },
    });

    res.status(200).json({
      message: "Restaurant updated successfully",
      data: restaurant,
    });
  } catch (error) {
    if (error instanceof BadRequestError) {
      return res.status(400).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Something went wrong",
      error: errorMessage(error),
    });
  }
});

/* GET All Restaurants by Users. */
router.get("/", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const search = getQueryString(req.query?.search);
    const city = getQueryString(req.query?.city);
    const cuisine = getQueryString(req.query?.cuisine);
    const rating = getQueryString(req.query?.rating);

    const where: Prisma.RestaurantWhereInput = {
      userId: req.user.id,
    };

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          cuisine: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          city: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          notes: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          address: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }
    if (city) {
      where.city = {
        equals: city,
        mode: "insensitive",
      };
    }
    if (cuisine) {
      where.cuisine = {
        equals: cuisine,
        mode: "insensitive",
      };
    }
    // if (rating) {
    //   const minRating = Number(rating);

    //   if (
    //     Number.isFinite(minRating) &&
    //     minRating >= 0 &&
    //     minRating <= 10 &&
    //     Number.isInteger(minRating * 2)
    //   ) {
    //     where.rating = {
    //       gte: minRating,
    //     };
    //   } else {
    //     return res.status(400).json({
    //       message: "Rating must be between 0 and 10 in 0.5 steps.",
    //     });
    //   }
    // }

    const restaurants = await prisma.restaurant.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
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

router.get("/filter-options", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const restaurants = await prisma.restaurant.findMany({
      where: {
        userId: req.user.id,
      },
      select: {
        city: true,
        cuisine: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const cityFilterOptions = [
      "All",
      ...new Set(
        restaurants
          .map((restaurant) => restaurant.city?.trim())
          .filter(Boolean),
      ),
    ];
    const cuisineFilterOptions = [
      "All",
      ...new Set(
        restaurants
          .map((restaurant) => restaurant.cuisine?.trim())
          .filter(Boolean),
      ),
    ];

    return res.status(200).json({
      message: "Filters fetched successfully",
      data: {
        city: cityFilterOptions,
        cuisine: cuisineFilterOptions,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong",
      error: errorMessage(error),
    });
  }
});

router.get("/:restaurantId", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id: req.params.restaurantId,
        userId: req.user.id,
      },
    });

    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found",
      });
    }

    return res.status(200).json({
      message: "Restaurant fetched successfully",
      data: restaurant,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong",
      error: errorMessage(error),
    });
  }
});

router.delete("/:restaurantId", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const existingRestaurant = await prisma.restaurant.findFirst({
      where: {
        id: req.params.restaurantId,
        userId: req.user.id,
      },
    });

    if (!existingRestaurant) {
      return res.status(404).json({
        message: "Restaurant not found",
      });
    }

    await prisma.restaurant.delete({
      where: {
        id: req.params.restaurantId,
      },
    });

    return res.status(200).json({
      message: "Restaurant deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong",
      error: errorMessage(error),
    });
  }
});

export default router;
