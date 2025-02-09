pragma solidity ^0.5.0;

import "./DappToken.sol";
import "./MockDaiToken.sol";

contract TokenFarm {
    string public name = "Web3ish Token Farm";
    address public owner;
    DappToken public dappToken;
    DaiToken public daiToken;

    address[] public stakers;
    mapping (address=>uint) public stakingBalance;
    mapping (address=>bool) public hasStaked;
    mapping (address=>bool) public isStaking;

    constructor(DappToken _dappToken, DaiToken _daiToken) public {
        dappToken = _dappToken;
        daiToken = _daiToken;
        owner = msg.sender;
    }

    modifier onlyOwner() {
    require(msg.sender==owner, "caller must be the owner");
    _;
    }

    function stakeTokens(uint _amount) public {
        require(_amount > 0, "can't be 0");
        daiToken.transferFrom(msg.sender, address(this), _amount);
        stakingBalance[msg.sender] += stakingBalance[msg.sender] + _amount;

        if(!hasStaked[msg.sender]) {
            stakers.push(msg.sender);
        }
        isStaking[msg.sender] = true;
        hasStaked[msg.sender] = true;
    }

    function issueTokens() public onlyOwner {
        for(uint i; i<stakers.length; i++) {
            address recipient = stakers[i];
            uint balance = stakingBalance[recipient];
            if(balance > 0) {
                dappToken.transfer(recipient, balance);
            }
        }
    }

    function unstakeTokens() public {
        uint balance = stakingBalance[msg.sender];
        require(balance > 0, "your balance is 0");
        daiToken.transfer(msg.sender, balance);
        stakingBalance[msg.sender] = 0;
        isStaking[msg.sender] = false;
    }
}