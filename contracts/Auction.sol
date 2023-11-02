// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {DUT} from "./Token.sol";

contract DutchAuction {
    address public auctioneer;
    uint256 public reservePrice;
    uint256 public startPrice;
    uint256 public startTime;
    uint256 public priceDropInterval;
    address[] public bidders;
    uint256[] public bids;
    uint256[] public amount;
    uint256 public totalCommitment;
    uint256 initialSupply;

    DUT private token;

    enum AuctionState {
        Created,
        Running,
        Ended,
        Canceled
    }
    AuctionState public state;

    event AuctionStarted(uint startBlock);
    event NewBid(address bidder, uint amount);
    event AuctionEnded(address[] winner, uint[] amount);

    constructor(
        uint256 _startPrice,
        uint256 _reservePrice,
        uint256 _priceDropInterval,
        uint256 _initialSupply
    ) {
        auctioneer = msg.sender;
        startPrice = _startPrice;
        reservePrice = _reservePrice;
        priceDropInterval = _priceDropInterval;
        state = AuctionState.Created;
        initialSupply = _initialSupply;
        token = new DUT(_initialSupply); // depoly a new contract
    }

    modifier onlyAuctioneer() {
        require(msg.sender == auctioneer);
        _;
    }

    modifier auctionNotEnded() {
        require(state == AuctionState.Running, "auction is not running");
        require(block.timestamp <= startTime + 20 minutes, "auction has been expired");
        _;
    }

    function startAuction() public onlyAuctioneer {
        startTime = block.timestamp;
        state = AuctionState.Running;
        emit AuctionStarted(startTime);
    }

    function cancelAuction() public onlyAuctioneer {
        state = AuctionState.Canceled;
    }

    function currentPrice() public view auctionNotEnded returns (uint256) {
        uint256 elapsedTimes = block.timestamp - startTime;
        uint256 priceDrop = elapsedTimes / priceDropInterval;
        return
            (startPrice - priceDrop > reservePrice)
                ? startPrice - priceDrop
                : reservePrice;
    }

    function bid() public payable auctionNotEnded {
        uint256 price = currentPrice();
        require(msg.value >= price);
        uint256 remainSupply = initialSupply - totalCommitment * price;
        uint256 remainMaximumValue = remainSupply * price;
        uint256 commitment = msg.value;
        if (commitment > remainMaximumValue) {
            payable(msg.sender).transfer(commitment - remainMaximumValue);
            commitment = remainMaximumValue;
        }
        totalCommitment += msg.value;
        bidders.push(msg.sender);
        bids.push(msg.value);
        emit NewBid(msg.sender, msg.value);
        if (totalCommitment >= price * initialSupply) {
            finalizeAuction();
        }
    }

    function finalizeAuction() public {
        require(state == AuctionState.Running);
        require(block.timestamp >= startTime);
        state = AuctionState.Ended;
        require(bidders.length == bids.length);
        uint bidsNumber = bidders.length;
        uint256 price = currentPrice();
        for (uint i = 0; i < bidsNumber; i++) {
            amount.push(bids[i] / price);
            bids[i] -= price * amount[i];
            token.transfer(bidders[i], amount[i]);
            if (bids[i] > 0) {
                payable(bidders[i]).transfer(bids[i]);
            }
        }
        emit AuctionEnded(bidders, bids);
        // Transfer the highest bid to the auctioneer
        if (block.timestamp >= startTime + 20 minutes) {
            token.burnAfterTime();
        }
    }
}
