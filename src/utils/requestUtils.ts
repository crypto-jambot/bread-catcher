import { SecretUtil } from "@crypto-jambot/secret-manager-utils";
import { BigNumber, Contract, providers, Wallet } from "ethers";
import {
    FlashbotsBundleProvider,
    FlashbotsPrivateTransaction,
} from "@flashbots/ethers-provider-bundle";
import JamBot from "../../contracts/JamBot.sol/JamBot.json";
import { TransactionInfo } from "./pubsubUtils";

const walletSecretUtil = new SecretUtil();
const deployerWalletSecretUtil = new SecretUtil();
const rpcProvider = new providers.JsonRpcProvider(
    {
        url: "https://rabbit.dev/http",
    },
    1
);
let wallet: Wallet;
let deployerWallet: Wallet;
let flashbotBundleProvider: FlashbotsBundleProvider;
export function sendBundle(data: TransactionInfo) {
    return new Promise<FlashbotsPrivateTransaction>(async (resolve, reject) => {
        // return new Promise<SimulationResponse>(async (resolve, reject) => {
        try {
            if (!wallet || !deployerWallet || !flashbotBundleProvider) {
                wallet = new Wallet(
                    await walletSecretUtil.getSecretString(
                        "flashbot-signer-key"
                    )
                );
                deployerWallet = Wallet.fromMnemonic(
                    await deployerWalletSecretUtil.getSecretString(
                        "seed-phrase-key"
                    )
                );
                flashbotBundleProvider = await FlashbotsBundleProvider.create(
                    rpcProvider,
                    wallet
                );
            }
            const jamContract = new Contract(
                "0x685FF453680af0C5AA5327111e4BC5E49B240128",
                JamBot.abi,
                deployerWallet
            );
            const executeTrade = await createTransaction(jamContract, data);
            executeTrade.gasLimit = BigNumber.from(data.gasLimit);
            executeTrade.maxFeePerGas = BigNumber.from(data.maxFeePerGas);
            executeTrade.maxPriorityFeePerGas = BigNumber.from(
                data.maxPriorityFeePerGas
            );
            executeTrade.type = 2;
            executeTrade.chainId = 1;
            // const signedBundle = await flashbotBundleProvider.signBundle([
            //     {
            //         signer: deployerWallet,
            //         transaction: executeTrade,
            //     },
            // ]);

            resolve(
                // flashbotBundleProvider.simulate(
                //     signedBundle,
                //     (await rpcProvider.getBlockNumber()) + 1
                // )
                flashbotBundleProvider.sendPrivateTransaction(
                    {
                        transaction: executeTrade,
                        signer: deployerWallet,
                    },
                    { maxBlockNumber: (await rpcProvider.getBlockNumber()) + 1 }
                )
            );
        } catch (err: any) {
            console.log(err);
            const body = err.body;
            reject({
                message: body ? JSON.parse(body) : { error: err.details },
                statusCode: err.status || 400,
            });
        }
    });
}

function createTransaction(contract: Contract, data: TransactionInfo) {
    return contract.populateTransaction.executeTrade(
        data.startToken,
        data.target,
        data.payload
    );
}
