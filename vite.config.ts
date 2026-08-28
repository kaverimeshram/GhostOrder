import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss()],
    root: './frontend',
    publicDir: '../public',
    server: {
      port: 3000,
      host: true,
    },
    define: {
      'process.env': {
        GHOST_ESCROW_ADDRESS: env.GHOST_ESCROW_ADDRESS || '0x05ac12e8a803d62ce65883a6352d1a38e7718b513721da2a5a0aeb2b79c6d53f',
        ORACLE_ADDRESS: env.ORACLE_ADDRESS || '0x063cc916c44b0ca8e6394adbead8a30aa3c1c3de6355f1d060e2962eed5883f2',
        SETTLEMENT_ADDRESS: env.SETTLEMENT_ADDRESS || '0x06a24514c06e79b6879321b2d178f5d58848dc31e5c9aac5a0c51fd6bb6bf87e',
        STARKNET_RPC_URL: env.STARKNET_RPC_URL || 'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_8/demo',
        CHAIN_ID: env.CHAIN_ID || 'SN_SEPOLIA',
        ACCOUNT_ADDRESS: env.ACCOUNT_ADDRESS || '',
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './frontend/src'),
        '@artifacts': path.resolve(__dirname, './target/dev')
      }
    }
  };
});
