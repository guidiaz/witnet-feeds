const settings = require("witnet-solidity-bridge/assets").settings
const utils = require("witnet-solidity-bridge/utils")

const { ecosystem, network } = utils.getRealmNetworkFromArgs()
if (ecosystem) {
  const header = console.info(`${ecosystem.toUpperCase()}`)
  console.info(header)
  console.info("=".repeat(header.length))
}

module.exports = {
  build_directory: "./build/",
  contracts_directory: "./contracts/",
  migrations_directory: "./migrations/scripts/",
  networks: settings.getNetworks(network),
  compilers: {
    solc: settings.getCompilers(network),
  },
  mocha: {
    reporter: "eth-gas-reporter",
    reporterOptions: {
      coinmarketcap: process.env.COINMARKETCAP_API_KEY,
      currency: "USD",
      gasPrice: 100,
      excludeContracts: ["Migrations"],
      src: "contracts",
    },
    timeout: 300000,
    useColors: true,
  },
  plugins: [
    "truffle-plugin-verify",
  ],
  api_keys: {
    arbiscan: process.env.ETHERSCAN_ARBISCAN_API_KEY,
    bobascan: process.env.BOBASCAN_API_KEY,
    celo: process.env.CELOSCAN_API_KEY,
    cronos: process.env.CRONOSCAN_API_KEY,
    etherscan: process.env.ETHERSCAN_API_KEY,
    mantlescan: process.env.ETHERSCAN_API_KEY,
    moonscan: process.env.ETHERSCAN_MOONBEAM_API_KEY,
    optimistic_etherscan: process.env.ETHERSCAN_OPTIMISM_API_KEY,
    // polygonscan: process.env.POLYGONSCAN_API_KEY,
    routescan: process.env.ROUTESCAN_API_KEY,
    scrollscan: process.env.SCROLLSCAN_API_KEY,
  },
}