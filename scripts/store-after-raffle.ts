import { ethers } from 'hardhat';
import * as fs from 'fs';

const storeAddress = '0xC0A30Deb5DDD84bcB898163C161d46081F4E8422';

const main: () => Promise<any> = async () => {
  const [deployer, premint1, premint2, vip1, vip2, public1, public2] = await ethers.getSigners();
  console.log('init contracts with the account:', deployer.address);

  const Store = await ethers.getContractFactory('CCCStore');
  const cccStoreContract = await Store.attach(storeAddress);

  const ticketPrice = await cccStoreContract.ticketPrice();

  // mintCCC
  let openingHours = await getCurrentTimestamp();
  openingHours -= 3600 * 9;
  await cccStoreContract.setOpeningHours(openingHours);
  // let currOpeningHours = await cccStoreContract.openingHours();
  // currOpeningHours = new Date(currOpeningHours * 1000);
  // console.log(currOpeningHours);
  // await cccStoreContract.connect(public1).mintCCC(3, {value: ticketPrice.mul(3)});
  // await cccStoreContract.connect(public2).mintCCC(30, {value: ticketPrice.mul(31)});
  console.log("Completed mintCCC", public1.address, public2.address);

  // getRandomNumber
  // await cccStoreContract.getRandomNumber();
  // console.log("Completed getRandomNumber");

  // check shuffleNumber
  // const shuffleNumber = await cccStoreContract.shuffleNumber();
  // console.log("Check shuffleNumber", shuffleNumber);

  // shuffle
  // let shuffledArray = await cccStoreContract.shuffle(10000);
  // shuffledArray = shuffledArray.map((x: any) => {return x.toNumber()});
  // fs.writeFileSync("data/shuffle-data.json", JSON.stringify(shuffledArray));

  // withdraw
  // const amount = 0.00576 * 10**18;
  // await cccStoreContract.withdraw(deployer.address, amount);
  // console.log("withdraw", amount / 10**18);
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
