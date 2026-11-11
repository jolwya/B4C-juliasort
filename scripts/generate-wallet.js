import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const envPath = path.join(projectRoot, ".env");

dotenv.config({ path: envPath });

console.log("==================================================");
console.log("🔑 FairPass - Dedicated Hackathon Testnet Wallet");
console.log("==================================================");

let deployerKey = process.env.DEPLOYER_PRIVATE_KEY;
let deployerAddress = "";

if (deployerKey && deployerKey.startsWith("0x")) {
  const wallet = new ethers.Wallet(deployerKey);
  deployerAddress = wallet.address;
  console.log("ℹ️ Existing wallet found in .env:");
} else {
  const newWallet = ethers.Wallet.createRandom();
  deployerKey = newWallet.privateKey;
  deployerAddress = newWallet.address;

  const envContent = `# FairPass Hackathon Environment
# TESTNET ONLY - DO NOT USE REAL MONEY
DEPLOYER_PRIVATE_KEY=${deployerKey}
DEPLOYER_ADDRESS=${deployerAddress}
BSC_TESTNET_RPC=https://data-seed-prebsc-1-s1.bnbchain.org:8545
CHAIN_ID=97
CONTRACT_ADDRESS=
GEMINI_API_KEY=
PORT=3000
`;

  fs.writeFileSync(envPath, envContent);
  console.log("✨ Generated fresh dedicated testnet wallet!");
}

console.log(`📍 Public Address: ${deployerAddress}`);
console.log(`🌐 Network: BSC Testnet (Chain ID 97)`);
console.log(`\n🚰 Step to fund this wallet with free tBNB:`);
console.log(`1. Go to: https://www.bnbchain.org/en/testnet-faucet`);
console.log(`2. Paste your address: ${deployerAddress}`);
console.log(`3. Click "Send 0.1 tBNB"`);
console.log(`\nOnce claimed, run: npm run check-balance`);
console.log("==================================================");
