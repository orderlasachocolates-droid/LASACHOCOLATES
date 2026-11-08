# LASA Chocolates & Bakers by Lakshitha 🍫✨

A luxury artisanal confection atelier website featuring handcrafted chocolates, custom box curation, fudge brownies, live visual editing, seasonal festival modes, WhatsApp order routing, and AI chatbot support.

---

## 🌟 Key Features
* **Cinematic Video Intro**: Center circular borderless video welcoming visitors with automated audio.
* **10-Piece Custom Box Builder**: Interactive tray builder to curate custom chocolate flights with real-time price tallying.
* **Festival Themes**: One-click toggles in Edit Mode for **Pongal 🪁**, **Dasara 🏹**, **Diwali 🪔**, and **Christmas 🎄** (featuring floating greetings and tiny particles on button clicks).
* **Live In-Browser Editor & Cloud Sync**: Click the secret owner star (`✦`) in the footer (Password: `3004`) to edit text, change photos, add products, or remove items. Includes **☁️ Cloud Sync** with Firebase Realtime Database so changes reflect across all customer devices worldwide!
* **Sticky Shopping Bag & WhatsApp Checkout**: Compulsory client verification (Name, WhatsApp number, Email) sending formatted orders directly to WhatsApp.
* **AI Chatbot Assistant**: Embedded Noupe AI assistant ready to answer customer queries.
* **Credits**: Made by **sinfotech.AI pvt ltd.**

---

## ☁️ Cross-Device Multi-User Sync (Firebase Realtime Database)
When hosting on static GitHub Pages, your site has no backend server. To make edits appear on **every device** (mobile phones, laptops, tablets) visiting your GitHub site:
1. Go to [console.firebase.google.com](https://console.firebase.google.com) (100% Free forever).
2. Click **Add project** &rarr; name it `lasa-chocolates`.
3. In the left sidebar, click **Build** &rarr; **Realtime Database** &rarr; click **Create Database** (Start in Test Mode).
4. In the **Rules** tab, set both `.read` and `.write` to `true`:
   ```json
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   ```
   Click **Publish**.
5. Copy your database URL (e.g., `https://lasa-chocolates-default-rtdb.firebaseio.com/`).
6. Either:
   - Paste it directly into the **☁️ Cloud Sync** box in Edit Mode and click **Connect & Test Live Sync**, OR
   - Set `const DEFAULT_FIREBASE_URL = 'https://lasa-chocolates-default-rtdb.firebaseio.com';` at line 14 in `app.js` and push to GitHub!

---

## 🚀 How to Run on GitHub Pages (Free Live Hosting)
1. Push or upload these files to your GitHub repository.
2. In your GitHub repository, click **Settings** > **Pages** (in the left sidebar).
3. Under **Branch**, select `main` (or `master`) and folder `/ (root)`, then click **Save**.
4. Within 1 minute, GitHub will give you your free live URL:  
   `https://<your-username>.github.io/<your-repo-name>/`

---

## 💻 How to Run Locally with Node.js
```bash
node server.js
```
Open [http://localhost:3456/](http://localhost:3456/) in your browser.

---

&copy; 2026 Lasa Chocolates & Bakers by Lakshitha. Made by **sinfotech.AI pvt ltd.**
