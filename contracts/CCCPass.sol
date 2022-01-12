// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract CCCPass is EIP712, Ownable {
    // EIP712 Feature
    bytes32 public constant TYPEHASH =
        keccak256("PassReq(address receiver,uint256 amount,uint8 passType)");

    struct PassReq {
        address receiver;
        uint256 amount;
        uint8 passType;
    }

    mapping(address => uint256) public claimedType0Count;
    mapping(address => uint256) public claimedType1Count;

    bool public paused = true;
    string public baseURI;
    address public store;

    uint256 public currentPassType0Count = 0;
    uint256 public currentPassType1Count = 0;

    uint256 public constant MAX_SUPPLY_PASS_TYPE_0 = 1000; // passType = 0 for specific NFT owners
    uint256 public constant MAX_SUPPLY_PASS_TYPE_1 = 8000; // passType = 1 for Discord users

    uint256 public claimUntil;

    event Paused();
    event Unpaused();
    event ClaimPass(address claimer, uint256 amount);
    event SetClaimUntil(uint256 claimUntil);
    event RetrieveUnclaimedPass(address to, uint256 passAmount);

    //TODO: coalesce the passes into a single pass contract
    constructor(
        string memory __name,
        string memory __baseURI
    ) EIP712(__name, "1") {
        baseURI = __baseURI;
    }

    function setClaimUntil(uint256 _claimUntil) external onlyOwner {
        claimUntil = _claimUntil;
        emit SetClaimUntil(_claimUntil);
    }

    function setStore(address _store) external onlyOwner {
        store = _store;
    }

    function pause() external onlyOwner {
        paused = true;
        emit Paused();
    }

    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused();
    }

    function checkPass(
        address sender,
        uint256 _passAmount,
        uint256 _amountToMint,
        uint8 passType,
        uint8 vSig,
        bytes32 rSig,
        bytes32 sSig
    ) external returns(bool isPartner) {
        require(msg.sender == store, "Not store");
        require(block.timestamp < claimUntil, "Claim period ended");
        require(paused == false, "Claims paused");
        uint256 MAX_SUPPLY = MAX_SUPPLY_PASS_TYPE_0;
        uint256 currentPassCount = currentPassType0Count;

        if (passType == 0) {
            require(_passAmount - claimedType0Count[sender] >= _amountToMint, "Not enough pass");
            claimedType0Count[sender] += _amountToMint;
            currentPassType0Count += _amountToMint;
        } else if(passType == 1) {
            require(_passAmount - claimedType1Count[sender] >= _amountToMint, "Not enough pass");
            claimedType1Count[sender] += _amountToMint;
            currentPassType1Count += _amountToMint;
            MAX_SUPPLY = MAX_SUPPLY_PASS_TYPE_1;
            currentPassCount = currentPassType1Count;        
        }

        require(currentPassCount + _amountToMint <= MAX_SUPPLY, "Exceeds max supply");

        bytes32 digest = _hashTypedDataV4(
            keccak256(abi.encode(TYPEHASH, sender, _passAmount, passType))
        );


        address signer = ecrecover(digest, vSig, rSig, sSig);

        require(signer == owner(), "Signature not owner");       
        
        emit ClaimPass(sender, _amountToMint);
        return true;
    }
}