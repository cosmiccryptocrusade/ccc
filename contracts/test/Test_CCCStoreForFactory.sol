//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../CCCFactory.sol";

contract Test_CCCStoreForFactory {
    CCCFactory private cccFactory;

    constructor(address _cccFactory) {
        cccFactory = CCCFactory(_cccFactory);
    }

    function mint(address to) external {
        cccFactory.mint(to);
    }
}
