import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { Account, CallData, RpcProvider, hash, num } from 'starknet';

dotenv.config();

const ESCROW_V2_SIERRA_PATH = path.join(__dirname, '../target/dev/ghost_orders_GhostEscrowV2.contract_class.json');
const ESCROW_V2_CASM_PATH = path.join(__dirname, '../target/dev/ghost_orders_GhostEscrowV2.compiled_contract_class.json');

async function main() {
  const rpcUrl = process.env.STARKNET_RPC_URL || 'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_8/demo';
  const accountAddress = process.env.ACCOUNT_ADDRESS;
  const privateKey = process.env.PRIVATE_KEY;
  const oracleAddress = process.env.ORACLE_ADDRESS;
  const settlementAddress = process.env.SETTLEMENT_ADDRESS;

  if (!accountAddress || !privateKey) {
    throw new Error('ACCOUNT_ADDRESS and PRIVATE_KEY must be set in .env');
  }
  if (!oracleAddress || !settlementAddress) {
    throw new Error('ORACLE_ADDRESS and SETTLEMENT_ADDRESS must be set in .env');
  }

  console.log('════════════════════════════════════════════════════════════════');
  console.log('       GHOSTESCROW V2 DEPLOYMENT TO STARKNET (SEPOLIA)          ');
  console.log('════════════════════════════════════════════════════════════════');
  console.log(`RPC Node   : ${rpcUrl}`);
  console.log(`Deployer   : ${accountAddress}`);
  console.log(`Oracle     : ${oracleAddress}`);
  console.log(`Settlement : ${settlementAddress}`);

  const provider = new RpcProvider({ nodeUrl: rpcUrl });
  const account = new Account({ provider, address: accountAddress, signer: privateKey, cairoVersion: '1' });

  // 1. Verify build artifacts
  if (!fs.existsSync(ESCROW_V2_SIERRA_PATH) || !fs.existsSync(ESCROW_V2_CASM_PATH)) {
    throw new Error('GhostEscrowV2 build artifacts not found. Run `scarb build` first.');
  }

  const sierra = JSON.parse(fs.readFileSync(ESCROW_V2_SIERRA_PATH, 'utf8'));
  const casm = JSON.parse(fs.readFileSync(ESCROW_V2_CASM_PATH, 'utf8'));

  // 2. Declare Class
  const classHash = hash.computeContractClassHash(sierra);
  console.log(`\n[1/3] Target Class Hash: ${classHash}`);

  let isDeclared = false;
  try {
    await provider.getClassByHash(classHash);
    console.log('  ✅ Class is already declared on-chain.');
    isDeclared = true;
  } catch {
    console.log('  Class is not declared yet. Submitting declaration transaction...');
  }

  if (!isDeclared) {
    const declareRes = await account.declare({ contract: sierra, casm });
    console.log(`  🚀 Declare Tx: ${declareRes.transaction_hash}`);
    await provider.waitForTransaction(declareRes.transaction_hash);
    console.log('  ✅ Declaration confirmed.');
  }

  // 3. Deploy Instance
  console.log('\n[2/3] Deploying GhostEscrowV2 contract instance...');
  const cd = new CallData(sierra.abi);
  const constructorCalldata = cd.compile('constructor', {
    oracle: oracleAddress,
    settlement: settlementAddress
  });

  const salt = num.toHex(BigInt(Math.floor(Math.random() * 1_000_000_000)));
  const deployRes = await account.deployContract({
    classHash,
    constructorCalldata,
    salt,
    unique: false
  });

  console.log(`  🚀 Deploy Tx: ${deployRes.transaction_hash}`);
  console.log('  Waiting for deployment confirmation...');
  await provider.waitForTransaction(deployRes.transaction_hash);

  const deployedAddress = deployRes.contract_address;
  console.log(`  ✅ GhostEscrowV2 deployed at: ${deployedAddress}`);

  // 4. Update .env file
  console.log('\n[3/3] Updating local .env file...');
  const envPath = path.join(__dirname, '../.env');
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  const lineToAdd = `GHOST_ESCROW_V2_ADDRESS=${deployedAddress}`;
  if (envContent.includes('GHOST_ESCROW_V2_ADDRESS=')) {
    envContent = envContent.replace(/GHOST_ESCROW_V2_ADDRESS=.*/, lineToAdd);
  } else {
    envContent += `\n# Deployed GhostEscrowV2\nGHOST_ESCROW_V2_ADDRESS=${deployedAddress}\n`;
  }

  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('  ✅ .env file updated with GHOST_ESCROW_V2_ADDRESS.');
  console.log('════════════════════════════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error('\n❌ Deployment Failed:', err);
  process.exit(1);
});
