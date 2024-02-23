const hre = require("hardhat");
const utils = require("../utils")

module.exports = { run };

async function run(args) {

    const todo = args.captions?.map(caption => {
        return "Price-" + caption.toUpperCase()
    }) || [];

    const [ pfs, ] = await utils.getWitnetPriceFeedsContract(args?.from);
    const feeds = await pfs.supportedFeeds()

    const caps = [], id4s = [], rads = [];
    feeds[0].forEach((id4, index) => {
        id4s.push(id4)
        caps.push(feeds[1][index])
        rads.push(feeds[2][index])
    });
    const oixs = [ ...caps].sort().map(caption => feeds[1].indexOf(caption))
    
    const status = await pfs.latestPrices(id4s)
    for (const index in caps) {
        if (
            todo.length > 0 
            && !todo.includes(caps[oixs[index]])
        ) continue;

        if (rads[oixs[index]].endsWith("000000000000000000000000")) {
            const solver = await pfs.lookupPriceSolver(id4s[oixs[index]])
            const solverAddr = solver[0]
            const solverDeps = solver[1]
            const solverContract = await utils.getWitnetPriceRouteSolverContract(solverAddr)
            const solverClass = await solverContract.class()
            utils.traceWitnetPriceRoute(
                caps[oixs[index]],
                id4s[oixs[index]],
                solverAddr,
                solverClass,
                solverDeps,
                parseInt(BigInt(status[oixs[index]][1]).toString()),
            );
            continue;

        } else {
            utils.traceWitnetPriceFeed(
                caps[oixs[index]],
                id4s[oixs[index]],
                rads[oixs[index]],
                parseInt(BigInt(status[oixs[index]][1]).toString()),
            );
        }
        
        const queryStatus = utils.getWitnetResultStatusString(
            await pfs.latestUpdateResponseStatus(id4s[oixs[index]])
        )
        if (queryStatus !== "Ready" && !args.updateForce) {
            if (queryStatus !== "Ready") {
                const queryId = await pfs.latestUpdateQueryId(id4s[oixs[index]])
                console.info("  ", `> Witnet Query:   #\x1b[33m${queryId}\x1b[0m`)
                if (queryStatus === "Error") {
                    const queryError = await pfs.latestUpdateResultError(id4s[oixs[index]])
                    console.info("  ", `> Query error:    \x1b[31m${queryError}\x1b[0m`)
                } else {
                    console.info("  ", `> Query status:   \x1b[33m${queryStatus}\x1b[0m`)
                }
            }
        } else if (args.updateForce || args.update) {
            const gasPrice = hre.network.config.gasPrice === "auto" 
                ? await hre.web3.eth.getGasPrice()
                : hre.network.config.gasPrice
            ;
            const balance = BigInt(await hre.ethers.provider.getBalance(pfs.runner.address))
            const updateFee = (await pfs["estimateUpdateBaseFee(uint256)"](gasPrice))
            process.stdout.write(`   > Requesting update (fee: ${parseFloat(updateFee.toString()) / 10 ** 18})... `)
            const tx = await pfs["requestUpdate(bytes4)"](id4s[oixs[index]], {
                gasLimit: null,
                gasPrice,
                value: updateFee
            });
            process.stdout.write(`${tx.hash} ... `)
            await tx.wait()
            const queryId = await pfs.latestUpdateQueryId(id4s[oixs[index]])
            process.stdout.write(`witnetQuery => #\x1b[33m${queryId}\x1b[0m\n`)
            const receipt = await hre.ethers.provider.getTransactionReceipt(tx.hash) 
            utils.traceTx(receipt, balance - BigInt(await hre.ethers.provider.getBalance(pfs.runner.address)))
        }
    }
    console.info()
}
