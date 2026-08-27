import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { Account, CallData, Contract, RpcProvider, hash, uint256, num } from 'starknet';
import { getSTRK20Config } from './config';

dotenv.config();

const ESCROW_SIERRA_PATH = path.join(__dirname, '../target/dev/ghost_orders_GhostEscrow.contract_class.json');
const ESCROW_CASM_PATH = path.join(__dirname, '../target/dev/ghost_orders_GhostEscrow.compiled_contract_class.json');

const ORACLE_SIERRA_PATH = path.join(__dirname, '../target/dev/ghost_orders_MockPriceOracle.contract_class.json');
const ORACLE_CASM_PATH = path.join(__dirname, '../target/dev/ghost_orders_MockPriceOracle.compiled_contract_class.json');

const SETTLEMENT_SIERRA_PATH = path.join(__dirname, '../target/dev/ghost_orders_MockSettlement.contract_class.json');
const SETTLEMENT_CASM_PATH = path.join(__dirname, '../target/dev/ghost_orders_MockSettlement.compiled_contract_class.json');

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'core::starknet::contract_address::ContractAddress' }],
    outputs: [{ name: 'balance', type: 'core::integer::u256' }],
    state_mutability: 'view'
  }
];
const STRK_ADDR = '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d';

export async function deployGhostEscrowSystem(accountAddress: string, privateKey: string) {
  const config = getSTRK20Config();
  console.log('════════════════════════════════════════════════════════════════');
  console.log('       GHOSTESCROW SYSTEM DEPLOYMENT TO STARKNET                ');
  console.log('════════════════════════════════════════════════════════════════');
  console.log(`Network RPC  : ${config.rpcUrl}`);
  console.log(`Config Chain : ${config.chainId}`);
  console.log(`Deployer     : ${accountAddress}`);

  const provider = new RpcProvider({ nodeUrl: config.rpcUrl });

  // 1. Verify RPC Chain ID
  console.log('\n[1/5] Verifying RPC network...');
  const rpcChainIdHex = await provider.getChainId();
  const rpcChainName = Buffer.from(rpcChainIdHex.replace('0x', ''), 'hex').toString('utf8');
  console.log(`  Reported Chain ID : ${rpcChainIdHex} (${rpcChainName})`);

  if (config.chainId === 'SN_SEPOLIA' && !rpcChainName.includes('SN_SEPOLIA')) {
    throw new Error(`RPC node returned ${rpcChainName}, expected SN_SEPOLIA.`);
  }

  // 2. Check STRK Balance & On-Chain Status
  console.log('\n[2/5] Checking deployer account on-chain status & STRK balance...');
  const existingClass = await provider.getClassHashAt(accountAddress);
  console.log(`  Account Class     : ${existingClass} (Deployed ✅)`);

  const strkContract = new Contract({ abi: ERC20_ABI, address: STRK_ADDR, providerOrAccount: provider });
  const strkBal = await strkContract.balanceOf(accountAddress);
  const balStr = (Number(uint256.uint256ToBN(strkBal.balance)) / 1e18).toFixed(4);
  console.log(`  STRK Balance      : ${balStr} STRK`);

  if (Number(balStr) < 0.1) {
    throw new Error(`Insufficient STRK balance (${balStr} STRK). Please fund the account for deployment gas.`);
  }

  const account = new Account({
    provider,
    address: accountAddress,
    signer: privateKey,
    cairoVersion: '1'
  });

  // 3. Verify build artifacts
  if (!fs.existsSync(ESCROW_SIERRA_PATH) || !fs.existsSync(ESCROW_CASM_PATH)) {
    throw new Error('Compiled Cairo artifacts not found in target/dev. Run `scarb build` first.');
  }

  // Helper to declare if needed and deploy contract
  async function deployContractSafely(name: string, sierraPath: string, casmPath: string, constructorCalldata: string[] = []) {
    const sierra = JSON.parse(fs.readFileSync(sierraPath, 'utf8'));
    const casm = JSON.parse(fs.readFileSync(casmPath, 'utf8'));
    const classHash = hash.computeContractClassHash(sierra);
    console.log(`  Target Class Hash (${name}): ${classHash}`);

    let isDeclared = false;
    try {
      await provider.getClassByHash(classHash);
      console.log(`  ✅ ${name} class is already declared on-chain.`);
      isDeclared = true;
    } catch {
      console.log(`  ${name} not declared yet. Submitting declaration...`);
    }

    if (!isDeclared) {
      const declareRes = await account.declare({ contract: sierra, casm });
      console.log(`  🚀 Declaration tx: ${declareRes.transaction_hash}`);
      console.log(`  Waiting for declaration confirmation...`);
      await provider.waitForTransaction(declareRes.transaction_hash);
      console.log(`  ✅ ${name} declared on-chain.`);
    }

    const salt = num.toHex(BigInt(Math.floor(Math.random() * 1_000_000_000)));
    console.log(`  Deploying instance of ${name}...`);
    const deployRes = await account.deployContract({
      classHash,
      constructorCalldata,
      salt,
      unique: false
    });
    console.log(`  🚀 Deploy tx (${name}): ${deployRes.transaction_hash}`);
    console.log(`  Waiting for deployment confirmation...`);
    await provider.waitForTransaction(deployRes.transaction_hash);
    console.log(`  ✅ ${name} deployed at: ${deployRes.contract_address}`);
    return deployRes.contract_address;
  }

  // 4. Declare & Deploy MockPriceOracle
  console.log('\n[3/5] Deploying MockPriceOracle...');
  const oracleAddress = await deployContractSafely('MockPriceOracle', ORACLE_SIERRA_PATH, ORACLE_CASM_PATH, []);

  // 5. Declare & Deploy MockSettlement
  console.log('\n[4/5] Deploying MockSettlement...');
  const settlementAddress = await deployContractSafely('MockSettlement', SETTLEMENT_SIERRA_PATH, SETTLEMENT_CASM_PATH, []);

  // 6. Declare & Deploy GhostEscrow
  console.log('\n[5/5] Deploying GhostEscrow...');
  const escrowConstructorCalldata = CallData.compile([oracleAddress, settlementAddress]);
  const escrowAddress = await deployContractSafely('GhostEscrow', ESCROW_SIERRA_PATH, ESCROW_CASM_PATH, escrowConstructorCalldata);

  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('       DEPLOYMENT COMPLETED SUCCESSFULLY                        ');
  console.log('════════════════════════════════════════════════════════════════');
  console.log(`GHOST_ESCROW_ADDRESS=${escrowAddress}`);
  console.log(`ORACLE_ADDRESS=${oracleAddress}`);
  console.log(`SETTLEMENT_ADDRESS=${settlementAddress}`);

  return {
    escrowAddress,
    oracleAddress,
    settlementAddress,
  };
}

if (require.main === module) {
  const accountAddress = process.env.ACCOUNT_ADDRESS;
  const privateKey = process.env.PRIVATE_KEY;

  if (!accountAddress || !privateKey) {
    console.error('❌ Error: ACCOUNT_ADDRESS and PRIVATE_KEY must be set in .env');
    process.exit(1);
  }

  deployGhostEscrowSystem(accountAddress, privateKey).catch((err) => {
    console.error('\n❌ Deployment failed:', err.message);
    process.exit(1);
  });
}
