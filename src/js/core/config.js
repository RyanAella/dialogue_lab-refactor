/**
 * @module Config
 * Dynamic configuration for path-based routing.
 * Reads settings from window.DIALOGUE_LAB_CONFIG (set in index.html).
 */

// 1. Default configuration (falls window.DIALOGUE_LAB_CONFIG nicht gesetzt ist)
const DEFAULT_CONFIG = {
    MODE: 'full',
    ALLOWED_MODES: ['SIMULATION', 'TRANSFORMATION'],
    HIDE_SIMULATION: false,
    HIDE_TRANSFORMATION: false,
    DEFAULT_MODE: 'SIMULATION',
    BASE_PATH: ''
};

// 2. Lade Konfiguration aus HTML (oder nutze Defaults)
const DIALOGUE_LAB_CONFIG = window.DIALOGUE_LAB_CONFIG || DEFAULT_CONFIG;
const allowedModes = DIALOGUE_LAB_CONFIG.ALLOWED_MODES || DEFAULT_CONFIG.ALLOWED_MODES;
const basePath = DIALOGUE_LAB_CONFIG.BASE_PATH || '';

// 3. Prüfe, ob nur ein Modus aktiv ist
const isPracticeOnly = allowedModes.length === 1 && allowedModes.includes('TRANSFORMATION');
const isSimulationOnly = allowedModes.length === 1 && allowedModes.includes('SIMULATION');

// 4. App-Konfiguration (mit dynamischem BASE_PATH)
export const APP_CONFIG = {
    PROXY_URL: "https://kite2.site/dialogue_lab/chat.php",
    DATALOGGER_BACKEND: "https://kite2.site/dialogue_lab/save_dialogue.php",
    MODEL: "gpt-4o",
    CHAT_TEMPERATURE: 0.7,
    COACH_TEMPERATURE: 0.3,
    ICH_BOTSCHAFT_TEMPERATURE: 0.4,
    EXERCISES_FILE: `${basePath}src/data/exercises.json`, // Dynamischer Pfad
    FALLBACK_PROMPTS: {
        transformation: "Du bist ein erfahrener Kommunikations-Coach. Analysiere die Umformulierungen des Nutzers kritisch und gib konstruktives Feedback.",
        simulation: "Du bist ein Mentor. Analysiere das Gesprächsprotokoll und gib hilfreiches Feedback."
    }
};

// 5. Modus-Konstanten (nur SIMULATION und TRANSFORMATION)
export const APP_MODES = {
    SIMULATION: "simulation",
    TRANSFORMATION: "transformation"
};

// 6. Übungstypen (dynamisch)
export const EXERCISE_TYPES = {
    TRANSFORMATION: "TRANSFORMATION",
    SIMULATION: "SIMULATION"
};

// 7. DOM-Element-IDs (dynamisch)
export const DOM_ELEMENT_IDS = [
    "briefing-header", "briefing-content", "chevron",
    "scenario-section", "exercise-section",
    "mode-select", "mode-badge",
    "chat-window", "start-info", "user-input", "send-btn", "next-task-btn",
    "status-box", "mobile-menu-btn", "sidebar", "sidebar-overlay",
    "exercise-actions", "feedback-btn", "export-transcript-btn",
    "modal-download-btn", "reset-btn", "auto-speak-toggle",
    "speak-briefing-btn", "stop-speech-btn", "mic-btn",
    "loading-overlay", "loading-title", "feedback-modal",
    "feedback-modal-title", "modal-close-feedback", "modal-close-reset",
    "reset-modal", "partner-name-display",
    "scenarios", "exercises"
];

// 8. DOM-Element-Aliase
export const DOM_ELEMENT_ALIASES = {
    exerciseSelect: "exercises",
    scenarioSelect: "scenarios"
};

// 9. Modus-Badge-Konfiguration
export const MODE_BADGE_CONFIG = {
    transformation: { label: "Modus: Übungen", cls: "bg-violet-100 text-violet-700 border border-violet-200" },
    simulation: { label: "Modus: Simulationen", cls: "bg-slate-100 text-slate-700 border border-slate-200" }
};

// 10. UI-Texte (für SIMULATION und TRANSFORMATION)
export const UI_TEXTS = {
    feedbackBtn: {
        transformation: "<span>📊</span> Auswertung erstellen",
        simulation: "<span>📊</span> Feedback erhalten"
    },
    subtitles: {
        simulation: "Lies das Briefing und starte das Gespräch mit einer Nachricht.",
        transformation: (title, instruction) => `${title}: ${instruction}`
    },
    status: {
        loading: "Lade...",
        ready: "Bereit",
        simulationActive: "Simulationen aktiv",
        transformationActive: "Transformationen aktiv",
        allExercisesDone: "Alle Aussagen bearbeitet. Klicke jetzt auf 'Auswertung erstellen', um dein abschließendes Feedback zu erhalten.",
        exerciseComplete: "Übung abgeschlossen",
        sending: "Sende...",
        analyzing: "Analysiere...",
        restarting: "restarted"
    },
    errors: {
        prefix: "Fehler:",
        noSimulations: "Keine Simulationen verfügbar.",
        noTransformations: "Keine Transformations-Übungen verfügbar.",
        noExercises: "Keine Übungen verfügbar.",
        noEntriesAvailable: "Keine Einträge verfügbar",
        loadingError: "Ladefehler.",
        contentLoadingError: "Ladefehler",
        initializationError: "Die Anwendung konnte nicht korrekt initialisiert werden."
    },
    input: {
        simulation: (roleName) => `Nachricht an ${roleName}...`,
        transformation: "Eingabe...",
        transformationNext: "Deine neue Umformulierung...",
        transformationRestart: "Eingabe...",
        chooseScenario: "Wähle ein Szenario...",
        chooseExercise: "Wähle eine Übung...",
        allDone: "Alle Aufgaben erledigt.",
        retryOrContinue: "Versuche es noch einmal oder klicke auf 'Weiter'..."
    },
    tts: {
        userLabel: "Ich",
        briefingLabel: "Briefing"
    }
};

// 11. Feedback messages
export const FEEDBACK_MESSAGES = {
    loading: {
        title: {
            transformation: "Coach analysiert das Gespräch...",
            simulation: "Mentor analysiert das Gespräch...",
        },
        status: {
            transformation: "Coach analysiert...",
            simulation: "Mentor analysiert...",
        },
    },
    modal: {
        title: {
            transformation: "<span>📊</span> Coach-Analyse",
            simulation: "<span>📊</span> Mentor-Feedback",
        },
    },
    tts: {
        transformation: "Coach",
        simulation: "Mentor",
    },
    status: {
        ready: "Fertig",
        error: "Fehler: Keine Antwort von der KI erhalten.",
    },
    errorPrefix: "Fehler: ",
};

// 12. Export messages
export const EXPORT_MESSAGES = {
    transcript: {
        header: "PROTOKOLL: ",
        modeLabel: "Modus: ",
        dateLabel: "Datum: ",
        divider: "==========================================\n\n",
        sections: {
            briefing: "### 1. BRIEFING / AUFGABE ###\n\n",
            chat: "### 2. CHAT-VERLAUF ###\n\n",
            analysis: "### 3. ABSCHLIESSENDE ANALYSE ###\n\n",
        },
        senders: {
            user: "Ich",
            coach: "Coach-Feedback",
        },
    },
    modeLabels: {
        transformation: {
            display: "Transformationstraining",
            filePrefix: "Transformation",
        },
        simulation: {
            display: "Simulation",
            filePrefix: "Simulation",
        },
    },
    status: {
        uploadSuccess: (success, failed) => `Upload abgeschlossen: ${success} erfolgreich, ${failed} fehlgeschlagen`,
        uploadWarning: (count) => `${count} Konversationen konnten nicht hochgeladen werden.`,
        uploadError: (error) => `Fehler beim Hochladen: ${error}`,
    },
    alerts: {
        researchStats: (stats) =>
            `📊 Statistiken:\n\n` +
            `Gesamt Konversationen: ${stats.totalConversations}\n` +
            `Gesamt Dialogschritte: ${stats.totalTurns}\n` +
            `Aktuelle Konversation: ${stats.currentConversationId || 'Keine'}\n` +
            `Ausstehende Uploads: ${stats.pendingUploads}\n` +
            `Backend konfiguriert: ${stats.backendConfigured ? 'Ja' : 'Nein'}`,
        noToken: "Fehler: Kein Forscher-Token vorhanden",
        downloadError: (error) => `Fehler: ${error}`,
    },
};

// 11. Restliche Konstanten (unchanged)
export const STATUS_CONFIGS = {
    loading: { cls: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500 animate-ping" },
    error: { cls: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
    default: { cls: "bg-slate-50 text-slate-600 border-slate-200", dot: "bg-green-500" }
};

export const MESSAGE_STYLES = {
    user: { label: "Deine Antwort", cls: "bg-blue-600 text-white rounded-tr-none" },
    partner: { label: "Partner", cls: "bg-white text-slate-800 border-slate-100 rounded-tl-none" },
    task: { label: "Aufgabe", cls: "bg-sky-50 text-sky-900 border-sky-100 rounded-tl-none" },
    feedback: { label: "Feedback", cls: "bg-indigo-50 text-indigo-900 border-indigo-100 rounded-tl-none" }
};

export const PROMPT_TEMPLATES = {
    simulation: {
        roleAdherence: "Verhalte dich konsequent gemäß deiner Rollenbeschreibung. Überlasse die Gesprächsführung und die Initiative dem Benutzer.",
        initialTopicGuidance: "Warte, bis der Benutzer das Thema des Gesprächs einführt, bevor du auf die Details deiner Rolle eingehst.",
        systemPrompt: (systemPrompt, partnerPrompt) => `${systemPrompt}\n\n${partnerPrompt}`
    },
    transformation: {
        userEvaluation: (statement, userVal) =>
            `Aufgabe: Formuliere die Aussage "${statement}" um.\n\nEingabe des Nutzers: "${userVal}"\n\nGib eine kurze, hilfreiche Rückmeldung (max. 2-3 Sätze) zu dieser spezifischen Umformulierung.`
    }
};

export const VOICE_KEYWORDS = {
    female: ["katja", "maren", "anna", "zira", "clara", "julia", "verena"],
    male: ["stefan", "conrad", "kasper", "killian", "hans", "michael"],
    highQuality: ["neural", "natural", "online", "premium", "enhanced"]
};

export const SPEECH_CONFIG = { LANG: "de-DE", VOLUME: 0.9 };
export const MENTOR_KEYWORDS = ["mentor", "feedback", "coach"];
export const SCENARIO_DEFAULTS = { ROLE_NAME: "Coach", SHORT_INSTRUCTION: "Bearbeite die Aussage.", COMMENT_PREFIX: "#" };
export const SCENARIO_FILE_KEYS = { INSTRUCTION_FILE: "instructionFile", SCENARIO_FILE: "scenarioFile", SOURCE_FILE: "sourceFile" };
export const DATA_LOGGER_CONFIG = {
    STORAGE_KEYS: { CONVERSATIONS: "dialogue_lab_conversations", FAILED_UPLOADS: "dialogue_lab_failed_uploads", RESEARCHER_TOKEN: "dialogue_lab_researcher_token" },
    DEFAULT: { autoUpload: false, retryFailedUploads: true, maxRetries: 3, retryDelay: 1000 }
};
export const CHAT_ROLES = { SYSTEM: "system", USER: "user", ASSISTANT: "assistant" };
export const AVATAR_CONFIG = {
    TRANSPARENT_PIXEL: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    LAYERS: ["body", "clothes", "hair", "glasses", "headset", "hands", "eyes", "mouth"]
};
export const AVATAR_ANIMATION = { MOUTH_INTERVAL: 150, BLINK_DURATION: 150, BLINK_INTERVAL_MIN: 2000, BLINK_INTERVAL_MAX: 6000 };