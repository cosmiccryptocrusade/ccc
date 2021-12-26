import { ethers } from 'hardhat';
import * as fs from 'fs';
import runRaffleData from '../data/run-raffle-data.json';

// on polygon
const raffleAddress = '0xdE2bBeb807d5ba1fBeb42a37A5EB199e0Fc5Dd61';

interface IResultJson {
  holders: Array<string>,
  amounts: Array<number>,
  raffleNumber: number
};

const main: () => Promise<any> = async () => {
  const [deployer] = await ethers.getSigners();

  const Raffle = await ethers.getContractFactory('CCCRaffleCalculation');

  const cccRaffleContract = Raffle.attach(raffleAddress);

  const holders = runRaffleData.holders;
  const amounts = runRaffleData.amounts;
  const totalTickets = amounts.reduce((a, b) => a + b, 0);

  // setTicketHolders
  // await cccRaffleContract.setTicketHolders(holders, amounts, 0);
  // console.log('Completed setTicketHolders', holders, amounts);

  // getTicketHash
  // let hashToEncode = "0x00000000000000000000000000000000";
  // hashToEncode = await cccRaffleContract.getTicketHash(0, 2, hashToEncode);
  // console.log("getTicketHash", hashToEncode);

  // getRandomNumber
  // await cccRaffleContract.getRandomNumber();
  // console.log("Completed getRandomNumber");

  // check raffleNumber
  const raffleNumber = await cccRaffleContract.raffleNumber();
  console.log("Check raffleNumber", raffleNumber);

  // runRaffle
  const raffleResult = await cccRaffleContract.runRaffle(
    runRaffleData.maxCCC,
    runRaffleData.preMintedCCC,
    runRaffleData.newlyMintedCCCWithPass,
    totalTickets
  );
  console.log("runRaffle", raffleResult);

  // calculateAllResults
  // await cccRaffleContract.calculateAllResults(
  //   raffleResult["slotSize"],
  //   raffleResult["offsetInSlot"],
  //   raffleResult["lastTargetIndex"],
  //   0,
  //   holders.length,
  //   0
  // );

  // output raffle-results-data.json
  const resultJson: IResultJson = {
    holders: [],
    amounts: [],
    raffleNumber: raffleNumber
  };
  for (let i = 0; i < holders.length; i++) {
    resultJson.holders.push(holders[i]);
    const amount = await cccRaffleContract.resultOf(holders[i]);
    resultJson.amounts.push(amount.toNumber());
  };
  fs.writeFileSync("data/raffle-results-data.json", JSON.stringify(resultJson));

  // getResultHash
  let hashToEncode = "0x00000000000000000000000000000000";
  hashToEncode = await cccRaffleContract.getResultHash(holders, hashToEncode);
  console.log("getResultHash", hashToEncode);
};

main()
  .then(async () => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
