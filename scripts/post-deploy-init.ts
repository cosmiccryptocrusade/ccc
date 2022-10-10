import { ethers } from 'hardhat';

const factoryAddress = '0xC9433cd80f6f5D4421Eb0b0c3D221A3a9Dff1B7b';
const passAddress = '0x036BfB0A16719b5a9812F6cbA3e974A52c57CF22';
const storeAddress = '0x8CE51278a22EDD6F7A99BAD1dF2b50868E5bb543';

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
