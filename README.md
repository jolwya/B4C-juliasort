# FairPass 🎟️
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

## 🎬 60-Second Hackathon Demo Flow (Pitch Deck Script)

1. **The Happy Path:** Click **"Buy at Face Value (0.002 tBNB)"**.
   * Shows sub-second confirmation on BSC Testnet. Ticket #1 is issued.
2. **The Smart Contract Law (The Blocked Moment):** Click **"Attempt 5x Scalper Resale"**.
   * Simulates a scalper trying to flip the ticket for 0.010 tBNB.
   * **Result:** The smart contract reverts on-screen:  
     `ANTI-SCALP VIOLATION: Resale price exceeds face value cap!`
3. **The AI Scalper Bouncer (The "Wow" Factor):** Click **"AI Agent: Inspect & Slash"**.
   * Simulates a student reporting a Facebook post: *"Selling Ticket #1 for ₱3,500"*.
   * The AI parses the post, identifies price gouging, and calls `slashScalpedTicket()` on BSC Testnet.
   * Ticket #1 turns red (**SLASHED / FRAUD**), and the whistleblower receives a bounty!
