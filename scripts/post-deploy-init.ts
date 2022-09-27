import { ethers } from 'hardhat';

const factoryAddress = '0x84318040f440DDB71E31C271e1349B3F065e4E80';
const passAddress = '0xB9cDc9Bc2002398E6a250D39F7b32ff6dCd36FcA';
const storeAddress = '0xb6a549f0f59C4517cEa69ec7EfAe9Bd723C098E5';

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
