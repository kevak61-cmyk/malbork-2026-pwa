const STORAGE_KEY = "malbork.phone-test.v2.3.0";

const tests = [
  {
    id: 1,
    title: "Instalacja PWA",
    critical: true,
    steps: [
      "Otwórz witrynę w Chrome przez HTTPS.",
      "Zainstaluj aplikację lub dodaj ją do ekranu głównego.",
      "Uruchom aplikację z ikony."
    ],
    pass: "Aplikacja otwiera się jako samodzielne okno."
  },
  {
    id: 2,
    title: "Integralność pakietu",
    critical: true,
    steps: ["Uruchom aplikację i odczekaj kilka sekund."],
    pass: "Brak błędu manifestu, podpisu lub brakującego pliku."
  },
  {
    id: 3,
    title: "GPS",
    critical: true,
    steps: [
      "Włącz dokładną lokalizację.",
      "Zezwól aplikacji na lokalizację podczas używania.",
      "Uruchom test GPS najlepiej na zewnątrz."
    ],
    pass: "Aplikacja otrzymuje pozycję bez trwałego błędu uprawnień.",
    action: "gps"
  },
  {
    id: 4,
    title: "Dźwięk i synteza mowy",
    critical: true,
    steps: [
      "Ustaw głośność multimediów na około 70%.",
      "Uruchom test dźwięku.",
      "Uruchom narrację aktywnego punktu."
    ],
    pass: "Komunikaty są po polsku, wyraźne i nie nakładają się.",
    action: "speech"
  },
  {
    id: 5,
    title: "Tryb offline",
    critical: true,
    steps: [
      "Uruchom aplikację online co najmniej raz.",
      "Zamknij ją, włącz tryb samolotowy i uruchom z ikony."
    ],
    pass: "Aplikacja, projekt i mapa otwierają się bez Internetu.",
    action: "cache"
  },
  {
    id: 6,
    title: "Zapis i wznowienie",
    critical: true,
    steps: [
      "Rozpocznij wyprawę i przejdź do kolejnego etapu.",
      "Zamknij aplikację całkowicie.",
      "Uruchom ją i wybierz Wznów sesję."
    ],
    pass: "Aktywny etap i postęp zostały zachowane."
  },
  {
    id: 7,
    title: "Wygaszony ekran",
    critical: false,
    steps: [
      "Uruchom sesję z GPS.",
      "Wygasz ekran na 3–5 minut i przejdź kilkadziesiąt metrów.",
      "Odblokuj telefon."
    ],
    pass: "Sesja nie została utracona."
  },
  {
    id: 8,
    title: "Czytelność w terenie",
    critical: false,
    steps: [
      "Sprawdź aplikację w pełnym słońcu.",
      "Obsłuż ją jedną ręką."
    ],
    pass: "Nazwa punktu, dystans i przyciski są czytelne."
  },
  {
    id: 9,
    title: "Awaryjny powrót",
    critical: true,
    steps: [
      "Rozpocznij sesję testową.",
      "Wybierz bezpośredni powrót na dworzec i potwierdź."
    ],
    pass: "Aktywnym etapem staje się powrót na dworzec."
  }
];

const defaultState = () => ({
  device: {
    model: "",
    android: "",
    chrome: "",
    date: new Date().toISOString().slice(0, 10)
  },
  results: Object.fromEntries(tests.map(test => [test.id, { status: "", note: "" }])),
  limitations: "",
  decision: "",
  updatedAt: new Date().toISOString()
});

let state = loadState();

const $ = id => document.getElementById(id);

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return { ...defaultState(), ...stored };
  } catch {
    return defaultState();
  }
}

function saveState() {
  state.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  renderSummary();
}

function renderEnvironment() {
  const secure = window.isSecureContext;
  const standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const sw = "serviceWorker" in navigator;
  $("environmentStatus").textContent =
    `HTTPS/secure context: ${secure ? "TAK" : "NIE"} · ` +
    `Tryb aplikacji: ${standalone ? "zainstalowana" : "przeglądarka"} · ` +
    `Service Worker: ${sw ? "obsługiwany" : "brak obsługi"} · ` +
    `Sieć: ${navigator.onLine ? "online" : "offline"}`;
}

function buildTests() {
  const list = $("testList");
  list.innerHTML = "";

  for (const test of tests) {
    const result = state.results[test.id];
    const section = document.createElement("section");
    section.className = `card test-card ${result.status.toLowerCase()}`;
    section.dataset.testId = String(test.id);

    const actionButton = test.action
      ? `<button class="test-action" data-action="${test.action}" data-test="${test.id}">
           ${test.action === "gps" ? "Sprawdź GPS" : test.action === "speech" ? "Odtwórz test" : "Sprawdź cache"}
         </button>`
      : "";

    section.innerHTML = `
      <div class="test-meta">
        <span class="stage-number">${test.id}</span>
        <h2>${test.title}</h2>
        ${test.critical ? '<span class="critical-badge">Krytyczny</span>' : ""}
      </div>
      <ol>${test.steps.map(step => `<li>${step}</li>`).join("")}</ol>
      <p><strong>Warunek PASS:</strong> ${test.pass}</p>
      ${actionButton}
      <div class="test-result-buttons">
        <button data-status="PASS" data-test="${test.id}" class="${result.status === "PASS" ? "selected-pass" : ""}">PASS</button>
        <button data-status="FAIL" data-test="${test.id}" class="${result.status === "FAIL" ? "selected-fail" : ""}">FAIL</button>
      </div>
      <textarea class="test-note" data-note="${test.id}" rows="2" placeholder="Uwagi do testu">${escapeHtml(result.note)}</textarea>
    `;
    list.appendChild(section);
  }
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function runAction(action, testId) {
  if (action === "gps") {
    if (!navigator.geolocation) {
      alert("Przeglądarka nie obsługuje geolokalizacji.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude, accuracy } = position.coords;
        state.results[testId].note =
          `GPS działa: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}, dokładność około ${Math.round(accuracy)} m.`;
        state.results[testId].status = accuracy <= 100 ? "PASS" : "";
        saveState();
        buildTests();
      },
      error => {
        state.results[testId].note = `Błąd GPS: ${error.message}`;
        state.results[testId].status = "FAIL";
        saveState();
        buildTests();
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  if (action === "speech") {
    if (!("speechSynthesis" in window)) {
      state.results[testId].note = "Brak obsługi syntezy mowy.";
      state.results[testId].status = "FAIL";
      saveState();
      buildTests();
      return;
    }
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      "Test dźwięku aplikacji Malbork. Komunikat powinien być wyraźny i odtworzony po polsku."
    );
    utterance.lang = "pl-PL";
    speechSynthesis.speak(utterance);
    state.results[testId].note = "Odtworzono komunikat testowy. Oceń go ręcznie jako PASS albo FAIL.";
    saveState();
    buildTests();
  }

  if (action === "cache") {
    if (!("caches" in window)) {
      state.results[testId].note = "Cache API nie jest dostępne.";
      state.results[testId].status = "FAIL";
    } else {
      const keys = await caches.keys();
      const malborkCaches = keys.filter(key => key.includes("malbork"));
      state.results[testId].note =
        malborkCaches.length
          ? `Znaleziono cache aplikacji: ${malborkCaches.join(", ")}. Właściwy test offline wymaga trybu samolotowego.`
          : "Nie znaleziono cache aplikacji. Uruchom najpierw główną aplikację online.";
      if (!malborkCaches.length) state.results[testId].status = "FAIL";
    }
    saveState();
    buildTests();
  }
}

function renderSummary() {
  const completed = tests.filter(test => state.results[test.id].status).length;
  const failedCritical = tests.filter(
    test => test.critical && state.results[test.id].status === "FAIL"
  );
  const pendingCritical = tests.filter(
    test => test.critical && !state.results[test.id].status
  );

  $("overallScore").textContent = `${completed}/9`;
  $("progressBar").style.width = `${(completed / tests.length) * 100}%`;

  if (completed === tests.length) {
    $("overallTitle").textContent = failedCritical.length ? "Test zakończony z błędem" : "Test zakończony";
  } else {
    $("overallTitle").textContent = "Test nieukończony";
  }

  $("criticalStatus").textContent = failedCritical.length
    ? `Testy krytyczne FAIL: ${failedCritical.map(test => test.id).join(", ")}.`
    : pendingCritical.length
      ? `Testy krytyczne oczekujące: ${pendingCritical.map(test => test.id).join(", ")}.`
      : "Wszystkie testy krytyczne mają PASS.";

  $("decisionStatus").textContent = state.decision
    ? `Wybrana decyzja: ${state.decision}.`
    : "Decyzja nie została wybrana.";

  document.querySelectorAll("[data-decision]").forEach(button => {
    button.classList.toggle("selected", button.dataset.decision === state.decision);
  });
}

function reportObject() {
  const criticalPass = tests
    .filter(test => test.critical)
    .every(test => state.results[test.id].status === "PASS");

  return {
    reportType: "Malbork2026PhoneAcceptanceTest",
    productVersion: "2.3.0",
    generatedAt: new Date().toISOString(),
    environment: {
      secureContext: window.isSecureContext,
      standalone:
        window.matchMedia("(display-mode: standalone)").matches ||
        navigator.standalone === true,
      onlineAtExport: navigator.onLine,
      userAgent: navigator.userAgent
    },
    device: state.device,
    results: tests.map(test => ({
      id: test.id,
      title: test.title,
      critical: test.critical,
      status: state.results[test.id].status || "NOT_RUN",
      note: state.results[test.id].note
    })),
    limitations: state.limitations,
    decision: state.decision || "NOT_SELECTED",
    automaticAssessment: criticalPass ? "CRITICAL_TESTS_PASS" : "CRITICAL_TESTS_NOT_PASS",
    updatedAt: state.updatedAt
  };
}

function summaryText() {
  const report = reportObject();
  const lines = [
    `Malbork 2026 — test telefonu v${report.productVersion}`,
    `Urządzenie: ${report.device.model || "nie podano"}`,
    `Android: ${report.device.android || "nie podano"}`,
    `Chrome: ${report.device.chrome || "nie podano"}`,
    `Decyzja: ${report.decision}`,
    ""
  ];
  for (const result of report.results) {
    lines.push(`${result.id}. ${result.title}: ${result.status}${result.note ? ` — ${result.note}` : ""}`);
  }
  if (report.limitations) lines.push("", `Ograniczenia: ${report.limitations}`);
  return lines.join("\n");
}

function bind() {
  const fields = [
    ["deviceModel", "model"],
    ["androidVersion", "android"],
    ["chromeVersion", "chrome"],
    ["testDate", "date"]
  ];

  for (const [id, key] of fields) {
    $(id).value = state.device[key] || "";
    $(id).addEventListener("input", event => {
      state.device[key] = event.target.value;
      saveState();
    });
  }

  $("limitations").value = state.limitations || "";
  $("limitations").addEventListener("input", event => {
    state.limitations = event.target.value;
    saveState();
  });

  document.addEventListener("click", event => {
    const statusButton = event.target.closest("[data-status]");
    if (statusButton) {
      const id = Number(statusButton.dataset.test);
      state.results[id].status = statusButton.dataset.status;
      saveState();
      buildTests();
      return;
    }

    const actionButton = event.target.closest("[data-action]");
    if (actionButton) {
      runAction(actionButton.dataset.action, Number(actionButton.dataset.test));
      return;
    }

    const decisionButton = event.target.closest("[data-decision]");
    if (decisionButton) {
      state.decision = decisionButton.dataset.decision;
      saveState();
    }
  });

  document.addEventListener("input", event => {
    if (event.target.matches("[data-note]")) {
      state.results[Number(event.target.dataset.note)].note = event.target.value;
      saveState();
    }
  });

  $("downloadReportBtn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(reportObject(), null, 2)], {
      type: "application/json"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `malbork-phone-test-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  });

  $("copyReportBtn").addEventListener("click", async () => {
    await navigator.clipboard.writeText(summaryText());
    $("decisionStatus").textContent = "Podsumowanie skopiowane do schowka.";
  });

  $("resetTestBtn").addEventListener("click", () => {
    if (!confirm("Wyzerować wszystkie wyniki testu telefonu?")) return;
    state = defaultState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    location.reload();
  });

  window.addEventListener("online", renderEnvironment);
  window.addEventListener("offline", renderEnvironment);
}

renderEnvironment();
buildTests();
bind();
renderSummary();
