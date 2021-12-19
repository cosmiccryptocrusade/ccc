# Cosmic Crypto Crusade
## Introduction
This repo contains the contract code for the Comic Crypto Crusade NFT's.


## Design
The base contracts were inspired from the URS.contract, we have added 2 major changes
1. Claim passes directly for partners by checking the signatures, no intermediate NFT's
1. Do the calculations for claiming in an L2 chain and bring back the claims via a merkle distributor so that as a User there is only 2 transactions instead of 3


## Process
1. Deploy the pass contract ``` npx hardhat run scripts/deploy-pass.ts --network goerli ```
1. Deploy the store contract ``` npx hardhat run scripts/deploy-store.ts --network goerli ```
1. Deploy the factory contract ``` npx hardhat run scripts/deploy-factory.ts --network goerli ```
1. Link up the above 3 contracts and set init parameters ``` npx hardhat run scripts/post-deploy-init.ts --network goerli ```

## Parameters to init
1. Store open hours
1. VIP open hours
....

## Private Sale && Snapshot of partner projects

1. In order to get the addresses of all the VIP's we need to snapshot their balance at a time in moment X
1. Then when the sale opens, these addresses can have a claim. These claims can be generated from a csv file. 
1. The generated file then needs to be made available to the address owner. [We could also embed it into the website, like your eligible and these are the parameters, additionally a button to make the UX easier can be made available]
