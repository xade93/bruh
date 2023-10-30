// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract DutchAuction {
    address public auctioneer;
    uint256 public reservePrice;
    uint256 public startPrice;
    uint256 public startBlock;
    uint256 public priceDropInterval;
    address public highestBidder;
    uint256 public highestBid;

    enum AuctionState { Created, Running, Ended, Canceled }
    AuctionState public state;

    event AuctionStarted(uint startBlock);
    event NewBid(address bidder, uint amount);
    event AuctionEnded(address winner, uint amount);

    constructor(
        uint256 _startPrice,
        uint256 _reservePrice,
        uint256 _priceDropInterval
    ) {
        auctioneer = msg.sender;
        startPrice = _startPrice;
        reservePrice = _reservePrice;
        startBlock = block.number;
        priceDropInterval = _priceDropInterval;
        state = AuctionState.Created;
    }

    modifier onlyAuctioneer() {
        require(msg.sender == auctioneer);
        _;
    }

    modifier auctionNotEnded() {
        require(state == AuctionState.Running);
        _;
    }

    function startAuction() public onlyAuctioneer {
        state = AuctionState.Running;
        emit AuctionStarted(startBlock);
    }

    function cancelAuction() public onlyAuctioneer {
        state = AuctionState.Canceled;
    }

    function currentPrice() public view returns (uint256) {
        if (state == AuctionState.Created || state == AuctionState.Canceled) {
            return 0;
        }
        uint256 elapsedBlocks = block.number - startBlock;
        uint256 priceDrop = elapsedBlocks / priceDropInterval;
        return (startPrice > priceDrop) ? startPrice - priceDrop : reservePrice;
    }

    function bid() public payable auctionNotEnded {
        uint256 price = currentPrice();
        require(msg.value >= price);

        if (highestBidder != address(0)) {
            // Refund the previous highest bidder
            payable(highestBidder).transfer(highestBid);
        }

        highestBidder = msg.sender;
        highestBid = price;

        emit NewBid(msg.sender, price);
    }

    function finalizeAuction() public {
        require(state == AuctionState.Running);
        require(block.number >= startBlock);

        state = AuctionState.Ended;
        emit AuctionEnded(highestBidder, highestBid);

        // Transfer the highest bid to the auctioneer
        payable(auctioneer).transfer(highestBid);
    }
}