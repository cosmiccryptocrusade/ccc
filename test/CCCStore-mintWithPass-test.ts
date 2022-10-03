import chai from 'chai';
import { ethers } from 'hardhat';
import { Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { solidity } from 'ethereum-waffle';
import { signTypedData, DomainType, splitSignature } from './utils/EIP712';

chai.use(solidity);
const { expect } = chai;

const MINT_PRICE = ethers.utils.parseEther('0.2');
const VIP_DISCOUNT = ethers.utils.parseEther('0.05');

const configs = {
  name: 'Test',
  symbol: 'TEST',
  baseURI: 'ipfs://test/',
};

describe('CCCStore-mintWithPass', async () => {
  let [deployer, account1]: SignerWithAddress[] = [];
    let cccFactoryContract: Contract;
    let cccPassContract: Contract;
    let cccStoreContract: Contract;
  
    const getCurrentTimestamp = async () => {
      const currentBlockNum = await ethers.provider.getBlockNumber();
      const currentBlock = await ethers.provider.getBlock(currentBlockNum);
      const currentTimestamp = currentBlock.timestamp;
      return currentTimestamp;
    };
  
    let contractOwner: SignerWithAddress = deployer;
    let domain: DomainType;
    let types: any;
    let signature: string;

    // [v, r, s]
    let splitSig: [number, string, string];

    beforeEach(async () => {

      [deployer, account1] = await ethers.getSigners();
      contractOwner = deployer;
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

      let openingHours = 0;
      openingHours = await getCurrentTimestamp();
      await cccStoreContract.setOpeningHours(openingHours);

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
        signer: contractOwner,
        domain,
        types,
        data: {
          receiver: account1.address,
          amount: 3,
        },
      });
      const { r, s, v } = splitSignature(signature);
      splitSig = [v, r, s];
    });

    it('successfully mints claimed amount pass', async () => {
        const receiver = account1;
        const mintAmount = 5;
        const discountAmount = 3;
        const totalPrice = MINT_PRICE.mul(mintAmount).sub(VIP_DISCOUNT.mul(discountAmount));

        const claimedCount = await cccPassContract.claimedCount(receiver.address);
        const CCCMinted = await cccStoreContract.CCCMinted(receiver.address);
        const totalCCCMinted = await cccStoreContract.totalCCCMinted();
        const totalCCCMintedByVIP = await cccStoreContract.totalCCCMintedByVIP();

        await cccStoreContract
          .connect(receiver)
          .mintCCC(3, mintAmount, ...splitSig, { value: totalPrice });

        expect(await cccPassContract.claimedCount(receiver.address)).to.eq(
          claimedCount.toNumber() + discountAmount
        );
        expect(await cccStoreContract.CCCMinted(receiver.address)).to.eq(
          CCCMinted.toNumber() + mintAmount
        );
        expect(await cccStoreContract.totalCCCMinted()).to.eq(
          totalCCCMinted.toNumber() + mintAmount
        );
        expect(await cccStoreContract.totalCCCMintedByVIP()).to.eq(
          totalCCCMintedByVIP.toNumber() + mintAmount
        );
    });
})