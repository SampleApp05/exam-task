// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {IStakeableToken} from "./StakeXToken.sol";

struct Stake {
    uint256 balance;
    uint256 lastUpdated;
}

error InvalidAmount();
error InvalidRewardRate();
error NoDepositsFound();
error NoRewardsAccrued();
error AmountGreaterThanStakedBalance();
error TokenContractIncomptible();
error InsuficientBalance();

contract StakingPool {
    event UserStaked(address indexed user, uint256 amount);

    event UserUnstaked(address indexed user, uint256 amount);

    event UserClaimedRewards(address indexed user);

    uint8 public immutable rewardRate;
    IStakeableToken public immutable tokenContract;

    mapping(address => Stake) public stakedBalances;
    mapping(address => uint256) public rewardBalances;

    // rewardRate -> 5 == 5%
    constructor(address tokenContractAddress, uint8 _rewardRate) {
        if (_rewardRate == 0 || _rewardRate > 100) {
            revert InvalidRewardRate();
        }

        tokenContract = IStakeableToken(tokenContractAddress);

        if (tokenContract.decimals() < 2) {
            revert TokenContractIncomptible();
        }

        rewardRate = _rewardRate;
    }

    modifier validateAmount(uint256 amount) {
        if (amount == 0) {
            revert InvalidAmount();
        }
        _;
    }

    modifier onlyStaker() {
        if (stakedBalances[msg.sender].lastUpdated == 0) {
            revert NoDepositsFound();
        }
        _;
    }

    // MARK: - Private
    function _updateUserRewards(
        Stake storage userStake
    ) private returns (uint256) {
        uint256 secondsSinceLastUpdate = block.timestamp -
            userStake.lastUpdated;
        userStake.lastUpdated = block.timestamp;

        if (userStake.balance == 0 || secondsSinceLastUpdate == 0) {
            return 0;
        }

        uint256 reward = (userStake.balance *
            rewardRate *
            secondsSinceLastUpdate) / (365 days * 100); // reward based on rewards per second and elapsed time

        return reward;
    }

    // MARK: - Public

    // Requires approval by msg.sender to transfer the tokens
    function stake(uint256 amount) public validateAmount(amount) {
        if (amount > tokenContract.balanceOf(msg.sender)) {
            revert InsuficientBalance();
        }

        Stake storage userStake = stakedBalances[msg.sender];

        uint256 reward = _updateUserRewards(userStake);
        if (reward > 0) {
            rewardBalances[msg.sender] += reward;
        }

        tokenContract.transferFrom(msg.sender, address(this), amount); // would auto revert if not enough allowance

        userStake.balance += amount;
        userStake.lastUpdated = block.timestamp;

        emit UserStaked(msg.sender, amount);
    }

    function unstake(uint256 amount) public onlyStaker validateAmount(amount) {
        Stake storage userStake = stakedBalances[msg.sender];

        if (amount > userStake.balance) {
            revert AmountGreaterThanStakedBalance();
        }

        uint256 reward = _updateUserRewards(userStake);
        if (reward > 0) {
            rewardBalances[msg.sender] += reward;
        }

        userStake.balance -= amount;
        userStake.lastUpdated = block.timestamp;

        tokenContract.transfer(msg.sender, amount);

        emit UserUnstaked(msg.sender, amount);
    }

    function unstakeAll() public onlyStaker {
        unstake(stakedBalances[msg.sender].balance);
    }

    function claimRewards() public onlyStaker {
        Stake storage userStake = stakedBalances[msg.sender];

        uint256 reward = rewardBalances[msg.sender] +
            _updateUserRewards(userStake);

        if (reward == 0) {
            revert NoRewardsAccrued();
        }

        rewardBalances[msg.sender] = 0;

        tokenContract.mint(msg.sender, reward);

        emit UserClaimedRewards(msg.sender);
    }
}
