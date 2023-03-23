import { SecretUtil } from "@crypto-jambot/secret-manager-utils";
import { BigNumber, Contract, providers, Wallet } from "ethers";
import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";
import Arbitrage from "../../contracts/Arbitrage.sol/Arbitrage.json";
import { TransactionInfo } from "./pubsubUtils";
import { FlashbotsPrivateTransaction } from "@flashbots/ethers-provider-bundle/src";

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
                "0xB56af9ACd06692BC2E1a45C8b6D5ee7D59A8f6C3",
                Arbitrage.abi,
                deployerWallet
            );
            const block = await rpcProvider.getBlock("latest");
            if (!block.baseFeePerGas) {
                reject({
                    message: "Unable to get baseFeePerGas",
                    statusCode: 500,
                });
                return;
            }
            const maxBaseFeeInFutureBlock =
                FlashbotsBundleProvider.getMaxBaseFeeInFutureBlock(
                    block.baseFeePerGas,
                    1
                );
            const priorityFee = BigNumber.from(10).pow(9);
            const executeTrade = await createTransaction(jamContract, data);
            executeTrade.gasLimit = BigNumber.from(data.gasLimit);
            executeTrade.maxFeePerGas = priorityFee.add(
                maxBaseFeeInFutureBlock
            );
            executeTrade.maxPriorityFeePerGas = priorityFee;
            executeTrade.type = 2;
            executeTrade.chainId = 1;

            // resolve(
            //     flashbotBundleProvider.sendPrivateTransaction(
            //         {
            //             transaction: executeTrade,
            //             signer: deployerWallet,
            //         },
            //         { maxBlockNumber: (await rpcProvider.getBlockNumber()) + 5 }
            //     )
            // );
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
        data.tokenPath,
        data.poolPath,
        BigNumber.from(data.tradeAmount)
    );
}
