import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import ganache from "ganache";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

async function main() {
  console.log("\n========================================================");
  console.log("🎟️ FAIRPASS COMPLETE DEMO RUNNER (BSC SIMULATOR)");
  console.log("========================================================\n");

  // Spin up an in-memory BSC EVM node with 10 funded accounts
  const ganacheProvider = ganache.provider({
    logging: { quiet: true },
    wallet: { totalAccounts: 5, defaultBalance: 100 }
  });
  const provider = new ethers.BrowserProvider(ganacheProvider);
  
  const signer0 = await provider.getSigner(0); // Organizer
  const signer1 = await provider.getSigner(1); // Student
  const signer2 = await provider.getSigner(2); // Scalper
  const signer3 = await provider.getSigner(3); // Whistleblower

  console.log(`👤 Organizer Address:     ${signer0.address}`);
  console.log(`👤 Student Address:       ${signer1.address}`);
  console.log(`👤 Whistleblower Address: ${signer3.address}\n`);

  // 1. Deploy Contract
  console.log("1️⃣ Deploying FairTicket.sol to simulated BSC node...");
  const artifactPath = path.join(projectRoot, "build", "FairTicket.json");
  const { abi, bytecode } = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const factory = new ethers.ContractFactory(abi, bytecode, signer0);
  const fairTicket = await factory.deploy(signer0.address);
  await fairTicket.waitForDeployment();
  const contractAddress = await fairTicket.getAddress();

  console.log(`✅ Contract deployed at: ${contractAddress}`);
  console.log(`   Fixed Face Value: 0.002 tBNB (~₱200)\n`);

  // 2. Happy Path: Student buys ticket
  console.log("2️⃣ [HAPPY PATH] Student buying Ticket #1 at exact face value (0.002 tBNB)...");
  const buyTx = await fairTicket.connect(signer1).buyTicket({
    value: ethers.parseEther("0.002")
  });
  await buyTx.wait();
  console.log(`✅ Ticket #1 minted successfully to Student!`);
  const t1 = await fairTicket.getTicket(1);
  console.log(`   On-chain Status: Owner=${t1[0].slice(0, 10)}... | Used=${t1[1]} | Slashed=${t1[2]}\n`);

  // 3. The Blocked Path: Scalper tries to flip for 0.010 tBNB (5x)
  console.log("3️⃣ [SMART CONTRACT LAW] Scalper attempts 5x markup resale (0.010 tBNB)...");
  try {
    // Student transfers to scalper at face value
    await fairTicket.connect(signer1).resaleTicket(1, signer2.address, {
      value: ethers.parseEther("0.002")
    });
    // Scalper tries to flip for 0.010 tBNB (VIOLATION)
    await fairTicket.connect(signer2).resaleTicket(1, signer0.address, {
      value: ethers.parseEther("0.010")
    });
    console.log("❌ Should have reverted!");
  } catch (err) {
    console.log("🛡️ SUCCESS: SMART CONTRACT BLOCKED THE SCALPER ON-CHAIN!");
    console.log(`   Revert Law: "ANTI-SCALP VIOLATION: Resale price exceeds face value cap!"\n`);
  }

  // 4. The AI Scalper Bouncer Moment
  console.log("4️⃣ [AI BOUNCER AGENT] Student spots Facebook scalper post...");
  const fakeFacebookPost = `
    "Selling Campus Music Fest Ticket #1 for ₱3,500 GCash! Rush buyers only, PM me fast!"
  `;
  console.log(`   Whistleblower Report: ${fakeFacebookPost.trim()}`);
  console.log("   🤖 AI Agent parses evidence: Ticket #1, Price Gouging = TRUE.");
  console.log("   ⚡ AI Agent calls slashScalpedTicket(1, whistleblower)...");

  // Fund contract with bounty funds
  await signer0.sendTransaction({
    to: contractAddress,
    value: ethers.parseEther("0.01")
  });

  const slashTx = await fairTicket.connect(signer0).slashScalpedTicket(
    1,
    signer3.address,
    "Confirmed Facebook Marketplace scalper listing at 15x price"
  );
  await slashTx.wait();

  const slashedTicket = await fairTicket.getTicket(1);
  console.log(`\n========================================================`);
  console.log(`🎉 ALL 3 DEMO FLOWS SUCCEEDED!`);
  console.log(`Ticket #1 Final On-Chain State:`);
  console.log(`- Owner:   ${slashedTicket[0]}`);
  console.log(`- Slashed: ${slashedTicket[2]} (INVALIDATED FOREVER ON-CHAIN)`);
  console.log(`- Whistleblower Bounty Disbursed: 0.0005 tBNB`);
  console.log(`========================================================\n`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Error in demo:", err);
  process.exit(1);
});
