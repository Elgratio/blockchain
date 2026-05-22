// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockERC20
 * @notice Token ERC20 tiruan untuk keperluan testing lokal.
 *         JANGAN deploy ke mainnet.
 */
contract MockERC20 is ERC20, Ownable {
    uint8 private _decimals;

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_
    ) ERC20(name, symbol) Ownable(msg.sender) {
        _decimals = decimals_;
    }

    /// @notice Mint token ke alamat tertentu. Hanya untuk testing.
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /// @notice Override decimals agar bisa disesuaikan (USDC = 6)
    function decimals() public view override returns (uint8) {
        return _decimals;
    }
}