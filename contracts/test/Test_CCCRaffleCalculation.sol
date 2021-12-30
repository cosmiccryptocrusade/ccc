//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.4;

import "../CCCRaffleCalculation.sol";

contract Test_CCCRaffleCalculation is CCCRaffleCalculation {
    constructor() CCCRaffleCalculation() {}

    function testFulfillRandomness(uint256 randomness) external {
        fulfillRandomness("0", randomness);
    }

    function testCalculateValidTicketAmount(
        uint256 index,
        uint256 amount,
        uint256 _slotSize,
        uint256 _offsetInSlot,
        uint256 _lastTargetIndex
    ) external pure returns (uint256 validTicketAmount) {
        return calculateValidTicketAmount(index, amount, _slotSize, _offsetInSlot, _lastTargetIndex);
    }
}