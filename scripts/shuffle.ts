import { ethers } from 'hardhat';

const storeAddress = '0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0';

const main: () => Promise<any> = async () => {
//   const [deployer] = await ethers.getSigners();

  const Store = await ethers.getContractFactory('CCCStore');

  const cccStoreContract = Store.attach(storeAddress);

  // call getRandomNumber/shuffle on mainnet
  await cccStoreContract.getRandomNumber();
  const maxCCC = await cccStoreContract.maxCCC();
  const shuffledArray = await cccStoreContract.shuffle(maxCCC);
  console.log(shuffledArray.slice(1, 10));
};

main()
  .then(async () => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
