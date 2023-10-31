// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DUT is ERC20 {
    address public owner;
    uint256 public destructionTime;

    constructor(uint256 initialSupply) ERC20("DutchToken", "DUT") {
        _mint(msg.sender, initialSupply);
        owner = msg.sender;
        destructionTime = block.timestamp + 20 minutes;
    }

    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "Only the owner can execute this function"
        );
        _;
    }

    function remainBalance() public view returns (uint256) {
        if (block.timestamp >= destructionTime) {
            return 0;
        } else {
            return balanceOf(owner);
        }
    }

    function transferTo(address recipient, uint256 amount) external onlyOwner {
        require(block.timestamp < destructionTime, "Token is destroyed");
        _transfer(owner, recipient, amount);
    }

    function burnAfterTime() external {
        require(
            block.timestamp >= destructionTime,
            "Cannot burn tokens before 20 minutes"
        );
        _burn(owner, balanceOf(owner));
    }
}
