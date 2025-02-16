import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
// import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre, { network } from "hardhat";
import { StakeX } from "../typechain-types";
import { bigint } from "hardhat/internal/core/params/argumentTypes";
// import { Addressable } from "ethers";

describe("StakingPool Contract", function () {
  const ONE_DAY = 60 * 60 * 24;

  async function deployTokenFixture() {
    const [owner] = await hre.ethers.getSigners();

    const factory = await hre.ethers.getContractFactory("StakeX");
    const contract = await factory.deploy(owner.address, owner.address);
    await contract.waitForDeployment();

    return { contract };
  }

  async function deployPoolFixure() {
    const [owner, staker, invalidStaker] = await hre.ethers.getSigners();
    let { contract: token } = await loadFixture(deployTokenFixture);

    const factory = await hre.ethers.getContractFactory("StakingPool");
    const pool = await factory.deploy(token.target, 5);
    await pool.waitForDeployment();

    let minterRole = await token.MINTER_ROLE();

    await token.grantRole(minterRole, pool.target);

    return { token, pool, owner, staker, invalidStaker, minterRole };
  }

  async function deployAndApprovePoolFixture() {
    let { token, pool, owner, staker, invalidStaker } = await loadFixture(
      deployPoolFixure
    );

    let stakerBalance = hre.ethers.parseUnits("1000", await token.decimals());

    await token.mint(staker.address, stakerBalance);
    await token.mint(invalidStaker.address, stakerBalance);
    await token.connect(staker).approve(pool.target, stakerBalance);

    return {
      token,
      pool,
      owner,
      staker,
      invalidStaker,
      stakerInitialBalance: stakerBalance,
    };
  }
  async function stakeFixture() {
    let { token, pool, owner, staker, invalidStaker, stakerInitialBalance } =
      await loadFixture(deployAndApprovePoolFixture);

    await pool.connect(staker).stake(stakerInitialBalance);

    return {
      token,
      pool,
      owner,
      staker,
      invalidStaker,
      stakerInitialBalance,
    };
  }

  describe("Deployment", function () {
    it("Should deploy StakingPool Contract", async function () {
      let { token, pool, minterRole } = await loadFixture(deployPoolFixure);

      expect(await pool.rewardRate()).to.equal(5);
      expect(await pool.tokenContract()).to.equal(token.target);
      expect(await token.hasRole(minterRole, pool.target)).to.be.true;
    });
  });

  describe("Staking Operations", function () {
    it("Stake should succeed", async function () {
      let { token, pool, staker, stakerInitialBalance } = await loadFixture(
        deployAndApprovePoolFixture
      );

      let transaction = pool.connect(staker).stake(stakerInitialBalance);

      await expect(transaction).to.changeTokenBalances(
        token,
        [pool.target, staker],
        [stakerInitialBalance, -stakerInitialBalance]
      );

      let userStake = await pool.stakedBalances(staker.address);
      expect(userStake.balance).to.be.equal(stakerInitialBalance);
      expect(userStake.lastUpdated).to.be.equal(await time.latest());

      expect(await pool.rewardBalances(staker.address)).to.equal(0);
    });

    it("Should emit event on stake", async function () {
      let { pool, staker, stakerInitialBalance } = await loadFixture(
        deployAndApprovePoolFixture
      );

      let transaction = pool.connect(staker).stake(stakerInitialBalance);

      await expect(transaction)
        .to.emit(pool, "UserStaked")
        .withArgs(staker.address, stakerInitialBalance);
    });

    it("Should revert if stake amount is 0", async function () {
      let { pool, staker, stakerInitialBalance } = await loadFixture(
        deployAndApprovePoolFixture
      );

      let transaction = pool.connect(staker).stake(BigInt(0));

      await expect(transaction).to.be.revertedWithCustomError(
        pool,
        "InvalidAmount"
      );
    });

    it("Should revert if balance is too low", async function () {
      let { pool, staker, stakerInitialBalance } = await loadFixture(
        deployAndApprovePoolFixture
      );

      let transaction = pool
        .connect(staker)
        .stake(stakerInitialBalance + BigInt(1));

      await expect(transaction).to.be.revertedWithCustomError(
        pool,
        "InsuficientBalance"
      );
    });

    it("Should revert if unsufficient allowance", async function () {
      let { pool, invalidStaker, stakerInitialBalance } = await loadFixture(
        deployAndApprovePoolFixture
      );

      let transaction = pool.connect(invalidStaker).stake(stakerInitialBalance);
      await expect(transaction).to.be.reverted;
    });
  });

  describe("Unstaking Operations", function () {
    it("Unstake should succeed", async function () {
      let { token, pool, staker, stakerInitialBalance } = await loadFixture(
        stakeFixture
      );

      let transaction = pool.connect(staker).unstake(stakerInitialBalance);

      await expect(transaction).to.changeTokenBalances(
        token,
        [pool.target, staker],
        [-stakerInitialBalance, stakerInitialBalance]
      );

      let userStake = await pool.stakedBalances(staker.address);
      expect(userStake.balance).to.be.equal(0);
    });

    it("Unstake should update lastUpdated timestamp", async function () {
      let { pool, staker, stakerInitialBalance } = await loadFixture(
        stakeFixture
      );

      await pool.connect(staker).unstake(stakerInitialBalance);
      let userStake = await pool.stakedBalances(staker.address);

      expect(userStake.lastUpdated).to.be.equal(await time.latest());
    });

    it("Unstake should emit event", async function () {
      let { pool, staker, stakerInitialBalance } = await loadFixture(
        stakeFixture
      );

      let transaction = pool.connect(staker).unstake(stakerInitialBalance);

      await expect(transaction)
        .to.emit(pool, "UserUnstaked")
        .withArgs(staker.address, stakerInitialBalance);
    });

    it("Unstake should update rewards if needed", async function () {
      let { pool, staker, stakerInitialBalance } = await loadFixture(
        stakeFixture
      );

      await time.increase(ONE_DAY * 365);
      await pool.connect(staker).unstake(stakerInitialBalance);

      let rewardBalance = await pool.rewardBalances(staker.address);
      let expectedReward = hre.ethers.parseUnits("50", 8);

      expect(rewardBalance).to.be.closeTo(expectedReward, 100000); // 100000 = 0.01%
    });

    it("Unstake should revert if amount is greater that staked balance", async function () {
      let { pool, staker, stakerInitialBalance } = await loadFixture(
        stakeFixture
      );

      let transaction = pool
        .connect(staker)
        .unstake(stakerInitialBalance + BigInt(100));

      await expect(transaction).to.be.revertedWithCustomError(
        pool,
        "AmountGreaterThanStakedBalance"
      );
    });
  });

  describe("Claiming Rewards Operations", function () {
    it("Claim should succeed", async function () {
      let { token, pool, staker, stakerInitialBalance } = await loadFixture(
        stakeFixture
      );

      await time.increase(ONE_DAY * 365); // one year
      await pool.connect(staker).claimRewards();

      let expectedReward = hre.ethers.parseUnits("50", 8);

      expect(await token.balanceOf(staker.address)).to.be.closeTo(
        expectedReward,
        100000
      );

      let rewardBalance = await pool.rewardBalances(staker.address);
      expect(rewardBalance).to.be.equal(0);
    });

    it("Claim should emit event on success", async function () {
      let { token, pool, staker, stakerInitialBalance } = await loadFixture(
        stakeFixture
      );

      await time.increase(ONE_DAY * 365); // one year
      expect(await pool.connect(staker).claimRewards())
        .to.emit(pool, "UserClaimedRewards")
        .withArgs(staker.address);
    });

    it("Claim should revert if no rewards to claim", async function () {
      let { pool, staker, invalidStaker } = await loadFixture(stakeFixture);
      let transaction = pool.connect(invalidStaker).claimRewards();

      await expect(transaction).to.be.revertedWithCustomError(
        pool,
        "NoDepositsFound"
      );
    });

    it("Claim should revert no rewards were accrued", async function () {
      let { pool, staker, stakerInitialBalance } = await loadFixture(
        stakeFixture
      );

      let currentTime = (await time.latest()) + ONE_DAY * 365;
      await time.setNextBlockTimestamp(currentTime);
      await pool.connect(staker).claimRewards();

      await network.provider.send("evm_mine", [currentTime]); // simulate several claim attempts

      let transaction = pool.connect(staker).claimRewards();
      await expect(transaction).to.be.revertedWithCustomError(
        pool,
        "NoRewardsAccrued"
      );
    });
  });
});
