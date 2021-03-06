import chai from 'chai';
import { ethers } from 'hardhat';
import {
  CCCFactory,
  CCCFactory__factory,
  CCCStore,
  CCCStore__factory,
  TestCCCPass,
  TestCCCPass__factory,
} from '../types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { solidity } from 'ethereum-waffle';
import { signTypedData, DomainType, splitSignature } from './utils/EIP712';
import raffleResultsData from '../test/data/raffle-results-test-data.json';
import runRaffleData from '../test/data/run-raffle-test-data.json';

// import { intToHex } from 'ethjs-util';

chai.use(solidity);
const { expect } = chai;

const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000';
const MAX_SUPPLY = 10000;
const MAX_PRE_MINT_SUPPLY = 500;

const MAX_MINT_PER_TX = 10;
const TICKET_PRICE_IN_WEI = ethers.utils.parseEther('0.00008');
const OPERATION_SECONDS_FOR_VIP = 3600 * 9;
const OPERATION_SECONDS = 3600 * 24;

const configs = {
  name: 'test',
  symbol: 'tst',
  baseURI: 'test.com/',
};
let splitSig: [number, string, string];
let domain: DomainType;
let types: any;
let signature: string;

describe('CCCStore', () => {
  let [deployer, account1, account2]: SignerWithAddress[] = [];
  let passContract: TestCCCPass;
  let cccFactoryContract: CCCFactory;
  let cccStoreContract: CCCStore;

  const getCurrentTimestamp = async () => {
    const currentBlockNum = await ethers.provider.getBlockNumber();
    const currentBlock = await ethers.provider.getBlock(currentBlockNum);
    const currentTimestamp = currentBlock.timestamp;

    return currentTimestamp;
  };

  beforeEach(async () => {
    [deployer, account1, account2] = await ethers.getSigners();

    const Pass = new TestCCCPass__factory(deployer);
    passContract = await Pass.deploy(
      configs.name,
      configs.baseURI
    );

    const CCCFactory = new CCCFactory__factory(deployer);
    cccFactoryContract = await CCCFactory.deploy(
      configs.name,
      configs.symbol,
      configs.baseURI
    );

    const CCCStore = new CCCStore__factory(deployer);
    cccStoreContract = await CCCStore.deploy();

    await cccFactoryContract.setCCCStore(cccStoreContract.address);
    await cccStoreContract.setCCCFactory(cccFactoryContract.address);
    await cccStoreContract.setPass(passContract.address);
    await passContract.setStore(cccStoreContract.address);
    const currentTimestamp = await getCurrentTimestamp();
    await passContract.setClaimUntil(currentTimestamp + 360000);
    await passContract.unpause();
    


    domain = {
        name: configs.name,
        version: '1',
        chainId: 31337, // hardhat test chainId
        verifyingContract: passContract.address,
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
        signer: deployer,
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
  });

  describe('constructor', async () => {
    it('Should be initialized successfully', async () => {
      expect(await cccStoreContract.pass()).to.eq(passContract.address);
      expect(await cccStoreContract.cccFactory()).to.eq(
        cccFactoryContract.address
      );
      expect(await cccStoreContract.owner()).to.eq(deployer.address);
      expect(await cccStoreContract.maxCCC()).to.eq(MAX_SUPPLY);
      expect(await cccStoreContract.preMintedCCC()).to.eq(0);
      expect(await cccStoreContract.maxPreMintCCC()).to.eq(MAX_PRE_MINT_SUPPLY);
      expect(await cccStoreContract.newlyMintedCCCWithPass()).to.eq(0);

      expect(await cccStoreContract.openingHours()).to.eq(0);
      expect(await cccStoreContract.operationSecondsForVIP()).to.eq(
        OPERATION_SECONDS_FOR_VIP
      );
      expect(await cccStoreContract.operationSeconds()).to.eq(
        OPERATION_SECONDS
      );
      expect(await cccStoreContract.ticketPrice()).to.eq(TICKET_PRICE_IN_WEI);
      expect(await cccStoreContract.maxMintPerTx()).to.eq(MAX_MINT_PER_TX);
      expect(await cccStoreContract.mintedCCCOf(deployer.address)).to.eq(0);
    });
  });


  describe('setPass', async () => {
    it('fails if non-owner try to call', async () => {
      const nonOwner = account1;
      expect(await cccStoreContract.owner()).not.to.eq(nonOwner.address);

      await expect(
        cccStoreContract.connect(nonOwner).setPass(passContract.address)
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('changes pass address', async () => {
      const newPassAddress = account1.address;
      expect(await cccStoreContract.pass()).not.to.eq(newPassAddress);

      await cccStoreContract.connect(deployer).setPass(newPassAddress);

      expect(await cccStoreContract.pass()).to.eq(newPassAddress);
    });

    it("emits 'SetPass' event", async () => {
      await expect(
        cccStoreContract.connect(deployer).setPass(passContract.address)
      )
        .to.emit(cccStoreContract, 'SetPass')
        .withArgs(passContract.address);
    });
  });

  describe('setCCCFactory', async () => {
    it('fails if non-owner try to call', async () => {
      const nonOwner = account1;
      expect(await cccStoreContract.owner()).not.to.eq(nonOwner.address);

      await expect(
        cccStoreContract
          .connect(nonOwner)
          .setCCCFactory(cccFactoryContract.address)
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('changes cccFactory address', async () => {
      const newCCCFactoryAddress = account1.address;

      expect(await cccStoreContract.cccFactory()).not.to.eq(
        newCCCFactoryAddress
      );

      await cccStoreContract
        .connect(deployer)
        .setCCCFactory(newCCCFactoryAddress);

      expect(await cccStoreContract.cccFactory()).to.eq(newCCCFactoryAddress);
    });

    it("emits 'SetCCCFactory' event", async () => {
      await expect(
        cccStoreContract
          .connect(deployer)
          .setCCCFactory(cccFactoryContract.address)
      )
        .to.emit(cccStoreContract, 'SetCCCFactory')
        .withArgs(cccFactoryContract.address);
    });
  });


  describe('setOpeningHours', async () => {
    const testOpeningHours = 1000;

    it('fails if non-owner try to call', async () => {
      const nonOwner = account1;
      expect(await cccStoreContract.owner()).not.to.eq(nonOwner.address);

      await expect(
        cccStoreContract.connect(nonOwner).setOpeningHours(testOpeningHours)
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('changes openingHours', async () => {
      expect(await cccStoreContract.openingHours()).not.to.eq(testOpeningHours);

      await cccStoreContract
        .connect(deployer)
        .setOpeningHours(testOpeningHours);

      expect(await cccStoreContract.openingHours()).to.eq(testOpeningHours);
    });

    it("emits 'SetOpeningHours' event", async () => {
      await expect(
        cccStoreContract.connect(deployer).setOpeningHours(testOpeningHours)
      )
        .to.emit(cccStoreContract, 'SetOpeningHours')
        .withArgs(testOpeningHours);
    });
  });

  describe('preMintCCC', async () => {
    let openingHours = 0;

    beforeEach(async () => {
      openingHours = await getCurrentTimestamp();
      await cccStoreContract.setOpeningHours(openingHours);
    });

    it('fails for empty recipients', async () => {
      await expect(
        cccStoreContract.connect(deployer).preMintCCC([])
      ).to.be.revertedWith('Number of recipients must be greater than 0');
    });

    it('fails if amount of recipients exceeds allowed amount', async () => {
      await expect(
        cccStoreContract
          .connect(deployer)
          .preMintCCC(new Array(MAX_PRE_MINT_SUPPLY + 1).fill(deployer.address))
      ).to.be.revertedWith('Exceeds max pre-mint CCC');
    });

    it('fails if one of recipients address is zero', async () => {
      await expect(
        cccStoreContract
          .connect(deployer)
          .preMintCCC([deployer.address, EMPTY_ADDRESS])
      ).to.be.revertedWith('receiver can not be empty address');
    });

    it('successfully mint multiple CCC', async () => {
      const mintAmount = MAX_PRE_MINT_SUPPLY;
      const preMintedCCCAmountBefore = await cccStoreContract.preMintedCCC();

      await cccStoreContract
        .connect(deployer)
        .preMintCCC(new Array(mintAmount).fill(deployer.address));

      const preMintedCCCAmountAfter = await cccStoreContract.preMintedCCC();

      expect(preMintedCCCAmountAfter).to.eq(
        preMintedCCCAmountBefore.add(mintAmount)
      );
    });

    it('successfully minted to each recipients', async () => {
      const recipientsInfo = {
        [deployer.address]: 1,
        [account1.address]: MAX_PRE_MINT_SUPPLY - 1,
      };
      const balanceBeforeInfo: { [key: string]: number } = {};
      await Promise.all(
        Object.keys(recipientsInfo).map(async (addr) => {
          const balance = await cccFactoryContract.balanceOf(addr);

          balanceBeforeInfo[addr] = balance.toNumber();
        })
      );

      const recipients: string[] = [];
      Object.entries(recipientsInfo).forEach(([addr, amount]) => {
        recipients.push(...new Array(amount).fill(addr));
      });

      await cccStoreContract.connect(deployer).preMintCCC(recipients);

      await Promise.all(
        Object.keys(recipientsInfo).map(async (addr) => {
          const balance = await cccFactoryContract.balanceOf(addr);

          expect(balance).to.eq(recipientsInfo[addr]);
        })
      );
    });

    it('fails if non-owner try to call', async () => {
      const nonOwner = account1;
      expect(await cccStoreContract.owner()).not.to.eq(nonOwner.address);

      await expect(
        cccStoreContract.connect(nonOwner).preMintCCC([nonOwner.address])
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('fails if ticketing period is over', async () => {
      const closingHours =
        openingHours + OPERATION_SECONDS_FOR_VIP + OPERATION_SECONDS;

      let currentBlockNum = await ethers.provider.getBlockNumber();
      let currentBlock = await ethers.provider.getBlock(currentBlockNum);
      let currentTimestamp = currentBlock.timestamp;
      expect(currentTimestamp).to.lt(closingHours);

      await expect(cccStoreContract.preMintCCC([deployer.address])).not.to.be
        .reverted;

      await ethers.provider.send('evm_increaseTime', [closingHours + 1]);
      await ethers.provider.send('evm_mine', []);

      currentBlockNum = await ethers.provider.getBlockNumber();
      currentBlock = await ethers.provider.getBlock(currentBlockNum);
      currentTimestamp = currentBlock.timestamp;
      expect(currentTimestamp).to.gt(closingHours);

      await expect(
        cccStoreContract.preMintCCC([deployer.address])
      ).to.be.revertedWith('Not available after ticketing period');
    });

    it('mints one CCC to receiver', async () => {
      const receiver = account1;
      const balanceOfReceiver = await cccFactoryContract.balanceOf(
        receiver.address
      );
      const preMintedCCCAmount = await cccStoreContract.preMintedCCC();

      await cccStoreContract.connect(deployer).preMintCCC([receiver.address]);
      expect(await cccFactoryContract.balanceOf(receiver.address)).to.eq(
        balanceOfReceiver.toNumber() + 1
      );
      expect(await cccStoreContract.preMintedCCC()).to.eq(
        preMintedCCCAmount.toNumber() + 1
      );
    });

    it('fails after maxPreMintedCCC number', async () => {
      const receiver = account1;
      const tasks = Promise.all(
        new Array(MAX_PRE_MINT_SUPPLY + 1)
          .fill(null)
          .map(() =>
            cccStoreContract.connect(deployer).preMintCCC([receiver.address])
          )
      );

      await expect(tasks).to.be.revertedWith('Exceeds max pre-mint CCC');
    });

    it('fails for zero address receiver', async () => {
      const receiver = EMPTY_ADDRESS;
      expect(
        cccStoreContract.connect(deployer).preMintCCC([receiver])
      ).to.be.revertedWith('receiver can not be empty address');
    });
  });

  describe('mintWithPass', async () => {
    let openingHours = 0;
    const passType = 0;

    beforeEach(async () => {
      openingHours = await getCurrentTimestamp();
      await cccStoreContract.setOpeningHours(openingHours);
    });

    it('fails if store is not opened', async () => {
      await cccStoreContract.setOpeningHours(openingHours + 24 * 3600);

      await expect(cccStoreContract
      .mintWithPass(3, 1, passType, ...splitSig, {value: TICKET_PRICE_IN_WEI.mul(1)}))
      .to.be.revertedWith(
        'Store is not opened for VIP'
      );
    });

    it('fails if vip time is over', async () => {
      await cccStoreContract.setOpeningHours(0);

      await expect(cccStoreContract
        .mintWithPass(3, 1, passType, ...splitSig, {value: TICKET_PRICE_IN_WEI.mul(1)}))
        .to.be.revertedWith(
        'Store is closed for VIP'
      );
    });

    it('fails if mint amount exceeds maxMintPerTx', async () => {
      await expect(
        cccStoreContract
        .mintWithPass(3, MAX_MINT_PER_TX + 1, passType, ...splitSig, {value: TICKET_PRICE_IN_WEI.mul(MAX_MINT_PER_TX + 1)}))
      .to.be.revertedWith('mint amount exceeds maximum');
    });

    it('fails for zero amount', async () => {
      await expect(cccStoreContract
      .mintWithPass(3, 0, passType, ...splitSig, {value: TICKET_PRICE_IN_WEI}))
      .to.be.revertedWith(
        'Need to mint more than 0'
      );
    });

    it('fails if mint amount exceeds allowed quantity (pass qty)', async () => {
      const receiver = account1;
      const amount = 3;
      const totalPrice = TICKET_PRICE_IN_WEI.mul(amount);

      expect(await passContract.claimedType0Count(receiver.address)).to.eq(0);
      await cccStoreContract.connect(receiver).mintWithPass(3, 1, passType, ...splitSig, {value: TICKET_PRICE_IN_WEI});
      expect(await passContract.claimedType0Count(receiver.address)).to.eq(1);

      await expect(
        cccStoreContract.connect(receiver).mintWithPass(3, amount, passType, ...splitSig, {value: totalPrice})
      ).to.be.reverted;
    });

    it('fails if zero ether is sent', async () => {
      const receiver = account1;

      await expect(
        cccStoreContract.connect(receiver)
        .mintWithPass(3, 1, passType, ...splitSig, {value: 0}))
        .to.be.revertedWith('Not enough money');
    });

    it('fails if not enough ether is sent', async () => {
      const receiver = account1;
      const amount = 3;
      const totalPrice = TICKET_PRICE_IN_WEI.mul(amount);

      await expect(
        cccStoreContract
          .connect(receiver)
          .mintWithPass(3, 3, passType, ...splitSig, { value: totalPrice.sub(1)}))
          .to.be.revertedWith('Not enough money');
    });

    it('mints requested amount to message sender', async () => {
      const receiver = account1;
      const amount = 3;
      const totalPrice = TICKET_PRICE_IN_WEI.mul(amount);

      const mintedAmount = await cccStoreContract.mintedCCCOf(receiver.address);
      const newlyMintedCCCWithPass =
        await cccStoreContract.newlyMintedCCCWithPass();

      await cccStoreContract
        .connect(receiver)
        .mintWithPass(3, amount, passType, ...splitSig, { value: totalPrice});

      expect(await cccStoreContract.mintedCCCOf(receiver.address)).to.eq(
        mintedAmount.toNumber() + amount
      );
      expect(await cccStoreContract.newlyMintedCCCWithPass()).to.eq(
        newlyMintedCCCWithPass.toNumber() + amount
      );
    });

    it('mints multiple until reaches max available amount', async () => {
      const receiver = account1;
      const amount = 3;
      const totalPrice = TICKET_PRICE_IN_WEI.mul(amount);

      const mintedAmount = await cccStoreContract.mintedCCCOf(receiver.address);
      const newlyMintedCCCWithPass =
        await cccStoreContract.newlyMintedCCCWithPass();

      await cccStoreContract
        .connect(receiver)
        .mintWithPass(3, amount - 1, passType, ...splitSig, { value: totalPrice});

      expect(await cccStoreContract.mintedCCCOf(receiver.address)).to.eq(
        mintedAmount.toNumber() + amount - 1
      );
      expect(await cccStoreContract.newlyMintedCCCWithPass()).to.eq(
        newlyMintedCCCWithPass.toNumber() + amount - 1
      );

      await cccStoreContract
        .connect(receiver)
        .mintWithPass(3, 1, passType, ...splitSig, { value: totalPrice});

      expect(await cccStoreContract.mintedCCCOf(receiver.address)).to.eq(
        mintedAmount.toNumber() + amount
      );
      expect(await cccStoreContract.newlyMintedCCCWithPass()).to.eq(
        newlyMintedCCCWithPass.toNumber() + amount
      );
    });

    it("accumulate received ether in it's contract", async () => {
      const receiver = account1;
      const amount = 3;
      const totalPrice = TICKET_PRICE_IN_WEI.mul(amount);

      const ethBalanceOfContract = await ethers.provider.getBalance(
        cccStoreContract.address
      );

      await cccStoreContract
        .connect(receiver)
        .mintWithPass(3, amount, passType, ...splitSig, { value: totalPrice});

      expect(await ethers.provider.getBalance(cccStoreContract.address)).to.eq(
        ethBalanceOfContract.add(totalPrice)
      );
    });

    it('returns changes', async () => {
      const receiver = account1;
      const amount = 3;
      const extraAmountInWei = 100;
      const totalPrice = TICKET_PRICE_IN_WEI.mul(amount);

      const ethBalanceOfContract = await ethers.provider.getBalance(
        cccStoreContract.address
      );
      const ethBalanceOfReceiver = await ethers.provider.getBalance(
        receiver.address
      );

      await cccStoreContract.connect(receiver)
      .mintWithPass(3, amount, passType, ...splitSig, { value: totalPrice.add(extraAmountInWei),
        gasPrice: 0,
      });

      expect(await ethers.provider.getBalance(cccStoreContract.address)).to.eq(
        ethBalanceOfContract.add(totalPrice)
      );
      expect(await ethers.provider.getBalance(receiver.address)).to.eq(
        ethBalanceOfReceiver.sub(totalPrice)
      );
    });

    it("emits 'MintWithPass' event", async () => {
      const receiver = account1;

      await expect(
        cccStoreContract
          .connect(receiver)
          .mintWithPass(3, 1, passType, ...splitSig, { value: TICKET_PRICE_IN_WEI})
      )
        .to.emit(cccStoreContract, 'MintWithPass')
        .withArgs(receiver.address, 1, 0);

      const changes = 100;
      await expect(
        cccStoreContract
          .connect(receiver)
          .mintWithPass(3, 2, passType, ...splitSig, { value: TICKET_PRICE_IN_WEI.mul(2).add(changes)})
      )
        .to.emit(cccStoreContract, 'MintWithPass')
        .withArgs(receiver.address, 2, changes);
    });
  });

  describe('mintCCC', async () => {
    let publicMinter: SignerWithAddress;
    let openingHours = 0

    beforeEach(async () => {
      openingHours = await getCurrentTimestamp();
      await cccStoreContract.setOpeningHours(openingHours);
      await ethers.provider.send('evm_increaseTime', [
        OPERATION_SECONDS_FOR_VIP + OPERATION_SECONDS / 2,
      ]);
      await ethers.provider.send('evm_mine', []);

      publicMinter = account1;
    });

    it('fails if before opening hours', async () => {
      await cccStoreContract.setOpeningHours(openingHours + OPERATION_SECONDS_FOR_VIP + OPERATION_SECONDS + 3600);

      await expect(cccStoreContract
        .mintCCC(1, {value: TICKET_PRICE_IN_WEI}))
        .to.be.revertedWith('Store is not opened');
    });

    it('fails if after opening hours', async () => {
      await cccStoreContract.setOpeningHours(0);

      await expect(cccStoreContract
        .mintCCC(1, {value: TICKET_PRICE_IN_WEI}))
        .to.be.revertedWith('Store is closed');
    });

    it('fails if mint amount exceeds maxMintPerTx', async () => {
      await expect(cccStoreContract
        .mintCCC(31, {value: TICKET_PRICE_IN_WEI.mul(31)}))
        .to.be.revertedWith('mint amount exceeds maximum');
    });

    it('fails for zero amount', async () => {
      await expect(cccStoreContract
        .mintCCC(0))
        .to.be.revertedWith('Need to mint more than 0');
    });

    it('fails if zero ether is sent', async () => {
      await expect(
        cccStoreContract
        .mintCCC(1, {value: 0}))
        .to.be.revertedWith('Not enough money');
    });

    it('fails if not enough ether is sent', async () => {
      await expect(
        cccStoreContract
        .mintCCC(2, {value: TICKET_PRICE_IN_WEI}))
        .to.be.revertedWith('Not enough money');
    });

    it('mints requested amount to message sender', async () => {
      const amount = 3;
      const totalPrice = TICKET_PRICE_IN_WEI.mul(amount);

      const mintedAmount = await cccStoreContract.publicMintedCCCOf(publicMinter.address);
      const newlyMintedCCCPublic = await cccStoreContract.newlyMintedCCCPublic();

      await cccStoreContract
        .connect(publicMinter)
        .mintCCC(amount, {value: totalPrice});

      expect(await cccStoreContract.publicMintedCCCOf(publicMinter.address)).to.eq(
        mintedAmount.toNumber() + amount
      );
      expect(await cccStoreContract.newlyMintedCCCPublic()).to.eq(
        newlyMintedCCCPublic.toNumber() + amount
      );
    });

    it("accumulate received ether in it's contract", async () => {
      const amount = 3;
      const totalPrice = TICKET_PRICE_IN_WEI.mul(amount);

      const ethBalanceOfContract = await ethers.provider.getBalance(
        cccStoreContract.address
      );

      await cccStoreContract
        .connect(publicMinter)
        .mintCCC(amount, {value: totalPrice});

      expect(await ethers.provider.getBalance(cccStoreContract.address)).to.eq(
        ethBalanceOfContract.add(totalPrice)
      );
    });

    it('returns changes', async () => {
      const amount = 3;
      const totalPrice = TICKET_PRICE_IN_WEI.mul(amount);

      const ethBalanceOfContract = await ethers.provider.getBalance(
        cccStoreContract.address
      );
      const ethBalanceOfReceiver = await ethers.provider.getBalance(
        publicMinter.address
      );

      await cccStoreContract
        .connect(publicMinter)
        .mintCCC(amount, {value: totalPrice, gasPrice: 0});

      expect(await ethers.provider.getBalance(cccStoreContract.address)).to.eq(
        ethBalanceOfContract.add(totalPrice)
      );
      expect(await ethers.provider.getBalance(publicMinter.address)).to.eq(
        ethBalanceOfReceiver.sub(totalPrice)
      );
    });

    it("emits 'MintCCC' event", async () => {
      const amount = 3;
      const totalPrice = TICKET_PRICE_IN_WEI.mul(amount);

      await expect(cccStoreContract
        .connect(publicMinter)
        .mintCCC(amount, {value: totalPrice})
      )
        .to.emit(cccStoreContract, 'MintCCC')
        .withArgs(publicMinter.address, amount, 0);

      const changes = 100;
      await expect(cccStoreContract
        .connect(publicMinter)
        .mintCCC(amount, {value: totalPrice.add(changes)})
      )
        .to.emit(cccStoreContract, 'MintCCC')
        .withArgs(publicMinter.address, amount, changes);
    });
  });

  describe('shuffle', async () => {
    it("fails if error", async () => {
      const shuffledArray = await cccStoreContract.shuffle(1000);
    });
  });

  describe('withdraw', async () => {
    beforeEach(async () => {
      const openingHours = await getCurrentTimestamp();
      await cccStoreContract.connect(deployer).setOpeningHours(openingHours);
      await ethers.provider.send('evm_increaseTime', [
        OPERATION_SECONDS_FOR_VIP + OPERATION_SECONDS / 2,
      ]);
      await ethers.provider.send('evm_mine', []);
    });

    it("fails for non-owner's request", async () => {
      const nonOwner = account1;

      await expect(
        cccStoreContract.connect(nonOwner).withdraw(nonOwner.address,TICKET_PRICE_IN_WEI.mul(MAX_SUPPLY * 2))
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('fails for zero address receiver', async () => {
      await expect(
        cccStoreContract.connect(deployer).withdraw(EMPTY_ADDRESS, 1)
      ).to.be.revertedWith('receiver cant be empty address');
    });

    it('sends appropriate eth value', async () => {
      const publicMinter = account1;
      const amount = 10;
      const totalPrice = TICKET_PRICE_IN_WEI.mul(amount);

      await cccStoreContract.connect(publicMinter).mintCCC(amount, {
        value: totalPrice,
      });

      const receiver = account2;

      const receiverBalanceBefore = await ethers.provider.getBalance(
        receiver.address
      );

      await expect(
        cccStoreContract.connect(deployer).withdraw(receiver.address, totalPrice)
      ).not.to.be.reverted;

      const receiverBalanceAfter = await ethers.provider.getBalance(
        receiver.address
      );
      expect(receiverBalanceAfter).to.eq(
        receiverBalanceBefore.add(
          totalPrice
        )
      );
    });

    it("emits 'Withdraw' event", async () => {
      const amount = 10;
      const totalPrice = TICKET_PRICE_IN_WEI.mul(amount);

      await cccStoreContract.connect(deployer).mintCCC(amount, {
        value: totalPrice,
      });

      await expect(cccStoreContract.withdraw(deployer.address, totalPrice))
        .to.emit(cccStoreContract, 'Withdraw')
        .withArgs(deployer.address);
    });
  });

});
