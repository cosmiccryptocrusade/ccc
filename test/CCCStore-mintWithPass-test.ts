import chai from 'chai';
import { ethers } from 'hardhat';
import {
  CCCFactory,
  CCCFactory__factory,
  CCCStore,
  CCCStore__factory,
  TestCCCPass as CCCPass,
  TestCCCPass__factory as CCCPass__factory,
} from '../types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { solidity } from 'ethereum-waffle';
import { testSets, testSetForPrint } from './utils/CalcHelper';
// import { intToHex } from 'ethjs-util';
import { signTypedData, DomainType, splitSignature } from './utils/EIP712';


chai.use(solidity);
const { expect } = chai;

const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000';
const MAX_SUPPLY = 10000;
const MAX_PRE_MINT_SUPPLY = 500;
const MAX_CCC_PER_PASS = 5;
const MAX_MINT_PER_TX = 30;
const TICKET_PRICE_IN_WEI = ethers.utils.parseEther('0.00008');
const OPERATION_SECONDS_FOR_VIP = 60 * 30;
const OPERATION_SECONDS = 3600 * 48;

const configs = {
  name: 'test',
  symbol: 'tst',
  baseURI: 'test.com/',
};

describe('claimPass', async () => {
  let [deployer, account1]: SignerWithAddress[] = [];
    let cccPassContract: CCCPass;
    let cccFactoryContract: CCCFactory;
    let cccStoreContract: CCCStore;
  
    const getCurrentTimestamp = async () => {
      const currentBlockNum = await ethers.provider.getBlockNumber();
      const currentBlock = await ethers.provider.getBlock(currentBlockNum);
      const currentTimestamp = currentBlock.timestamp;
      return currentTimestamp;
    };
  
    let currentTimestamp: number;

    let contractOwner: SignerWithAddress = deployer;
    let domain: DomainType;
    let types: any;
    let signature: string;

    // [v, r, s]
    let splitSig: [number, string, string];

    beforeEach(async () => {

      [deployer, account1] = await ethers.getSigners();
      contractOwner = deployer;
      const cccPassFactory = new CCCPass__factory(contractOwner);
        cccPassContract = await cccPassFactory.deploy(
          configs.name,
          configs.baseURI
        );

        const CCCFactory = new CCCFactory__factory(contractOwner);
        cccFactoryContract = await CCCFactory.deploy(
        configs.name,
        configs.symbol,
        configs.baseURI
        );

        const CCCStore = new CCCStore__factory(contractOwner);
        cccStoreContract = await CCCStore.deploy();

        console.log('contractOwner ', contractOwner.address);

        await cccFactoryContract.setCCCStore(cccStoreContract.address);
        await cccStoreContract.setCCCFactory(cccFactoryContract.address);
        await cccStoreContract.setPass(cccPassContract.address);
        await cccPassContract.setStore(cccStoreContract.address);
      domain = {
        name: configs.name,
        version: '1',
        chainId: 31337, // hardhat test chainId
        verifyingContract: cccPassContract.address,
      };
      types = {
        PassReq: [
          {
            name: 'receiver',
            type: 'address',
          },
          {
            name: 'amount',
            type: 'uint256',
          },
          {
            name: 'passType',
            type: 'uint8',
          },
        ],
      };
      signature = await signTypedData({
        signer: contractOwner,
        domain,
        types,
        data: {
          receiver: account1.address,
          amount: 3,
          passType: 0,
        },
      });
      const { r, s, v } = splitSignature(signature);
      splitSig = [v, r, s];

      const currentBlockNum = await ethers.provider.getBlockNumber();
      const currentBlock = await ethers.provider.getBlock(currentBlockNum);
      currentTimestamp = currentBlock.timestamp;

      await cccPassContract.setClaimUntil(currentTimestamp + 3600);
      await cccPassContract.unpause();

      let openingHours = 0;
      openingHours = await getCurrentTimestamp();
      await cccStoreContract.setOpeningHours(openingHours);

    });

    it('successfully mints claimed amount pass', async () => {
        const receiver = account1;
        const amount = 3;
        const passType = 0;
        const totalPrice = TICKET_PRICE_IN_WEI.mul(amount);

        const mintedAmount = await cccStoreContract.mintedCCCOf(receiver.address);
        const newlyMintedCCCWithPass = await cccStoreContract.newlyMintedCCCWithPass();

        await cccStoreContract
          .connect(receiver)
          .mintWithPass(3, amount, passType, ...splitSig, {value: totalPrice});

        expect(await cccStoreContract.mintedCCCOf(receiver.address)).to.eq(
          mintedAmount.toNumber() + amount
        );
        expect(await cccStoreContract.newlyMintedCCCWithPass()).to.eq(
          newlyMintedCCCWithPass.toNumber() + amount
        );
    });
})