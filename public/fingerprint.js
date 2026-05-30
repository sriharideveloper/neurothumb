// Device fingerprinting for free trial tracking
export function getDeviceFingerprint() {
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 0,
    navigator.deviceMemory || 0,
  ].join("|");

  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  return Math.abs(hash).toString(16);
}

export async function getClientIP() {
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    return data.ip;
  } catch (e) {
    return "unknown";
  }
}

export async function checkTrialStatus() {
  try {
    const ip = await getClientIP();
    const device = getDeviceFingerprint();

    const res = await fetch(
      `/api/analyze?action=check-trial&ip=${ip}&device=${device}`,
    );
    const data = await res.json();
    return data;
  } catch (e) {
    console.error("Trial check failed:", e);
    return { canUseTrial: true, used: false };
  }
}
