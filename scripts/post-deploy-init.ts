import { ethers } from 'hardhat';

const factoryAddress = '0xdE2bBeb807d5ba1fBeb42a37A5EB199e0Fc5Dd61';
const passAddress = '0x1e732f6260a24B1A79E2Ea9c4fc1E280cDeab927';
const storeAddress = '0xC0A30Deb5DDD84bcB898163C161d46081F4E8422';

const main: () => Promise<any> = async () => {
  const [deployer] = await ethers.getSigners();
  console.log('init contracts with the account:', deployer.address);

  const Factory = await ethers.getContractFactory('CCCFactory');
  const Pass = await ethers.getContractFactory('CCCPass');
  const Store = await ethers.getContractFactory('CCCStore');

  const cccFactoryContract = await Factory.attach(factoryAddress);
  const passContract = await Pass.attach(passAddress);
  const cccStoreContract = await Store.attach(storeAddress);

  //link em up
  await cccFactoryContract.setCCCStore(cccStoreContract.address);
  await passContract.setStore(cccStoreContract.address);
  await cccStoreContract.setCCCFactory(cccFactoryContract.address);
  await cccStoreContract.setPass(passContract.address);

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
