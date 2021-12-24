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
import { Result } from 'ethers/lib/utils';
import { string } from 'hardhat/internal/core/params/argumentTypes';
import * as fs from 'fs';

chai.use(solidity);
const { expect } = chai;

const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000';

interface IResultJson {
  holders: Array<string>,
  amount: Array<number>,
}

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
          holders.slice(i, i + pageSize),
          amounts.slice(i, i + pageSize),
          i
        );
        console.log("set", i);
      };
      // for (let i = 0; i < 10; i++) {
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
      const minimalABI = [
        "address",
        "uint256",
        "uint256"
      ]
      const ticketPrice = await cccCalculationContract.ticketPrice();
      let currTotal = 0;
      const decodedSetResultArray: Result[] = [];
      const abiCoder = new ethers.utils.AbiCoder();
      
      for (let i = 0; i < holders.length; i += pageSize) {
        const tx = await cccCalculationContract.calculateAllResults(
          slotSize,
          offsetInSlot,
          lastTargetIndex,
          i,
          Math.min(i + pageSize, holders.length),
          currTotal
        );
        const receipt = await tx.wait();
        const setResultEventArray = receipt.events?.filter((x) => {return x.event == "SetResult"});
        console.log("event1 -- ", setResultEventArray?setResultEventArray[0]:'No event');
        
        setResultEventArray?.map(
          (event) => {
            decodedSetResultArray.push(abiCoder.decode(minimalABI, event?event["data"]:""));
          }
        )
        console.log("event -- ", decodedSetResultArray);
        for (let j = i; j < i + pageSize; j++) {
          currTotal += amounts[j];
        }
        console.log("calc", i, currTotal);
        if (i == 0) {
          expect(tx)
            .to.emit(cccCalculationContract, 'SetResult')
            .withArgs(account1.address, 1, ticketPrice.mul(1))
            .to.emit(cccCalculationContract, 'SetResult')
            .withArgs(account2.address, 5, ticketPrice.mul(5));
        };
        //
      };

      const resultJson:IResultJson={
        holders: [],
        amount: []
      };
      // store the decoded result into a result file
      decodedSetResultArray.map(
        (result:Result) => {
          resultJson.holders.push(result[0])
          resultJson.amount.push((result[1]).toNumber())
        }
      );
      fs.writeFileSync( "result.json", JSON.stringify(resultJson))
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
    }).timeout(5000000);
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
    }).timeout(5000000);
  });
});