import * as dotenv from 'dotenv';
import { Account, CallData, RpcProvider, Signer, ec, num } from 'starknet';

dotenv.config();

const RPC_SEPOLIA = process.env.STARKNET_RPC_URL || 'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_8/demo';
const CLASS_HASH = '0x036078334509b514626504edc9fb252328d1a240e4e948bef8d0c08dff45927f';

class ReadySigner extends Signer {
  override async signDeployAccountTransaction(details: any): Promise<string[]> {
    const rawSig: any = await super.signDeployAccountTransaction(details);
    const pubKey = ec.starkCurve.getStarkKey(this.pk);
    const r = num.toHex(rawSig[0] ?? rawSig.r);
    const s = num.toHex(rawSig[1] ?? rawSig.s);
    return ['0x0', pubKey, r, s];
  }

  override async signDeclareTransaction(details: any): Promise<string[]> {
    const rawSig: any = await super.signDeclareTransaction(details);
    const pubKey = ec.starkCurve.getStarkKey(this.pk);
    const r = num.toHex(rawSig[0] ?? rawSig.r);
    const s = num.toHex(rawSig[1] ?? rawSig.s);
    return ['0x0', pubKey, r, s];
  }

  override async signTransaction(calls: any, details: any): Promise<string[]> {
    const rawSig: any = await super.signTransaction(calls, details);
    const pubKey = ec.starkCurve.getStarkKey(this.pk);
    const r = num.toHex(rawSig[0] ?? rawSig.r);
    const s = num.toHex(rawSig[1] ?? rawSig.s);
    return ['0x0', pubKey, r, s];
  }
}

export async function activateAccount() {
  const accountAddress = process.env.ACCOUNT_ADDRESS;
  const privateKey = process.env.PRIVATE_KEY;

  if (!accountAddress || !privateKey) {
    throw new Error('ACCOUNT_ADDRESS and PRIVATE_KEY must be set in .env');
  }

  console.log('════════════════════════════════════════════════════════════════');
  console.log('          ACTIVATING READY WALLET ACCOUNT ON SEPOLIA            ');
  console.log('════════════════════════════════════════════════════════════════');
  console.log(`Account Address : ${accountAddress}`);
  console.log(`Class Hash      : ${CLASS_HASH}`);

  const provider = new RpcProvider({ nodeUrl: RPC_SEPOLIA });

  // 1. Check if already deployed
  try {
    const existingClass = await provider.getClassHashAt(accountAddress);
    console.log(`✅ Account is ALREADY deployed on-chain! Class: ${existingClass}`);
    return { contract_address: accountAddress, transaction_hash: 'already_deployed' };
  } catch {
    console.log('Account is counterfactual. Submitting DEPLOY_ACCOUNT transaction...');
  }

  const pubKey = ec.starkCurve.getStarkKey(privateKey);
  const constructorCalldata = ['0x0', pubKey, '0x1']; // Signer::Starknet(pubKey), Option::None
  const addressSalt = pubKey;

  const signer = new ReadySigner(privateKey);
  const account = new Account({
    provider,
    address: accountAddress,
    signer,
    cairoVersion: '1'
  });

  console.log('\n[1/2] Submitting deployAccount transaction...');
  const deployResponse = await account.deployAccount({
    classHash: CLASS_HASH,
    constructorCalldata,
    addressSalt,
    contractAddress: accountAddress
  });

  console.log('🚀 Transaction submitted!');
  console.log(`   Tx Hash         : ${deployResponse.transaction_hash}`);
  console.log(`   Contract Address: ${deployResponse.contract_address}`);

  console.log('\n[2/2] Waiting for block confirmation on Starknet Sepolia...');
  const receipt = await provider.waitForTransaction(deployResponse.transaction_hash);
  console.log('   Execution status:', (receipt as any).execution_status || 'SUCCEEDED');

  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('🎉 ACCOUNT SUCCESSFULLY ACTIVATED AND DEPLOYED ON-CHAIN!       ');
  console.log('════════════════════════════════════════════════════════════════');

  return deployResponse;
}

if (require.main === module) {
  activateAccount().catch((err) => {
    console.error('\n❌ Activation failed:', err);
    process.exit(1);
  });
}
