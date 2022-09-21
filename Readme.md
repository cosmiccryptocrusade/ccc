# Cosmic Crypto Crusade
## Introduction
This repo contains the contract code for the Comic Crypto Crusade NFT's.


## Design
There are 2 main differences from the standard ERC721 NFT contracts.
1. There is a pass contract which verifies whitelisted address. These VIPs pay a discounted price.
1. It uses Chainlink VRF to get a random seed, which will be used to determine the shuffled order of the NFTs for reveal. This ensures that the Team cannot cheat (e.g. assign rare NFTs to themselves).


## Process
1. Deploy the factory contract ``` npx hardhat run scripts/deploy-factory.ts --network goerli ```
1. Deploy the pass contract ``` npx hardhat run scripts/deploy-pass.ts --network goerli ```
1. Deploy the store contract ``` npx hardhat run scripts/deploy-store.ts --network goerli ```
1. Link up the above 3 contracts and set init parameters ``` npx hardhat run scripts/post-deploy-init.ts --network goerli ```

## Parameters to init
1. Store openingHours and mintPrice

## Whitelisting process
1. We will generate a list of addresses that have donated to GitCoin (period/rounds TBD). These addresses will be allowed up to N discounted NFT mints based on their donation amounts. 
1. ```sign-message.ts``` will generate the signatures to be used by the mint page on the CCC website.

## Shuffle process
1. The NFT attributes json files will be uploaded to IPFS in a folder structure with an initial order. The keccak256 hash of the IPFS hash will be set as the ```verificationHash``` on the Store contract. This will be done pre-deployment.
1. After the mint period, ```getRandomNumber()``` on the Store contract will be called to generate a ```shuffleNumber```. This can only be done once.
1. ```shuffle()``` will be called to generate a shuffled array. NFT #n will be assigned picture ```shuffledArray[n]``` from the initial order.
1. The NFT attributes json files will be reuploaded on IPFS in the shuffled order, and ```setBaseURI()``` on the Factory contract will be called with the new IPFS link.
1. The original IPFS hash will also be revealed if the public wishes to verify the initial order.