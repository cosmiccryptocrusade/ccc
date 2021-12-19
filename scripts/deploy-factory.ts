import { ethers } from 'hardhat';
import deployData from '../data/deploy-data.json';
import * as hre from "hardhat";

const main: () => Promise<any> = async () => {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);

  const Factory = await ethers.getContractFactory('CCCFactory');
  const contract = await Factory.deploy(
    deployData.factoryContractConfigs.name,
    deployData.factoryContractConfigs.symbol,
    deployData.factoryContractConfigs.baseURI
  );

  await contract.deployed();
  console.log('Contract deployed at:', contract.address);

  return {
    'CCCFactory':contract.address,
  };
};


async function verify(contractAddress:any,...args:any) {
  console.log("verifying", contractAddress, ...args);
  await hre.run("verify:verify", {
    address: contractAddress,
    constructorArguments: [
      ...args
    ],
  });
}


function delay(ms:number) { 
  return new Promise( resolve => setTimeout(resolve, ms) );
}


main()
  .then(async (deployedData) => {
    await delay(80000);
    await verify(deployedData.CCCFactory, deployData.factoryContractConfigs.name,
      deployData.factoryContractConfigs.symbol,
      deployData.factoryContractConfigs.baseURI); //Verify the master contract
  
    process.exit(0)
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
