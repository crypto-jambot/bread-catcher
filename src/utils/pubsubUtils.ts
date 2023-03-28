import { Request, Response } from "express";

export type TransactionInfo = {
    startToken: string;
    target: string;
    payload: string;
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
    gasLimit: string;
};
export function parseMessage(req: Request, res: Response) {
    const { body } = req;
    if (!body) {
        const msg = "no Pub/Sub message received";
        console.error(`error: ${msg}`);
        res.status(400).send(`Bad Request: ${msg}`);
        return null;
    }
    const { message: pubSubMessage } = body;
    if (!pubSubMessage) {
        const msg = "invalid Pub/Sub message format";
        console.error(`error: ${msg}`);
        res.status(400).send(`Bad Request: ${msg}`);
        return null;
    }
    const { data } = pubSubMessage;
    if (!data) {
        const msg = "Data in message is blank";
        console.error(`error: ${msg}`);
        res.status(400).send(`Bad Request: ${msg}`);
        return null;
    }
    return JSON.parse(
        Buffer.from(data as string, "base64")
            .toString()
            .trim()
    ) as TransactionInfo;
}
