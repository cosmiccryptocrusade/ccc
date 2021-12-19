import '@nomiclabs/hardhat-etherscan';
import 'hardhat-gas-reporter';
import '@typechain/hardhat';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';
import 'hardhat-contract-sizer';
import "@nomiclabs/hardhat-etherscan";

import 'hardhat-tracer';
import 'solidity-coverage';
import { HardhatUserConfig } from 'hardhat/config';
import dotenv from 'dotenv';

dotenv.config();

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

const onlyRunInFullTest = () => (process.env.FULL_TEST ? true : false);

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.4',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      initialBaseFeePerGas: 0,
      accounts: {
        accountsBalance: '100000000000000000000000', // 100,000eth
      },
    },
    localhost: {
      url: `http://127.0.0.1:8545/`,
      accounts: [`0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`,`0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`,`0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`],
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: [`0x${process.env.PRIV_KEY}`],
    },
    ropsten: {
      url: `https://ropsten.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: [`0x${process.env.PRIV_KEY}`],
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: [`0x${process.env.MAINNET_PRIV_KEY}`],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_APIKEY,
  },
  typechain: {
    outDir: './types',
    target: 'ethers-v5',
  },
  gasReporter: {
    enabled: onlyRunInFullTest(),
    gasPrice: 20,
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: onlyRunInFullTest(),
    disambiguatePaths: false,
  },
  mocha: {
    timeout: 120000,
  },
};

export default config;
