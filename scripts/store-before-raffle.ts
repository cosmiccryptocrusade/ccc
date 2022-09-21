import { ethers } from 'hardhat';

const storeAddress = '0x8837E6100912Bdf52B12A24807800e6BD3BaC506';

const main: () => Promise<any> = async () => {
  const [deployer, public1, public2, vip1, vip2] = await ethers.getSigners();
  console.log('init contracts with the account:', deployer.address);

  const Store = await ethers.getContractFactory('CCCStore');
  const cccStoreContract = await Store.attach(storeAddress);

  const mintPrice = await cccStoreContract.mintPrice();
  const VIPDiscount = await cccStoreContract.VIPDiscount();

  // preMintCCC
  // await cccStoreContract.preMintCCC();
  // console.log('Completed preMintCCC');
  // console.log((await cccStoreContract.totalCCCMinted()).toString());
  // console.log((await cccStoreContract.totalCCCMintedByTeam()).toString());

  // mintCCC
  // console.log(public1.address);
  // await cccStoreContract.connect(public1).mintCCC(
  //   0,
  //   1,
  //   0,
  //   "0x0000000000000000000000000000000000000000000000000000000000000000",
  //   "0x0000000000000000000000000000000000000000000000000000000000000000",
  //   { value: mintPrice.mul(0), gasLimit: 100000 }
  // );
  // console.log((await cccStoreContract.totalCCCMinted()).toString());
  // console.log((await cccStoreContract.totalETHDonated()).toString());

  // await cccStoreContract.connect(public2).mintCCC(
  //   0,
  //   5,
  //   0,
  //   "0x0000000000000000000000000000000000000000000000000000000000000000",
  //   "0x0000000000000000000000000000000000000000000000000000000000000000",
  //   { value: mintPrice.mul(4) }
  // );
  // console.log((await cccStoreContract.totalCCCMinted()).toString());
  // console.log((await cccStoreContract.totalETHDonated()).toString());

  // await cccStoreContract.connect(vip1).mintCCC(
  //   5,
  //   2,
  //   27,
  //   "0x8c92f0966089ed392c385cca2db4861306d7655a74ab0a024d32af18e18a17da",
  //   "0x18d4239813128efb8c8342fd877bfeefb07be0e5332356f34bf22bdf1e7a33db",
  //   { value: mintPrice.mul(2).sub(VIPDiscount.mul(2)) }
  // );
  // console.log((await cccStoreContract.totalCCCMinted()).toString());
  // console.log((await cccStoreContract.totalCCCMintedByVIP()).toString());
  // console.log((await cccStoreContract.totalETHDonated()).toString());
  // console.log((await cccStoreContract.totalETHDonatedByVIP()).toString());
};

const getCurrentTimestamp = async () => {
  const currentBlockNum = await ethers.provider.getBlockNumber();
  const currentBlock = await ethers.provider.getBlock(currentBlockNum);
  const currentTimestamp = currentBlock.timestamp;

  return currentTimestamp;
};

main()
  .then(async () => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
