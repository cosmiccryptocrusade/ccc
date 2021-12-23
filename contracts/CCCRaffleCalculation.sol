// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";

contract CCCRaffleCalculation is Ownable, VRFConsumerBase {
    /**
        Chainlink VRF
     */
    bytes32 internal keyHash;
    uint256 internal fee;
    uint256 public raffleNumber;

    uint256 public ticketPrice = 0.00008 ether;
    mapping(uint256 => ticket) public ticketsOf;
    struct ticket {
        address holder;
        uint256 amount;
    }
    mapping(address => result) public resultOf;
    struct result {
        uint256 validTicketAmount;
    }

    event SetChainlinkFee(uint256);
    event SetChainlinkKeyHash(bytes32);
    event SetResult(address,uint256,uint256);

    constructor()
        VRFConsumerBase(
            0x3d2341ADb2D31f1c5530cDC622016af293177AE0, // VRF Coordinator
            0xb0897686c545045aFc77CF20eC7A532E3120E0F1  // LINK Token
        ) {
        keyHash = 0xf86195cf7690c55907b2b611ebb7343a6f649bff128701cc542f0569e2c549da;
        fee = 0.0001 * 10 ** 18;
    }

    /**
     * Requests randomness from chainlink
     */
    function getRandomNumber() external onlyOwner returns (bytes32 requestId) {
        require(LINK.balanceOf(address(this)) >= fee, "Not enough LINK");
        return requestRandomness(keyHash, fee);
    }

    /**
     * Callback from requestRandomness()
     */
    function fulfillRandomness(bytes32, uint256 randomness) internal override {
        require(raffleNumber == 0, "raffle number is already set");
        raffleNumber = randomness;
    }

    function setKeyHash(bytes32 _keyHash) external onlyOwner {
        keyHash = _keyHash;
        emit SetChainlinkKeyHash(_keyHash);
    }

    function setChainlinkFee(uint256 _fee) external onlyOwner {
        fee = _fee;
        emit SetChainlinkFee(_fee);
    }
    
    /// @dev set ticket holders in batches to avoid hitting the gas block limit
    function setTicketHolders(address[] memory _holders, uint256[] memory _amounts, uint256 startIndex) external onlyOwner {
        for (uint256 i = 0; i < _holders.length; i++) {
            ticketsOf[startIndex + i].amount = _amounts[i];
            ticketsOf[startIndex + i].holder = _holders[i];
        }
    }

    function runRaffle(
        uint256 maxCCC,
        uint256 preMintedCCC,
        uint256 newlyMintedCCCWithPass,
        uint256 totalTickets
    ) public view onlyOwner returns (uint256 slotSize, uint256 offsetInSlot, uint256 lastTargetIndex){
        require(raffleNumber != 0, "raffle number is not set");
        uint256 remainingCCC = maxCCC - preMintedCCC - newlyMintedCCCWithPass;
        require(remainingCCC <= totalTickets, "total tickets sold cant be less than remaining CCCs for raffle");

        slotSize = totalTickets / remainingCCC;
        offsetInSlot = raffleNumber % slotSize;
        lastTargetIndex = slotSize * remainingCCC - 1;
    }

    function calculateValidTicketAmount(
        uint256 index,
        uint256 amount,
        uint256 _slotSize,
        uint256 _offsetInSlot,
        uint256 _lastTargetIndex
    ) internal pure returns (uint256 validTicketAmount) {
        /**

        /_____fio___\___________________________________/lio\___________
                v   f |         v     |         v     |     l   v     |
        ______slot #n__|___slot #n+1___|____slot #n+2__|____slot #n+3__|

            f : first index (incl.)
            l : last index (incl.)
            v : win ticket
            fio : first index offset
            lio : last index offset
            n, n+1,... : slot index
            
            v in (slot #n+1) is ths firstWinIndex
            v in (slot #n+2) is ths lastWinIndex
        */
        uint256 lastIndex = index + amount - 1; // incl.
        if (lastIndex > _lastTargetIndex) {
            lastIndex = _lastTargetIndex;
        }

        uint256 firstIndexOffset = index % _slotSize;
        uint256 lastIndexOffset = lastIndex % _slotSize;

        uint256 firstWinIndex;
        if (firstIndexOffset <= _offsetInSlot) {
            firstWinIndex = index + _offsetInSlot - firstIndexOffset;
        } else {
            firstWinIndex =
                index +
                _slotSize +
                _offsetInSlot -
                firstIndexOffset;
        }

        // Nothing is selected
        if (firstWinIndex > _lastTargetIndex) {
            validTicketAmount = 0;
        } else {
            uint256 lastWinIndex;
            if (lastIndexOffset >= _offsetInSlot) {
                lastWinIndex = lastIndex + _offsetInSlot - lastIndexOffset;
            } else if (lastIndex < _slotSize) {
                lastWinIndex = 0;
            } else {
                lastWinIndex =
                    lastIndex +
                    _offsetInSlot -
                    lastIndexOffset -
                    _slotSize;
            }

            if (firstWinIndex > lastWinIndex) {
                validTicketAmount = 0;
            } else {
                validTicketAmount =
                    (lastWinIndex - firstWinIndex) /
                    _slotSize +
                    1;
            }
        }
    }

    function calculateAllResults(
        uint256 slotSize, 
        uint256 offsetInSlot, 
        uint256 lastTargetIndex, 
        uint256 startIndex,
        uint256 endIndex,
        uint256 currTotal)
        external 
        {
        require(raffleNumber > 0, "Invalid Raffle Number");
        for (uint256 i = startIndex; i < endIndex; i++) {
            ticket memory myTicket = ticketsOf[i];

            uint256 validTicketAmount = calculateValidTicketAmount(
                currTotal,
                myTicket.amount,
                slotSize,
                offsetInSlot,
                lastTargetIndex
            );
            currTotal += myTicket.amount;
            resultOf[myTicket.holder].validTicketAmount = validTicketAmount;

            uint256 remainingTickets = myTicket.amount - validTicketAmount;
            uint256 changes = remainingTickets * ticketPrice;
            emit SetResult(myTicket.holder, validTicketAmount, changes);
        }
    }

    /// @dev The ticket hash can be checked in batches, with hashToEncode as the prev result hash.
    /// This is used to verify that the tickets copied over to L2 matches.
    function getTicketHash(uint256 startIndex, uint256 endIndex, bytes memory hashToEncode) external view returns (bytes32 ticketHash) {
        for (uint256 i = startIndex; i < endIndex; i++) {
            hashToEncode = abi.encodePacked(ticketsOf[i].holder, ticketsOf[i].amount, hashToEncode);
        }
        return keccak256(abi.encodePacked(hashToEncode));
    }

    /// @dev The result hash can be checked in batches, with hashToEncode as the prev result hash.
    /// This is used to verify that the results copied over from L2 matches.
    function getResultHash(address[] memory _holders, bytes memory hashToEncode) external view returns (bytes32 resultHash) {
        for (uint256 i = 0; i < _holders.length; i++) {
            hashToEncode = abi.encodePacked(_holders[i], resultOf[_holders[i]].validTicketAmount, hashToEncode);
        }
        return keccak256(abi.encodePacked(hashToEncode));
    }
}