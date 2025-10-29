


import TonWeb from "tonweb";
import fetch from "node-fetch";

const tonweb = new TonWeb(new TonWeb.HttpProvider(
  "https://testnet.toncenter.com/api/v2/jsonRPC",
  { apiKey: process.env.TONCENTER_API_KEY }
));

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const { to, amount } = req.body || {};
  if (!to || !amount) {
    return res.status(400).json({ ok: false, error: "Missing 'to' or 'amount'" });
  }

  try {
    const walletSeed = process.env.WALLET_SEED_PHRASE;
    if (!walletSeed) throw new Error("No wallet seed configured");

    const seedBytes = TonWeb.utils.hexToBytes(walletSeed);
    const keyPair = TonWeb.utils.keyPairFromSeed(seedBytes);
    const WalletClass = tonweb.wallet.all.v3R2;
    const wallet = new WalletClass(tonweb.provider, { publicKey: keyPair.publicKey });

    const seqno = await wallet.methods.seqno().call() || 0;

    const tx = await wallet.methods.transfer({
      secretKey: keyPair.secretKey,
      toAddress: to,
      amount: TonWeb.utils.toNano("0.05"), // gas fee
      seqno,
      payload: new TonWeb.boc.Cell().bits.writeString(`Reward ${amount} RPG`),
      sendMode: 3,
    }).send();

    res.status(200).json({ ok: true, tx: tx || "sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
}