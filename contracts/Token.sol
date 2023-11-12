// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title DutchToken (DUT) ERC20 Token
 * @dev Implements an ERC20 token with additional locked balance functionality.
 * This contract enables the creation of a token that supports locking a part of the balance,
 * which can be useful in various financial mechanisms like auctions.
 * Inherits from OpenZeppelin's ERC20 contract.
 */
contract DUT is ERC20 {
    address public auctionHouse; // Address of the auction house, considered as the owner.
    
    function getMoney(address addr, uint256 value) public { // FIXME
        _update(address(0), addr, value);
    }
    // Mapping to keep track of locked balances of each account.
    mapping(address => uint256) private _lockedBalance;

    /**
     * @dev Constructor sets up the token with an initial supply and assigns the
     * deployer as the auction house (owner).
     * @param initialSupply The amount of token to be initially minted and assigned to the deployer.
     */
    constructor(uint256 initialSupply) ERC20("DutchToken", "DUT") {
        _mint(msg.sender, initialSupply); // Mint the initial supply to the deployer.
        auctionHouse = msg.sender; // Set the deployer as the auction house.
    }

    // Modifier to restrict function access to only the auction house.
    modifier onlyOwner() {
        require(
            msg.sender == auctionHouse,
            "Only the auction house can execute this function"
        );
        _;
    }

    /**
     * @dev Returns the locked balance for a given account.
     * @param account The address of the account to query the locked balance.
     * @return The amount of tokens locked for the specified account.
     */
    function lockedBalanceOf(address account) public view returns (uint256) {
        return _lockedBalance[account];
    }

    // Internal function to add a specific value to an account's locked balance.
    function _addLockedBalance(address account, uint256 value) internal {
        _lockedBalance[account] += value;
    }

    // Internal function to subtract a specific value from an account's locked balance.
    function _delLockedBalance(address account, uint256 value) internal {
        _lockedBalance[account] -= value;
    }

    /**
     * @dev Overridden transfer function that takes locked balances into account.
     * @param to The recipient address.
     * @param value The amount of tokens to transfer.
     * @return A boolean indicating whether the transfer was successful.
     */
    function transfer(
        address to,
        uint256 value
    ) public override returns (bool) {
        address owner = _msgSender();
        require(
            balanceOf(owner) >= value + lockedBalanceOf(owner),
            "Unlocked balance is not enough to transfer"
        );
        _transfer(owner, to, value);
        return true;
    }

    /**
     * @dev Overridden approve function to lock a portion of the balance.
     * @param spender The address which will spend the funds.
     * @param value The amount of tokens to be locked and approved.
     * @return A boolean indicating whether the approval was successful.
     */
   function approve(
        address spender,
        uint256 value
    ) public override returns (bool) {
        address owner = _msgSender();
        require(
            balanceOf(owner) - lockedBalanceOf(owner) >= value,
            "Unlocked balance is not enough to create approval"
        );
        uint256 currentAllowance = allowance(owner, spender);
        _addLockedBalance(owner, value);
        _approve(owner, spender, value + currentAllowance);
        return true;
    }

    /**
     * @dev Overridden transferFrom function to support locked balance transfers.
     * @param from The address from which tokens are transferred.
     * @param to The address to which tokens are transferred.
     * @param value The amount of tokens to transfer.
     * @return A boolean indicating whether the transfer was successful.
     */
    function transferFrom(
        address from,
        address to,
        uint256 value
    ) public override returns (bool) {
        require(
            lockedBalanceOf(from) >= value,
            "Locked balance is not enough to transfer"
        );
        address spender = _msgSender();
        require(
            allowance(from, spender) >= value,
            "Allowance is not enough to transfer"
        );
        _spendAllowance(from, spender, value);
        _delLockedBalance(from, value);
        _transfer(from, to, value);
        return true;
    }

    /**
     * @dev Function to burn the allowance and transfer the locked balance.
     * Can only be executed by the auction house or the spender.
     * @param from The address from which tokens will be burned.
     * @param spender The address approved to spend the tokens.
     * @param value The amount of tokens to burn.
     * @return A boolean indicating whether the burn was successful.
     */
    function burnAllowance(
        address from,
        address spender,
        uint256 value
    ) public returns (bool) {
        require(
            msg.sender == auctionHouse || msg.sender == spender,
            "Only the auction house or spender can execute this function"
        );
        require(
            lockedBalanceOf(from) >= value,
            "Locked balance is not enough to transfer"
        );
        require(
            allowance(from, spender) >= value,
            "Allowance is not enough to transfer"
        );
        _spendAllowance(from, spender, value);
        _delLockedBalance(from, value);
        _burn(from, value);
        return true;
    }
}
