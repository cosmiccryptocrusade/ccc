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

const mnemonic = {
  mnemonic: `${process.env.MNEMONIC}`
};

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
      accounts: [],
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: mnemonic
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: [`0x${process.env.MAINNET_PRIV_KEY}`],
    },
    mumbai: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${process.env.ALCHEMY_MUMBAI_KEY}`,
      accounts: mnemonic
    },
    polygon: {
      url: `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: mnemonic
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
