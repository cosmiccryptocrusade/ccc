import { ethers } from 'hardhat';

const factoryAddress = '0xcE2E1BB06E3Db7F56845c31cacCAecBAAc235903';
const passAddress = '0x21c930A81AA1a52DAdcC733eE1D95125cE75239A';
const storeAddress = '0x440f19d26c1BB89a7183fac767E016fd179d33Ed';

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
