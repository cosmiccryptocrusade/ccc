import { ethers } from 'hardhat';

const storeAddress = '0xC0A30Deb5DDD84bcB898163C161d46081F4E8422';

const main: () => Promise<any> = async () => {
  const [deployer, premint1, premint2, vip1, vip2, public1, public2] = await ethers.getSigners();
  console.log('init contracts with the account:', deployer.address);

  const Store = await ethers.getContractFactory('CCCStore');
  const cccStoreContract = await Store.attach(storeAddress);

  const ticketPrice = await cccStoreContract.ticketPrice();

  // preMintCCC
  // const preMintAddress = [premint1.address, premint2.address];
  // await cccStoreContract.preMintCCC(preMintAddress);
  // console.log('Completed preMintCCC', premint1.address, premint2.address);

  // mintWithPass
  await cccStoreContract.connect(vip1).mintWithPass(
    6,
    3,
    0,
    27,
    "0xfb55ceddcd948116f5ed632921cc4106c68a6cbc2fcd9338bc6d095be0f89f62",
    "0x419aedc2d3cb2092952ddff3d17e3d93e193187381869e35c82738ef0bf104d2",
    {value:ticketPrice.mul(3)}
  );
  await cccStoreContract.connect(vip1).mintWithPass(
    4,
    3,
    1,
    27,
    "0xf8358cdf02b8ade40f37c3521f5e07b37c9fb5840b6c611ce6a6fb19815d0fa7",
    "0x4d458ef870d1e2c3e9540a5db8c8a616dc20d181c64713c3b1ef2e8927b2e4a5",
    {value:ticketPrice.mul(3)}
  );
  await cccStoreContract.connect(vip2).mintWithPass(
    15,
    3,
    1,
    27,
    "0xdfcec9deb418d59d1844488c47e2372f6b844619013fced8cd96d262f8155518",
    "0x7c191d02c338b50721b0d0922f3208cd58844c1c44f83b9f273e2f45972d7245",
    {value:ticketPrice.mul(3)}
  );
  console.log('Completed mintWithPass', vip1.address, vip2.address);
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
