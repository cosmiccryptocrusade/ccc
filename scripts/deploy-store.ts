import { ethers } from 'hardhat';
import * as hre from "hardhat";

const main: () => Promise<any> = async () => {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);

  const Store = await ethers.getContractFactory('contracts/CCCStore.sol:CCCStore');
  const contract = await Store.deploy();

  await contract.deployed();
  console.log('Contract deployed at:', contract.address);
  return {
    'CCCStore': contract.address,
  };
};

async function verify(contractAddress: any, ...args: any) {
  console.log("verifying", contractAddress, ...args);
  await hre.run("verify:verify", {
    address: contractAddress,
    contract: "contracts/CCCStore.sol:CCCStore",
    constructorArguments: [
      ...args
    ],
  });
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main()
  .then(async (deployedData) => {
    await delay(30000);
    await verify(deployedData.CCCStore); //Verify the master contract
  
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
