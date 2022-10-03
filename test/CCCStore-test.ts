import chai from 'chai';
import { ethers } from 'hardhat';
import { Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { solidity } from 'ethereum-waffle';
import { signTypedData, DomainType, splitSignature } from './utils/EIP712';

chai.use(solidity);
const { expect } = chai;

const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000';
const MAX_SUPPLY = 5000;
const MAX_PRE_MINT_SUPPLY = 345;
const MAX_MINT_PER_TX = 100;
const MINT_PRICE = ethers.utils.parseEther('0.2');
const VIP_DISCOUNT = ethers.utils.parseEther('0.05');
const OPENING_HOURS = 1665411010; // 2022-10-10 22:10:10 GMT+8

const configs = {
  name: 'Test',
  symbol: 'TEST',
  baseURI: 'ifps://test/',
};

let splitSig: [number, string, string];
let noSig: [number, string, string];
let domain: DomainType;
let types: any;
let signature: string;

describe('CCCStore', () => {
  let [deployer, account1, account2]: SignerWithAddress[] = [];
  let cccFactoryContract: Contract;
  let cccPassContract: Contract;
  let cccStoreContract: Contract;

  const getCurrentTimestamp = async () => {
    const currentBlockNum = await ethers.provider.getBlockNumber();
    const currentBlock = await ethers.provider.getBlock(currentBlockNum);
    const currentTimestamp = currentBlock.timestamp;

    return currentTimestamp;
  };

  beforeEach(async () => {
    [deployer, account1, account2] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory('contracts/CCCFactory.sol:CCCFactory');
    cccFactoryContract = await Factory.deploy(
      configs.name,
      configs.symbol,
      configs.baseURI
    );

    const Pass = await ethers.getContractFactory('contracts/CCCPass.sol:CCCPass');
    cccPassContract = await Pass.deploy(configs.name);

    const Store = await ethers.getContractFactory('CCCStore');
    cccStoreContract = await Store.deploy();

    await cccFactoryContract.setCCCStore(cccStoreContract.address);
    await cccStoreContract.setCCCFactory(cccFactoryContract.address);
    await cccStoreContract.setCCCPass(cccPassContract.address);
    await cccPassContract.setCCCStore(cccStoreContract.address);

    await cccPassContract.unpause();

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
        ],
      };
      signature = await signTypedData({
        signer: deployer,
        domain,
        types,
        data: {
          receiver: account1.address,
          amount: 3,
        },
      });
      const { r, s, v } = splitSignature(signature);
      splitSig = [v, r, s];
      noSig = [0, "0x0000000000000000000000000000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000000000000000000000000000"];
  });

  describe('constructor', async () => {
    it('Should be initialized successfully', async () => {
      expect(await cccStoreContract.cccPass()).to.eq(cccPassContract.address);
      expect(await cccStoreContract.cccFactory()).to.eq(
        cccFactoryContract.address
      );
      expect(await cccStoreContract.owner()).to.eq(deployer.address);
      expect(await cccStoreContract.shuffleNumber()).to.eq(0);
      expect(await cccStoreContract.maxCCC()).to.eq(MAX_SUPPLY);
      expect(await cccStoreContract.maxCCCForTeam()).to.eq(MAX_PRE_MINT_SUPPLY);
      expect(await cccStoreContract.totalCCCMinted()).to.eq(0);
      expect(await cccStoreContract.totalCCCMintedByTeam()).to.eq(0);
      expect(await cccStoreContract.totalCCCMintedByVIP()).to.eq(0);
      expect(await cccStoreContract.CCCMinted(deployer.address)).to.eq(0);
      expect(await cccStoreContract.totalETHDonated()).to.eq(0);
      expect(await cccStoreContract.totalETHDonatedByVIP()).to.eq(0);
      expect(await cccStoreContract.openingHours()).to.eq(OPENING_HOURS);
      expect(await cccStoreContract.mintPrice()).to.eq(MINT_PRICE);
      expect(await cccStoreContract.VIPDiscount()).to.eq(VIP_DISCOUNT);
      expect(await cccStoreContract.maxMintPerTx()).to.eq(MAX_MINT_PER_TX);
    });
  });


  describe('setCCCPass', async () => {
    it('fails if non-owner try to call', async () => {
      const nonOwner = account1;
      expect(await cccStoreContract.owner()).not.to.eq(nonOwner.address);

      await expect(
        cccStoreContract.connect(nonOwner).setCCCPass(cccPassContract.address)
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('changes pass address', async () => {
      const newPassAddress = account1.address;
      expect(await cccStoreContract.cccPass()).not.to.eq(newPassAddress);

      await cccStoreContract.connect(deployer).setCCCPass(newPassAddress);

      expect(await cccStoreContract.cccPass()).to.eq(newPassAddress);
    });

    it("emits 'SetCCCPass' event", async () => {
      await expect(
        cccStoreContract.connect(deployer).setCCCPass(cccPassContract.address)
      )
        .to.emit(cccStoreContract, 'SetCCCPass')
        .withArgs(cccPassContract.address);
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
    it('fails if non-owner try to call', async () => {
      const nonOwner = account1;
      expect(await cccStoreContract.owner()).not.to.eq(nonOwner.address);

      await expect(
        cccStoreContract.connect(nonOwner).preMintCCC()
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('successfully premint multiple CCC', async () => {
      const totalCCCMintedByTeamBefore = await cccStoreContract.totalCCCMintedByTeam();
      expect(totalCCCMintedByTeamBefore).to.eq(0);
      const totalCCCMintedBefore = await cccStoreContract.totalCCCMinted();
      const ownerCCCMintedBefore = await cccStoreContract.CCCMinted(cccStoreContract.owner());

      await cccStoreContract.connect(deployer).preMintCCC();

      const totalCCCMintedByTeamAfter = await cccStoreContract.totalCCCMintedByTeam();
      expect(totalCCCMintedByTeamAfter).to.eq(MAX_PRE_MINT_SUPPLY);
      const totalCCCMintedAfter = await cccStoreContract.totalCCCMinted();
      expect(totalCCCMintedAfter).to.eq(totalCCCMintedBefore.add(MAX_PRE_MINT_SUPPLY));
      const ownerCCCMintedAfter = await cccStoreContract.CCCMinted(cccStoreContract.owner());
      expect(ownerCCCMintedAfter).to.eq(ownerCCCMintedBefore.add(MAX_PRE_MINT_SUPPLY));
    });

    it('fails if premint was done', async () => {
      await cccStoreContract.connect(deployer).preMintCCC();
      await expect(
        cccStoreContract.connect(deployer).preMintCCC()
      ).to.be.revertedWith('preMint was done');
    });
  });

  describe('mintCCC', async () => {
    let openingHours = 0;

    beforeEach(async () => {
      openingHours = await getCurrentTimestamp();
      await cccStoreContract.setOpeningHours(openingHours);
    });

    it('fails if store is not opened', async () => {
      await cccStoreContract.setOpeningHours(openingHours + 24 * 3600);

      await expect(cccStoreContract
      .mintCCC(0, 1, ...noSig, { value: MINT_PRICE.mul(1) }))
      .to.be.revertedWith(
        'Store is not opened'
      );
    });

    it('fails if mint amount exceeds maxMintPerTx', async () => {
      await expect(
        cccStoreContract
        .mintCCC(0, MAX_MINT_PER_TX + 1, ...noSig, { value: MINT_PRICE.mul(MAX_MINT_PER_TX + 1) }))
      .to.be.revertedWith('mint amount exceeds maximum');
    });

    it('fails for zero amount', async () => {
      await expect(cccStoreContract
      .mintCCC(0, 0, ...noSig, { value: MINT_PRICE }))
      .to.be.revertedWith(
        'Need to mint more than 0'
      );
    });

    it('fails if zero ether is sent', async () => {
      const receiver = account1;

      await expect(
        cccStoreContract.connect(receiver)
        .mintCCC(0, 1, ...noSig, { value: 0 }))
        .to.be.revertedWith('Not enough money');
    });

    it('fails if not enough ether is sent for mint with pass', async () => {
      const receiver = account1;
      let amount = 1;
      let totalPrice = MINT_PRICE.mul(amount).sub(VIP_DISCOUNT.mul(amount));

      expect(await cccPassContract.claimedCount(receiver.address)).to.eq(0);
      await cccStoreContract.connect(receiver).mintCCC(3, amount, ...splitSig, { value: totalPrice });
      expect(await cccPassContract.claimedCount(receiver.address)).to.eq(amount);

      amount = 3;
      totalPrice = MINT_PRICE.mul(amount).sub(VIP_DISCOUNT.mul(amount));
      await expect(
        cccStoreContract.connect(receiver).mintCCC(3, amount, ...splitSig, { value: totalPrice })
      ).to.be.revertedWith("Not enough money");
    });

    it('correctly calculates remaining discount for mint with pass', async () => {
      const receiver = account1;
      let amount = 1;
      let totalPrice = MINT_PRICE.mul(amount).sub(VIP_DISCOUNT.mul(amount));

      expect(await cccPassContract.claimedCount(receiver.address)).to.eq(0);
      await cccStoreContract.connect(receiver).mintCCC(3, amount, ...splitSig, { value: totalPrice });
      expect(await cccPassContract.claimedCount(receiver.address)).to.eq(amount);

      amount = 3;
      totalPrice = MINT_PRICE.mul(amount).sub(VIP_DISCOUNT.mul(2));
      await cccStoreContract.connect(receiver).mintCCC(3, amount, ...splitSig, { value: totalPrice });
      expect(await cccPassContract.claimedCount(receiver.address)).to.eq(amount);
    });

    it('mints requested amount to sender', async () => {
      const receiver = account1;
      const amount = 3;
      const totalPrice = MINT_PRICE.mul(amount);

      const totalCCCMinted = await cccStoreContract.totalCCCMinted();
      const senderCCCMinted = await cccStoreContract.CCCMinted(receiver.address);
      const totalETHDonated = await cccStoreContract.totalETHDonated();

      await cccStoreContract
        .connect(receiver)
        .mintCCC(0, amount, ...noSig, { value: totalPrice });

      expect(await cccStoreContract.totalCCCMinted()).to.eq(
        totalCCCMinted.add(amount)
      );
      expect(await cccStoreContract.CCCMinted(receiver.address)).to.eq(
        senderCCCMinted.add(amount)
      );
      expect(await cccStoreContract.totalETHDonated()).to.eq(
        totalETHDonated.add(totalPrice)
      );
    });

    it("accumulate received ether in it's contract", async () => {
      const receiver = account1;
      const amount = 3;
      const totalPrice = MINT_PRICE.mul(amount);

      const ethBalanceOfContract = await ethers.provider.getBalance(
        cccStoreContract.address
      );

      await cccStoreContract
        .connect(receiver)
        .mintCCC(0, amount, ...noSig, { value: totalPrice });

      expect(await ethers.provider.getBalance(cccStoreContract.address)).to.eq(
        ethBalanceOfContract.add(totalPrice)
      );
    });

    it("emits 'MintCCC' event", async () => {
      const receiver = account1;

      await expect(
        cccStoreContract
          .connect(receiver)
          .mintCCC(0, 1, ...noSig, { value: MINT_PRICE })
      )
        .to.emit(cccStoreContract, 'MintCCC')
        .withArgs(receiver.address, 1);
    });
  });

  // describe('shuffle', async () => {
  //   it("fails if error", async () => {
  //     const shuffledArray = await cccStoreContract.shuffle(1000);
  //   });
  // });

  describe('withdraw', async () => {
    it("fails for non-owner's request", async () => {
      const nonOwner = account1;

      await expect(
        cccStoreContract.connect(nonOwner).withdraw(nonOwner.address, 1)
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('fails for zero address receiver', async () => {
      await expect(
        cccStoreContract.connect(deployer).withdraw(EMPTY_ADDRESS, 1)
      ).to.be.revertedWith('receiver cant be empty address');
    });

    it('sends appropriate eth value', async () => {
      const receiver = account1;
      const amount = 10;
      const totalPrice = MINT_PRICE.mul(amount);

      await cccStoreContract.connect(deployer).setOpeningHours(0);
      await cccStoreContract
        .connect(receiver)
        .mintCCC(0, amount, ...noSig, { value: totalPrice });

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
      const receiver = account1;
      const amount = 10;
      const totalPrice = MINT_PRICE.mul(amount);

      await cccStoreContract.connect(deployer).setOpeningHours(0);
      await cccStoreContract
        .connect(receiver)
        .mintCCC(0, amount, ...noSig, { value: totalPrice });

      await expect(cccStoreContract.withdraw(deployer.address, totalPrice))
        .to.emit(cccStoreContract, 'Withdraw')
        .withArgs(deployer.address);
    });
  });

});
