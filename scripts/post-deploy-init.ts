import { ethers } from 'hardhat';

const factoryAddress = '0x5fbdb2315678afecb367f032d93f642f64180aa3';
const passAddress = '0xe7f1725e7734ce288f8367e1bb143e90bb3f0512';
const storeAddress = '0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0';

const main: () => Promise<any> = async () => {
  const [deployer] = await ethers.getSigners();
  console.log('init contracts with the account:', deployer.address);

  const Store = await ethers.getContractFactory('CCCStore');
  const Pass = await ethers.getContractFactory('CCCPass');
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

  console.log('Completed init actions');
};

const getCurrentTimestamp = async () => {
  const currentBlockNum = await ethers.provider.getBlockNumber();
  const currentBlock = await ethers.provider.getBlock(currentBlockNum);
  const currentTimestamp = currentBlock.timestamp;

  return currentTimestamp;
};

main()
  .then(async () => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
