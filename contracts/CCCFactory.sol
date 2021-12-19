// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CCCFactory is ERC721, Ownable {
    string public baseURI;
    uint256 public constant MAX_SUPPLY = 10000;
    uint256 public totalSupply;
    address public cccStore;

    event SetCCCStore(address cccStore);
    event SetBaseURI(string baseURI);

    constructor(
        string memory __name,
        string memory __symbol,
        string memory __baseURI
    ) ERC721(__name, __symbol) {
        baseURI = __baseURI;
    }

    modifier onlyOwnerOrStore() {
        require(
            cccStore == msg.sender || owner() == msg.sender,
            "caller is neither cccStore nor owner"
        );
        _;
    }

    function setCCCStore(address _cccStore) external onlyOwner {
        cccStore = _cccStore;
        emit SetCCCStore(_cccStore);
    }

    function setBaseURI(string memory __baseURI) external onlyOwner {
        baseURI = __baseURI;
        emit SetBaseURI(__baseURI);
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    function mint(address to) public onlyOwnerOrStore {
        require(totalSupply < MAX_SUPPLY, "Exceeds max supply");
        // TODO: check if need to change this to _safeMint
        _mint(to, totalSupply);
        totalSupply += 1;
    }
}
