import { Router } from "express";
import {utils, Wallet} from "ethers";
import {SecretUtil} from "@crypto-jambot/secret-manager-utils";

export const pubsubRouter = Router();

const walletSecretUtil = new SecretUtil();

pubsubRouter.post("/", async (req, res, next) => {
    const wallet = new Wallet(
        await walletSecretUtil.getSecretString(
            process.env.FLASH_BOTS_KEY as string
        )
    );
    const address = wallet.address;
    const privateKey = wallet.privateKey;
    const body = "hello world";
    const hashBody = utils.id(body);
    const signatureMessage = await wallet.signMessage(hashBody);
    const signature = wallet.address + ":" + signatureMessage;
    console.log(wallet._signingKey());

    res.status(200).json("");
});
