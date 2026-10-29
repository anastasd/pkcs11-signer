import { mkdir, writeFile, remove, BaseDirectory } from "@tauri-apps/plugin-fs";
import { Command } from "@tauri-apps/plugin-shell";
import { desktopDir } from "@tauri-apps/api/path";

type ActionType = "sign" | "verify";

interface TabButtonElement extends HTMLButtonElement {
  dataset: DOMStringMap & {
    tab?: string;
  };
}

const tabButtons = document.querySelectorAll<TabButtonElement>(".tab-btn");
const tabContents = document.querySelectorAll<HTMLElement>(".tab-content");

const signFileButton = document.querySelector<HTMLButtonElement>("#sign-button");
const verifyFileButton = document.querySelector<HTMLButtonElement>("#verify-button");

const signFileInput = document.querySelector<HTMLInputElement>("#sign-file");
const signedFileInput = document.querySelector<HTMLInputElement>("#signed-file");
const signatureFileInput = document.querySelector<HTMLInputElement>("#signature");

const signModal = document.querySelector<HTMLElement>("#pin-code-modal");
const okButton = document.querySelector<HTMLButtonElement>("#ok-button");
const cancelButton = document.querySelector<HTMLButtonElement>("#cancel-button");

const pinCodeInput = document.querySelector<HTMLInputElement>("#pin-code");

const randomPath = Math.random().toString(36).substring(2, 10);

async function readFileAsUint8Array(file: File): Promise<Uint8Array> {
  const buffer = await file.arrayBuffer();
  return new Uint8Array(buffer);
}

function resetPinModal(): void {
  if (pinCodeInput) pinCodeInput.value = "";
  signModal?.classList.remove("active");
}

function showModal(action: ActionType): void {
  if (!okButton) return;
  okButton.dataset.action = action;

  if (action === "sign" && (!signFileInput?.files || signFileInput.files.length === 0)) {
    alert("Please select a file to sign.");
    return;
  }

  if (
    action === "verify" &&
    (!signedFileInput?.files?.length || !signatureFileInput?.files?.length)
  ) {
    alert("Please select both the signed file and signature file.");
    return;
  }

  signModal?.classList.add("active");
}

function hideModal(event: Event): void {
  if (event.target === signModal || event.target === cancelButton) {
    resetPinModal();
  }
}

function handleOkButtonClick(event: MouseEvent): void {
  const button = event.currentTarget as HTMLButtonElement | null;
  const action = button?.dataset.action as ActionType | undefined;

  switch (action) {
    case "sign":
      void signFile();
      break;
    case "verify":
      void verifySignature();
      break;
  }
}

async function signFile(): Promise<void> {
  const fileObj = signFileInput?.files?.[0];
  if (!fileObj) {
    alert("No file selected.");
    return;
  }

  const pinCode = pinCodeInput?.value ?? "";
  const desktopPath = await desktopDir();

  const folderPath = `${desktopPath}/pkcs11-signer`;
  const filePath = `${folderPath}/${fileObj.name}`;
  const sigPath = `${filePath}.sig`;

  try {
    await mkdir("pkcs11-signer", {
      baseDir: BaseDirectory.Desktop,
      recursive: true,
    });

    const fileSrc = await readFileAsUint8Array(fileObj);
    await writeFile(filePath, fileSrc);

    const command = Command.create("pkcs11-tool", [
      "--sign",
      "--pin", pinCode,
      "--id", "0001",
      "--mechanism", "SHA256-RSA-PKCS",
      "--input-file", filePath,
      "--output-file", sigPath,
    ]);

    const output = await command.execute();

    if (output.code === 0) {
      if (signFileInput) signFileInput.value = "";
      resetPinModal();
      alert(`Signature successfully generated and saved to ${sigPath}`);
    } else {
      const errorCode = output.stderr.match(new RegExp("CKR_[A-Z_]+")) as RegExpMatchArray | null;

      if (errorCode) {
        switch (errorCode[0]) {
          case "CKR_HOST_MEMORY":
            alert("Your computer has insufficient memory to perform the requested function.");
            break;
          case "CKR_SLOT_ID_INVALID":
            alert("The specified slot ID is not valid.");
            break;
          case "CKR_GENERAL_ERROR":
            alert("Unknown error happened: " + output.stderr);
            break;
          case "CKR_ARGUMENTS_BAD":
            alert("The provided arguments were not appropriate");
            break;
          case "CKR_ATTRIBUTE_TYPE_INVALID":
            alert("An invalid value was specified for an attribute.");
            break;
          case "CKR_DATA_INVALID":
            alert("The plaintext input data is invalid.");
            break;
          case "CKR_DEVICE_ERROR":
            alert("Some problem has occurred with the token and/or slot. ");
            break;
          case "CKR_DEVICE_MEMORY":
            alert("The device does not have sufficient memory to create the signature.");
            break;
          case "CKR_KEY_HANDLE_INVALID":
            alert("The specified key handle is not valid.");
            break;
          case "CKR_PIN_INCORRECT":
            alert("The PIN code is incorrect!");
            break;
          default:
            alert(`Error creating signature: "${output.stderr}"`);
        }
      } else {
        // await remove(filePath);
        alert(`Error creating signature: "${output.stderr}"`);
      }
    }
  } catch (error) {
    await remove(filePath).catch(() => { });
    alert(`Failed to run command: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function writeVerifyFiles(desktopPath: string, file1: File, file2: File): Promise<{ file1Path: string; file2Path: string; dirPath: string }> {
  const dirPath = `${desktopPath}/pkcs11-signer/${randomPath}`;
  const file1Path = `${dirPath}/${file1.name}`;
  const file2Path = `${dirPath}/${file2.name}`;

  await mkdir(`pkcs11-signer/${randomPath}`, {
    baseDir: BaseDirectory.Desktop,
    recursive: true,
  });

  const [src1, src2] = await Promise.all([
    readFileAsUint8Array(file1),
    readFileAsUint8Array(file2),
  ]);

  await Promise.all([
    writeFile(file1Path, src1),
    writeFile(file2Path, src2),
  ]);

  return { file1Path, file2Path, dirPath };
}

async function verifySignature(): Promise<void> {
  const fileObj1 = signedFileInput?.files?.[0];
  const fileObj2 = signatureFileInput?.files?.[0];

  if (!fileObj1 || !fileObj2) {
    alert("Please provide both the source file and signature file.");
    return;
  }

  const desktopPath = await desktopDir();
  let sessionDir = "";

  try {
    const { file1Path, file2Path, dirPath } = await writeVerifyFiles(desktopPath, fileObj1, fileObj2);
    sessionDir = dirPath;

    const command = Command.create("pkcs11-tool", [
      "--verify",
      "--id", "0001",
      "--mechanism", "SHA256-RSA-PKCS",
      "--input-file", file1Path,
      "--signature-file", file2Path,
    ]);

    const output = await command.execute();

    if (output.code === 0) {
      alert("Signature is valid");
    } else {
      // alert(`Signature verification failed: "${output.stderr}"`);
      alert("Signature verification failed");
    }
  } catch (error) {
    alert(`Failed to run command: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    if (sessionDir) {
      await remove(sessionDir, { recursive: true }).catch(() => { });
    }
  }
}

function initTabs(): void {
  if (!tabButtons.length || !tabContents.length) return;

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
  signFileButton?.addEventListener("click", () => showModal("sign"));
  verifyFileButton?.addEventListener("click", verifySignature);

  cancelButton?.addEventListener("click", hideModal);
  signModal?.addEventListener("click", hideModal);

  okButton?.addEventListener("click", handleOkButtonClick);
  cancelButton?.addEventListener("click", resetPinModal);

  initTabs();
});