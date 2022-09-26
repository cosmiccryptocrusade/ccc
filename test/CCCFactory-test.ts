import chai from 'chai';
import { ethers } from 'hardhat';
import { Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { solidity } from 'ethereum-waffle';

chai.use(solidity);
const { expect } = chai;

const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000';
const MAX_SUPPLY = 5000;

const configs = {
  name: 'Test',
  symbol: 'TEST',
  baseURI: 'ifps://test/',
};

describe('CCCFactory', () => {
  let [deployer, account1]: SignerWithAddress[] = [];
  let cccFactoryContract: Contract;
  let cccStoreContract: Contract;

  beforeEach(async () => {
    [deployer, account1] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory('contracts/CCCFactory.sol:CCCFactory');
    cccFactoryContract = await Factory.deploy(
      configs.name,
      configs.symbol,
      configs.baseURI
    );

    const Store = await ethers.getContractFactory('Test_CCCStoreForFactory');
    cccStoreContract = await Store.deploy(cccFactoryContract.address);
  });

  describe('constructor', async () => {
    it('Should be initialized successfully', async () => {
      expect(await cccFactoryContract.name()).to.eq(configs.name);
      expect(await cccFactoryContract.symbol()).to.eq(configs.symbol);
      expect(await cccFactoryContract.baseURI()).to.eq(configs.baseURI);
      expect(await cccFactoryContract.MAX_SUPPLY()).to.eq(MAX_SUPPLY);
      expect(await cccFactoryContract.totalSupply()).to.eq(0);
      expect(await cccFactoryContract.owner()).to.eq(deployer.address);
      expect(await cccFactoryContract.cccStore()).to.eq(EMPTY_ADDRESS);
    });
  });

  describe('setCCCStore', async () => {
    it("fails for nonOwner's request", async () => {
      const nonOwner = account1;
      await expect(
        cccFactoryContract
          .connect(nonOwner)
          .setCCCStore(cccStoreContract.address)
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('sets CCCStore', async () => {
      let currentCCCStoreAddress = await cccFactoryContract.cccStore();
      expect(currentCCCStoreAddress).to.eq(EMPTY_ADDRESS);

      await cccFactoryContract
        .connect(deployer)
        .setCCCStore(cccStoreContract.address);
      currentCCCStoreAddress = await cccFactoryContract.cccStore();
      expect(currentCCCStoreAddress).to.eq(cccStoreContract.address);
    });

    it("emits 'SetCCCStore' event", async () => {
      await expect(
        cccFactoryContract
          .connect(deployer)
          .setCCCStore(cccStoreContract.address)
      )
        .to.emit(cccFactoryContract, 'SetCCCStore')
        .withArgs(cccStoreContract.address);
    });
  });

  describe('setBaseURI', async () => {
    const newBaseURI = 'http://new.com/';

    it("fails for nonOwner's request", async () => {
      const nonOwner = account1;
      await expect(
        cccFactoryContract.connect(nonOwner).setBaseURI(newBaseURI)
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('sets baseURI', async () => {
      let currentBaseURI = await cccFactoryContract.baseURI();
      expect(currentBaseURI).to.eq(configs.baseURI);

      await cccFactoryContract.connect(deployer).setBaseURI(newBaseURI);
      currentBaseURI = await cccFactoryContract.baseURI();
      expect(currentBaseURI).to.eq(newBaseURI);
    });

    it("emits 'SetBaseURI' event", async () => {
      await expect(cccFactoryContract.connect(deployer).setBaseURI(newBaseURI))
        .to.emit(cccFactoryContract, 'SetBaseURI')
        .withArgs(newBaseURI);
    });
  });

  describe('mint', async () => {
    it('fails if transaction sender is neither owner nor cccStore', async () => {
      let stranger = account1;

      expect(await cccFactoryContract.owner()).not.to.eq(stranger.address);
      expect(await cccFactoryContract.cccStore()).not.to.eq(stranger.address);

      await expect(
        cccFactoryContract.connect(stranger).mint(stranger.address)
      ).to.be.revertedWith('caller is neither cccStore nor owner');
    });

    it('successfully mint new token by owner', async () => {
      const owner = deployer;
      expect(await cccFactoryContract.owner()).to.eq(owner.address);

      const receiver = account1;

      const tokenId = await cccFactoryContract.totalSupply();
      await expect(cccFactoryContract.ownerOf(tokenId)).to.be.revertedWith(
        'ERC721: invalid token ID'
      );

      await cccFactoryContract.connect(owner).mint(receiver.address);

      const ownerOfToken = await cccFactoryContract.ownerOf(tokenId);
      expect(ownerOfToken).to.eq(receiver.address);

      const currentTotalSupply = await cccFactoryContract.totalSupply();
      expect(currentTotalSupply).to.eq(tokenId.toNumber() + 1);
    });

    it('successfully mint new token by cccStore', async () => {
      const cccStore = cccStoreContract;
      await cccFactoryContract.connect(deployer).setCCCStore(cccStore.address);
      expect(await cccFactoryContract.cccStore()).to.eq(cccStore.address);

      const receiver = account1;

      const tokenId = await cccFactoryContract.totalSupply();
      await expect(cccFactoryContract.ownerOf(tokenId)).to.be.revertedWith(
        'ERC721: invalid token ID'
      );

      await cccStore.connect(receiver).mint(receiver.address);

      const ownerOfToken = await cccFactoryContract.ownerOf(tokenId);
      expect(ownerOfToken).to.eq(receiver.address);

      const currentTotalSupply = await cccFactoryContract.totalSupply();
      expect(currentTotalSupply).to.eq(tokenId.toNumber() + 1);
    });
  });

  describe('tokenURI', async () => {
    it('returns with custom baseURI', async () => {
      const tokenId = await cccFactoryContract.totalSupply();
      await cccFactoryContract.connect(deployer).mint(deployer.address);

      let currentTokenURI = await cccFactoryContract.tokenURI(tokenId);
      expect(currentTokenURI).to.eq(`${configs.baseURI}${tokenId}`);

      const newBaseURI = 'http://new.com/';
      await cccFactoryContract.connect(deployer).setBaseURI(newBaseURI);
      expect(await cccFactoryContract.baseURI()).to.eq(newBaseURI);

      currentTokenURI = await cccFactoryContract.tokenURI(tokenId);
      expect(currentTokenURI).to.eq(`${newBaseURI}${tokenId}`);
    });
  });
});
