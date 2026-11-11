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

async function main() {
  const artifactPath = path.join(projectRoot, "build", "FairTicket.json");
  if (!fs.existsSync(artifactPath)) {
    console.error("❌ Build artifact not found. Please run `npm run compile` first.");
    process.exit(1);
  }

  const { abi, bytecode } = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    console.error("❌ No DEPLOYER_PRIVATE_KEY in .env");
    process.exit(1);
  }

  const rpcUrl = process.env.BSC_TESTNET_RPC || "https://data-seed-prebsc-1-s1.bnbchain.org:8545";
  console.log(`🌐 Connecting to BSC Testnet (${rpcUrl})...`);
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  const balance = await provider.getBalance(wallet.address);
  console.log(`👤 Deployer Address: ${wallet.address}`);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} tBNB`);

  if (balance === 0n) {
    console.error("❌ Cannot deploy: Balance is 0 tBNB. Please get faucet funds first:");
    console.error("👉 https://www.bnbchain.org/en/testnet-faucet");
    process.exit(1);
  }

  console.log("🚀 Deploying FairTicket.sol to BSC Testnet...");
  // Pass the deployer's address as the initial aiAgent address so they can test immediately
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy(wallet.address);

  console.log(`⏳ Transaction submitted: ${contract.deploymentTransaction().hash}`);
  console.log("⏳ Waiting for block confirmation on BSC (takes ~0.5s)...");

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("\n========================================================");
  console.log("🎉 CONTRACT DEPLOYED SUCCESSFULLY!");
  console.log(`📍 Contract Address: ${contractAddress}`);
  console.log(`🔗 BscScan Explorer: https://testnet.bscscan.com/address/${contractAddress}`);
  console.log("========================================================\n");

  // Update .env with the new contract address
  let envFile = fs.readFileSync(envPath, "utf8");
  if (envFile.includes("CONTRACT_ADDRESS=")) {
    envFile = envFile.replace(/CONTRACT_ADDRESS=.*/, `CONTRACT_ADDRESS=${contractAddress}`);
  } else {
    envFile += `\nCONTRACT_ADDRESS=${contractAddress}`;
  }
  fs.writeFileSync(envPath, envFile);
  console.log("📝 Updated CONTRACT_ADDRESS in .env");
}

main().catch((err) => {
  console.error("❌ Deployment failed:", err.message);
  process.exit(1);
});
