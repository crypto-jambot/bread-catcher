import { Router } from "express";
import { pubsubRouter } from "./pubsub";

export const router = Router();

router.use("/", pubsubRouter);
