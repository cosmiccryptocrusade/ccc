import { ethers } from 'hardhat';
import * as fs from 'fs';

const storeAddress = '0xC0A30Deb5DDD84bcB898163C161d46081F4E8422';

// interface IRunRaffleJson {
//   holders: Array<string>,
//   amounts: Array<number>,
//   maxCCC: number,
//   preMintedCCC: number,
//   newlyMintedCCCWithPass: number
// }

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
  //   6,
  //   3,
  //   0,
  //   27,
  //   "0x2a56c387d156402643e622fa41f3c1bc8b7c7716b2405f8ff2f7251088b50d2a",
  //   "0x6008fcbbefdd8bc94b30b0110a7b3b33b45586169c3601fc079669579bfb8e8c",
  //   {value:ticketPrice.mul(3)}
  // );
  // await cccStoreContract.connect(vip2).mintWithPass(
  //   6,
  //   3,
  //   1,
  //   27,
  //   "0xaab2fae16c572288ac3d9afd3172ca100596c0950d9c44a33e2453576e782436",
  //   "0x28fe89f9acbb8531f8cd834570db9ed16a60111a229abee059ec0aa3bbce10a7",
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
  // const maxCCC = await cccStoreContract.maxCCC();
  // const preMintedCCC = await cccStoreContract.preMintedCCC();
  // const newlyMintedCCCWithPass = await cccStoreContract.newlyMintedCCCWithPass();
  // const runRaffleJson: IRunRaffleJson = {
  //   holders: [public1.address, public2.address],
  //   amounts: [2, 10000],
  //   maxCCC: maxCCC.toNumber(),
  //   preMintedCCC: preMintedCCC.toNumber(),
  //   newlyMintedCCCWithPass: newlyMintedCCCWithPass.toNumber()
  // };
  // fs.writeFileSync("data/run-raffle-data.json", JSON.stringify(runRaffleJson));

  // getTicketHash
  // let hashToEncode = "0x00000000000000000000000000000000";
  // hashToEncode = await cccStoreContract.getTicketHash(runRaffleJson.holders, hashToEncode);
  // console.log("getTicketHash", hashToEncode);
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
