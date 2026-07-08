require('dotenv').config();
const path = require('path');
const fs = require('fs');
const ethers = require('ethers');

function parseArg(name) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

async function main() {
  const rpcUrl = parseArg('rpc-url') || process.env.RPC_URL || 'http://127.0.0.1:8545';
  const privateKey = parseArg('private-key') || process.env.PRIVATE_KEY;
  const factoryAddress = parseArg('factory-address') || process.env.FACTORY_ADDRESS;
  const wethAddress = parseArg('weth-address') || process.env.WETH_ADDRESS;

  if (!privateKey) {
    console.error('Missing private key. Set PRIVATE_KEY or pass --private-key=0x...');
    process.exit(1);
  }
  if (!factoryAddress) {
    console.error('Missing factory address. Set FACTORY_ADDRESS or pass --factory-address=0x...');
    process.exit(1);
  }
  if (!wethAddress) {
    console.error('Missing WETH address. Set WETH_ADDRESS or pass --weth-address=0x...');
    process.exit(1);
  }

  const wallet = new ethers.Wallet(privateKey);
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = wallet.connect(provider);

  const artifactPath = path.join(__dirname, '../out/PancakeRouter.sol/PancakeRouter.json');
  if (!fs.existsSync(artifactPath)) {
    console.error(`Cannot find compiled artifact at ${artifactPath}`);
    process.exit(1);
  }

  const artifact = require(artifactPath);
  if (!artifact.abi || !artifact.bytecode) {
    console.error('Artifact does not contain ABI or bytecode. Recompile with forge build.');
    process.exit(1);
  }

  console.log('RPC URL:', rpcUrl);
  console.log('Deployer:', signer.address);
  console.log('Factory address:', factoryAddress);
  console.log('WETH address:', wethAddress);
  console.log('Loading PancakeRouter artifact from:', artifactPath);

  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);
  const contract = await factory.deploy(factoryAddress, wethAddress);
  const deployTx = contract.deployTransaction || contract.deploymentTransaction?.();
  console.log('Deploy transaction hash:', deployTx ? deployTx.hash : 'unknown');

  if (contract.waitForDeployment) {
    await contract.waitForDeployment();
  } else if (deployTx && provider) {
    await provider.waitForTransaction(deployTx.hash);
  }

  console.log('PancakeRouter deployed at:', contract.target || contract.address);
  console.log('Verify with:');
  console.log(`  cast call --rpc-url ${rpcUrl} ${contract.address} "factory()"`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
