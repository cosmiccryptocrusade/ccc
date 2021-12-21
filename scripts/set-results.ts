import { ethers } from 'hardhat';
import raffleResultsData from '../data/raffle-results-data.json';

const storeAddress = '0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0';

const main: () => Promise<any> = async () => {
//   const [deployer] = await ethers.getSigners();

  const Store = await ethers.getContractFactory('CCCStore');

  const cccStoreContract = Store.attach(storeAddress);

  // call setRaffleNumber/setRaffleResults on mainnet
  const holders = raffleResultsData.holders;
  const amounts = raffleResultsData.amounts;
  await cccStoreContract.setRaffleNumber(raffleResultsData.raffleNumber);
  await cccStoreContract.setRaffleResults(holders, amounts);
};

main()
  .then(async () => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
