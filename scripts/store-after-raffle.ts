import { ethers } from 'hardhat';
import { BigNumber } from '@ethersproject/bignumber';
import * as fs from 'fs';
import raffleResultsData from '../data/raffle-results-data.json';

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
  const holders = raffleResultsData.holders;
  const amounts = raffleResultsData.amounts;

  // setRaffleNumber
  // const raffleNumber = BigNumber.from(raffleResultsData.raffleNumber);
  // await cccStoreContract.setRaffleNumber(raffleNumber);
  // console.log("setRaffleNumber", raffleNumber);

  // setRaffleResults
  // await cccStoreContract.setRaffleResults(holders, amounts, true);
  // console.log("setRaffleResults", holders, amounts);

  // getResultHash
  // let hashToEncode = "0x00000000000000000000000000000000";
  // hashToEncode = await cccStoreContract.getResultHash(holders, hashToEncode);
  // console.log("getResultHash", hashToEncode);

  // mintCCC
  // await cccStoreContract.connect(public1).mintCCC();
  // await cccStoreContract.connect(public2).mintCCC();
  // console.log("Completed mintCCC", public1.address, public2.address);

  // getRandomNumber
  // await cccStoreContract.getRandomNumber();
  // console.log("Completed getRandomNumber");

  // check shuffleNumber
  // const shuffleNumber = await cccStoreContract.shuffleNumber();
  // console.log("Check shuffleNumber", shuffleNumber);

  // shuffle
  let shuffledArray = await cccStoreContract.shuffle(10000);
  shuffledArray = shuffledArray.map((x: any) => {return x.toNumber()});
  fs.writeFileSync("data/shuffle-data.json", JSON.stringify(shuffledArray));
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
