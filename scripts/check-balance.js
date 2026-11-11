import { ethers } from "ethers";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(projectRoot, ".env") });

const RPC_URL = process.env.BSC_TESTNET_RPC || "https://data-seed-prebsc-1-s1.bnbchain.org:8545";
const provider = new ethers.JsonRpcProvider(RPC_URL);

async function main() {
  const address = process.env.DEPLOYER_ADDRESS;
  if (!address) {
    console.error("❌ No DEPLOYER_ADDRESS found in .env. Run `npm run wallet` first.");
    process.exit(1);
  }

  console.log(`🔍 Checking BSC Testnet balance for: ${address}...`);
  try {
    const balanceWei = await provider.getBalance(address);
    const balanceEther = ethers.formatEther(balanceWei);
    console.log(`💰 Current Balance: ${balanceEther} tBNB`);

    if (parseFloat(balanceEther) > 0) {
      console.log("✅ Wallet has funds! You are ready to deploy your contract: npm run deploy");
    } else {
      console.log("⚠️ Balance is 0 tBNB.");
      console.log(`🚰 Claim free testnet BNB at: https://www.bnbchain.org/en/testnet-faucet`);
      console.log(`   Address: ${address}`);
    }
  } catch (err) {
    console.error("❌ Network error connecting to BSC Testnet:", err.message);
  }
}

main();
