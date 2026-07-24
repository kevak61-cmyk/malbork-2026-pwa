export const READINESS_KEYS = ["package", "offline", "gps", "storage", "audio"];

export function initialReadinessState() {
  return {
    package: "CHECKING",
    offline: "CHECKING",
    gps: "UNKNOWN",
    storage: "UNKNOWN",
    audio: "UNKNOWN",
    install: "UNKNOWN"
  };
}

export function readinessSummary(state) {
  const essential = ["package", "offline", "gps"];
  const readyCount = READINESS_KEYS.filter((key) => state[key] === "READY").length;
  const blocked = essential.filter((key) => state[key] === "BLOCKED");
  const pending = essential.filter((key) => !["READY", "BLOCKED"].includes(state[key]));
  return {
    ready: blocked.length === 0 && pending.length === 0,
    readyCount,
    total: READINESS_KEYS.length,
    blocked,
    pending,
    label: blocked.length
      ? "Wymaga działania"
      : pending.length
        ? "Trwa przygotowanie"
        : "Gotowa do wyprawy"
  };
}

export function recoveryStatus(saved, project) {
  if (!saved) return { recoverable: false, reason: "NO_SESSION" };
  if (saved.projectId !== project?.metadata?.projectId) {
    return { recoverable: false, reason: "PROJECT_MISMATCH" };
  }
  if (saved.projectVersion !== project?.metadata?.version) {
    return { recoverable: false, reason: "VERSION_MISMATCH" };
  }
  if (!["ACTIVE", "PAUSED"].includes(saved.state)) {
    return { recoverable: false, reason: "NOT_IN_PROGRESS" };
  }
  return {
    recoverable: true,
    reason: "IN_PROGRESS",
    currentStageId: saved.currentStageId,
    updatedAt: saved.updatedAt ?? null
  };
}

export function permissionStatus(permissionState) {
  if (permissionState === "granted") return "READY";
  if (permissionState === "denied") return "BLOCKED";
  return "ACTION_REQUIRED";
}

export function storageStatus({ persisted = false, quota = 0, usage = 0 } = {}) {
  const free = Math.max(0, quota - usage);
  if (quota > 0 && free < 5_000_000) return "BLOCKED";
  return persisted ? "READY" : "AVAILABLE";
}

export function installationInstructions(userAgent = "") {
  const android = /Android/i.test(userAgent);
  return android
    ? [
        "Otwórz menu przeglądarki Chrome.",
        "Wybierz „Zainstaluj aplikację” albo „Dodaj do ekranu głównego”.",
        "Uruchom Malbork 2026 z ikony na ekranie głównym.",
        "Przy pierwszym uruchomieniu zezwól na dokładną lokalizację."
      ]
    : [
        "Otwórz menu przeglądarki.",
        "Wybierz instalację aplikacji lub dodanie jej do ekranu głównego.",
        "Uruchom aplikację z utworzonej ikony.",
        "Zezwól na dostęp do lokalizacji."
      ];
}

export function canStartFieldSession(state, override = false) {
  if (override) return { allowed: true, overridden: true, reasons: [] };
  const required = ["package", "offline", "gps"];
  const reasons = required.filter((key) => state[key] !== "READY");
  return { allowed: reasons.length === 0, overridden: false, reasons };
}
