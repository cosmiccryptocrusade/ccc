import { ethers } from 'hardhat';
import * as fs from 'fs';

const storeAddress = '0x8837E6100912Bdf52B12A24807800e6BD3BaC506';

interface IRunRaffleJson {
  holders: Array<string>,
  amounts: Array<number>,
  maxCCC: number,
  preMintedCCC: number,
  newlyMintedCCCWithPass: number
}

const main: () => Promise<any> = async () => {
  const [deployer, premint1, premint2, vip1, vip2, public1, public2] = await ethers.getSigners();
  console.log('init contracts with the account:', deployer.address);

  const Store = await ethers.getContractFactory('CCCStore');
  const cccStoreContract = await Store.attach(storeAddress);

  const ticketPrice = await cccStoreContract.ticketPrice();

  // preMintCCC
  // const preMintAddress = [premint1.address, premint2.address];
  // await cccStoreContract.preMintCCC(preMintAddress);
  // console.log('Completed preMintCCC', premint1.address, premint2.address);

  // mintWithPass
  // await cccStoreContract.connect(vip1).mintWithPass(
  //   3,
  //   3,
  //   0,
  //   27,
  //   "0x44d9a54ea73ebc59fceffb42dc9e24eb51be262280e291f58c7a3b2d9c38655b",
  //   "0x239e7d90eeab05346df8b4d012aa38602bbd349d118c12940455d3d57dab88d9",
  //   {value:ticketPrice.mul(3)}
  // );
  // await cccStoreContract.connect(vip2).mintWithPass(
  //   3,
  //   3,
  //   1,
  //   28,
  //   "0xf95d366e5125fe7ea8473e0ed7cfc8274b2d6337322048b2672b5535145afc61",
  //   "0x5db91a32e34805f2fceb4e80eda65a5d493606f782cddfe4bbdf7f4f4457e088",
  //   {value:ticketPrice.mul(3)}
  // );
  // console.log('Completed mintWithPass', vip1.address, vip2.address);

  // takingTickets
  // let openingHours = 0;
  // openingHours = await getCurrentTimestamp();
  // openingHours -= 3600 * 9;
  // await cccStoreContract.setOpeningHours(openingHours);
  // let currOpeningHours = await cccStoreContract.openingHours();
  // currOpeningHours = new Date(currOpeningHours * 1000);
  // console.log(currOpeningHours);
  // await cccStoreContract.connect(public1).takingTickets(2, {value:ticketPrice.mul(2)});
  // await cccStoreContract.connect(public2).takingTickets(10000, {value:ticketPrice.mul(10000)});
  // console.log('Completed takingTickets', public1.address, public2.address);

  // output run-raffle-data.json
  const maxCCC = await cccStoreContract.maxCCC();
  const preMintedCCC = await cccStoreContract.preMintedCCC();
  const newlyMintedCCCWithPass = await cccStoreContract.newlyMintedCCCWithPass();
  const runRaffleJson: IRunRaffleJson = {
    holders: [public1.address, public2.address],
    amounts: [2, 10000],
    maxCCC: maxCCC.toNumber(),
    preMintedCCC: preMintedCCC.toNumber(),
    newlyMintedCCCWithPass: newlyMintedCCCWithPass.toNumber()
  };
  fs.writeFileSync("data/run-raffle-data.json", JSON.stringify(runRaffleJson));

  // getTicketHash
  let hashToEncode = "0x00000000000000000000000000000000";
  hashToEncode = await cccStoreContract.getTicketHash(runRaffleJson.holders, hashToEncode);
  console.log("getTicketHash", hashToEncode);
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
