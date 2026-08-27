import * as dotenv from 'dotenv';
import { execSync } from 'child_process';
import * as fs from 'fs';
import { RpcProvider, Contract, uint256 } from 'starknet';

dotenv.config();

const SNCAST_BIN = `${process.env.HOME}/.local/bin/sncast`;
const RPC_SEPOLIA = process.env.STARKNET_RPC_URL || 'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_8/demo';
const ACCOUNT_NAME = 'deployer_sepolia';

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

function runSncast(subcommand: string, args: string[]): any {
  const cmd = `"${SNCAST_BIN}" --account "${ACCOUNT_NAME}" --json ${subcommand} --network sepolia ${args.join(' ')}`;
  try {
    const stdout = execSync(cmd, { stdio: ['pipe', 'pipe', 'pipe'] }).toString();
    const lines = stdout.trim().split('\n');
    const jsonLines = lines.map(line => {
      try { return JSON.parse(line); } catch { return null; }
    }).filter(Boolean);

    const errorObj = jsonLines.find(x => x.type === 'error' || x.error);
    if (errorObj) {
      throw new Error(errorObj.error || JSON.stringify(errorObj));
    }
    const resultObj = jsonLines.find(x => x.class_hash || x.contract_address || x.command === subcommand);
    return resultObj || jsonLines[jsonLines.length - 1] || {};
  } catch (err: any) {
    const rawOut = (err.stdout?.toString() || '') + '\n' + (err.stderr?.toString() || '') + '\n' + err.message;
    throw new Error(rawOut.trim());
  }
}

export async function deployWithFoundry() {
  const accountAddress = process.env.ACCOUNT_ADDRESS;
  const privateKey = process.env.PRIVATE_KEY;

  if (!accountAddress || !privateKey) {
    throw new Error('ACCOUNT_ADDRESS and PRIVATE_KEY must be set in .env');
  }

  console.log('════════════════════════════════════════════════════════════════');
  console.log('       GHOSTESCROW DEPLOYMENT VIA STARKNET FOUNDRY              ');
  console.log('════════════════════════════════════════════════════════════════');
  console.log(`Account Address : ${accountAddress}`);
  console.log(`Network         : Starknet Sepolia`);

  // 1. Verify sncast is installed
  if (!fs.existsSync(SNCAST_BIN)) {
    throw new Error(`sncast not found at ${SNCAST_BIN}. Run snfoundryup to install.`);
  }

  // 2. Live RPC & Account Checks
  console.log('\n[1/5] Verifying Sepolia RPC and On-Chain Account...');
  const provider = new RpcProvider({ nodeUrl: RPC_SEPOLIA });
  const chainId = await provider.getChainId();
  const chainName = Buffer.from(chainId.replace('0x', ''), 'hex').toString('utf8');
  console.log(`  RPC Chain ID   : ${chainId} (${chainName})`);

  if (!chainName.includes('SN_SEPOLIA')) {
    throw new Error(`RPC node returned chain ${chainName}, expected SN_SEPOLIA.`);
  }

  let classHash = '';
  try {
    classHash = await provider.getClassHashAt(accountAddress);
    console.log(`  Account Class  : ${classHash} (Deployed ✅)`);
  } catch {
    throw new Error(`Account ${accountAddress} is not yet deployed on Sepolia. Please fund and activate it first.`);
  }

  // Check STRK balance
  const strkContract = new Contract({ abi: ERC20_ABI, address: STRK_ADDR, providerOrAccount: provider });
  const strkBal = await strkContract.balanceOf(accountAddress);
  const balanceStr = (Number(uint256.uint256ToBN(strkBal.balance)) / 1e18).toFixed(4);
  console.log(`  STRK Balance   : ${balanceStr} STRK`);

  if (Number(balanceStr) < 0.1) {
    throw new Error(`Account STRK balance is ${balanceStr} STRK. Please fund with Sepolia STRK.`);
  }

  // 3. Import Account into sncast (detect oz / argent / ready based on class)
  console.log('\n[2/5] Importing Account into Starknet Foundry...');
  let accountType = 'oz';
  if (classHash.toLowerCase().includes('3607833')) {
    accountType = 'argent';
  }
  try {
    const importCmd = `"${SNCAST_BIN}" account import --name "${ACCOUNT_NAME}" --address "${accountAddress}" --type ${accountType} --network sepolia --private-key "${privateKey}" --silent`;
    execSync(importCmd, { stdio: 'pipe' });
    console.log(`  ✅ Account registered with sncast (--type ${accountType}).`);
  } catch {
    console.log('  Account already imported or updated.');
  }

  // 4. Declare & Deploy MockPriceOracle
  console.log('\n[3/5] Declaring & Deploying MockPriceOracle...');
  let oracleClassHash = '0x3326e03ae724c33c4902a653d94775996e4e2cd651078bf8c71476e2d5a919e';
  try {
    const oracleDeclareRes = runSncast('declare', ['--contract-name', 'MockPriceOracle']);
    oracleClassHash = oracleDeclareRes.class_hash || oracleClassHash;
    console.log(`  Declared MockPriceOracle: ${oracleClassHash}`);
  } catch (e: any) {
    if (e.message.includes('already declared') || e.message.includes('ClassAlreadyDeclared')) {
      console.log(`  MockPriceOracle already declared: ${oracleClassHash}`);
    } else {
      throw e;
    }
  }

  const oracleDeployRes = runSncast('deploy', ['--class-hash', oracleClassHash]);
  const oracleAddress = oracleDeployRes.contract_address;
  console.log(`  ✅ MockPriceOracle Deployed: ${oracleAddress}`);

  // 5. Declare & Deploy MockSettlement
  console.log('\n[4/5] Declaring & Deploying MockSettlement...');
  let settlementClassHash = '0x0';
  try {
    const settlementDeclareRes = runSncast('declare', ['--contract-name', 'MockSettlement']);
    settlementClassHash = settlementDeclareRes.class_hash;
    console.log(`  Declared MockSettlement: ${settlementClassHash}`);
  } catch (e: any) {
    if (e.message.includes('already declared') || e.message.includes('ClassAlreadyDeclared')) {
      console.log(`  MockSettlement already declared.`);
    } else {
      throw e;
    }
  }

  const settlementDeployRes = runSncast('deploy', ['--class-hash', settlementClassHash]);
  const settlementAddress = settlementDeployRes.contract_address;
  console.log(`  ✅ MockSettlement Deployed: ${settlementAddress}`);

  // 6. Declare & Deploy GhostEscrow
  console.log('\n[5/5] Declaring & Deploying GhostEscrow...');
  let escrowClassHash = '0x0';
  try {
    const escrowDeclareRes = runSncast('declare', ['--contract-name', 'GhostEscrow']);
    escrowClassHash = escrowDeclareRes.class_hash;
    console.log(`  Declared GhostEscrow: ${escrowClassHash}`);
  } catch (e: any) {
    if (e.message.includes('already declared') || e.message.includes('ClassAlreadyDeclared')) {
      console.log(`  GhostEscrow already declared.`);
    } else {
      throw e;
    }
  }

  const escrowDeployRes = runSncast('deploy', [
    '--class-hash', escrowClassHash,
    '--constructor-calldata', oracleAddress, settlementAddress
  ]);
  const escrowAddress = escrowDeployRes.contract_address;
  console.log(`  ✅ GhostEscrow Deployed: ${escrowAddress}`);

  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('       DEPLOYMENT COMPLETED SUCCESSFULLY                        ');
  console.log('════════════════════════════════════════════════════════════════');
  console.log(`GHOST_ESCROW_ADDRESS=${escrowAddress}`);
  console.log(`ORACLE_ADDRESS=${oracleAddress}`);
  console.log(`SETTLEMENT_ADDRESS=${settlementAddress}`);

  return {
    escrowAddress,
    oracleAddress,
    settlementAddress
  };
}

if (require.main === module) {
  deployWithFoundry().catch((err) => {
    console.error('\n❌ Deployment failed:', err.message);
    process.exit(1);
  });
}
