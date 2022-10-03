import { ethers } from 'hardhat';

const factoryAddress = '0x73a48464660C5B440add0E3D82fA72e2DC215b3d';
const passAddress = '0xeC82867202af675e1E3277Aa18f460dBd57e4571';
const storeAddress = '0xecdd794C02451A8A8EC213140795Ed1f66C407F0';

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
