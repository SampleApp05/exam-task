// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {AccessControl, IAccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

interface IStakeableToken is IERC20, IAccessControl {
    function mint(address to, uint256 amount) external;

    function decimals() external returns (uint8);
}

contract StakeX is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor(address admin, address minter) ERC20("StakeX", "STX") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, minter);

        mint(admin, 5_000_000 * 10 ** decimals());
    }

    // MARK: - Public
    function decimals() public pure override returns (uint8) {
        return 8;
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }
}
