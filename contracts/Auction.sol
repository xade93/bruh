// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {DUT} from "./Token.sol";

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Dutch Auction Contract
 * @dev Implements a Dutch auction system using the DUT token.
 * This contract includes functionalities to create, start, bid in, and end auctions.
 * Inherits from OpenZeppelin's ReentrancyGuard to prevent re-entrancy attacks.
 */
contract DutchAuction is ReentrancyGuard {
    // Mappings for various auction parameters
    mapping(uint256 => address) public auctioneer; // Auction creator's address
    mapping(uint256 => uint256) public reservePrice; // Minimum price of the auction
    mapping(uint256 => uint256) public startPrice; // Starting price of the auction
    mapping(uint256 => uint256) public startTime; // Timestamp when the auction starts
    mapping(uint256 => uint256) public priceDropInterval; // Time interval for price drop
    mapping(uint256 => address[]) public bidders; // List of bidders for each auction
    mapping(uint256 => uint256[]) public bids; // List of bids for each auction
    mapping(uint256 => uint256[]) public amount; // Amount of tokens bid for in each auction
    mapping(uint256 => uint256) public totalCommitment; // Total amount committed in the auction
    mapping(uint256 => uint256) public initialSupply; // Initial supply of tokens for the auction
    mapping(address => uint256) public allowanceRequired; // Allowance needed for creating the auction
    mapping(address => uint256) public shouldBurnValue; // Amount of tokens to be burned post-auction
    uint256 public constant lastingTime = 20 minutes; // Duration for which auction lasts
    DUT public token; // DUT token used for the auction

    // Enum for the state of the auction
    enum AuctionState {
        Created,
        Running,
        Ended,
        Finished,
        Canceled
    }
    mapping(uint256 => AuctionState) public state; // Mapping of auction IDs to their states
    uint256[] auctions; // List of auctions

    // Events for various actions within the contract
    event AuctionStarted(uint256 auctionID, uint startBlock);
    event NewBid(uint256 auctionID, address bidder, uint amount);
    event AuctionEnded(uint256 auctionID);
    event AuctionResult(uint256 auctionID, address[] winner, uint[] amount);
    event AuctionTokenBurn(address auctioneer, uint256 amount);

    /**
     * @dev Constructor that sets the token address.
     * @param _token Address of the DUT token.
     */
    constructor(address _token) {
        token = DUT(_token); // depoly a new token.
    }

    // Modifier to check if the function caller is the auctioneer
    modifier onlyAuctioneer(uint256 _auctionId, address _auctioneer) {
        require(auctioneer[_auctionId] == _auctioneer, "not auctioneer");
        _;
    }

    // Modifier to check if the auction has not ended
    modifier auctionNotEnded(uint256 _auctionId) {
        require(
            state[_auctionId] == AuctionState.Running,
            "auction is not running"
        );
        require(
            block.timestamp <= startTime[_auctionId] + lastingTime,
            "auction has been expired"
        );
        _;
    }

    /**
     * @dev Creates a new auction with specified parameters.
     * The function sets various auction parameters and registers the auction.
     * @param _startPrice The initial price of the auction.
     * @param _reservePrice The minimum acceptable price for the auction.
     * @param _priceDropInterval The interval at which the price drops.
     * @param _initialSupply The amount of tokens available for auction.
     * @return auctionID The ID of the created auction.
     */
    function createAuction(
        uint256 _startPrice,
        uint256 _reservePrice,
        uint256 _priceDropInterval,
        uint256 _initialSupply
    ) public returns (uint256) {
        require(
            allowanceRequired[msg.sender] + _initialSupply <=
                token.allowance(msg.sender, address(this)),
            "allowance is not enough"
        );
        allowanceRequired[msg.sender] += _initialSupply;
        uint256 auctionID = auctions.length;
        auctions.push(auctionID);
        auctioneer[auctionID] = msg.sender;
        state[auctionID] = AuctionState.Created;
        initialSupply[auctionID] = _initialSupply;
        reservePrice[auctionID] = _reservePrice;
        startPrice[auctionID] = _startPrice;
        totalCommitment[auctionID] = 0;
        priceDropInterval[auctionID] = _priceDropInterval;
        return auctionID;
    }

    /**
     * @dev Starts an auction with a given ID.
     * The function sets the auction's start time and changes its state to 'Running'.
     * It can only be called by the auctioneer who created the auction.
     * @param _auctionID The ID of the auction to be started.
     */
    function startAuction(
        uint256 _auctionID
    ) public onlyAuctioneer(_auctionID, msg.sender) {
        require(state[_auctionID] == AuctionState.Created, "Wrong State");
        startTime[_auctionID] = block.timestamp;
        state[_auctionID] = AuctionState.Running;
        emit AuctionStarted(_auctionID, startTime[_auctionID]);
    }

    /**
     * @dev Cancels an existing auction. Only the auctioneer (creator of the auction)
     * can cancel the auction. This function sets the auction's state to Canceled.
     * It can only be called if the auction is not already begun.
     *
     * @param _auctionID The unique identifier of the auction to be canceled.
     *
     * Requirements:
     * - The caller must be the auctioneer of the auction.
     * - The auction must not have already begun.
     */
    function cancelAuction(
        uint256 _auctionID
    ) public onlyAuctioneer(_auctionID, msg.sender) {
        require(
            state[_auctionID] == AuctionState.Created,
            "Cannot be canceled"
        );
        state[_auctionID] = AuctionState.Canceled;
    }

    /**
     * @dev Calculates the current price of the tokens in a running auction. The price
     * starts from a set starting price and decreases over time at a fixed interval
     * until it reaches the reserve price. The current price is calculated based
     * on the elapsed time since the auction started.
     *
     * @param _auctionID The unique identifier of the auction.
     * @return The current price of the tokens in the specified auction.
     *
     * Requirements:
     * - The auction must be in a running state.
     * - The auction must not have ended (i.e., it must be within the defined lasting time).
     *
     * Notes:
     * - The price drop is calculated based on the number of minutes elapsed since
     *   the start of the auction.
     * - If the calculated current price is less than or equal to the reserve price,
     *   the reserve price is returned as the current price.
     */
    function currentPrice(
        uint256 _auctionID
    ) public view auctionNotEnded(_auctionID) returns (uint256) {
        uint256 elapsedTimes = block.timestamp - startTime[_auctionID];
        uint256 elapsedTimes_in_minutes = elapsedTimes / 60;
        uint256 priceDrop = elapsedTimes_in_minutes *
            priceDropInterval[_auctionID];
        return
            (startPrice[_auctionID] > reservePrice[_auctionID] + priceDrop)
                ? startPrice[_auctionID] - priceDrop
                : reservePrice[_auctionID];
    }

    /**
     * @dev Retrieves the current state of a specified auction.
     * This function returns the state of the auction, which can be one of the following:
     * Created, Running, Ended, Finished, or Canceled.
     *
     * @param _auctionID The unique identifier of the auction whose state is being queried.
     * @return The current state of the auction.
     */
    function getState(uint256 _auctionID) public view returns (AuctionState) {
        return state[_auctionID];
    }

    /**
     * @dev Checks if the total commitments in an auction meet or exceed the current price
     * multiplied by the initial supply of tokens. This function helps in determining whether
     * enough funds have been committed to the auction to meet the selling criteria.
     *
     * @param _auctionID The unique identifier of the auction.
     * @return A boolean value indicating whether the total commitments are sufficient.
     *
     * Requirements:
     * - The auction must be in a running state.
     * - The auction must not have ended (i.e., it must be within the defined lasting time).
     *
     * Notes:
     * - Total commitment is the sum of all bids made in the auction.
     * - The function compares this total commitment against the product of the current price
     *   of tokens and the initial supply to determine if the auction has enough commitments.
     */
    function commitmentEnough(
        uint256 _auctionID
    ) public view auctionNotEnded(_auctionID) returns (bool) {
        return
            totalCommitment[_auctionID] >=
            currentPrice(_auctionID) * initialSupply[_auctionID];
    }

    /**
     * @dev Allows a user to place a bid in a running auction. The bid is the commitment of ETH
     * equivalent to the current price of the token. If the total commitment meets or exceeds
     * the product of the current price and the initial supply, the auction is ended.
     * Any excess funds sent by the bidder are refunded.
     *
     * @param _auctionID The unique identifier of the auction in which to bid.
     * @return A boolean indicating whether the bid was successfully placed.
     *
     * Requirements:
     * - The function call must send enough ETH to cover the current price of the token.
     * - The auction must be in a running state and not yet ended.
     * - The function does not uses nonReentrant modifier. 
     * - This function does not use the nonReentrant modifier to prevent reentrancy attacks.
     *   Instead, it follows the Checks-Effects-Interactions pattern. This approach is chosen
     *   to enable buyers to automatically start a new bid after receiving a refund. Using
     *   the nonReentrant modifier would cause the function to revert if the buyer attempts
     *   to call it again within the same transaction, which is not desirable in this context.

     *
     * Notes:
     * - If the total commitment for the auction is already sufficient, the auction ends,
     *   and the full bid amount is refunded.
     * - If the bid amount is higher than the required to meet the auction target,
     *   the excess is refunded to the bidder.
     * - The function records the bidder's address and the commitment amount.
     * - Emits a `NewBid` event upon a successful bid.
     */
    function bid(
        uint256 _auctionID
    ) public payable auctionNotEnded(_auctionID) returns (bool) {
        uint256 price = currentPrice(_auctionID);
        require(msg.value >= price, "Bid amount is less than current price");
        uint256 refund = 0;
        uint256 commitment = msg.value;

        if (totalCommitment[_auctionID] >= price * initialSupply[_auctionID]) {
            _endAuction(_auctionID);
            refund = commitment;
            payable(msg.sender).transfer(refund);
            return false;
        }

        uint256 remainMaximumValue = price *
            initialSupply[_auctionID] -
            totalCommitment[_auctionID];
        if (commitment > remainMaximumValue) {
            refund = commitment - remainMaximumValue;
            commitment = remainMaximumValue;
        }

        totalCommitment[_auctionID] += commitment;
        bidders[_auctionID].push(msg.sender);
        bids[_auctionID].push(commitment);
        emit NewBid(_auctionID, msg.sender, commitment);

        if (totalCommitment[_auctionID] >= price * initialSupply[_auctionID]) {
            _endAuction(_auctionID);
        }

        if (refund != 0) {
            payable(msg.sender).transfer(refund);
        }

        return true;
    }

    /**
     * @dev Internal function to end an auction. It changes the state of the auction to Ended.
     * This function is called when the auction has either reached its time limit or
     * the total commitment has met the auction's requirements.
     *
     * @param _auctionID The unique identifier of the auction to be ended.
     *
     * Requirements:
     * - The auction must be currently running.
     */
    function _endAuction(uint256 _auctionID) internal {
        require(
            state[_auctionID] == AuctionState.Running,
            "Auction is not running"
        );
        state[_auctionID] = AuctionState.Ended;
        emit AuctionEnded(_auctionID);
    }

    /**
     * @dev Public function to end an auction. It can be called by anyone.
     * The auction is ended if the current time exceeds the auction's duration or
     * if the total commitment is enough to meet the auction's requirements.
     * This function calls the internal `_endAuction` function.
     *
     * @param _auctionID The unique identifier of the auction to be ended.
     * @return A boolean indicating whether the auction was successfully ended.
     *
     * Requirements:
     * - The auction must be currently running.
     * - The auction must have either reached its time limit or met its total commitment requirement.
     */
    function endAuction(uint256 _auctionID) public returns (bool) {
        require(
            state[_auctionID] == AuctionState.Running,
            "Auction is not running"
        );

        if (block.timestamp > startTime[_auctionID] + lastingTime) {
            _endAuction(_auctionID);
        } else {
            require(
                commitmentEnough(_auctionID),
                "Total commitment is not enough"
            );
            _endAuction(_auctionID);
        }

        return true;
    }

    /**
     * @dev Internal function to calculate the final price per token at the end of an auction.
     * The final price is determined by the total commitment divided by the initial supply of tokens.
     * However, if this calculated price is less than the reserve price, the reserve price is used instead.
     *
     * @param _auctionID The unique identifier of the auction.
     * @return The final price per token for the auction.
     *
     * Notes:
     * - If there are no commitments (total commitment is zero), the function returns 0.
     * - The function ensures that the final price is not less than the reserve price.
     */
    function _finalPrice(uint256 _auctionID) internal view returns (uint256) {
        if (totalCommitment[_auctionID] == 0) {
            return 0;
        }
        uint256 price = totalCommitment[_auctionID] / initialSupply[_auctionID];
        if (price < reservePrice[_auctionID]) {
            price = reservePrice[_auctionID];
        }
        return price;
    }

    /**
     * @dev Public function to get the final price of tokens in an auction.
     * It calls the internal `_finalPrice` function and can only be called once the auction has ended.
     *
     * @param _auctionID The unique identifier of the auction.
     * @return The final price per token for the auction.
     *
     * Requirements:
     * - The auction must have already ended.
     */
    function finalPrice(uint256 _auctionID) external view returns (uint256) {
        require(
            state[_auctionID] == AuctionState.Ended,
            "Auction has not ended"
        );
        return _finalPrice(_auctionID);
    }

    /**
     * @dev Completes an auction that has ended. This function distributes the tokens to bidders,
     * refunds any excess commitments, and transfers the sale proceeds to the auctioneer.
     * The function can only be called once the auction has ended, and it marks the auction's state as Finished.
     *
     * @param _auctionID The unique identifier of the auction to be completed.
     *
     * Requirements:
     * - The auction must have already ended (AuctionState.Ended).
     *
     * Process:
     * - Calculates the final price per token.
     * - Iterates through all bidders, transferring the appropriate amount of tokens to each bidder
     *   and refunding any excess bid amount.
     * - Updates the auctioneer's balance with the total sale proceeds.
     * - Emits an AuctionResult event with details of the auction result.
     * - Adjusts the shouldBurnValue to account for any unsold tokens.
     * - Sets the auction state to Finished.
     *
     * Notes:
     * - This function uses the nonReentrant modifier to prevent reentrancy attacks.
     * - Ensures that the auctioneer's allowance is adjusted to account for the tokens sold.
     */
    function completeAuction(uint256 _auctionID) public nonReentrant {
        require(
            state[_auctionID] == AuctionState.Ended,
            "Auction has not ended"
        );

        uint256 bidsNumber = bidders[_auctionID].length;
        uint256 price = _finalPrice(_auctionID);
        uint256 totalTransfer = 0;
        uint256 sellerBalance = 0;
        allowanceRequired[auctioneer[_auctionID]] -= initialSupply[_auctionID];

        for (uint i = 0; i < bidsNumber; i++) {
            amount[_auctionID].push(bids[_auctionID][i] / price);
            bids[_auctionID][i] -= price * amount[_auctionID][i];
            token.transferFrom(
                auctioneer[_auctionID],
                bidders[_auctionID][i],
                amount[_auctionID][i]
            );
            totalTransfer += amount[_auctionID][i];
            sellerBalance += amount[_auctionID][i] * price;
            if (bids[_auctionID][i] > 0) {
                payable(bidders[_auctionID][i]).transfer(bids[_auctionID][i]);
            }
        }
        payable(auctioneer[_auctionID]).transfer(sellerBalance);
        emit AuctionResult(_auctionID, bidders[_auctionID], bids[_auctionID]);
        shouldBurnValue[auctioneer[_auctionID]] +=
            initialSupply[_auctionID] -
            totalTransfer;
        state[_auctionID] = AuctionState.Finished;
    }

    /**
     * @dev Burns the remaining tokens that were not sold in an auction.
     * This function calls the `burnAllowance` function of the DUT token contract
     * to burn the tokens allocated to an auction but not sold. It is typically called
     * after an auction is completed to handle unsold tokens.
     *
     * @param _auctioneer The address of the auctioneer whose tokens are to be burned.
     *
     * Process:
     * - Calls the `burnAllowance` function of the DUT token contract with the auctioneer's address
     *   and the amount of tokens to be burned.
     * - Emits an `AuctionTokenBurn` event indicating the number of tokens burned.
     * - Resets the `shouldBurnValue` for the auctioneer to 0, indicating that all unsold tokens
     *   have been handled.
     *
     * Notes:
     * - This function can be called by any user, but it will only have an effect if
     *   there are tokens to be burned (as indicated by `shouldBurnValue[_auctioneer]`).
     */
    function burnToken(address _auctioneer) public {
        token.burnAllowance(
            _auctioneer,
            address(this),
            shouldBurnValue[_auctioneer]
        );
        emit AuctionTokenBurn(_auctioneer, shouldBurnValue[_auctioneer]);
        shouldBurnValue[_auctioneer] = 0;
    }
}
