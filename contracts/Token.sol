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

    function remainToken() public view returns (uint256) {
        require(block.timestamp < destructionTime, "Token is destroyed");
        return super.balanceOf(owner);
    }

    function transferTo(address recipient, uint256 amount) external onlyOwner {
        require(block.timestamp < destructionTime, "Token is destroyed");
        super._transfer(owner, recipient, amount);
    }

    function transfer(
        address to,
        uint256 value
    ) public override returns (bool) {
        address sender = super._msgSender();
        require(sender != owner, "Sender cannot be owner");
        super._transfer(owner, to, value);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 value
    ) public override returns (bool) {
        require(from != owner, "Transfer from address cannot be owner");
        address spender = super._msgSender();
        super._spendAllowance(from, spender, value);
        super._transfer(from, to, value);
        return true;
    }

    function burnAfterTime() external {
        require(
            block.timestamp >= destructionTime,
            "Cannot burn tokens before 20 minutes"
        );
        super._burn(owner, balanceOf(owner));
    }
}
