# 🇮🇩 Arena Warga - GeoGuessr Kearifan Lokal

**Arena Warga** adalah game tebak lokasi multiplayer berbasis web yang mengajak pemain menjelajahi sudut-sudut unik Indonesia melalui Google Street View. Tantang temanmu dalam adu ketajaman insting geografis!

![Arena Warga Banner](https://via.placeholder.com/1200x500.png?text=Preview+Arena+Warga) *<!-- Ganti link ini dengan screenshot game asli nanti -->*

## 🎮 Fitur Utama

-   **Multiplayer Real-time**: Main bareng teman menggunakan Room ID.
-   **50+ Lokasi Indonesia**: Dari Sabang sampai Merauke, curated locations.
-   **Street View Mode**: Eksplorasi 360 derajat (Tanpa label nama jalan untuk tantangan ekstra!).
-   **2 Mode Permainan**:
    -   **Classic**: Adu skor tertinggi berdasarkan jarak tebakan.
    -   **Battle Royale**: Bertahan hidup! HP berkurang jika tebakanmu jauh.
-   **Leaderboard Live**: Pantau skor dan ranking secara *real-time* di dalam game.
-   **UI Modern**: Tampilan *Dark Mode* yang sleek dengan *Glassmorphism*.

## 🛠️ Teknologi yang Digunakan

Project ini dibangun dengan **MERN Stack** (minus Mongo untuk saat ini, data in-memory):

*   **Frontend**: React.js (Vite), Tailwind CSS, Framer Motion.
*   **Backend**: Node.js, Express.
*   **Real-time**: Socket.io (Komunikasi dua arah super cepat).
*   **Maps**: Google Maps JavaScript API.

---

## 🚀 Cara Install & Menjalankan (Local)

Ikuti langkah ini untuk menjalankan game di komputer kamu sendiri.

### Prasyarat
Pastikan kamu sudah menginstall:
-   [Node.js](https://nodejs.org/) (Versi 16 atau terbaru)
-   Git

### 1. Clone Repository
```bash
git clone https://github.com/username/arena-warga.git
cd arena-warga
```

### 2. Install Dependencies (Backend & Frontend)

Install library untuk server (root folder):
```bash
npm install
```

Install library untuk client (frontend):
```bash
cd client
npm install
cd ..
```

### 3. Konfigurasi (Opsional)
Untuk pengalaman terbaik (menghilangkan watermark "For Development Purposes"), kamu butuh **Google Maps API Key**.
-   Buka `client/index.html`.
-   Cari bagian `<script src="https://maps.googleapis.com/maps/api/js?key=...">`.
-   Masukkan API Key kamu di situ.
-   *Catatan: Tanpa API Key game tetap bisa jalan, tapi Street View akan ada watermark.*

### 4. Jalankan Game

Kamu butuh 2 terminal untuk menjalankan Server dan Client secara bersamaan.

**Terminal 1 (Server):**
```bash
# Di folder root 'arena-warga'
node server.js
```
*Server akan jalan di port 3000.*

**Terminal 2 (Client):**
```bash
# Di folder root 'arena-warga'
cd client
npm run dev
```
*Client akan jalan di http://localhost:5173 (atau port lain yang muncul).*

Buka browser dan akses URL Client tersebut! 🎉

---

## 🎲 Cara Main

1.  **Buka Game**: Akses `localhost:5173`.
2.  **Buat Room**:
    -   Pilih tab **"Buat Room"**.
    -   Masukkan Nama Kamu.
    -   Atur Mode (Normal / Battle Royale) dan Jumlah Ronde.
    -   Klik "Buat Room".
3.  **Undang Teman**:
    -   Salin **Room ID** yang ada di pojok kiri atas layar permainan.
    -   Kirim ke temanmu.
4.  **Join Room** (Untuk Teman):
    -   Buka game, pilih tab **"Join Room"**.
    -   Masukkan Nama dan **Room ID** yang diberikan.
    -   Klik "Masuk".
5.  **Main!**:
    -   Host klik "Mulai Game".
    -   Tebak lokasi Street View dengan klik di Peta Kanan Bawah.
    -   Klik "Tebak Lokasi" (ikon Target).
    -   Semakin dekat tebakanmu, semakin besar poinmu!

## 📂 Struktur Folder

```
arena-warga/
├── game/               # Logika Game & Data
│   ├── LocationService.js  # Pengatur lokasi random
│   ├── RoomManager.js      # Pengatur room & player state
│   └── locations.json      # Database koordinat lokasi
├── client/             # Frontend (React)
│   ├── src/components/     # Komponen Game (GameRoom, Lobby, Maps)
│   └── ...
├── server.js           # Entry point Backend (Socket.io)
└── package.json        # Dependencies Backend
```

## 🤝 Kontribusi

Mau nambahin lokasi seru di daerahmu?
1.  Fork repo ini.
2.  Buka `game/locations.json`.
3.  Tambahkan koordinat (lat, lng) tempat unikan di kotamu!
4.  Pull Request.

---
Dibuat dengan ❤️ untuk Warga +62.
Selamat bermain!
