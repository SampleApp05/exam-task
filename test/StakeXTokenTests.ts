import { expect } from "chai";
import hre from "hardhat";

describe("StakeX Token", function () {
  it("Should deploy StakeX token", async function () {
    const [owner] = await hre.ethers.getSigners();

    const factory = await hre.ethers.getContractFactory("StakeX");
    const contract = await factory.deploy(owner.address, owner.address);
    await contract.waitForDeployment();

    let adminRole = await contract.DEFAULT_ADMIN_ROLE();
    let minterRole = await contract.MINTER_ROLE();

    expect(await contract.hasRole(adminRole, owner.address)).to.be.true;
    expect(await contract.hasRole(minterRole, owner.address)).to.be.true;
    expect(await contract.decimals()).to.be.equal(8);

    let expectedBalance = hre.ethers.parseUnits(
      "5000000",
      await contract.decimals()
    );

    expect(await contract.balanceOf(owner.address)).to.be.equal(
      expectedBalance
    );
  });
});
