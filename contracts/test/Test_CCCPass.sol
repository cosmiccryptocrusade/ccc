//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.4;

import "../CCCPass.sol";

contract Test_CCCPass is CCCPass {
    constructor(
        string memory __name,
        string memory __baseURI
    ) CCCPass(__name, __baseURI) {}
}