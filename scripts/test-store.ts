import { ethers } from 'hardhat';

const storeAddress = '0x440f19d26c1BB89a7183fac767E016fd179d33Ed';

const main: () => Promise<any> = async () => {
  const [deployer] = await ethers.getSigners();
  console.log('init contracts with the account:', deployer.address);

  const Store = await ethers.getContractFactory('CCCStore');
  

  const cccStoreContract = await Store.attach(storeAddress);
 
  const currentBlockNum = await ethers.provider.getBlockNumber();
  const currentBlock = await ethers.provider.getBlock(currentBlockNum);
  let currentTimestamp = currentBlock.timestamp;

  //premint
  // const preMintAddress = ["0x513ab7aa66c04ee36b0cce970ebb70e97fa6c5c4","0xe631bd4BBDb8c618b4E6a111D7907fC399c0c890"]
  // await cccStoreContract.preMintCCC(preMintAddress);

  // console.log('Completed premint actions');

  //mintWithPass
  // await cccStoreContract.mintWithPass(3,
  //   3,
  //   1,
  //   27,
  //   "0xf1240fffe70f5086b1d68121b0632919d387a8bb5221a841615ef0cebf5ce039",
  //   "0x4ded4ff5edcd48a8a378e63091d1bbf8e26ceae945334f9017c275dfdb31c0b7",{value:250000000000000});

  // console.log('Completed premint actions');
  
  //Call Chainlink
  // await cccStoreContract.getRandomNumber();

  let shuffleNumber = await cccStoreContract.shuffleNumber();
  console.log("shuffleNumber", shuffleNumber);
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
