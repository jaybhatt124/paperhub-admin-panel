# PaperHub 📄

A question paper app for students — CBSE, GSEB, GTU Diploma.
No login, no signup, completely free.

---

## 📁 Project Structure

```
paperhub/
├── app/              → React Native Expo (Mobile App)
└── admin-panel/      → React + Vite (Admin Website)
```

---

## 🔥 Step 1: Setup Firebase

1. Go to https://console.firebase.google.com
2. Create a new project called "paperhub"
3. Add a **Web App**
4. Copy the config object
5. Paste it in TWO places:
   - `app/src/utils/firebase.js`
   - `admin-panel/src/utils/firebase.js`

6. In Firebase Console → Firestore Database → Create database (Start in test mode)

---

## 📱 Step 2: Run the Mobile App

```bash
cd app
npm install
npx expo start
```

- Scan QR code with Expo Go app on your phone
- Or press `a` for Android emulator

---

## 🖥️ Step 3: Run the Admin Panel

```bash
cd admin-panel
npm install
npm run dev
```

Open http://localhost:5173 in your browser
Default password: **admin123** (change in App.jsx line 8)

---

## 🔑 Admin Panel Features

- **Dashboard** — See total papers, board-wise stats
- **Papers** — Add, edit, delete papers with Drive links
- **Universities & Boards** — Add new universities, classes, branches
- **Subjects** — Add subjects for each class/semester/stream

---

## 📄 Adding Papers

1. Open Admin Panel
2. Go to Papers tab
3. Click "Add Paper"
4. Fill in: Board → Class → Subject → Year → Title
5. Paste Google Drive links:
   - **View Link**: `https://drive.google.com/file/d/FILE_ID/view`
   - **Download Link**: `https://drive.google.com/uc?export=download&id=FILE_ID`

---

## 🏛️ Adding a New University

1. Go to Universities & Boards tab
2. Click "Add University/Board"
3. Enter name, type (board/university)
4. Add classes (for boards) or branches (for universities)
5. Go to Subjects tab to add subjects for each group

---

## 📦 Build for Production

### Admin Panel (deploy to Vercel):
```bash
cd admin-panel
npm run build
# Upload dist/ folder to Vercel
```

### Mobile App (build APK):
```bash
cd app
npx eas build --platform android --profile preview
```

---

## 💰 Adding Ads Later

### For Website (Admin Panel / Web):
- Sign up at https://adsense.google.com
- Add AdSense script to index.html

### For Mobile App:
- Sign up at https://admob.google.com
- Install: `npx expo install expo-ads-admob`
- Replace ad placeholder components with real AdMob ads

---

## 🔧 Change Admin Password

Open `admin-panel/src/App.jsx` line 8:
```js
const ADMIN_PASSWORD = 'your-new-password';
```

---

## 📞 Need Help?

- Expo Docs: https://docs.expo.dev
- Firebase Docs: https://firebase.google.com/docs
- React Navigation: https://reactnavigation.org
