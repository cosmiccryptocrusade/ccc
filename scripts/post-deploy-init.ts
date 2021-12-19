import { ethers } from 'hardhat';
import * as hre from "hardhat";

const storeAddress = "0xeEE26CF2B31e133cfaFDEbfe7A97b68AA6bB8E26";
const passAddress = "0xafCe5092D0f112753dABda7d22202ADfD2872EA3";
const factoryAddress = "0xF144DA5442980f6506d40A1D6Dab2Cdfa8CDF1d1";

const main: () => Promise<any> = async () => {
  const [deployer] = await ethers.getSigners();
  console.log("init contracts with the account:", deployer.address);

  const Store = await ethers.getContractFactory('CCCStore');
  const Pass = await ethers.getContractFactory('contracts/Pass.sol:Pass');
  const Factory = await ethers.getContractFactory('CCCFactory');

  const cccStoreContract = await Store.attach(storeAddress);
  const passContract = await Pass.attach(passAddress);
  const cccFactoryContract = await Factory.attach(factoryAddress);

  //link em up
  await cccFactoryContract.setCCCStore(cccStoreContract.address);
  await cccStoreContract.setCCCFactory(cccFactoryContract.address);
  await cccStoreContract.setPass(passContract.address);
  await passContract.setStore(cccStoreContract.address);

  const currentBlockNum = await ethers.provider.getBlockNumber();
  const currentBlock = await ethers.provider.getBlock(currentBlockNum);
  let currentTimestamp = currentBlock.timestamp;
  await passContract.setClaimUntil(currentTimestamp + 360000);
  await passContract.unpause();


  let openingHours = 0;
  openingHours = await getCurrentTimestamp();
  await cccStoreContract.setOpeningHours(openingHours);



  console.log("Completed init actions");
  return null
};

const getCurrentTimestamp = async () => {
  const currentBlockNum = await ethers.provider.getBlockNumber();
  const currentBlock = await ethers.provider.getBlock(currentBlockNum);
  const currentTimestamp = currentBlock.timestamp;

  return currentTimestamp;
};


function delay(ms:number) { 
  return new Promise( resolve => setTimeout(resolve, ms) );
}


main()
  .then(async (deployedData) => {
    // await delay(80000);
    // await verify(deployedData.CCCStore); //Verify the master contract
  
    process.exit(0)
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
