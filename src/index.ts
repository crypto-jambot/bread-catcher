import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { router } from "./routes/router";
const app = express();
const port = process.env.PORT || 3000;
app.use(bodyParser.json({ limit: Infinity }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use("/", router);
app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});