import { ethers } from 'hardhat';

const factoryAddress = '0xEE7ef90c5D8e564638DFc0e152379c35BeE9685C';
const passAddress = '0x5e0037ABf1AE4201152eE38cB91F49E7860Dd4bF';
const storeAddress = '0x19F2EDC250C723f511376F262899370950e7C26B';

const main: () => Promise<any> = async () => {
  const [deployer] = await ethers.getSigners();
  console.log('init contracts with the account:', deployer.address);

  const Factory = await ethers.getContractFactory('contracts/CCCFactory.sol:CCCFactory');
  const Pass = await ethers.getContractFactory('contracts/CCCPass.sol:CCCPass');
  const Store = await ethers.getContractFactory('contracts/CCCStore.sol:CCCStore');

  const cccFactoryContract = await Factory.attach(factoryAddress);
  const cccPassContract = await Pass.attach(passAddress);
  const cccStoreContract = await Store.attach(storeAddress);

  //link em up
  await cccFactoryContract.setCCCStore(cccStoreContract.address);
  await cccStoreContract.setCCCFactory(cccFactoryContract.address);
  await cccPassContract.setCCCStore(cccStoreContract.address);
  await cccStoreContract.setCCCPass(cccPassContract.address);

  await cccPassContract.unpause();

  // let openingHours = 0;
  // openingHours = await getCurrentTimestamp();
  // await cccStoreContract.setOpeningHours(openingHours);

  // await cccStoreContract.setMintPrice(10);

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
