import http from "http";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { ethers } from "ethers";
import { fileURLToPath } from "url";
import { evaluateReport } from "./scripts/agent.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const PORT = process.env.PORT || 3000;
const rpcUrl = process.env.BSC_TESTNET_RPC || "https://data-seed-prebsc-1-s1.bnbchain.org:8545";
const network97 = ethers.Network.from({ chainId: 97, name: "bnbt" });
const provider = new ethers.JsonRpcProvider(rpcUrl, network97, { staticNetwork: network97 });

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  // Status API
  if (url.pathname === "/api/status" && req.method === "GET") {
    const contractAddress = process.env.CONTRACT_ADDRESS || null;
    const deployerAddress = process.env.DEPLOYER_ADDRESS || null;
    let balance = "0.0";

    if (deployerAddress) {
      try {
        const bal = await provider.getBalance(deployerAddress);
        balance = ethers.formatEther(bal);
      } catch (e) {}
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        contractAddress,
        deployerAddress,
        balance,
        chainId: 97,
        network: "BNB Smart Chain Testnet",
      })
    );
    return;
  }

  // AI Agent Whistleblower Report -> BSC Testnet Slashing
  if (url.pathname === "/api/report-scalper" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const { reportText, whistleblowerWallet } = JSON.parse(body || "{}");
        const defaultReport =
          reportText ||
          'Spotted on Facebook Marketplace: "Selling VIP Ticket #1 for ₱3,500 GCash! Rush!"';
        const targetWallet = whistleblowerWallet || process.env.DEPLOYER_ADDRESS;

        const result = await evaluateReport(defaultReport, targetWallet);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, result }));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // Serve static files (public/)
  let filePath = path.join(__dirname, "public", url.pathname === "/" ? "index.html" : url.pathname);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    const contentTypes = {
      ".html": "text/html",
      ".js": "text/javascript",
      ".css": "text/css",
      ".json": "application/json",
      ".png": "image/png",
    };
    res.writeHead(200, { "Content-Type": contentTypes[ext] || "text/plain" });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🦊 FairPass Live BSC Testnet Server: http://localhost:${PORT}`);
  console.log(`======================================================\n`);
});
