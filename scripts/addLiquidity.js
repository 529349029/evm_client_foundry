const path = require('path');
const fs = require('fs');
const ethers = require('ethers');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

function parseArg(name) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

function readConfig(name, envName, fallback) {
  const value = parseArg(name) ?? process.env[envName];
  return value === undefined || value === '' ? fallback : value;
}

function maskValue(value) {
  if (!value) {
    return 'not set';
  }
  if (value.length <= 12) {
    return `${value.slice(0, 4)}...${value.slice(-2)}`;
  }
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function parseAmount(value, decimals) {
  if (value === undefined || value === null || value === '') {
    throw new Error('Missing amount value');
  }

  const normalized = String(value).trim().replace(/_/g, '');
  if (!normalized) {
    throw new Error('Empty amount value');
  }

  if (normalized.startsWith('0x')) {
    return BigInt(normalized);
  }

  if (normalized.includes('.')) {
    const [whole, frac = ''] = normalized.split('.');
    if (frac.length > decimals) {
      throw new Error(`Too many decimal places for ${decimals} decimals: ${normalized}`);
    }
    const padded = `${whole || '0'}${frac.padEnd(decimals, '0')}`;
    return BigInt(padded);
  }

  return BigInt(normalized);
}

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function balanceOf(address owner) external view returns (uint256)',
];

async function approveToken(tokenAddress, spender, amount, wallet) {
  const token = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
  const currentAllowance = await token.allowance(wallet.address, spender);
  const currentAllowanceBigInt = BigInt(currentAllowance.toString ? currentAllowance.toString() : currentAllowance);
  if (currentAllowanceBigInt >= amount) {
    console.log(`[approve] ${tokenAddress} already approved for ${spender} (allowance=${currentAllowanceBigInt.toString()})`);
    return;
  }

  const approvalTx = await token.approve(spender, amount);
  console.log(`[approve] Sent approval tx ${approvalTx.hash} for ${spender}`);
  await approvalTx.wait();
  console.log(`[approve] Approval confirmed for ${spender}`);
}

async function main() {
  const envPath = path.resolve(__dirname, '../.env');
  const rpcUrl = readConfig('rpc-url', 'RPC_URL', 'http://127.0.0.1:8545');
  const privateKey = readConfig('private-key', 'PRIVATE_KEY', '');
  const routerAddress = readConfig('router-address', 'ROUTER_ADDRESS', '');
  const tokenA = readConfig('token-a', 'TOKEN_A', '');
  const tokenB = readConfig('token-b', 'TOKEN_B', '');
  const amountADesiredRaw = readConfig('amount-a-desired', 'AMOUNT_A_DESIRED', '');
  const amountBDesiredRaw = readConfig('amount-b-desired', 'AMOUNT_B_DESIRED', '');
  const amountAMinRaw = readConfig('amount-a-min', 'AMOUNT_A_MIN', '0');
  const amountBMinRaw = readConfig('amount-b-min', 'AMOUNT_B_MIN', '0');
  const toAddress = readConfig('to-address', 'TO_ADDRESS', '');
  const approveAmount = readConfig('approve-amount', 'APPROVE_AMOUNT', ethers.MaxUint256.toString());
  const approveSpender = readConfig('approve-to', 'APPROVE_TO', routerAddress);
  const deadlineSeconds = readConfig('deadline', 'DEADLINE', String(Math.floor(Date.now() / 1000) + 1800));

  if (!privateKey) {
    console.error('[config] Missing private key. Set PRIVATE_KEY or pass --private-key=0x...');
    process.exit(1);
  }
  if (!routerAddress) {
    console.error('[config] Missing router address. Set ROUTER_ADDRESS or pass --router-address=0x...');
    process.exit(1);
  }
  if (!tokenA || !tokenB) {
    console.error('[config] Missing token addresses. Set TOKEN_A and TOKEN_B or pass --token-a=0x... --token-b=0x...');
    process.exit(1);
  }
  if (!amountADesiredRaw || !amountBDesiredRaw) {
    console.error('[config] Missing desired amounts. Set AMOUNT_A_DESIRED and AMOUNT_B_DESIRED or pass --amount-a-desired=... --amount-b-desired=...');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  const artifactPath = path.join(__dirname, '../out/PancakeRouter.sol/PancakeRouter.json');
  if (!fs.existsSync(artifactPath)) {
    console.error(`[config] Cannot find PancakeRouter artifact at ${artifactPath}`);
    process.exit(1);
  }

  const artifact = require(artifactPath);
  if (!artifact.abi) {
    console.error('[config] Artifact does not contain ABI. Recompile with forge build.');
    process.exit(1);
  }

  console.log(`[config] Loaded environment from ${envPath}`);
  console.log(`[config] RPC URL: ${rpcUrl}`);
  console.log(`[config] Router: ${routerAddress}`);
  console.log(`[config] Deployer: ${wallet.address}`);
  console.log(`[config] Recipient: ${toAddress || wallet.address}`);
  console.log(`[config] Private key: ${maskValue(privateKey)}`);

  const router = new ethers.Contract(routerAddress, artifact.abi, wallet);
  console.log('[step 1/4] Querying token decimals...');
  const tokenAContract = new ethers.Contract(tokenA, ERC20_ABI, wallet);
  const tokenBContract = new ethers.Contract(tokenB, ERC20_ABI, wallet);
  const tokenADecimals = Number(await tokenAContract.decimals().catch(() => 18));
  const tokenBDecimals = Number(await tokenBContract.decimals().catch(() => 18));

  const amountADesired = parseAmount(amountADesiredRaw, tokenADecimals);
  const amountBDesired = parseAmount(amountBDesiredRaw, tokenBDecimals);
  const amountAMin = parseAmount(amountAMinRaw, tokenADecimals);
  const amountBMin = parseAmount(amountBMinRaw, tokenBDecimals);
  const deadline = BigInt(deadlineSeconds);
  const recipient = toAddress || wallet.address;
  const approvalAmount = BigInt(approveAmount);

  console.log(`[step 2/4] Token A decimals=${tokenADecimals}, Token B decimals=${tokenBDecimals}`);
  console.log(`[step 2/4] Desired amounts: ${amountADesired.toString()} / ${amountBDesired.toString()}`);
  console.log(`[step 2/4] Minimum amounts: ${amountAMin.toString()} / ${amountBMin.toString()}`);

  if (approveSpender) {
    console.log('[step 3/4] Approving tokens before adding liquidity...');
    await approveToken(tokenA, approveSpender, approvalAmount, wallet);
    await approveToken(tokenB, approveSpender, approvalAmount, wallet);
  }

  const nonce = await provider.getTransactionCount(wallet.address, 'pending');
  console.log(`[step 4/4] Sending addLiquidity transaction with nonce=${nonce}...`);

  const tx = await router.addLiquidity(
    tokenA,
    tokenB,
    amountADesired,
    amountBDesired,
    amountAMin,
    amountBMin,
    recipient,
    deadline,
    { nonce: nonce }
  );
  console.log(`[tx] addLiquidity tx hash: ${tx.hash}`);

  const receipt = await tx.wait();
  console.log(`[success] Transaction confirmed in block ${receipt.blockNumber}`);

  const factoryAddress = await router.factory();
  const factoryArtifactPath = path.join(__dirname, '../out/PancakeFactory.sol/PancakeFactory.json');
  if (fs.existsSync(factoryArtifactPath)) {
    const factoryArtifact = require(factoryArtifactPath);
    const factory = new ethers.Contract(factoryAddress, factoryArtifact.abi, wallet);
    const pairAddress = await factory.getPair(tokenA, tokenB);
    console.log(`[success] Pair address: ${pairAddress}`);
  }
}

main().catch((error) => {
  console.error('[error]', error);
  process.exit(1);
});
