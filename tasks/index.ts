import { task } from "hardhat/config";
import { StakeX } from "../typechain-types";

task("deployToken", "Deploy StakeX token contract").setAction(
  async (taskArgs, hre) => {
    const [owner] = await hre.ethers.getSigners();

    const factory = await hre.ethers.getContractFactory("StakeX");
    const contract = await factory.deploy(owner.address, owner.address);
    await contract.waitForDeployment();

    console.log("StakeX deployed to:", contract.target);
    return contract;
  }
);

task("deployPool", "Deploy StakingPool contract").setAction(async (_, hre) => {
  let tokenContract = (await hre.run("deployToken")) as StakeX;

  const factory = await hre.ethers.getContractFactory("StakingPool");
  const contract = await factory.deploy(tokenContract.target, 5);
  await contract.waitForDeployment();

  console.log("StakingPool deployed to:", contract.target);

  let minterRole = await tokenContract.MINTER_ROLE();

  await tokenContract.grantRole(minterRole, contract.target);
});
