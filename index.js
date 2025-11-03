


import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { TonClient, WalletContractV4, internal, mnemonicToWalletKey } from "ton";

dotenv.config();

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: ["https://zaddiii.github.io", "http://localhost:3000"],
    methods: ["GET", "POST"],
  })
);

const toncenter = new TonClient({
  endpoint: process.env.TONCENTER_API,
  apiKey: process.env.TONCENTER_API_KEY,
});

let wallet;
let senderAddress;

// 🧠 Load wallet from mnemonic
async function initWallet() {
  const key = await mnemonicToWalletKey(process.env.OWNER_MNEMONIC.split(" "));
  wallet = WalletContractV4.create({ workchain: 0, publicKey: key.publicKey });
  senderAddress = wallet.address.toString(true, true, true);
  console.log(`✅ Wallet loaded: ${senderAddress}`);
  return { wallet, key };
}

// ✅ Test route
app.get("/", (req, res) => res.send("🟢 TON Reward Server is Live"));

// 🪙 Real Jetton reward route
app.post("/api/reward", async (req, res) => {
  try {
    const { to } = req.body;
    if (!to) return res.status(400).json({ ok: false, error: "Missing 'to' address" });

    const { wallet, key } = await initWallet();
    const seqno = await toncenter.getWalletSeqno(wallet.address);

    console.log(`🎯 Sending 100 Jettons to: ${to}`);

    const transfer = internal({
      to: process.env.JETTON_MASTER,
      value: "0.05", // TON fee
      body: Buffer.from(
        JSON.stringify({
          op: "JettonTransfer",
          destination: to,
          amount: "100",
        })
      ),
    });

    const msg = await wallet.createTransfer({
      seqno,
      secretKey: key.secretKey,
      messages: [transfer],
    });

    await toncenter.sendBoc(msg.toBoc());
    console.log(`✅ Jetton transfer broadcasted to ${to}`);

    res.json({ ok: true, tx: "Broadcasted to TON Testnet" });
  } catch (err) {
    console.error("❌ Error sending Jettons:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));