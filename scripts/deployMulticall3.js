// 部署 Multicall3 合约到本地 Anvil 测试网
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function deployMulticall3() {
  // 读取编译产物
  const artifactPath = path.join(__dirname, "../out/Multicall3.sol/Multicall3.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));

  const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
  const PRIVATE_KEY = process.env.PRIVATE_KEY;

  if (!PRIVATE_KEY) {
    throw new Error("环境变量 PRIVATE_KEY 未设置");
  }

  console.log(`连接 RPC: ${RPC_URL}`);
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const deployer = wallet.address;

  console.log(`部署者: ${deployer}`);
  console.log(`余额: ${ethers.formatEther(await provider.getBalance(deployer))} ETH`);

  // 创建合约工厂
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode.object, wallet);

  console.log("正在部署 Multicall3...");
  const tx = await factory.deploy();
  console.log(`交易哈希: ${tx.hash}`);

  const contract = await tx.waitForDeployment();
  const address = await contract.getAddress();
  const blockNumber = await provider.getBlockNumber();

  console.log("\n✅ 部署成功！");
  console.log(`合约地址: ${address}`);
  console.log(`区块高度: ${blockNumber}`);

  // 验证：调用 getChainId
  const chainId = await contract.getChainId();
  console.log(`getChainId() 返回: ${chainId}`);

  // 写入部署记录
  const deployRecord = {
    address,
    contract: "Multicall3",
    blockNumber,
    txHash: tx.hash,
    timestamp: new Date().toISOString(),
  };
  const recordPath = path.join(__dirname, "../deployments/multicall3.json");
  fs.mkdirSync(path.dirname(recordPath), { recursive: true });
  fs.writeFileSync(recordPath, JSON.stringify(deployRecord, null, 2));
  console.log(`\n部署记录已写入: ${recordPath}`);
}

deployMulticall3().catch((err) => {
  console.error("部署失败:", err.message);
  process.exit(1);
});
