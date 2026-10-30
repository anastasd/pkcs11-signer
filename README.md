# PKCS#11 Document & File Signer

An open-source cross-platform desktop application built with **Tauri**, **Rust**, **TypeScript**, and **Tailwind CSS**. It enables fast, hardware-secured digital signatures on any arbitrary file using PKCS#11 smart cards and USB crypto tokens (HSMs).

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Linux%20%7C%20Windows%20%7C%20macOS-lightgrey)

---

## 🌟 Overview

Most hardware security module (HSM) vendors provide plug-and-play desktop software primarily for Windows, leaving Linux and cross-platform users without a clean, native interface for daily digital signing operations.

**pkcs11-signer** bridges this gap by providing a modern, lightweight GUI that directly interfaces with your smart card readers and USB tokens (such as YubiKey, Gemalto, Athena, Safenet, Bit4id, and open-source OpenSC tokens). Private keys generated inside hardware modules never leave the physical chip—all cryptographic calculations take place securely on the device.

---

## ✨ Features

- **PKCS#11 Module Integration:** Load any system PKCS#11 dynamic library (`.so`, `.dll`, `.dylib`) or default OpenSC installations.
- **Hardware Token Detection:** Auto-detects connected smart card readers, token labels, and key slots.
- **Detached & Embedded Signatures:** Generate cryptographic signature files (`.sig` / `.p7s`) for any file format.
- **On-Chip Cryptography:** Verifies your PIN and performs private-key signature generation directly inside the HSM chip.
- **Lightweight & Fast:** Built on Tauri and Rust for a minimal resource footprint and high performance compared to heavy Electron apps.

---

## 🛠 Prerequisites & Dependencies

### 1. Hardware Driver Stack (Linux)

Ensure your system has the Smart Card Daemon (`pcscd`) and OpenSC installed:

#### **Debian / Ubuntu**
```bash
sudo apt update
sudo apt install pcscd opensc-pkcs11 libccid
sudo systemctl enable --now pcscd

```

#### **Fedora / RHEL**

```bash
sudo dnf install pcsc-lite pcsc-lite-ccid opensc
sudo systemctl enable --now pcscd

```

> **Note for Vendor Libraries:** If you use proprietary tokens (e.g., SafeNet eToken, Bit4id), ensure you have the vendor's PKCS#11 driver path available (e.g., `/usr/lib/libeTPkcs11.so` or `/usr/lib/libbit4xpki.so`).

---

## 🚀 Getting Started

### Installation / Pre-built Binaries

Download the latest release for your platform from the [Releases](https://github.com/anastasd/pkcs11-signer/releases) tab.

---

## 💻 Building from Source

### Prerequisites

1. **Node.js** (v18 or higher)
2. **Rust** toolchain:
```bash
curl --proto '=https' --tlsv1.2 -sSf [https://sh.rustup.rs](https://sh.rustup.rs) | sh

```


3. **Tauri Prerequisites** (Linux system packages):
```bash
# Debian/Ubuntu
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev

# Fedora
sudo dnf check-update
sudo dnf install webkit2gtk4.1-devel openssl-devel curl wget sqlite-devel libsoup3-devel

```



### Step-by-Step Build

1. **Clone the Repository:**
```bash
git clone [https://github.com/anastasd/pkcs11-signer.git](https://github.com/anastasd/pkcs11-signer.git)
cd pkcs11-signer

```


2. **Install Frontend Dependencies:**
```bash
npm install
# or
pnpm install

```


3. **Run in Development Mode:**
```bash
npm run tauri dev

```


4. **Build Production Release:**
```bash
npm run tauri build

```


The compiled binaries will be located in `src-tauri/target/release/bundle/`.

---

## 📖 How to Use

1. **Insert Token:** Connect your PKCS#11 hardware token or smart card reader via USB.
2. **Select Module:** Point the app to your system's PKCS#11 driver path (e.g., `/usr/lib64/opensc-pkcs11.so`).
3. **Authenticate:** Enter your hardware token User PIN to unlock certificate slots.
4. **Choose File & Sign:** Drag and drop or browse for the target file, choose your key certificate, and click **Sign**.

---

## 🔒 Security Architecture

* **Zero Private Key Exposure:** The application only passes file hashes (digests) to the hardware token; private signing keys remain strictly unexportable inside the physical HSM chip.
* **Isolated Execution:** Rust-backed IPC calls ensure memory-safe interactions between the frontend UI and system-level cryptographic libraries.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

Feel free to check the [issues page](https://github.com/anastasd/pkcs11-signer/issues).

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
