# MyTiket 🎟️
> **Anti-Scalp Event Ticketing with Smart Contract Price Ceilings & AI Bouncer**  
> Built for the **BCC Hackathon 2026** on **BNB Smart Chain Testnet (Chain ID 97)**.

---

## 🌟 The Formula
* **Track:** Consumer Apps / AI Agents / Payments
* **AI Does:** Parses off-platform scalper posts (Facebook/Telegram), identifies price-gouging evidence, and calls on-chain slashing tools.
* **BSC Does:** Enforces fixed face-value price ceilings in smart contract bytecode (`require(msg.value <= FACE_VALUE)`) and executes atomic slashing with whistleblower bounties.

---

## 🚀 Quick Start Guide

### 1. Check & Fund Your Dedicated Testnet Wallet
Your dedicated hackathon wallet is already generated in `.env`:
* **Public Address:** Check via `npm run wallet`
* **Free Faucet:** [https://www.bnbchain.org/en/testnet-faucet](https://www.bnbchain.org/en/testnet-faucet) (paste your address to get 0.1 free tBNB)
* **Check Balance:**
  ```bash
  npm run check-balance
  ```

### 2. Deploy the Smart Contract to BSC Testnet
```bash
npm run deploy
```
* Once deployed, it automatically saves the contract address to `.env` and gives you the live **BscScan link**.

### 3. Start the Live Interactive Web Demo
```bash
npm start
```
* Open your browser to: **`http://localhost:3000`**

---
