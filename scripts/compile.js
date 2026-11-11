import fs from "fs";
import path from "path";
import solc from "solc";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const contractPath = path.join(projectRoot, "contracts", "FairTicket.sol");
const source = fs.readFileSync(contractPath, "utf8");

const input = {
  language: "Solidity",
  sources: {
    "FairTicket.sol": {
      content: source,
    },
  },
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode.object"],
      },
    },
  },
};

console.log("🔨 Compiling FairTicket.sol with solc...");
const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors) {
  let hasErrors = false;
  for (const err of output.errors) {
    if (err.severity === "error") {
      console.error("❌ Compilation error:", err.formattedMessage);
      hasErrors = true;
    } else {
      console.warn("⚠️ Warning:", err.formattedMessage);
    }
  }
  if (hasErrors) {
    process.exit(1);
  }
}

const contract = output.contracts["FairTicket.sol"]["FairTicket"];
const buildDir = path.join(projectRoot, "build");
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

const artifact = {
  contractName: "FairTicket",
  abi: contract.abi,
  bytecode: contract.evm.bytecode.object,
};

fs.writeFileSync(
  path.join(buildDir, "FairTicket.json"),
  JSON.stringify(artifact, null, 2)
);

console.log("✅ Compilation successful! Saved to build/FairTicket.json");
