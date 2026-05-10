# Testing FindCelo on MiniPay

To test the MiniPay integration, follow these steps:

## 1. Expose your local server via Ngrok

MiniPay requires an HTTPS URL to load your application. Use Ngrok to expose your local development server:

1.  Start your local development server:
    ```bash
    npm run dev
    ```
2.  In a new terminal, start Ngrok:
    ```bash
    ngrok http 3000
    ```
3.  Copy the provided HTTPS URL (e.g., `https://abcd-123.ngrok-free.app`).

## 2. Test in the MiniPay App

1.  Open the **Opera Mini** or **MiniPay** app on your mobile device.
2.  Go to **Settings** (usually the gear icon or profile icon).
3.  Find and tap on **Developer Options**.
4.  Select **Test Mini App**.
5.  Paste your Ngrok HTTPS URL into the input field and tap **Go**.

## 3. Verification

Once the app loads:
- You should see a **MINIPAY** badge next to the "LIVE" status at the top.
- The app should automatically prompt you to connect your wallet (or connect instantly if already authorized) without clicking the "Connect Wallet" button.
- You can now interact with the game using your MiniPay wallet on Celo.
