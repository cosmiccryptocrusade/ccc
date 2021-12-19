import chai from 'chai';
import { ethers } from 'hardhat';
import {
  TestCCCRaffleCalculation as CCCRaffleCalculation,
  TestCCCRaffleCalculation__factory as CCCRaffleCalculation__factory,
} from '../types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { solidity } from 'ethereum-waffle';
import { BigNumber } from '@ethersproject/bignumber';

chai.use(solidity);
const { expect } = chai;

const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000';

describe('CCCRaffleCalculation', () => {
  let [deployer, account1, account2]: SignerWithAddress[] = [];
  let cccCalculationContract: CCCRaffleCalculation;

  let totalTickets = 0;

  // maxCCC, preMintedCCC, newlyMintedCCCWithPass will be from CCCStore
  let maxCCC = 10000;
  let preMintedCCC = 500;
  let newlyMintedCCCWithPass = maxCCC - preMintedCCC - 4;

  let slotSize: BigNumber;
  let offsetInSlot: BigNumber;
  let lastTargetIndex: BigNumber;
  let holders: string[];
  let amounts: number[];

  before(async () => {
    [deployer, account1, account2] = await ethers.getSigners();

    const cccCalculation = new CCCRaffleCalculation__factory(deployer);
    cccCalculationContract = await cccCalculation.deploy();

    // account 1 holds ticker #0 #1
    // account 2 holds ticket #2 to #10
    // the rest are fillers
    holders = [account1.address, account2.address];
    amounts = [2, 9];
    for (let i = 0; i < 5; i++) {
      holders.push(EMPTY_ADDRESS);
      amounts.push(4);
    }
    totalTickets = amounts.reduce((a, b) => a + b, 0);
    await cccCalculationContract.setTicketHolders(holders, amounts);
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

  describe('calculateAllResults', async () => {
    it('emits SetResult event', async () => {
      const ticketPrice = await cccCalculationContract.ticketPrice();
      // const tx = await cccCalculationContract.calculateAllResults(
      //   slotSize,
      //   offsetInSlot,
      //   lastTargetIndex,
      //   noOfHolders
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
        .withArgs(account1.address, 0, ticketPrice.mul(2))
        .to.emit(cccCalculationContract, 'SetResult')
        .withArgs(account2.address, 2, ticketPrice.mul(7));
    });
  });

  describe('testCalculateValidTicketAmount', async () => {
    it('test winning ticket algorithm for account1', async () => {
      for (let i = 0; i < slotSize.toNumber(); i++) {
        offsetInSlot = BigNumber.from(i);
        const validTicketAmount = await cccCalculationContract.testCalculateValidTicketAmount(
          0,
          2,
          slotSize,
          offsetInSlot,
          lastTargetIndex
        );
        // console.log(i, validTicketAmount);
        if (i < 2) {
          expect(validTicketAmount).to.eq(1);
        } else {
          expect(validTicketAmount).to.eq(0);
        }
      }
    });

    it('test winning ticket algorithm for account2', async () => {
      for (let i = 0; i < slotSize.toNumber(); i++) {
        offsetInSlot = BigNumber.from(i);
        const validTicketAmount = await cccCalculationContract.testCalculateValidTicketAmount(
          2,
          9,
          slotSize,
          offsetInSlot,
          lastTargetIndex
        );
        // console.log(i, validTicketAmount);
        if (i >= 2 && i <= 3) {
          expect(validTicketAmount).to.eq(2);
        } else {
          expect(validTicketAmount).to.eq(1);
        }
      }
    });
  });
});