import { ethers } from 'hardhat';
import runRaffleData from '../data/run-raffle-data.json';

const storeAddress = '0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0';
const raffleAddress = '0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9';

const main: () => Promise<any> = async () => {
//   const [deployer] = await ethers.getSigners();

  const Store = await ethers.getContractFactory('CCCStore');
  const Raffle = await ethers.getContractFactory('CCCRaffleCalculation');

  const cccStoreContract = Store.attach(storeAddress);
  const cccRaffleContract = Raffle.attach(raffleAddress);

  // call setTicketHolders/getRandomNumber/runRaffle/calculateAllResults on polygon
  const holders = runRaffleData.holders;
  const amounts = runRaffleData.amounts;
  const totalTickets = amounts.reduce((a, b) => a + b, 0);
  await cccRaffleContract.setTicketHolders(holders, amounts);
  await cccRaffleContract.getRandomNumber();
  const raffleResult = await cccRaffleContract.runRaffle(
    runRaffleData.maxCCC,
    runRaffleData.preMintedCCC,
    runRaffleData.newlyMintedCCCWithPass,
    totalTickets
  );
  const tx = await cccRaffleContract.calculateAllResults(
    raffleResult["slotSize"],
    raffleResult["offsetInSlot"],
    raffleResult["lastTargetIndex"],
    holders.length
  );
  const receipt = await tx.wait();
  console.log(receipt);
};

main()
  .then(async () => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
