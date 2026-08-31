import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { Account, Contract, RpcProvider } from 'starknet';

dotenv.config();

const ESCROW_V2_SIERRA_PATH = path.join(__dirname, '../target/dev/ghost_orders_GhostEscrowV2.contract_class.json');

async function main() {
  const rpcUrl = process.env.STARKNET_RPC_URL || 'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_8/demo';
  const accountAddress = process.env.ACCOUNT_ADDRESS;
  const privateKey = process.env.PRIVATE_KEY;
  const escrowV2Address = process.env.GHOST_ESCROW_V2_ADDRESS;

  if (!accountAddress || !privateKey) {
    throw new Error('ACCOUNT_ADDRESS and PRIVATE_KEY must be set in .env');
  }
  if (!escrowV2Address) {
    throw new Error('GHOST_ESCROW_V2_ADDRESS must be set in .env. Run deployment script first.');
  }

  console.log('════════════════════════════════════════════════════════════════');
  console.log('                 GHOSTORDER KEEPER / EXECUTOR                   ');
  console.log('════════════════════════════════════════════════════════════════');
  console.log(`RPC Node       : ${rpcUrl}`);
  console.log(`Keeper Account : ${accountAddress}`);
  console.log(`GhostEscrowV2  : ${escrowV2Address}`);

  const provider = new RpcProvider({ nodeUrl: rpcUrl });
  const keeperAccount = new (Account as any)({ provider, address: accountAddress, signer: privateKey, cairoVersion: '1' });

  if (!fs.existsSync(ESCROW_V2_SIERRA_PATH)) {
    throw new Error('Compiled GhostEscrowV2 contract class not found.');
  }

  const sierra = JSON.parse(fs.readFileSync(ESCROW_V2_SIERRA_PATH, 'utf8'));
  const escrowContract = new (Contract as any)({ abi: sierra.abi, address: escrowV2Address, providerOrAccount: keeperAccount });

  console.log('\n[1/3] Querying active orders from GhostEscrowV2...');
  const countRaw = await escrowContract.get_order_count();
  const count = Number(countRaw);
  console.log(`  Total Orders in Contract: ${count}`);

  const executableOrders: bigint[] = [];

  for (let i = 1; i <= count; i++) {
    try {
      const order = await escrowContract.get_order(i);
      const status = Number(order.status); // 0 = Active, 1 = Executed, 2 = Cancelled

      if (status === 0) {
        console.log(`  • Order #${i}: Status = Active, Expiry = ${new Date(Number(order.expiry) * 1000).toLocaleString()}`);
        
        // Query conditions count
        const conditionsCount = Number(order.conditions_count);
        for (let c = 0; c < conditionsCount; c++) {
          const condition = await escrowContract.get_condition(i, c);
          const type = Number(condition.cond_type) === 0 ? 'Price' : 'Time';
          console.log(`      - Condition #${c}: Type = ${type}, Operator = ${condition.operator}, Value = ${condition.value}`);
        }

        // Check if executable
        const isExecutable = await escrowContract.is_order_executable(i);
        console.log(`      - Is Executable: ${isExecutable}`);

        if (isExecutable) {
          executableOrders.push(BigInt(i));
        }
      }
    } catch (err: any) {
      console.warn(`  ⚠️ Failed to fetch details for order #${i}:`, err.message);
    }
  }

  if (executableOrders.length === 0) {
    console.log('\n[2/3] No executable orders found.');
    console.log('════════════════════════════════════════════════════════════════\n');
    return;
  }

  console.log(`\n[2/3] Found ${executableOrders.length} executable orders. Triggering execution...`);

  for (const orderId of executableOrders) {
    try {
      console.log(`  🚀 Executing Order #${orderId}...`);
      const tx = await escrowContract.execute_order(orderId);
      console.log(`     Tx Broadcasted: ${tx.transaction_hash}`);
      console.log('     Waiting for block confirmation...');
      await provider.waitForTransaction(tx.transaction_hash);
      console.log(`  ✅ Order #${orderId} executed successfully!`);
    } catch (err: any) {
      console.error(`  ❌ Failed to execute order #${orderId}:`, err.message);
    }
  }

  console.log('════════════════════════════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error('\n❌ Keeper execution failed:', err);
  process.exit(1);
});
