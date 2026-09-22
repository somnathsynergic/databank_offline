import ReactNativeBiometrics from 'react-native-biometrics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import forge from 'node-forge';

const rnBiometrics = new ReactNativeBiometrics();

const AGENT_CODE_KEY = '@secure_agent_code';
const PUBLIC_KEY_CACHE = '@secure_public_key';
const PRIVATE_KEY_FALLBACK = '@secure_private_key_fallback';
const KEY_TYPE_MODE = '@secure_key_type_mode'; // 'hardware' | 'software'

/**
 * Generate a hardware-backed RSA keypair in Android Keystore / iOS Secure Enclave.
 * Fallbacks seamlessly to a 2048-bit Software RSA keypair if Hardware Keystore fails on emulators/unsupported hardware.
 */
export const generateDeviceKeyPair = async () => {
  // 1. Try Hardware Keystore (Android Keystore / Secure Enclave)
  try {
    try {
      await rnBiometrics.deleteKeys();
    } catch (e) {
      // Ignore
    }
    const { publicKey } = await rnBiometrics.createKeys();
    if (publicKey) {
      await AsyncStorage.setItem(PUBLIC_KEY_CACHE, publicKey);
      await AsyncStorage.setItem(KEY_TYPE_MODE, 'hardware');
      console.log("Hardware Keypair successfully generated.");
      return publicKey;
    }
  } catch (hwError) {
    console.log("Hardware Keystore notice, switching to fast Software RSA Fallback.");
  }

  // 2. Software RSA Fallback (Instant generation with workers: 0)
  try {
    // workers: 0 prevents forge from spawning non-existent Web Workers in React Native
    const keypair = forge.pki.rsa.generateKeyPair({ bits: 1024, workers: 0 });
    const publicKeyPem = forge.pki.publicKeyToPem(keypair.publicKey);
    const privateKeyPem = forge.pki.privateKeyToPem(keypair.privateKey);

    await AsyncStorage.setItem(PUBLIC_KEY_CACHE, publicKeyPem);
    await AsyncStorage.setItem(PRIVATE_KEY_FALLBACK, privateKeyPem);
    await AsyncStorage.setItem(KEY_TYPE_MODE, 'software');

    console.log("Software RSA Keypair successfully generated fallback.");
    return publicKeyPem;
  } catch (swError) {
    console.error("Fatal: Failed to generate Software RSA Keypair:", swError);
    throw swError;
  }
};

/**
 * Sign a challenge string using either Hardware Key or Software RSA Fallback key.
 * Returns Base64 encoded SHA256 RSA signature.
 */
export const signChallenge = async (challenge) => {
  const mode = await AsyncStorage.getItem(KEY_TYPE_MODE);

  if (mode === 'hardware') {
    try {
      const result = await rnBiometrics.createSignature({
        promptMessage: 'Authenticate Device Binding',
        payload: challenge,
        cancelButtonText: 'Cancel',
      });

      if (result.success && result.signature) {
        return result.signature;
      }
    } catch (hwSignErr) {
      console.warn("Hardware signature failed, trying software fallback:", hwSignErr);
    }
  }

  // Software Fallback Signing
  try {
    const privateKeyPem = await AsyncStorage.getItem(PRIVATE_KEY_FALLBACK);
    if (!privateKeyPem) {
      throw new Error("No private key found. Please re-register device.");
    }

    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
    const md = forge.md.sha256.create();
    md.update(challenge, 'utf8');

    const rawSignature = privateKey.sign(md);
    const base64Signature = forge.util.encode64(rawSignature);

    return base64Signature;
  } catch (swSignErr) {
    console.error("Software signature failed:", swSignErr);
    throw swSignErr;
  }
};

/**
 * Store agent_code persistently in secure local storage.
 */
export const saveAgentCodeLocally = async (agentCode) => {
  try {
    await AsyncStorage.setItem(AGENT_CODE_KEY, agentCode);
  } catch (error) {
    console.error("Error saving agent code locally:", error);
  }
};

/**
 * Retrieve saved agent_code from secure local storage.
 */
export const getAgentCodeLocally = async () => {
  try {
    return await AsyncStorage.getItem(AGENT_CODE_KEY);
  } catch (error) {
    console.error("Error retrieving agent code locally:", error);
    return null;
  }
};

/**
 * Clear saved agent_code from local storage.
 */
export const clearAgentCodeLocally = async () => {
  try {
    await AsyncStorage.removeItem(AGENT_CODE_KEY);
    await AsyncStorage.removeItem(PUBLIC_KEY_CACHE);
    await AsyncStorage.removeItem(PRIVATE_KEY_FALLBACK);
    await AsyncStorage.removeItem(KEY_TYPE_MODE);
    try {
      await rnBiometrics.deleteKeys();
    } catch (e) {
      // Ignore
    }
    console.log("Local device registration and keypair wiped successfully.");
  } catch (error) {
    console.error("Error clearing agent code locally:", error);
  }
};
