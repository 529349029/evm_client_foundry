
// SPDX-License-Identifier: MIT
//仅用于测试，生产环境禁用
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockERC20 - 用于测试的代币合约
 * @dev 任何人都可以调用 mint 函数为自己增发代币，仅用于测试环境！
 */
contract MockERC20 is ERC20 {
    uint8 private immutable _decimals;

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_
    ) ERC20(name, symbol) {
        _decimals = decimals_;
        _mint(msg.sender, 1e60);
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /**
     * @dev 增发代币：仅限测试使用，生产环境请删除或加上严格的权限控制
     * @param to 接收地址
     * @param amount 增发数量
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}