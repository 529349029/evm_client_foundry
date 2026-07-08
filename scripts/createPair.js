require('dotenv').config();
const path = require('path');
const fs = require('fs');
const ethers = require('ethers');

function parseArg(name) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
];

async function approveToken(tokenAddress, spender, amount, wallet) {
  const token = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
  const currentAllowance = await token.allowance(wallet.address, spender);
  const currentAllowanceBigInt = BigInt(currentAllowance.toString ? currentAllowance.toString() : currentAllowance);
  if (currentAllowanceBigInt >= amount) {
    console.log(`Already approved ${spender} to spend ${tokenAddress}, allowance = ${currentAllowanceBigInt.toString()}`);
    return;
  }
  const approvalTx = await token.approve(spender, amount);
  console.log(`approve(${spender}, ${amount.toString()}) tx hash:`, approvalTx.hash);
  await approvalTx.wait();
  console.log(`Approved ${spender} to spend ${amount.toString()} of ${tokenAddress}`);
}

async function main() {
  const rpcUrl = parseArg('rpc-url') || process.env.RPC_URL || 'http://127.0.0.1:8545';
  const privateKey = parseArg('private-key') || process.env.PRIVATE_KEY;
  const factoryAddress = parseArg('factory-address') || process.env.FACTORY_ADDRESS;
  const tokenA = parseArg('token-a') || process.env.TOKEN_A;
  const tokenB = parseArg('token-b') || process.env.TOKEN_B;
  const approveAmount = parseArg('approve-amount') || process.env.APPROVE_AMOUNT || '115792089237316195423570985008687907853269984665640564039457584007913129639935';
  const approveSpender = parseArg('approve-to') || process.env.APPROVE_TO || factoryAddress;

  if (!privateKey) {
    console.error('Missing private key. Set PRIVATE_KEY or pass --private-key=0x...');
    process.exit(1);
  }
  if (!factoryAddress) {
    console.error('Missing factory address. Set FACTORY_ADDRESS or pass --factory-address=0x...');
    process.exit(1);
  }
  if (!tokenA || !tokenB) {
    console.error('Missing token addresses. Set TOKEN_A and TOKEN_B or pass --token-a=0x... --token-b=0x...');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  const artifactPath = path.join(__dirname, '../out/PancakeFactory.sol/PancakeFactory.json');
  if (!fs.existsSync(artifactPath)) {
    console.error(`Cannot find PancakeFactory artifact at ${artifactPath}`);
    process.exit(1);
  }

  const artifact = require(artifactPath);
  if (!artifact.abi) {
    console.error('Artifact does not contain ABI. Recompile with forge build.');
    process.exit(1);
  }

  const factory = new ethers.Contract(factoryAddress, artifact.abi, wallet);

  console.log('RPC URL:', rpcUrl);
  console.log('Factory:', factoryAddress);
  console.log('Deployer:', wallet.address);
  console.log('Token A:', tokenA);
  console.log('Token B:', tokenB);

  if (approveSpender) {
    const amount = BigInt(approveAmount);
    console.log('Approving tokens before createPair...');
    await approveToken(tokenA, approveSpender, amount, wallet);
    await approveToken(tokenB, approveSpender, amount, wallet);
  }

  const nonce = await provider.getTransactionCount(wallet.address, 'pending');
  console.log('Using nonce for createPair:', nonce);

  const tx = await factory.createPair(tokenA, tokenB, { nonce });
  console.log('createPair tx hash:', tx.hash);

  const receipt = await tx.wait();
  console.log('Transaction confirmed in block', receipt.blockNumber);

  const pairAddress = await factory.getPair(tokenA, tokenB);
  console.log('Pair address:', pairAddress);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});