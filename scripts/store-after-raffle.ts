import { ethers } from 'hardhat';
import * as fs from 'fs';
import { BigNumber } from 'ethers';

const storeAddress = '0x8837E6100912Bdf52B12A24807800e6BD3BaC506';

const main: () => Promise<any> = async () => {
  const [deployer, public1, public2, vip1, vip2] = await ethers.getSigners();
  console.log('init contracts with the account:', deployer.address);

  const Store = await ethers.getContractFactory('CCCStore');
  const cccStoreContract = await Store.attach(storeAddress);

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
  // const amount = BigNumber.from("200000000000000000");
  // await cccStoreContract.withdraw(deployer.address, amount);
  // console.log("withdraw", amount);
};

main()
  .then(async () => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
