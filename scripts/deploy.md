  WBNB deployed at: 0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1
  USDT deployed at: 0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE
  USDC deployed at: 0x68B1D87F95878fE05B998F19b66F4baba5De1aed
  CAKE deployed at: 0x3Aa5ebB10DC797CAC828524e59A333d0A371443c
  BUSD deployed at: 0xc6e7DF5E7b4f2A278906862b61205850344D4e7d
  PIG deployed at: 0x59b670e9fA9D0A427751Af201D676719a970857b
  ASS deployed at: 0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1
  PancakeFactory deployed at: 0x7a2088a1bFc9d81c55368AE168C2C02570cB814F
  PancakeRouter deployed at: 0x0E801D84Fa97b50751Dbf25036d067dCf18858bF

RPC_URL=http://127.0.0.1:8545 \
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
FEE_TO_SETTER=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
node scripts/deployPancakeFactory.js


# createPair 调用

请在项目根目录创建 `.env` 文件，内容示例：

```env
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
FACTORY_ADDRESS=0x7a2088a1bFc9d81c55368AE168C2C02570cB814F
TOKEN_A=0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1
TOKEN_B=0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE
APPROVE_AMOUNT=115792089237316195423570985008687907853269984665640564039457584007913129639935
# 可选：覆盖默认授权地址
# APPROVE_TO=0xOTHER_SPENDER_ADDRESS
```

然后直接运行：

```bash
node scripts/createPair.js
```

如果你要临时覆盖环境变量，仍可通过命令行参数传入：

```bash
node scripts/createPair.js --rpc-url=http://127.0.0.1:8545 --private-key=0x... --factory-address=0x... --token-a=0x... --token-b=0x...
```

默认情况下，脚本会先给 `FACTORY_ADDRESS` 授权两个代币，然后再调用 `createPair`。如果你希望授权给其他地址，可以额外传入 `--approve-to=0x...`。