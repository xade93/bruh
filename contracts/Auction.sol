// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {DUT} from "./Token.sol";

contract DutchAuction {
    mapping(uint256 => address) public auctioneer;
    mapping(uint256 => uint256) public reservePrice;
    mapping(uint256 => uint256) public startPrice;
    mapping(uint256 => uint256) public startTime;
    mapping(uint256 => uint256) public priceDropInterval;
    mapping(uint256 => address[]) public bidders;
    mapping(uint256 => uint256[]) public bids;
    mapping(uint256 => uint256[]) public amount;
    mapping(uint256 => uint256) public totalCommitment;
    mapping(uint256 => uint256) public initialSupply;
    mapping(address => uint256) public allowanceRequired;
    mapping(address => uint256) public shouldBurnValue;
    uint256 public constant lastingTime = 20 minutes;
    DUT public token;

    enum AuctionState {
        Created,
        Running,
        Ended,
        Finished,
        Canceled
    }
    mapping(uint256 => AuctionState) public state;
    uint256[] auctions;

    event AuctionStarted(uint256 auctionID, uint startBlock);
    event NewBid(uint256 auctionID, address bidder, uint amount);
    event AuctionEnded(uint256 auctionID);
    event AuctionResult(uint256 auctionID, address[] winner, uint[] amount);
    event AuctionTokenBurn(address auctioneer, uint256 amount);

    constructor(address _token) {
        token = DUT(_token); // depoly a new token.
    }

    modifier onlyAuctioneer(uint256 _auctionId, address _auctioneer) {
        require(auctioneer[_auctionId] == _auctioneer, "not auctioneer");
        _;
    }

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
        priceDropInterval[auctionID] = _priceDropInterval;
        return auctionID;
    }

    function startAuction(
        uint256 _auctionID
    ) public onlyAuctioneer(_auctionID, msg.sender) {
        require(state[_auctionID] == AuctionState.Created, "Wrong State");
        startTime[_auctionID] = block.timestamp;
        state[_auctionID] = AuctionState.Running;
        emit AuctionStarted(_auctionID, startTime[_auctionID]);
    }

    function cancelAuction(
        uint256 _auctionID
    ) public onlyAuctioneer(_auctionID, msg.sender) {
        state[_auctionID] = AuctionState.Canceled;
    }

    function currentPrice(
        uint256 _auctionID
    ) public view auctionNotEnded(_auctionID) returns (uint256) {
        uint256 elapsedTimes = block.timestamp - startTime[_auctionID];
        uint256 priceDrop = elapsedTimes / priceDropInterval[_auctionID];
        return
            (startPrice[_auctionID] > reservePrice[_auctionID] + priceDrop)
                ? startPrice[_auctionID] - priceDrop
                : reservePrice[_auctionID];
    }

    function getState(uint256 _auctionID) public view returns (AuctionState) {
        return state[_auctionID];
    }

    function commitmentEnough(
        uint256 _auctionID
    ) public view auctionNotEnded(_auctionID) returns (bool) {
        return
            totalCommitment[_auctionID] >=
            currentPrice(_auctionID) * initialSupply[_auctionID];
    }

    function bid(
        uint256 _auctionID
    ) public payable auctionNotEnded(_auctionID) returns (bool) {
        uint256 price = currentPrice(_auctionID);
        require(msg.value >= price);
        if (totalCommitment[_auctionID] >= price * initialSupply[_auctionID]) {
            payable(msg.sender).transfer(price);
            _endAuction(_auctionID);
            return false;
        }
        uint256 remainMaximumValue = price *
            initialSupply[_auctionID] -
            totalCommitment[_auctionID];
        uint256 commitment = msg.value;
        if (commitment > remainMaximumValue) {
            payable(msg.sender).transfer(commitment - remainMaximumValue);
            commitment = remainMaximumValue;
        }
        totalCommitment[_auctionID] += commitment;
        bidders[_auctionID].push(msg.sender);
        bids[_auctionID].push(commitment);
        emit NewBid(_auctionID, msg.sender, commitment);
        if (totalCommitment[_auctionID] >= price * initialSupply[_auctionID]) {
            _endAuction(_auctionID);
        }
        return true;
    }

    function _endAuction(uint256 _auctionID) internal {
        require(state[_auctionID] == AuctionState.Running);
        state[_auctionID] = AuctionState.Ended;
        emit AuctionEnded(_auctionID);
    }

    function endAuction(uint256 _auctionID) public returns (bool) {
        require(state[_auctionID] == AuctionState.Running);
        if (block.timestamp > startTime[_auctionID] + lastingTime) {
            _endAuction(_auctionID);
        } else {
            require(commitmentEnough(_auctionID));
            _endAuction(_auctionID);
        }
        return true;
    }

    function _finalPrice(uint256 _auctionID) internal view returns (uint256) {
        if (totalCommitment[_auctionID] == 0) {
            return 0;
        }
        uint256 price = initialSupply[_auctionID] / totalCommitment[_auctionID];
        if (price < reservePrice[_auctionID]) {
            price = reservePrice[_auctionID];
        }
        return price;
    }

    function completeAuction(uint256 _auctionID) public {
        require(state[_auctionID] == AuctionState.Ended);
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
