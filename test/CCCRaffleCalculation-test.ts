import chai from 'chai';
import { ethers } from 'hardhat';
import {
  TestCCCRaffleCalculation as CCCRaffleCalculation,
  TestCCCRaffleCalculation__factory as CCCRaffleCalculation__factory,
} from '../types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { solidity } from 'ethereum-waffle';
import { BigNumber } from '@ethersproject/bignumber';
import runRaffleData from '../test/data/run-raffle-test-data.json';

chai.use(solidity);
const { expect } = chai;

const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000';

describe('CCCRaffleCalculation', () => {
  let [deployer, account1, account2]: SignerWithAddress[] = [];
  let cccCalculationContract: CCCRaffleCalculation;

  let totalTickets = 0;

  // maxCCC, preMintedCCC, newlyMintedCCCWithPass will be from CCCStore
  let maxCCC = 0;
  let preMintedCCC = 0;
  let newlyMintedCCCWithPass = 0;

  let slotSize: BigNumber;
  let offsetInSlot: BigNumber;
  let lastTargetIndex: BigNumber;
  let holders: string[];
  let amounts: number[];
  let pageSize = 0;

  before(async () => {
    [deployer, account1, account2] = await ethers.getSigners();

    const cccCalculation = new CCCRaffleCalculation__factory(deployer);
    cccCalculationContract = await cccCalculation.deploy();

    maxCCC = runRaffleData.maxCCC;
    preMintedCCC = runRaffleData.preMintedCCC;
    newlyMintedCCCWithPass = runRaffleData.newlyMintedCCCWithPass;
    holders = runRaffleData.holders.slice(0, 10);
    amounts = runRaffleData.amounts.slice(0, 10);
    newlyMintedCCCWithPass = maxCCC - preMintedCCC - 10;
    pageSize = 3;
    totalTickets = amounts.reduce((a, b) => a + b, 0);
  });

  describe('setTicketHolders', async () => {
    it('fails if error', async () => {
      for (let i = 0; i < holders.length; i += pageSize) {
        await cccCalculationContract.setTicketHolders(
          holders,
          amounts,
          i
        );
        console.log("set", i);
      };
      // for (let i = 0; i < holders.length; i++) {
      //   console.log(await cccCalculationContract.ticketsOf(i));
      // };
    });
  });

  describe('runRaffle', async () => {
    it('fails if error', async () => {
      // getRandomNumber() will callback fulfillRandomness()
      await cccCalculationContract.testFulfillRandomness(10);
      const raffleResult = await cccCalculationContract.runRaffle(
        maxCCC,
        preMintedCCC,
        newlyMintedCCCWithPass,
        totalTickets
      );
      slotSize = raffleResult["slotSize"];
      offsetInSlot = raffleResult["offsetInSlot"];
      lastTargetIndex = raffleResult["lastTargetIndex"];
      // console.log(slotSize, offsetInSlot, lastTargetIndex);
    });
  });

  describe('calculateAllResults', async () => {
    it('emits SetResult event', async () => {
      const ticketPrice = await cccCalculationContract.ticketPrice();
      // const tx = await cccCalculationContract.calculateAllResults(
      //   slotSize,
      //   offsetInSlot,
      //   lastTargetIndex,
      //   totalTickets
      // );
      // const receipt = await tx.wait();
      // const event1 = receipt.events?.filter((x) => {return x.logIndex == 0});
      // console.log(event1);
      await expect(cccCalculationContract.calculateAllResults(
        slotSize,
        offsetInSlot,
        lastTargetIndex,
        holders.length,
      )).to.emit(cccCalculationContract, 'SetResult')
        .withArgs(account1.address, 1, ticketPrice.mul(1))
        .to.emit(cccCalculationContract, 'SetResult')
        .withArgs(account2.address, 5, ticketPrice.mul(5));
    });
  });

  // describe('testCalculateValidTicketAmount', async () => {
  //   it('test winning ticket algorithm for account1', async () => {
  //     for (let i = 0; i < slotSize.toNumber(); i++) {
  //       offsetInSlot = BigNumber.from(i);
  //       const validTicketAmount = await cccCalculationContract.testCalculateValidTicketAmount(
  //         0,
  //         2,
  //         slotSize,
  //         offsetInSlot,
  //         lastTargetIndex
  //       );
  //       // console.log(i, validTicketAmount);
  //       if (i < 2) {
  //         expect(validTicketAmount).to.eq(1);
  //       } else {
  //         expect(validTicketAmount).to.eq(0);
  //       }
  //     }
  //   });

  //   it('test winning ticket algorithm for account2', async () => {
  //     for (let i = 0; i < slotSize.toNumber(); i++) {
  //       offsetInSlot = BigNumber.from(i);
  //       const validTicketAmount = await cccCalculationContract.testCalculateValidTicketAmount(
  //         2,
  //         9,
  //         slotSize,
  //         offsetInSlot,
  //         lastTargetIndex
  //       );
  //       // console.log(i, validTicketAmount);
  //       if (i == 1) {
  //         expect(validTicketAmount).to.eq(0);
  //       } else {
  //         expect(validTicketAmount).to.eq(1);
  //       }
  //     }
  //   });
  // });

  describe('getTicketHash', async () => {
    it("fails if error", async () => {
      let hashToEncode = "0x00000000000000000000000000000000";
      for (let i = 0; i < holders.length; i += pageSize) {
        hashToEncode = await cccCalculationContract.getTicketHash(
          i,
          Math.min(i + pageSize, holders.length),
          hashToEncode
        );
        console.log(hashToEncode, i);
      };
    });
  });

  describe('getResultHash', async () => {
    it("fails if error", async () => {
      let hashToEncode = "0x00000000000000000000000000000000";
      for (let i = 0; i < holders.length; i += pageSize) {
        hashToEncode = await cccCalculationContract.getResultHash(
          holders.slice(i, i + pageSize),
          hashToEncode
        );
        console.log(hashToEncode, i);
      };
    });
  });
});