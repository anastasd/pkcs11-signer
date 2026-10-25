import { mkdir, writeFile, remove, BaseDirectory } from "@tauri-apps/plugin-fs";
import { Command } from "@tauri-apps/plugin-shell";
import { desktopDir } from '@tauri-apps/api/path';

const tabButtons = document.querySelectorAll<TabButtonElement>(".tab-btn");
const tabContents = document.querySelectorAll<HTMLElement>(".tab-content");
const signFileButton = document.querySelector<HTMLButtonElement>("#sign-button") as HTMLButtonElement | null;

const signFileInput = document.querySelector<HTMLInputElement>("#sign-file");
const signedFileInput = document.querySelector<HTMLInputElement>("#signed-file");
const signatureFileInput = document.querySelector<HTMLInputElement>("#signature");
const veriyFileButton = document.querySelector<HTMLButtonElement>("#verify-button") as HTMLButtonElement | null;

const signModal = document.querySelector<HTMLElement>("#pin-code-modal") as HTMLInputElement | null;
const okButton = document.querySelector<HTMLButtonElement>("#ok-button");
const cancelButton = document.querySelector<HTMLButtonElement>("#cancel-button");

const pinCodeInput = document.querySelector<HTMLInputElement>("#pin-code");


interface TabButtonElement extends HTMLButtonElement {
  dataset: DOMStringMap & {
    tab?: string;
  };
}


function showModal(action: string): void {
  okButton!.dataset.action = action; // Assign the correct action so the OK button knows it

  if (action == "sign" && signFileInput?.files?.length == 0) {
    alert("ERROR");

    return;
  }

  if (action == "verify" && (signedFileInput?.files?.length == 0 || signatureFileInput?.files?.length == 0)) {
    alert("ERROR");

    return;
  }

  signModal?.classList.add("active");
}

function hideModal(event: Event): void {
  if (event.target === signModal || event.target === cancelButton) {
    pinCodeInput!.value = "";
    signModal?.classList.remove("active");
  }
}

function okButtonClicked(event: Event) {
  const button = event.target as HTMLButtonElement | null;

  if (button) {
    switch (button.dataset.action) {
      case "sign":
        signFile();
        break;
      case "verify":
        verifySignature();
        break;
    }
  }
}

function cancelButtonClicked() {
  pinCodeInput!.value = "";
  signModal?.classList.remove("active");
}

async function signFile() {
  const pinCode = pinCodeInput?.value as String | "";
  const desktopPath = await desktopDir() as any;

  await mkdir("pkcs11-signer", {
    baseDir: BaseDirectory.Desktop,
    recursive: true,
  });

  if (signFileInput && signFileInput.files) {
    const fileObj = signFileInput.files[0], reader = new FileReader();

    reader.onload = async function () {
      if (reader.result instanceof ArrayBuffer) {
        const fileSrc = new Uint8Array(reader.result);

        await writeFile(desktopPath + "/pkcs11-signer/" + fileObj.name, fileSrc);

        try {
          const program = "pkcs11-tool";
          const args = [
            "--sign",
            "--pin", pinCode,
            "--id", "0001",
            "--mechanism", "SHA256-RSA-PKCS",
            "--input-file", desktopPath + "/pkcs11-signer/" + fileObj.name,
            "--output-file", desktopPath + "/pkcs11-signer/" + fileObj.name + ".sig"
          ] as string[];
          const command = Command.create(program, args);
          const output = await command.execute();

          if (output.code === 0) {
            if (signFileInput) {
              signFileInput.value = "";
            }
            signModal?.classList.remove("active");
            pinCodeInput!.value = "";

            alert("Signature successfuly generated and saved to " + desktopPath + "/pkcs11-signer/" + fileObj.name + ".sig");
          } else {
            await remove(desktopPath + "/pkcs11-signer/" + fileObj.name);

            alert("There was an error creating the signature: \"" + output.stderr + "\"");
          }

        } catch (error) {
          await remove(desktopPath + "/pkcs11-signer/" + fileObj.name);

          console.error("Failed to run command:", error);
        }
      }
    };

    var blob = fileObj.slice(0, fileObj.size);
    reader.readAsArrayBuffer(blob);
  }
}

async function verifySignature() {
  const pinCode = pinCodeInput?.value as String | "";

  console.log(pinCode)

  const desktopPath = await desktopDir() as any;

  if (signFileInput && signFileInput.files) {
    const fileObj = signFileInput.files[0], reader = new FileReader();

    reader.onload = async function () {
      if (reader.result instanceof ArrayBuffer) {
        const fileSrc = new Uint8Array(reader.result);

        await writeFile(desktopPath + "/" + fileObj.name, fileSrc);

        try {
          const program = "pkcs11-tool";
          const args = [
            "--verify",
            "--id", "0001",
            "--mechanism", "SHA256-RSA-PKCS",
            "--input-file", desktopPath + "/" + fileObj.name,
            "--signature-file", desktopPath + "/" + fileObj.name + ".sig"
          ] as string[];
          const command = Command.create(program, args);
          const output = await command.execute();

          if (output.code === 0) {
            if (signFileInput) {
              signFileInput.value = "";
            }
            signModal?.classList.remove("active");
            pinCodeInput!.value = "";

            alert("Signature successfuly generated and saved to " + desktopPath + "/" + fileObj.name + ".sig");
          } else {
            await remove(desktopPath + "/" + fileObj.name);

            alert("There was an error creating the signature: \"" + output.stderr + "\"");
          }

        } catch (error) {
          await remove(desktopPath + "/" + fileObj.name);

          console.error("Failed to run command:", error);
        }
      }
    };

    var blob = fileObj.slice(0, fileObj.size);
    reader.readAsArrayBuffer(blob);
  }
}

function initTabs(): void {
  if (!tabButtons?.length || !tabContents.length) return;

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetTabId = button.dataset.tab;
      if (!targetTabId) return;

      const targetContent = document.getElementById(targetTabId);
      if (!targetContent) return;

      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));

      button.classList.add("active");
      targetContent.classList.add("active");
    });
  });
}

window.addEventListener("DOMContentLoaded", () => {
  signFileButton?.addEventListener("click", () => {
    showModal("sign");
  });

  veriyFileButton?.addEventListener("click", () => {
    showModal("verify");
  });

  cancelButton?.addEventListener("click", hideModal);

  signModal?.addEventListener("click", hideModal);

  okButton?.addEventListener("click", okButtonClicked);
  cancelButton?.addEventListener("click", cancelButtonClicked);

  initTabs();
});