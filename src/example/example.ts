import { Wallet, Provider, ERC20, DefaultConf, IntentBuilder, SignedIntent, StatusCode } from "marmojs";
import { equal, ok } from 'assert'


const crypto = require('crypto')

const ETH_NODE = "https://ropsten.node.rcn.loans:8545/"
const RELAYER = "http://ec2-18-188-99-203.us-east-2.compute.amazonaws.com/"
const TEST_ERC20 = "0x2f45b6fb2f28a73f110400386da31044b2e953d4"


const wait = ms => new Promise((r, j) => setTimeout(r, ms))

async function waitUntil(predicate: () => Promise<boolean>, timeout: number = 30, period = 1000) {
    const mustEnd = Date.now() + timeout * 1000
    while (Date.now() < mustEnd) {
        if (await predicate()) {
            return true;
        } else {
            await wait(period)
        }
    }
    return false;
}

async function example() {
    let provider: Provider;
    let wallet: Wallet;

    DefaultConf.ROPSTEN.asDefault();
    wallet = new Wallet('0x' + crypto.randomBytes(32).toString('hex'));
    provider = new Provider(ETH_NODE, RELAYER);

    const walletReceiver = new Wallet('0x' + crypto.randomBytes(32).toString('hex'));

    const intentAction = new ERC20(TEST_ERC20).transfer(walletReceiver.address, 0);
    const intent = new IntentBuilder().withIntentAction(intentAction).build();

    const signedIntent: SignedIntent = wallet.sign(intent);
    await signedIntent.relay(provider);

    equal(
        (await signedIntent.status(provider)).code,
        StatusCode.Pending
    );

    ok(await waitUntil(async () => (await signedIntent.status(provider)).code === StatusCode.Settling, 640));
    ok((await signedIntent.status(provider)).receipt!.success);
}

example()