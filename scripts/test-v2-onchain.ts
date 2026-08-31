import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { Account, CallData, Contract, RpcProvider, CairoCustomEnum, cairo, hash, num, uint256 } from 'starknet';

dotenv.config();

// Contract Artifacts
const ESCROW_V2_SIERRA = JSON.parse(fs.readFileSync(path.join(__dirname, '../target/dev/ghost_orders_GhostEscrowV2.contract_class.json'), 'utf8'));
const ORACLE_SIERRA = JSON.parse(fs.readFileSync(path.join(__dirname, '../target/dev/ghost_orders_MockPriceOracle.contract_class.json'), 'utf8'));
const SETTLEMENT_SIERRA = JSON.parse(fs.readFileSync(path.join(__dirname, '../target/dev/ghost_orders_MockSettlement.contract_class.json'), 'utf8'));
const ERC20_SIERRA = JSON.parse(fs.readFileSync(path.join(__dirname, '../target/dev/ghost_orders_MockERC20.contract_class.json'), 'utf8'));
const ERC20_CASM = JSON.parse(fs.readFileSync(path.join(__dirname, '../target/dev/ghost_orders_MockERC20.compiled_contract_class.json'), 'utf8'));

const STRK_ADDR = '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d';

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'core::starknet::contract_address::ContractAddress' }],
    outputs: [{ name: 'balance', type: 'core::integer::u256' }],
    state_mutability: 'view'
  },
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'core::starknet::contract_address::ContractAddress' },
      { name: 'amount', type: 'core::integer::u256' }
    ],
    outputs: [{ name: 'success', type: 'core::bool' }],
    state_mutability: 'external'
  }
];

async function main() {
  const rpcUrl = process.env.STARKNET_RPC_URL || 'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_8/demo';
  const accountAddress = process.env.ACCOUNT_ADDRESS;
  const privateKey = process.env.PRIVATE_KEY;

  const escrowV2Address = process.env.GHOST_ESCROW_V2_ADDRESS;
  const oracleAddress = process.env.ORACLE_ADDRESS;
  const settlementAddress = process.env.SETTLEMENT_ADDRESS;

  if (!accountAddress || !privateKey) {
    throw new Error('ACCOUNT_ADDRESS and PRIVATE_KEY must be set in .env');
  }
  if (!escrowV2Address || !oracleAddress || !settlementAddress) {
    throw new Error('GHOST_ESCROW_V2_ADDRESS, ORACLE_ADDRESS, and SETTLEMENT_ADDRESS must be set in .env');
  }

  console.log('════════════════════════════════════════════════════════════════');
  console.log('       GHOSTORDER V2 ON-CHAIN INTEGRATION TEST (SEPOLIA)        ');
  console.log('════════════════════════════════════════════════════════════════');
  console.log(`Network RPC   : ${rpcUrl}`);
  console.log(`User Account  : ${accountAddress}`);
  console.log(`GhostEscrowV2 : ${escrowV2Address}`);
  console.log(`Oracle        : ${oracleAddress}`);
  console.log(`Settlement    : ${settlementAddress}`);

  const provider = new RpcProvider({ nodeUrl: rpcUrl });
  const account = new (Account as any)({ provider, address: accountAddress, signer: privateKey, cairoVersion: '1' });

  // 1. Verify V2 Class Hash matches expected
  const expectedClassHash = hash.computeContractClassHash(ESCROW_V2_SIERRA);
  const actualClassHash = await provider.getClassHashAt(escrowV2Address);
  console.log(`\n[1/13] Verifying Contract Class Hash...`);
  console.log(`  Expected Class Hash : ${expectedClassHash}`);
  console.log(`  Actual Class Hash   : ${actualClassHash}`);
  if (actualClassHash !== expectedClassHash) {
    throw new Error(`Class hash mismatch! Expected ${expectedClassHash}, got ${actualClassHash}`);
  }
  console.log(`  ✅ Class hash match verified.`);

  // 2. Setup Mock Token Out (Mock USDC)
  console.log('\n[2/13] Deploying Mock USDC token dynamically...');
  const erc20ClassHash = hash.computeContractClassHash(ERC20_SIERRA);
  let isErc20Declared = false;
  try {
    await provider.getClassByHash(erc20ClassHash);
    isErc20Declared = true;
  } catch {}

  if (!isErc20Declared) {
    console.log('  Declaring MockERC20...');
    const declareRes = await account.declare({ contract: ERC20_SIERRA, casm: ERC20_CASM });
    await provider.waitForTransaction(declareRes.transaction_hash);
  }

  const cd = new CallData(ERC20_SIERRA.abi);
  const constructorCalldata = cd.compile('constructor', {
    name: 'Mock USDC V2',
    symbol: 'USDCv2',
    decimals: 18
  });

  const salt = num.toHex(BigInt(Math.floor(Math.random() * 1_000_000_000)));
  const deployRes = await account.deployContract({
    classHash: erc20ClassHash,
    constructorCalldata,
    salt,
    unique: false
  });
  console.log(`  🚀 Mock USDC Deploy Tx: ${deployRes.transaction_hash}`);
  await provider.waitForTransaction(deployRes.transaction_hash);
  const tokenOutAddress = deployRes.contract_address;
  console.log(`  ✅ Mock USDC deployed at: ${tokenOutAddress}`);

  // Contract instances
  const tokenOutContract = new (Contract as any)({ abi: ERC20_SIERRA.abi, address: tokenOutAddress, providerOrAccount: account });
  const strkContract = new (Contract as any)({ abi: ERC20_ABI, address: STRK_ADDR, providerOrAccount: account });
  const oracleContract = new (Contract as any)({ abi: ORACLE_SIERRA.abi, address: oracleAddress, providerOrAccount: account });
  const settlementContract = new (Contract as any)({ abi: SETTLEMENT_SIERRA.abi, address: settlementAddress, providerOrAccount: account });
  const escrowContract = new (Contract as any)({ abi: ESCROW_V2_SIERRA.abi, address: escrowV2Address, providerOrAccount: account });

  // 3. Fund Settlement contract with token_out
  console.log('\n[3/13] Funding MockSettlement with Mock USDC output...');
  const settlementFundAmount = 1000000000000000000000n; // 1000 USDC
  const mintTx = await tokenOutContract.mint(settlementAddress, cairo.uint256(settlementFundAmount));
  console.log(`  🚀 Mint Tx: ${mintTx.transaction_hash}`);
  await provider.waitForTransaction(mintTx.transaction_hash);

  // 4. Configure Oracle Price BELOW target (1.5e18)
  console.log('\n[4/13] Configuring Oracle Price BELOW Target...');
  const priceBelowTarget = 1500000000000000000n; // 1.5e18
  const targetPrice = 2000000000000000000n; // 2.0e18
  const amountIn = 10000000000000000n; // 0.01 STRK
  const minAmountOut = 20000000000000000n; // 0.02 USDC
  const configuredOutput = 25000000000000000n; // 0.025 USDC

  const setPrice1Tx = await oracleContract.set_price(STRK_ADDR, tokenOutAddress, cairo.uint256(priceBelowTarget));
  console.log(`  🚀 Set Price Tx: ${setPrice1Tx.transaction_hash}`);
  await provider.waitForTransaction(setPrice1Tx.transaction_hash);

  // Configure Settlement output
  const setOutputTx = await settlementContract.set_output_amount(
    STRK_ADDR,
    tokenOutAddress,
    cairo.uint256(amountIn),
    cairo.uint256(configuredOutput)
  );
  await provider.waitForTransaction(setOutputTx.transaction_hash);

  // 5. Create V2 Order (Price condition & Time condition)
  console.log('\n[5/13] Creating V2 Order (AND logic: Price & Time)...');
  const targetTimestamp = Math.floor(Date.now() / 1000) + 20; // 20s from now
  const expiry = BigInt(Math.floor(Date.now() / 1000) + 7200); // 2 hours

  const priceCondition = {
    cond_type: new CairoCustomEnum({ Price: {} }),
    operator: new CairoCustomEnum({ Gte: {} }),
    value: cairo.uint256(targetPrice),
    token_in: STRK_ADDR,
    token_out: tokenOutAddress
  };

  const timeCondition = {
    cond_type: new CairoCustomEnum({ Time: {} }),
    operator: new CairoCustomEnum({ Gte: {} }),
    value: cairo.uint256(BigInt(targetTimestamp)),
    token_in: '0x0000000000000000000000000000000000000000000000000000000000000000',
    token_out: '0x0000000000000000000000000000000000000000000000000000000000000000'
  };

  const action = {
    action_type: new CairoCustomEnum({ Swap: {} }),
    token_in: STRK_ADDR,
    token_out: tokenOutAddress,
    amount_in: cairo.uint256(amountIn),
    min_amount_out: cairo.uint256(minAmountOut)
  };

  const approveCall = strkContract.populate('approve', {
    spender: escrowV2Address,
    amount: cairo.uint256(amountIn)
  });

  const createCall = escrowContract.populate('create_order', {
    conditions: [priceCondition, timeCondition],
    action,
    expiry
  });

  const createTx = await account.execute([approveCall, createCall]);
  console.log(`  🚀 Create Order Tx: ${createTx.transaction_hash}`);
  await provider.waitForTransaction(createTx.transaction_hash);

  const orderCountRaw = await escrowContract.get_order_count();
  const orderId = Number(orderCountRaw);
  console.log(`  ✅ V2 Order #${orderId} created successfully.`);

  // 6. Verify is_order_executable is FALSE
  console.log('\n[6/13] Checking order executability before targets are met...');
  const isExecutableBefore = await escrowContract.is_order_executable(orderId);
  console.log(`  is_order_executable(#${orderId}) === ${isExecutableBefore} (Expected: false)`);
  if (isExecutableBefore !== false) {
    throw new Error('Order should NOT be executable yet.');
  }

  // 7. Verify execute_order reverts while conditions are false
  console.log('\n[7/13] Proving execution fails when conditions are unmet...');
  let executeFailedBeforeMet = false;
  try {
    await escrowContract.execute_order(orderId);
  } catch (err: any) {
    console.log(`  ✅ execute_order reverted as expected.`);
    executeFailedBeforeMet = true;
  }
  if (!executeFailedBeforeMet) {
    throw new Error('execute_order should have reverted when conditions were unmet.');
  }

  // Record Balances Before
  const userStrkBefore = uint256.uint256ToBN((await strkContract.balanceOf(accountAddress)).balance);
  const userUsdcBefore = uint256.uint256ToBN(await tokenOutContract.balance_of(accountAddress));
  const escrowStrkBefore = uint256.uint256ToBN((await strkContract.balanceOf(escrowV2Address)).balance);
  const settlementStrkBefore = uint256.uint256ToBN((await strkContract.balanceOf(settlementAddress)).balance);
  const settlementUsdcBefore = uint256.uint256ToBN(await tokenOutContract.balance_of(settlementAddress));

  // 8. Update price condition to TRUE
  console.log('\n[8/13] Making Price Condition TRUE (setting price to 2.5e18)...');
  const priceAboveTarget = 2500000000000000000n; // 2.5e18
  const setPrice2Tx = await oracleContract.set_price(STRK_ADDR, tokenOutAddress, cairo.uint256(priceAboveTarget));
  console.log(`  🚀 Price Update Tx: ${setPrice2Tx.transaction_hash}`);
  await provider.waitForTransaction(setPrice2Tx.transaction_hash);

  // 9. Wait for time condition to become TRUE
  console.log('\n[9/13] Waiting for Time Condition to become TRUE...');
  const timeToWait = Math.max(0, targetTimestamp - Math.floor(Date.now() / 1000) + 5);
  console.log(`  Waiting ${timeToWait} seconds...`);
  await new Promise((resolve) => setTimeout(resolve, timeToWait * 1000));

  // 10. Verify is_order_executable is TRUE
  console.log('\n[10/13] Verifying order is now executable...');
  const isExecutableAfter = await escrowContract.is_order_executable(orderId);
  console.log(`  is_order_executable(#${orderId}) === ${isExecutableAfter} (Expected: true)`);
  if (isExecutableAfter !== true) {
    throw new Error('Order MUST be executable now!');
  }

  // 11. Execute Order on-chain
  console.log('\n[11/13] Executing Order V2 as Keeper...');
  const executeTx = await escrowContract.execute_order(orderId);
  console.log(`  🚀 Keeper Execution Tx: ${executeTx.transaction_hash}`);
  await provider.waitForTransaction(executeTx.transaction_hash);
  console.log(`  ✅ Order #${orderId} executed on-chain.`);

  // 12. Verify status is EXECUTED
  console.log('\n[12/13] Querying Order Status...');
  const finalOrder = await escrowContract.get_order(orderId);
  const statusStr = typeof finalOrder.status?.activeVariant === 'function'
    ? finalOrder.status.activeVariant()
    : (finalOrder.status?.activeVariant || (finalOrder.status ? Object.keys(finalOrder.status)[0] : '') || '');
  console.log(`  Order status: ${statusStr} (Expected: 'Executed')`);
  if (statusStr !== 'Executed') {
    throw new Error(`Expected status Executed, got ${statusStr}`);
  }

  // Record Balances After
  const userStrkAfter = uint256.uint256ToBN((await strkContract.balanceOf(accountAddress)).balance);
  const userUsdcAfter = uint256.uint256ToBN(await tokenOutContract.balance_of(accountAddress));
  const escrowStrkAfter = uint256.uint256ToBN((await strkContract.balanceOf(escrowV2Address)).balance);
  const settlementStrkAfter = uint256.uint256ToBN((await strkContract.balanceOf(settlementAddress)).balance);
  const settlementUsdcAfter = uint256.uint256ToBN(await tokenOutContract.balance_of(settlementAddress));

  // 13. Verify Protection Mechanisms (Double Execution & Post-Execution Cancel)
  console.log('\n[13/13] Testing Protection Mechanisms (Expect Revert)...');
  let doubleExecProtected = false;
  try {
    await escrowContract.execute_order(orderId);
  } catch {
    console.log('  ✅ Double execution attempt properly rejected.');
    doubleExecProtected = true;
  }

  let postCancelProtected = false;
  try {
    await escrowContract.cancel_order(orderId);
  } catch {
    console.log('  ✅ Cancel-after-execution attempt properly rejected.');
    postCancelProtected = true;
  }

  // Print Report
  console.log('\n========================================');
  console.log('GHOSTORDER V2 ON-CHAIN TEST');
  console.log('========================================');
  console.log(`Network: Starknet Sepolia (SN_SEPOLIA)`);
  console.log(`Account: ${accountAddress}`);
  console.log(`V2 Contract: ${escrowV2Address}`);
  console.log(`\nOrder ID: #${orderId}`);
  console.log(`\nConditions:`);
  console.log(`- PRICE >= 2.0e18`);
  console.log(`- TIME >= ${targetTimestamp}`);
  console.log(`- Logic: AND`);
  console.log(`\nTransactions:`);
  console.log(`- Create Order: https://sepolia.starkscan.co/tx/${createTx.transaction_hash}`);
  console.log(`- Price Update: https://sepolia.starkscan.co/tx/${setPrice2Tx.transaction_hash}`);
  console.log(`- Keeper Execution: https://sepolia.starkscan.co/tx/${executeTx.transaction_hash}`);
  console.log(`\nFinal Status:\nEXECUTED`);
  console.log(`\nBalances Before:`);
  console.log(`  User STRK       : ${(Number(userStrkBefore) / 1e18).toFixed(4)} STRK`);
  console.log(`  User USDC       : ${(Number(userUsdcBefore) / 1e18).toFixed(4)} USDC`);
  console.log(`  Escrow STRK     : ${(Number(escrowStrkBefore) / 1e18).toFixed(4)} STRK`);
  console.log(`  Settlement STRK : ${(Number(settlementStrkBefore) / 1e18).toFixed(4)} STRK`);
  console.log(`  Settlement USDC : ${(Number(settlementUsdcBefore) / 1e18).toFixed(4)} USDC`);
  console.log(`\nBalances After:`);
  console.log(`  User STRK       : ${(Number(userStrkAfter) / 1e18).toFixed(4)} STRK`);
  console.log(`  User USDC       : ${(Number(userUsdcAfter) / 1e18).toFixed(4)} USDC`);
  console.log(`  Escrow STRK     : ${(Number(escrowStrkAfter) / 1e18).toFixed(4)} STRK`);
  console.log(`  Settlement STRK : ${(Number(settlementStrkAfter) / 1e18).toFixed(4)} STRK`);
  console.log(`  Settlement USDC : ${(Number(settlementUsdcAfter) / 1e18).toFixed(4)} USDC`);
  console.log(`\nSecurity:`);
  console.log(`- Execution before conditions: ${executeFailedBeforeMet ? 'PASS' : 'FAIL'}`);
  console.log(`- Double execution protection: ${doubleExecProtected ? 'PASS' : 'FAIL'}`);
  console.log(`- Cancel after execution: ${postCancelProtected ? 'PASS' : 'FAIL'}`);
  console.log('========================================\n');
}

main().catch((err) => {
  console.error('\n❌ Integration Test Failed:', err);
  process.exit(1);
});
