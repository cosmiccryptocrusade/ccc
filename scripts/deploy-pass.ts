import { ethers } from 'hardhat';
import deployData from '../data/deploy-data.json';
import * as hre from "hardhat";

const main: () => Promise<any> = async () => {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);

  const Pass = await ethers.getContractFactory('contracts/CCCPass.sol:CCCPass');
  const contract = await Pass.deploy(deployData.passContractConfigs.name);

  await contract.deployed();
  console.log('Contract deployed at:', contract.address);
  return {
    'CCCPass': contract.address,
  };
};

async function verify(contractAddress: any, ...args: any) {
  console.log("verifying", contractAddress, ...args);
  await hre.run("verify:verify", {
    address: contractAddress,
    contract: "contracts/CCCPass.sol:CCCPass",
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
    await verify(deployedData.CCCPass,
      deployData.passContractConfigs.name); //Verify the master contract
  
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
