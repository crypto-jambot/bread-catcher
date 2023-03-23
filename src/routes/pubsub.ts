import { Router } from "express";
import { parseMessage } from "../utils/pubsubUtils";
import { sendBundle } from "../utils/requestUtils";
import { FlashbotsTransactionResolution } from "@flashbots/ethers-provider-bundle";

export const pubsubRouter = Router();

pubsubRouter.post("/", async (req, res, next) => {
    const data = parseMessage(req, res);
    if (!data) return;
    try {
        const bundle = await sendBundle(data);
        // @ts-ignore
        const response = await bundle.wait();
        if (response === FlashbotsTransactionResolution.TransactionIncluded) {
            console.log("Private transaction successfully included on-chain.");
        } else if (
            response === FlashbotsTransactionResolution.TransactionDropped
        ) {
            console.log(
                "Private transaction was not included in a block and has been removed from the system."
            );
        }
        res.status(200).json({ data: bundle });
    } catch (err: any) {
        res.status(err.statusCode).json(err.message ?? "SOMETHING WENT WRONG");
    }
});
