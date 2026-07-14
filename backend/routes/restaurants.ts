import { Router } from "express";

import prisma from "../src/db/prisma";

import type { Prisma } from "@prisma/client";

import { v2 as cloudinary } from "cloudinary";

import multer from "multer";

import { unlink } from "node:fs/promises";

const upload = multer({ dest: "uploads/" });

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
  totalAmountPaid?: number | string | null;
  dishName?: string | null;
  dishRating?: number | string | null;
  dishNotes?: string | null;
  wouldEatAgain?: boolean | string | null;
  visitNotes?: string | null;
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

function parseOptionalAmount(value: RestaurantPayload["totalAmountPaid"]) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const amount = Number(value);

  if (!Number.isFinite(amount) || amount < 0) {
    throw new BadRequestError("Amount paid must be 0 or greater.");
  }

  return amount;
}

function parseOptionalBoolean(value: RestaurantPayload["wouldEatAgain"]) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw new BadRequestError("Invalid boolean value.");
}

function parseOptionalString(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function getQueryString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

const cloudinaryFolderName =
  process.env.NODE_ENV === "production" ? "prod" : "dev";

type ImagesDataType = {
  fieldname?: string;
  originalname?: string;
  encoding?: string;
  mimetype?: string;
  path?: string;
  destination?: string;
  filename?: string;
  size?: Number;
};

type ImagesDataMapType = Record<string, ImagesDataType[]>;

router.post("/", upload.single("bannerImage"), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    let bannerImageUrl: string | undefined;
    let bannerImagePublicId: string | undefined;

    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        asset_folder: `bite-diary/${cloudinaryFolderName}/restaurants`,
        public_id: `${req.user.id}-${Date.now()}`,
      });

      bannerImageUrl = uploadResult.secure_url;
      bannerImagePublicId = uploadResult.public_id;

      await unlink(req.file.path);
    }

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
      dishName,
      dishRating,
      dishNotes,
      wouldEatAgain,
      totalAmountPaid,
      visitNotes,
    } = req.body as RestaurantPayload;

    if (!name) {
      return res.status(400).json({
        message: "Restaurant name is required",
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
        bannerImageUrl,
        bannerImagePublicId,
        userId: req.user.id,
      },
    });

    const parsedRating = parseOptionalRating(rating);
    const parsedVisitedAt = parseOptionalDate(visitedAt);
    const parsedTotalAmountPaid = parseOptionalAmount(totalAmountPaid);
    const parsedDishRating = parseOptionalRating(dishRating);
    const parsedWouldEatAgain = parseOptionalBoolean(wouldEatAgain);
    const parsedDishName = parseOptionalString(dishName);
    const parsedDishNotes = parseOptionalString(dishNotes);

    const visit = await prisma.restaurantVisit.create({
      data: {
        visitNotes,
        rating: parsedRating,
        visitedAt: parsedVisitedAt,
        totalAmountPaid: parsedTotalAmountPaid,
        restaurantId: restaurant.id,
        userId: req.user.id,
      },
      include: {
        dishes: true,
      },
    });

    if (visit && parsedDishName) {
      const dish = await prisma.dish.create({
        data: {
          name: parsedDishName,
          rating: parsedDishRating,
          notes: parsedDishNotes,
          wouldEatAgain: parsedWouldEatAgain,

          restaurantVisitId: visit.id,
        },
      });
    }

    return res.status(201).json({
      message: "Restaurant and first visit created successfully",
      data: {
        ...restaurant,
        bannerImagePublicId,
        bannerImageUrl,
      },
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

router.patch(
  "/:restaurantId",
  upload.single("bannerImage"),
  async (req, res) => {
    try {
      if (!req.user) {
        if (req.file) {
          await unlink(req.file.path);
        }

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
        if (req.file) {
          await unlink(req.file.path);
        }

        return res.status(400).json({
          message: "Restaurant name is required",
        });
      }

      const existingRestaurant = await prisma.restaurant.findFirst({
        where: {
          id: req.params.restaurantId,
          userId: req.user.id,
        },
      });

      if (!existingRestaurant) {
        if (req.file) {
          await unlink(req.file.path);
        }

        return res.status(404).json({
          message: "Restaurant not found",
        });
      }

      // const parsedRating = parseNullableRating(rating);
      // const parsedVisitedAt = parseNullableDate(visitedAt);

      let bannerImageUrl: string | undefined;
      let bannerImagePublicId: string | undefined;

      const cloudinaryFolderName =
        process.env.NODE_ENV === "production" ? "prod" : "dev";

      if (req.file) {
        const uploadResult = await cloudinary.uploader.upload(req.file.path, {
          asset_folder: `bite-diary/${cloudinaryFolderName}/restaurants`,
          public_id: `${req.user.id}-${Date.now()}`,
        });

        bannerImageUrl = uploadResult.secure_url;
        bannerImagePublicId = uploadResult.public_id;

        await unlink(req.file.path);
      }

      const restaurant = await prisma.restaurant.update({
        where: {
          id: existingRestaurant.id,
        },
        data: {
          name,
          cuisine,
          city,
          state,
          country,
          address,
          notes,
          ...(bannerImageUrl && bannerImagePublicId
            ? {
                bannerImagePublicId,
                bannerImageUrl,
              }
            : {}),
          // rating: parsedRating,
          // visitedAt: parsedVisitedAt,
        },
      });

      if (bannerImagePublicId && existingRestaurant.bannerImagePublicId) {
        await cloudinary.uploader.destroy(
          existingRestaurant.bannerImagePublicId,
        );
      }

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
  },
);

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

router.get("/:restaurantId/visits", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const visits = await prisma.restaurantVisit.findMany({
      where: {
        restaurantId: req.params.restaurantId,
        userId: req.user.id,
      },
      include: {
        dishes: {
          include: {
            dishImages: true,
          },
        },
      },
      orderBy: [{ visitedAt: "desc" }],
    });

    return res.status(200).json({
      message: "Successfully fetched all visits",
      visits,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong",
      error: errorMessage(error),
    });
  }
});

router.post("/:restaurantId/visits", upload.any(), async (req, res) => {
  const restaurantId = req.params.restaurantId;
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!restaurantId) {
      return res.status(404).json({
        message: "Restaurant id is needed.",
      });
    }

    const {
      visitNotes,
      rating,
      visitedAt,
      totalAmountPaid,
      dishName,
      dishRating,
      dishNotes,
      wouldEatAgain,
      dishList,
    } = req.body;

    const { dishImages } = req?.files;

    let imagesDataMap: ImagesDataMapType = {};

    if (req.files) {
      const seen = new Set();
      (req?.files || [])?.forEach((imageData) => {
        const id = imageData.fieldname.split("^")?.[1];
        seen.has(id)
          ? imagesDataMap[id].push(imageData)
          : (imagesDataMap[id] = [imageData]);

        seen.add(id);
      });
    }

    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id: restaurantId,
        userId: req.user?.id,
      },
    });

    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found",
      });
    }

    const createDishImageArray = async (imageList) => {
      const dishImagesCloudinaryUrl = [];

      for (const image of imageList) {
        try {
          const uploadResult = await cloudinary.uploader.upload(image.path, {
            asset_folder: `bite-diary/${cloudinaryFolderName}/dishes`,
            public_id: `${image.fieldname.split("^")[1]}-${Date.now()}`,
          });

          dishImagesCloudinaryUrl.push({
            dishImageUrl: uploadResult.secure_url,
            dishImagePublicUrl: uploadResult.public_id,
          });
        } finally {
          try {
            await unlink(image.path);
          } catch (deleteError: any) {
            if (deleteError.code !== "ENOENT") {
              console.error(
                "Failed to delete temporary image:",
                image.path,
                deleteError,
              );
            }
          }
        }
      }

      return dishImagesCloudinaryUrl;
    };

    const visit = await prisma.restaurantVisit.create({
      data: {
        visitNotes,
        rating: parseOptionalRating(rating),
        visitedAt: parseOptionalDate(visitedAt),
        totalAmountPaid: parseOptionalAmount(totalAmountPaid),
        restaurantId,
        userId: req.user.id,
        dishes: {
          create: await Promise.all(
            JSON.parse(dishList).map(async (dish) => {
              return {
                name: parseOptionalString(dish?.name),
                rating: parseOptionalRating(dish?.rating),
                // price         ,
                notes: parseOptionalString(dish?.notes),
                wouldEatAgain: dish?.wouldEatAgain,

                // dishImages: dishImagesData(dish)),
                dishImages: {
                  create: await createDishImageArray(imagesDataMap[dish.id]),
                },
              };
            }),
          ),
        },
      },
      include: {
        dishes: {
          include: {
            dishImages: true,
          },
        },
      },
    });

    // const parsedDishName = parseOptionalString(dishName);
    // const parsedDishNotes = parseOptionalString(dishNotes);

    // if (visit && parsedDishName) {
    //   const dish = await prisma.dish.create({
    //     data: {
    //       name: parsedDishName,
    //       rating: parseOptionalRating(dishRating),
    //       notes: parsedDishNotes,
    //       wouldEatAgain: parseOptionalBoolean(wouldEatAgain),

    //       restaurantVisitId: visit.id,
    //     },
    //   });
    // }

    return res.status(201).json({
      message: "Visit created successfully",
      data: visit,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong",
      error: errorMessage(error),
    });
  }
});

export default router;
