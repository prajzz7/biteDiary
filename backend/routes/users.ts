import { Router } from "express";

const router = Router();

/* GET users listing. */
router.get("/", (_req, res) => {
  res.status(200).json({
    status: "success",
    title: "Welcome to Express JS",
  });
});

export default router;
