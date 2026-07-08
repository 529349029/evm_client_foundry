// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {Counter} from "../src/Counter.sol";

contract CounterScript is Script {
    Counter public counter;

    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0));
        require(
            deployerPrivateKey != 0,
            "PRIVATE_KEY is not set. Example: PRIVATE_KEY=0x... forge script script/Counter.s.sol:CounterScript --rpc-url http://127.0.0.1:8545 --broadcast"
        );

        vm.startBroadcast(deployerPrivateKey);

        counter = new Counter();
        console.log("Counter deployed at:", address(counter));

        vm.stopBroadcast();
    }
}
/**

anvil --port 8545
export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

cd /home/administrator/workspace/evm_client_foundry
forge script script/Counter.s.sol:CounterScript --rpc-url http://127.0.0.1:8545 --broadcast
*/

