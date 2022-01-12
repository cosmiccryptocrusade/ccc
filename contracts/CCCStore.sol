// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";

interface Factory {
    function mint(address) external;
}

interface Pass {
    function claimBalance(address) external view returns (uint256);
    function checkPass(
        address sender,
        uint256 _passAmount,
        uint256 _amountToMint,
        uint8 passType,
        uint8 vSig,
        bytes32 rSig,
        bytes32 sSig
    ) external returns(bool isPartner);
}

contract CCCStore is Ownable, VRFConsumerBase {
    Pass public pass;
    Factory public cccFactory;

    /**
        Numbers for CCC Factory
     */
    uint256 public constant maxCCC = 10000;

    /**
        Verification and VRF
     */
    bytes32 internal keyHash;
    uint256 internal fee;
    uint256 public shuffleNumber;
    string public verificationHash = "Qmh.....";

    /**
        Team allocated CCC
     */
    // CCC which is minted by the owner
    uint256 public preMintedCCC = 0;
    // MAX CCC which owner can mint
    uint256 public constant maxPreMintCCC = 500;

    /**
        Mint Pass
     */
    uint256 public newlyMintedCCCWithPass = 0;
    mapping(address => uint256) public mintedCCCOf;

    // public mint
    uint256 public newlyMintedCCCPublic = 0;
    mapping(address => uint256) public publicMintedCCCOf;

    /**
        Scheduling
     */
    uint256 public openingHours;
    uint256 public constant operationSecondsForVIP =  3600 * 9; // 9 hours 
    uint256 public constant operationSeconds = 3600 * 24; // 24 hours

    /**
        Ticket
     */
    uint256 public ticketPrice = 0.00008 ether;
    uint256 public totalTickets = 0;
    address public cccRaffle;
    mapping(address => ticket) public ticketsOf;
    struct ticket {
        uint256 index; // Incl
        uint256 amount;
    }

    /**
        Security
     */
    uint256 public constant maxMintPerTx = 30;

    /**
        Raffle
     */
    uint256 public raffleNumber;
    mapping(address => result) public resultOf;
    struct result {
        uint256 validTicketAmount;
        bool claimed;
    }

    bool calculationExecuted = false;

    event SetPass(address pass);
    event SetCCCFactory(address cccFactory);
    event SetCCCRaffle(address cccRaffle);
    event SetTicketPrice(uint256 price);
    event SetOpeningHours(uint256 openingHours);
    event MintWithPass(address account, uint256 amount, uint256 changes);
    event TakingTickets(address account, uint256 amount, uint256 changes);
    event RunRaffle(uint256 raffleNumber);
    event SetResult(
        address account,
        uint256 validTicketAmount,
        uint256 changes
    );
    event MintCCC(address account, uint256 mintRequestAmount, uint256 changes);
    event Withdraw(address to);
    event SetChainlinkFee(uint256);
    event SetChainlinkKeyHash(bytes32);

    constructor()
        VRFConsumerBase(
            0xb3dCcb4Cf7a26f6cf6B120Cf5A73875B7BBc655B, // VRF Coordinator
            0x01BE23585060835E02B77ef475b0Cc51aA1e0709  // LINK Token
        ) {
        keyHash = 0x2ed0feb3e7fd2022120aa84fab1945545a9f2ffc9076fd6156fa96eaff4c1311;
        fee = 0.1 * 10 ** 18;
    }

    modifier whenVIPOpened() {
        require(block.timestamp >= openingHours, "Store is not opened for VIP");
        require(
            block.timestamp < openingHours + operationSecondsForVIP,
            "Store is closed for VIP"
        );
        _;
    }

    modifier whenOpened() {
        require(
            block.timestamp >= openingHours + operationSecondsForVIP,
            "Store is not opened"
        );
        require(
            block.timestamp <
                openingHours + operationSecondsForVIP + operationSeconds,
            "Store is closed"
        );
        _;
    }

    function setPass(Pass _pass) external onlyOwner {
        pass = _pass;
        emit SetPass(address(_pass));
    }

    function setCCCFactory(Factory _cccFactory) external onlyOwner {
        cccFactory = _cccFactory;
        emit SetCCCFactory(address(_cccFactory));
    }

    function setRaffleContract(address _cccRaffle) external onlyOwner {
        cccRaffle = _cccRaffle;
        emit SetCCCRaffle(_cccRaffle);
    }

    function setTicketPrice(uint256 _price) external onlyOwner {
        ticketPrice = _price * 0.0000001 ether;
        emit SetTicketPrice(_price);
    }

    function setOpeningHours(uint256 _openingHours) external onlyOwner {
        openingHours = _openingHours;
        emit SetOpeningHours(_openingHours);
    }

    function preMintCCC(address[] memory recipients) external onlyOwner {
        require(
            block.timestamp <
                openingHours + operationSecondsForVIP + operationSeconds,
            "Not available after ticketing period"
        );
        uint256 totalRecipients = recipients.length;

        require(
            totalRecipients > 0,
            "Number of recipients must be greater than 0"
        );
        require(
            preMintedCCC + totalRecipients <= maxPreMintCCC,
            "Exceeds max pre-mint CCC"
        );

        for (uint256 i = 0; i < totalRecipients; i++) {
            address to = recipients[i];
            require(to != address(0), "receiver can not be empty address");
            cccFactory.mint(to);
        }

        preMintedCCC += totalRecipients;
    }

    function mintWithPass(
        uint256 _passAmount,
        uint256 _amountToMint,
        uint8 passType,
        uint8 vSig,
        bytes32 rSig,
        bytes32 sSig)
        external 
        payable 
        whenVIPOpened {
        require(_amountToMint <= maxMintPerTx, "mint amount exceeds maximum");
        require(_amountToMint > 0, "Need to mint more than 0");
        uint256 totalPrice = ticketPrice * _amountToMint;
        require(totalPrice <= msg.value, "Not enough money");
        
        bool validPartner = pass.checkPass(msg.sender, _passAmount, _amountToMint, passType, vSig, rSig, sSig);
        require(validPartner);

        uint256 mintedCCC = mintedCCCOf[msg.sender];

        for (uint256 i = 0; i < _amountToMint; i += 1) {
            cccFactory.mint(msg.sender);
        }

        mintedCCCOf[msg.sender] = mintedCCC + _amountToMint;
        newlyMintedCCCWithPass += _amountToMint;

        // Refund changes
        uint256 changes = msg.value - totalPrice;
        emit MintWithPass(msg.sender, _amountToMint, changes);

        if (changes > 0) {
            payable(msg.sender).transfer(changes);
        }
    }

    function mintCCC(uint256 _amountToMint) external payable whenOpened {
        require(_amountToMint <= maxMintPerTx, "mint amount exceeds maximum");
        require(_amountToMint > 0, "Need to mint more than 0");
        uint256 totalPrice = ticketPrice * _amountToMint;
        require(totalPrice <= msg.value, "Not enough money");
        
        uint256 publicMintedCCC = publicMintedCCCOf[msg.sender];

        for (uint256 i = 0; i < _amountToMint; i += 1) {
            cccFactory.mint(msg.sender);
        }

        publicMintedCCCOf[msg.sender] = publicMintedCCC + _amountToMint;
        newlyMintedCCCPublic += _amountToMint;

        // Refund changes
        uint256 changes = msg.value - totalPrice;
        emit MintCCC(msg.sender, _amountToMint, changes);

        if (changes > 0) {
            payable(msg.sender).transfer(changes);
        }
    }

//    function takingTickets(uint256 _amountToMint) external payable whenOpened {
//        require(_amountToMint > 0, "Need ticket more than 0");
//
//        ticket storage myTicket = ticketsOf[msg.sender];
//        require(myTicket.amount == 0, "Already registered");
//
//        uint256 totalPrice = ticketPrice * _amountToMint;
//        require(totalPrice <= msg.value, "Not enough money");
//
//        myTicket.index = totalTickets;
//        myTicket.amount = _amountToMint;
//
//        totalTickets = totalTickets + _amountToMint;
//
//        // Refund changes
//        uint256 changes = msg.value - totalPrice;
//        emit TakingTickets(msg.sender, _amountToMint, changes);
//
//        if (changes > 0) {
//            payable(msg.sender).transfer(changes);
//        }
//    }
//
//    function setRaffleNumber(uint256 _raffleNumber) external onlyOwner {
//        require(_raffleNumber > 0);
//        require(raffleNumber == 0);
//        raffleNumber = _raffleNumber;
//    }
//
//    /// @dev The raffle result can be set in batches.
//    function setRaffleResults(
//        address[] memory _holders,
//        uint256[] memory _amounts,
//        bool _calculationExecuted
//        ) external onlyOwner {
//        for (uint256 i = 0; i < _holders.length; i++) {
//            resultOf[_holders[i]].validTicketAmount = _amounts[i];
//        }
//        calculationExecuted = _calculationExecuted;
//    }
//
//    /// @dev The ticket hash can be checked in batches, with hashToEncode as the prev result hash.
//    /// This is used to verify that the tickets copied over to L2 matches.
//    function getTicketHash(address[] memory _holders, bytes memory hashToEncode) external view returns (bytes32 ticketHash) {
//        for (uint256 i = 0; i < _holders.length; i++) {
//            hashToEncode = abi.encodePacked(_holders[i], ticketsOf[_holders[i]].amount, hashToEncode);
//        }
//        return keccak256(abi.encodePacked(hashToEncode));
//    }
//
//    /// @dev The result hash can be checked in batches, with hashToEncode as the prev result hash.
//    /// This is used to verify that the results copied over from L2 matches.
//    function getResultHash(address[] memory _holders, bytes memory hashToEncode) external view returns (bytes32 resultHash) {
//        for (uint256 i = 0; i < _holders.length; i++) {
//            hashToEncode = abi.encodePacked(_holders[i], resultOf[_holders[i]].validTicketAmount, hashToEncode);
//        }
//        return keccak256(abi.encodePacked(hashToEncode));
//    }
//
//    function mintCCC() external {
//        require(calculationExecuted, "Results not set");
//        
//        result storage myResult = resultOf[msg.sender];
//        ticket memory myTicket = ticketsOf[msg.sender];
//        uint256 claims = (myTicket.amount - myResult.validTicketAmount) * ticketPrice;
//        
//        
//        require(myResult.validTicketAmount > 0, "No valid tickets");
//
//        uint256 mintRequestAmount = 0;
//
//        if (myResult.validTicketAmount > maxMintPerTx) {
//            mintRequestAmount = maxMintPerTx;
//            myResult.validTicketAmount -= maxMintPerTx;
//        } else {
//            mintRequestAmount = myResult.validTicketAmount;
//            myResult.validTicketAmount = 0;
//        }
//
//        for (uint256 i = 0; i < mintRequestAmount; i += 1) {
//            cccFactory.mint(msg.sender);
//        }
//        
//        if (!myResult.claimed) {
//            myResult.claimed = true;
//            claimRefund(claims);
//        }
//        
//        emit MintCCC(msg.sender, mintRequestAmount);
//       
//    }
//
//    function claimRefund(uint256 claims) private {
//        if (claims > 0) {
//            payable(msg.sender).transfer(claims);
//        }   
//    }

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
        require(shuffleNumber == 0, "shuffle number is already set");
        shuffleNumber = randomness;
    }

    function setKeyHash(bytes32 _keyHash) external onlyOwner {
        keyHash = _keyHash;
        emit SetChainlinkKeyHash(_keyHash);
    }

    function setChainlinkFee(uint256 _fee) external onlyOwner {
        fee = _fee;
        emit SetChainlinkFee(_fee);
    }

    // Fisher-Yates shuffle to obtained shuffled array of 0 to 9999. token id #n will be picture shuffledArray[n]
    function shuffle(uint256 n) public view returns (uint256[] memory shuffledArray) {
        // initialize array
        shuffledArray = new uint256[](n);
        for (uint256 i = 0; i < n; i++) {
            shuffledArray[i] = i;
        }
        uint256 entropy = shuffleNumber;

        for (uint256 i = n-1; i > 0; i--) {
            // select random number from 0 to i inclusive
            entropy = uint256(keccak256(abi.encode(entropy)));
            uint256 j = (entropy) % (i+1);

            // swap item i and j
            uint256 temp = shuffledArray[i];
            shuffledArray[i] = shuffledArray[j];
            shuffledArray[j] = temp;
        }
    }

    // withdraw eth for sold CCC
    function withdraw(address payable _to, uint256 amount) external onlyOwner {
        require(_to != address(0), "receiver cant be empty address");
        // require(
        //     maxCCC - preMintedCCC - newlyMintedCCCWithPass <= totalTickets,
        //     "Not enough ethers are collected"
        // );

        // Send eth to designated receiver
        emit Withdraw(_to);

        _to.transfer(amount);
    }
}