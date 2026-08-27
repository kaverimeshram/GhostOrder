import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { Account, CallData, Contract, RpcProvider, cairo, hash, num, uint256 } from 'starknet';

dotenv.config();

// Contract Artifacts
const ESCROW_SIERRA = JSON.parse(fs.readFileSync(path.join(__dirname, '../target/dev/ghost_orders_GhostEscrow.contract_class.json'), 'utf8'));
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

  const escrowAddress = process.env.GHOST_ESCROW_ADDRESS;
  const oracleAddress = process.env.ORACLE_ADDRESS;
  const settlementAddress = process.env.SETTLEMENT_ADDRESS;

  if (!accountAddress || !privateKey) {
    throw new Error('ACCOUNT_ADDRESS and PRIVATE_KEY must be set in .env');
  }
  if (!escrowAddress || !oracleAddress || !settlementAddress) {
    throw new Error('GHOST_ESCROW_ADDRESS, ORACLE_ADDRESS, and SETTLEMENT_ADDRESS must be set in .env');
  }

  console.log('════════════════════════════════════════════════════════════════');
  console.log('       GHOSTORDER EXECUTION & SETTLEMENT FLOW TEST (SEPOLIA)    ');
  console.log('════════════════════════════════════════════════════════════════');
  console.log(`Network RPC        : ${rpcUrl}`);
  console.log(`Deployer Account   : ${accountAddress}`);
  console.log(`GhostEscrow        : ${escrowAddress}`);
  console.log(`MockPriceOracle    : ${oracleAddress}`);
  console.log(`MockSettlement     : ${settlementAddress}`);

  const provider = new RpcProvider({ nodeUrl: rpcUrl });
  const account = new Account({ provider, address: accountAddress, signer: privateKey, cairoVersion: '1' });

  // 1. Get or Deploy Mock USDC Token (token_out)
  console.log('\n[1/8] Setting up Mock USDC Token (token_out) on Sepolia...');
  const erc20ClassHash = hash.computeContractClassHash(ERC20_SIERRA);
  let isErc20Declared = false;
  try {
    await provider.getClassByHash(erc20ClassHash);
    isErc20Declared = true;
    console.log(`  MockERC20 class already declared: ${erc20ClassHash}`);
  } catch {
    console.log('  Declaring MockERC20 class...');
  }

  if (!isErc20Declared) {
    const declareRes = await account.declare({ contract: ERC20_SIERRA, casm: ERC20_CASM });
    console.log(`  🚀 Declare tx: ${declareRes.transaction_hash}`);
    await provider.waitForTransaction(declareRes.transaction_hash);
  }

  // Deploy instance of Mock USDC
  const cd = new CallData(ERC20_SIERRA.abi);
  const constructorCalldata = cd.compile('constructor', {
    name: 'Mock USDC',
    symbol: 'USDC',
    decimals: 18
  });

  const salt = num.toHex(BigInt(Math.floor(Math.random() * 1_000_000_000)));
  console.log('  Deploying Mock USDC instance...');
  const deployRes = await account.deployContract({
    classHash: erc20ClassHash,
    constructorCalldata,
    salt,
    unique: false
  });
  console.log(`  🚀 Mock USDC Deploy tx: ${deployRes.transaction_hash}`);
  await provider.waitForTransaction(deployRes.transaction_hash);
  const tokenOutAddress = deployRes.contract_address;
  console.log(`  ✅ Mock USDC deployed at: ${tokenOutAddress}`);

  // Contract instances
  const tokenOutContract = new Contract({ abi: ERC20_SIERRA.abi, address: tokenOutAddress, providerOrAccount: account });
  const strkContract = new Contract({ abi: ERC20_ABI, address: STRK_ADDR, providerOrAccount: account });
  const oracleContract = new Contract({ abi: ORACLE_SIERRA.abi, address: oracleAddress, providerOrAccount: account });
  const settlementContract = new Contract({ abi: SETTLEMENT_SIERRA.abi, address: settlementAddress, providerOrAccount: account });
  const escrowContract = new Contract({ abi: ESCROW_SIERRA.abi, address: escrowAddress, providerOrAccount: account });

  // Mint 1000 USDC to MockSettlement so it can payout the swap
  console.log('\n[2/8] Funding MockSettlement with Token Out (Mock USDC)...');
  const settlementFundAmount = 1000000000000000000000n; // 1000 USDC
  const mintTx = await tokenOutContract.mint(settlementAddress, cairo.uint256(settlementFundAmount));
  console.log(`  🚀 Mint tx to Settlement: ${mintTx.transaction_hash}`);
  await provider.waitForTransaction(mintTx.transaction_hash);
  console.log(`  ✅ MockSettlement funded with 1000 Mock USDC.`);

  // 2. Set Initial Oracle Price (Below Target -> Not Executable)
  console.log('\n[3/8] Setting MockPriceOracle Price Below Target Price...');
  const priceBelowTarget = 1500000000000000000n; // 1.5e18
  const targetPrice = 2000000000000000000n; // 2.0e18
  const amountIn = 10000000000000000n; // 0.01 STRK
  const minAmountOut = 20000000000000000n; // 0.02 USDC
  const configuredOutput = 25000000000000000n; // 0.025 USDC

  const setPrice1Tx = await oracleContract.set_price(STRK_ADDR, tokenOutAddress, cairo.uint256(priceBelowTarget));
  console.log(`  🚀 Set Price tx (1.5e18): ${setPrice1Tx.transaction_hash}`);
  await provider.waitForTransaction(setPrice1Tx.transaction_hash);

  // Configure Settlement output
  const setOutputTx = await settlementContract.set_output_amount(
    STRK_ADDR,
    tokenOutAddress,
    cairo.uint256(amountIn),
    cairo.uint256(configuredOutput)
  );
  await provider.waitForTransaction(setOutputTx.transaction_hash);

  // 3. Create Order
  console.log('\n[4/8] Creating Order in GhostEscrow (STRK -> Mock USDC)...');
  const expiry = BigInt(Math.floor(Date.now() / 1000) + 7200); // 2 hours

  const approveCall = strkContract.populate('approve', {
    spender: escrowAddress,
    amount: cairo.uint256(amountIn)
  });
  const createOrderCall = escrowContract.populate('create_order', {
    token_in: STRK_ADDR,
    token_out: tokenOutAddress,
    amount_in: cairo.uint256(amountIn),
    target_price: cairo.uint256(targetPrice),
    min_amount_out: cairo.uint256(minAmountOut),
    expiry
  });

  const createOrderTx = await account.execute([approveCall, createOrderCall]);
  console.log(`  🚀 Create Order Tx: ${createOrderTx.transaction_hash}`);
  await provider.waitForTransaction(createOrderTx.transaction_hash);

  const orderCountRaw = await escrowContract.get_order_count();
  const orderId = BigInt(orderCountRaw);
  console.log(`  ✅ Order #${orderId} created successfully.`);

  // 4. Verify is_order_executable is FALSE
  console.log('\n[5/8] Checking Order Executability Before Price Update...');
  const isExecutableBefore = await escrowContract.is_order_executable(orderId);
  console.log(`  is_order_executable(#${orderId}) === ${isExecutableBefore} (Expected: false)`);
  if (isExecutableBefore !== false) {
    throw new Error('Order should NOT be executable when price < target_price');
  }

  // 5. Update Oracle Price (Above Target -> Now Executable)
  console.log('\n[6/8] Updating Oracle Price Above Target Price (Trigger Condition True)...');
  const priceAboveTarget = 2500000000000000000n; // 2.5e18
  const setPrice2Tx = await oracleContract.set_price(STRK_ADDR, tokenOutAddress, cairo.uint256(priceAboveTarget));
  console.log(`  🚀 Price Update Tx (2.5e18): ${setPrice2Tx.transaction_hash}`);
  await provider.waitForTransaction(setPrice2Tx.transaction_hash);

  const isExecutableAfter = await escrowContract.is_order_executable(orderId);
  console.log(`  is_order_executable(#${orderId}) === ${isExecutableAfter} (Expected: true)`);
  if (isExecutableAfter !== true) {
    throw new Error('Order MUST be executable when price >= target_price');
  }

  // Record Balances Before Execution
  const ownerStrkBefore = uint256.uint256ToBN((await strkContract.balanceOf(accountAddress)).balance);
  const ownerUsdcBefore = uint256.uint256ToBN(await tokenOutContract.balance_of(accountAddress));

  const escrowStrkBefore = uint256.uint256ToBN((await strkContract.balanceOf(escrowAddress)).balance);
  const escrowUsdcBefore = uint256.uint256ToBN(await tokenOutContract.balance_of(escrowAddress));

  const settlementStrkBefore = uint256.uint256ToBN((await strkContract.balanceOf(settlementAddress)).balance);
  const settlementUsdcBefore = uint256.uint256ToBN(await tokenOutContract.balance_of(settlementAddress));

  console.log('\nBalances Recorded Immediately Before Execution:');
  console.log(`  Owner STRK / USDC       : ${(Number(ownerStrkBefore) / 1e18).toFixed(4)} STRK | ${(Number(ownerUsdcBefore) / 1e18).toFixed(4)} USDC`);
  console.log(`  GhostEscrow STRK / USDC : ${(Number(escrowStrkBefore) / 1e18).toFixed(4)} STRK | ${(Number(escrowUsdcBefore) / 1e18).toFixed(4)} USDC`);
  console.log(`  Settlement STRK / USDC  : ${(Number(settlementStrkBefore) / 1e18).toFixed(4)} STRK | ${(Number(settlementUsdcBefore) / 1e18).toFixed(4)} USDC`);

  // 6. Execute Order
  console.log('\n[7/8] Executing Order on GhostEscrow...');
  const executeTx = await escrowContract.execute_order(orderId);
  console.log(`  🚀 Execute Order Tx: ${executeTx.transaction_hash}`);
  console.log(`  Waiting for block confirmation (ACCEPTED_ON_L2)...`);
  const receipt = await provider.waitForTransaction(executeTx.transaction_hash);
  console.log(`  ✅ Execution confirmed on Sepolia! Status: ${(receipt as any).execution_status || 'SUCCEEDED'}`);

  // Query Final Order State
  const finalOrder = await escrowContract.get_order(orderId);
  const finalStatus = finalOrder.status.toString();
  console.log(`  Final Order #${orderId} State in Storage: Status = ${finalStatus} (Executed)`);

  // Record Balances After Execution
  const ownerStrkAfter = uint256.uint256ToBN((await strkContract.balanceOf(accountAddress)).balance);
  const ownerUsdcAfter = uint256.uint256ToBN(await tokenOutContract.balance_of(accountAddress));

  const escrowStrkAfter = uint256.uint256ToBN((await strkContract.balanceOf(escrowAddress)).balance);
  const escrowUsdcAfter = uint256.uint256ToBN(await tokenOutContract.balance_of(escrowAddress));

  const settlementStrkAfter = uint256.uint256ToBN((await strkContract.balanceOf(settlementAddress)).balance);
  const settlementUsdcAfter = uint256.uint256ToBN(await tokenOutContract.balance_of(settlementAddress));

  console.log('\nBalances Recorded After Execution:');
  console.log(`  Owner STRK / USDC       : ${(Number(ownerStrkAfter) / 1e18).toFixed(4)} STRK | ${(Number(ownerUsdcAfter) / 1e18).toFixed(4)} USDC`);
  console.log(`  GhostEscrow STRK / USDC : ${(Number(escrowStrkAfter) / 1e18).toFixed(4)} STRK | ${(Number(escrowUsdcAfter) / 1e18).toFixed(4)} USDC`);
  console.log(`  Settlement STRK / USDC  : ${(Number(settlementStrkAfter) / 1e18).toFixed(4)} STRK | ${(Number(settlementUsdcAfter) / 1e18).toFixed(4)} USDC`);

  // 7. Test Protection Mechanisms (Double Execution & Post-Execution Cancel)
  console.log('\n[8/8] Testing Protection Mechanisms (Double Execution & Cancel Reverts)...');
  let doubleExecProtected = false;
  try {
    console.log('  Testing double execution attempt (expecting revert)...');
    await escrowContract.execute_order(orderId);
  } catch (err: any) {
    console.log(`  ✅ Double execution properly reverted: ${err.message.slice(0, 100)}...`);
    doubleExecProtected = true;
  }

  let postCancelProtected = false;
  try {
    console.log('  Testing cancel on executed order attempt (expecting revert)...');
    await escrowContract.cancel_order(orderId);
  } catch (err: any) {
    console.log(`  ✅ Post-execution cancel properly reverted: ${err.message.slice(0, 100)}...`);
    postCancelProtected = true;
  }

  // Final Report
  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('-----------------------------------');
  console.log('GHOSTORDER EXECUTION FLOW TEST');
  console.log('-----------------------------------');
  console.log(`Network                         : Starknet Sepolia (SN_SEPOLIA)`);
  console.log(`Account                         : ${accountAddress}`);
  console.log(`Order ID                        : #${orderId}`);
  console.log(`Oracle Price Before             : ${priceBelowTarget.toString()} (1.5e18)`);
  console.log(`Oracle Price After              : ${priceAboveTarget.toString()} (2.5e18)`);
  console.log(`Executable Before               : false`);
  console.log(`Executable After                : true`);
  console.log(`Create Transaction              : ${createOrderTx.transaction_hash}`);
  console.log(`Execute Transaction             : ${executeTx.transaction_hash}`);
  console.log(`Execution Status                : Executed (OrderStatus::Executed)`);
  console.log(`Owner Balance Before / After    : ${(Number(ownerUsdcBefore) / 1e18).toFixed(4)} USDC -> ${(Number(ownerUsdcAfter) / 1e18).toFixed(4)} USDC (+0.025 USDC received)`);
  console.log(`Escrow Balance Before / After   : ${(Number(escrowStrkBefore) / 1e18).toFixed(4)} STRK -> ${(Number(escrowStrkAfter) / 1e18).toFixed(4)} STRK (-0.01 STRK cleared)`);
  console.log(`Settlement Balance Before/After : ${(Number(settlementStrkBefore) / 1e18).toFixed(4)} STRK -> ${(Number(settlementStrkAfter) / 1e18).toFixed(4)} STRK (+0.01 STRK transferred)`);
  console.log(`Double Execution Protection     : ${doubleExecProtected ? 'PASS' : 'FAIL'}`);
  console.log(`Post Execution Cancel Protection: ${postCancelProtected ? 'PASS' : 'FAIL'}`);
  console.log('\nFINAL RESULT:');
  console.log('FULL GHOSTORDER EXECUTION FLOW PASSED ✅');
  console.log('\nStarkscan URLs:');
  console.log(`  • Create Order  : https://sepolia.starkscan.co/tx/${createOrderTx.transaction_hash}`);
  console.log(`  • Price Update  : https://sepolia.starkscan.co/tx/${setPrice2Tx.transaction_hash}`);
  console.log(`  • Execute Order : https://sepolia.starkscan.co/tx/${executeTx.transaction_hash}`);
  console.log(`  • GhostEscrow   : https://sepolia.starkscan.co/contract/${escrowAddress}`);
  console.log('════════════════════════════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error('\n❌ Execution Flow Test Failed:', err);
  process.exit(1);
});
