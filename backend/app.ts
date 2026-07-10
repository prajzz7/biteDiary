import "dotenv/config";

import createError from "http-errors";
import express, { type ErrorRequestHandler } from "express";
import path from "path";
import cookieParser from "cookie-parser";
import cors from "cors";
import logger from "morgan";

import indexRouter from "./routes/index";
import usersRouter from "./routes/users";
import restaurantsRouter from "./routes/restaurants";
import authRouter from "./routes/auth";
import authMiddleware from "./middleware/authMiddleware";

import { v2 as cloudinary } from "cloudinary";

const app = express();

app.set("trust proxy", 1);

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// view engine setup
app.set("views", path.join(process.cwd(), "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(process.cwd(), "public")));

app.use("/", indexRouter);
app.use("/api", authRouter);
app.use("/users", usersRouter);
app.use("/api/restaurants", authMiddleware, restaurantsRouter);

// catch 404 and forward to error handler
app.use((_req, _res, next) => {
  next(createError(404));
});

// error handler
const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
};

app.use(errorHandler);

export default app;
