// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {MockERC20} from "../src/bsc20/MockERC20.sol";

contract MockERC20Script is Script {

    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0));
        require(
            deployerPrivateKey != 0,
            "PRIVATE_KEY is not set. Example: PRIVATE_KEY=0x... forge script script/MockERC20.s.sol:MockERC20Script --rpc-url http://127.0.0.1:8545 --broadcast"
        );

        vm.startBroadcast(deployerPrivateKey);
        //WBNB,USDT,USDC,CAKE,BUSD,PIG,ASS,
        MockERC20 mockERC20 = new MockERC20("WBNB","WBNB", 18);
        console.log("WBNB deployed at:", address(mockERC20));
        MockERC20 mockERC201 = new MockERC20("USDT","USDT", 6);
        console.log("USDT deployed at:", address(mockERC201));
        MockERC20 mockERC202 = new MockERC20("USDC","USDC", 18);
        console.log("USDC deployed at:", address(mockERC202));

        MockERC20 mockERC203 = new MockERC20("CAKE","CAKE", 18);
        console.log("CAKE deployed at:", address(mockERC203));

        MockERC20 mockERC204 = new MockERC20("BUSD","BUSD", 18);
        console.log("BUSD deployed at:", address(mockERC204));

        MockERC20 mockERC205 = new MockERC20("PIG","PIG", 18);
        console.log("PIG deployed at:", address(mockERC205));

        MockERC20 mockERC206 = new MockERC20("ASS","ASS", 18);
        console.log("ASS deployed at:", address(mockERC206));

        vm.stopBroadcast();
    }
}
/**

anvil --port 8545
export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

cd /home/administrator/workspace/evm_client_foundry
forge script script/MockERC20.s.sol:MockERC20Script --rpc-url http://127.0.0.1:8545 --broadcast
cd /home/administrator/workspace/evm_client_foundry
forge script script/DEPLOY.s.sol:MockERC20Script --rpc-url http://127.0.0.1:8545 --broadcast
*/

