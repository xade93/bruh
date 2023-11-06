// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DUT is ERC20 {
    address public auctionHouse;

    mapping(address => uint256) private _lockedBalance;

    constructor(uint256 initialSupply) ERC20("DutchToken", "DUT") {
        _mint(msg.sender, initialSupply);
        auctionHouse = msg.sender;
    }

    modifier onlyOwner() {
        require(
            msg.sender == auctionHouse,
            "Only the auction house can execute this function"
        );
        _;
    }

    function lockedBalanceOf(address account) public view returns (uint256) {
        return _lockedBalance[account];
    }

    function _addLockedBalance(address account, uint256 value) internal {
        _lockedBalance[account] += value;
    }

    function _delLockedBalance(address account, uint256 value) internal {
        _lockedBalance[account] -= value;
    }

    function transfer(
        address to,
        uint256 value
    ) public override returns (bool) {
        address owner = _msgSender();
        require(
            balanceOf(owner) - lockedBalanceOf(owner) >= value,
            "unlocked balance is not enough to transfer"
        );
        _transfer(owner, to, value);
        return true;
    }

    function approve(
        address spender,
        uint256 value
    ) public override returns (bool) {
        address owner = _msgSender();
        require(
            balanceOf(owner) - lockedBalanceOf(owner) >= value,
            "unlocked balance is not enough to create approvement"
        );
        _addLockedBalance(owner, value);
        _approve(owner, spender, value);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 value
    ) public override returns (bool) {
        require(
            lockedBalanceOf(from) >= value,
            "locked balance is not enough to transfer"
        );
        address spender = _msgSender();
        require(
            allowance(from, spender) >= value,
            "allowance is not enough to transfer"
        );
        _spendAllowance(from, spender, value);
        _delLockedBalance(from, value);
        _transfer(from, to, value);
        return true;
    }

    function burnAllowance(
        address from,
        address spender,
        uint256 value
    ) public returns (bool) {
        require(
            msg.sender == auctionHouse || msg.sender == spender,
            "Only the auction house  or spender can execute this function"
        );
        require(
            lockedBalanceOf(from) >= value,
            "locked balance is not enough to transfer"
        );
        require(
            allowance(from, spender) >= value,
            "allowance is not enough to transfer"
        );
        _spendAllowance(from, spender, value);
        _delLockedBalance(from, value);
        _burn(from, value);
        return true;
    }
}
