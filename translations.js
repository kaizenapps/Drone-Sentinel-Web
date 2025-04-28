/**
 * translations.js
 * Contains all translation data for the Drone Sentinel application
 */

// Translation data for multiple languages
const translations = {
    en: {
        // Header and main UI
        appTitle: "Drone Sentinel",
        appTitleFull: "Drone Sentinel System",
        appDescription: "Real-time sound detection for security monitoring",
        dashboard: "Sound Detection Dashboard",
        aboutDroneSentinel: "About Drone Sentinel",
        soundDetectionDashboard: "Sound Detection Dashboard",
        soundDetectionMeter: "Sound Detection Meter",
        
        // Status messages
        waiting: "Waiting...",
        listening: "Listening...",
        possibleDrone: "Possible FPV Drone",
        droneDetected: "FPV Drone detected!",
        initializing: "Initializing...",
        loading: "Loading...",
        waitingForSounds: "Waiting for sounds...",
        initializingSoundDetection: "Initializing sound detection...",
        
        // Control buttons and labels
        startDetection: "Start Detection",
        stopDetection: "Stop Detection",
        detectionSensitivity: "Detection Sensitivity:",
        confidenceThreshold: "Confidence Threshold",
        testMode: "Test Mode",
        moreDetections: "More Detections",
        higherAccuracy: "Higher Accuracy",
        test: "Test",
        testAlarm: "Test Alarm",
        alarmSound: "Alarm Sound",
        
        // System status
        systemStatus: "System Status",
        microphoneAccess: "Microphone Access",
        modelLoaded: "Model Loaded",
        browserSupport: "Browser Support",
        granted: "Granted",
        denied: "Denied",
        ready: "Ready",
        notReady: "Not Ready",
        supported: "Supported",
        notSupported: "Not Supported",
        microphone: "Microphone",
        model: "Model",
        detectionStatus: "Detection Status",
        monitoringFor: "Monitoring For",
        monitoringTargets: "Background Noise, FPV Drone",
        
        // Alarm related
        alarmSounds: "Alarm Sound",
        classicAlarm: "Classic Alarm",
        sirenAlarm: "Siren",
        buzzAlarm: "Buzzer",
        alarmTriggered: "DRONE DETECTED!",
        confidence: "Confidence",
        dismiss: "Dismiss",
        
        // About section
        aboutContent: "Drone Sentinel is an AI-powered sound detection system designed to identify FPV drones by their distinctive sound signature. Using TensorFlow.js, this web application analyzes audio in real-time to detect drone sounds with high accuracy.",
        systemUsage: "The system uses TensorFlow.js and a pre-trained model to detect drone sounds in your environment.",
        howItWorks: "How It Works",
        howToUse: "How To Use",
        howToUseStep1: "Allow microphone access when prompted by the browser",
        howToUseStep2: "Wait for the model to load",
        howToUseStep3: "Click the 'Start Detection' button to begin sound detection",
        howToUseStep4: "The system will display an alert when it detects FPV drone sounds",
        howToUseStep5: "Click 'Stop Detection' to pause detection",
        note: "Note:",
        microphoneAccessNote: "This system requires microphone access to function. If you deny access, you will need to enable it in your browser settings and reload the page.",
        privacyInfo: "Privacy Information",
        
        // Footer
        poweredBy: "Powered by",
        inCollaborationWith: "In collaboration with",
        copyright: "Drone Sentinel - AI-Powered Sound Detection System",
        
        // Technical
        browserNotSupported: "Your browser does not support the audio element.",
        
        // Banner
        workInProgress: "Work in progress, click",
        forSupport: "here for support"
    },
    uk: {
        // Header and main UI
        appTitle: "Дрон Вартовий",
        appTitleFull: "Система Дрон Вартовий",
        appDescription: "Виявлення звуку в реальному часі для моніторингу безпеки",
        dashboard: "Панель виявлення звуку",
        aboutDroneSentinel: "Про Дрон Вартовий",
        soundDetectionDashboard: "Панель виявлення звуку",
        soundDetectionMeter: "Вимірювач виявлення звуку",

        // Status messages
        waiting: "Очікування...",
        listening: "Прослуховування...",
        possibleDrone: "Можливий FPV дрон",
        droneDetected: "FPV дрон виявлено!",
        initializing: "Ініціалізація...",
        loading: "Завантаження...",
        waitingForSounds: "Очікування звуків...",
        initializingSoundDetection: "Ініціалізація виявлення звуку...",

        // Control buttons and labels
        startDetection: "Почати виявлення",
        stopDetection: "Зупинити виявлення",
        detectionSensitivity: "Чутливість виявлення:",
        confidenceThreshold: "Поріг впевненості",
        testMode: "Тестовий режим",
        moreDetections: "Більше виявлень",
        higherAccuracy: "Вища точність",
        test: "Тест",

        // System status
        systemStatus: "Стан системи",
        microphoneAccess: "Доступ до мікрофона",
        modelLoaded: "Модель завантажена",
        browserSupport: "Підтримка браузера",
        granted: "Надано",
        denied: "Відмовлено",
        ready: "Готово",
        notReady: "Не готово",
        supported: "Підтримується",
        notSupported: "Не підтримується",
        microphone: "Мікрофон",
        model: "Модель",
        detectionStatus: "Статус виявлення",
        monitoringFor: "Моніторинг для",
        monitoringTargets: "Фоновий шум, FPV дрон",

        // Alarm related
        alarmSounds: "Звук тривоги",
        classicAlarm: "Класична тривога",
        sirenAlarm: "Сирена",
        buzzAlarm: "Дзижчання",
        alarmTriggered: "ДРОН ВИЯВЛЕНО!",
        confidence: "Впевненість",
        dismiss: "Закрити",

        // About section
        aboutContent: "Дрон Вартовий - це система виявлення звуку з підтримкою ШІ, призначена для ідентифікації FPV дронів за їх характерним звуковим підписом.",
        systemUsage: "Система використовує TensorFlow.js і попередньо навчену модель для виявлення звуків дронів у вашому середовищі.",
        howItWorks: "Як це працює",
        howToUse: "Як користуватися",
        howToUseStep1: "Дозвольте доступ до мікрофона, коли браузер запитає",
        howToUseStep2: "Зачекайте, поки модель завантажиться",
        howToUseStep3: "Натисніть кнопку 'Почати виявлення', щоб почати виявлення звуку",
        howToUseStep4: "Система відобразить сповіщення, коли виявить звуки FPV дрона",
        howToUseStep5: "Натисніть 'Зупинити виявлення', щоб призупинити виявлення",
        note: "Примітка:",
        microphoneAccessNote: "Ця система потребує доступу до мікрофона для функціонування. Якщо ви відмовите у доступі, вам потрібно буде включити його в налаштуваннях браузера та перезавантажити сторінку.",
        privacyInfo: "Інформація про конфіденційність",

        // Footer
        poweredBy: "Розроблено",
        inCollaborationWith: "У співпраці з",
        copyright: "Дрон Вартовий - Система виявлення звуку на базі ШІ",

        // Technical
        browserNotSupported: "Ваш браузер не підтримує аудіо елемент.",

        // Banner
        workInProgress: "В розробці, натисніть",
        forSupport: "тут для підтримки"
    },
    lv: {
        // Header and main UI
        appTitle: "Drona Sargs",
        appTitleFull: "Drona Sarga Sistēma",
        appDescription: "Reāllaika skaņas noteikšana drošības uzraudzībai",
        dashboard: "Skaņas noteikšanas panelis",
        aboutDroneSentinel: "Par Drona Sargu",
        soundDetectionDashboard: "Skaņas noteikšanas panelis",
        soundDetectionMeter: "Skaņas noteikšanas mērītājs",
        
        // Status messages
        waiting: "Gaida...",
        listening: "Klausās...",
        possibleDrone: "Iespējams FPV drons",
        droneDetected: "FPV drons noteikts!",
        initializing: "Inicializē...",
        loading: "Ielādē...",
        waitingForSounds: "Gaida skaņas...",
        initializingSoundDetection: "Inicializē skaņas noteikšanu...",
        
        // Control buttons and labels
        startDetection: "Sākt noteikšanu",
        stopDetection: "Apturēt noteikšanu",
        detectionSensitivity: "Noteikšanas jutīgums:",
        confidenceThreshold: "Ticamības slieksnis",
        testMode: "Testa režīms",
        moreDetections: "Vairāk noteikšanas",
        higherAccuracy: "Augstāka precizitāte",
        test: "Tests",
        testAlarm: "Pārbaudīt trauksmi",
        alarmSound: "Trauksmes skaņa",
        
        // System status
        systemStatus: "Sistēmas statuss",
        microphoneAccess: "Mikrofona piekļuve",
        modelLoaded: "Modelis ielādēts",
        browserSupport: "Pārlūka atbalsts",
        granted: "Piešķirts",
        denied: "Liegts",
        ready: "Gatavs",
        notReady: "Nav gatavs",
        supported: "Atbalstīts",
        notSupported: "Nav atbalstīts",
        microphone: "Mikrofons",
        model: "Modelis",
        detectionStatus: "Noteikšanas statuss",
        monitoringFor: "Uzrauga",
        monitoringTargets: "Fona troksnis, FPV drons",
        
        // Alarm related
        alarmSounds: "Trauksmes skaņa",
        classicAlarm: "Klasiskā trauksme",
        sirenAlarm: "Sirēna",
        buzzAlarm: "Dūciens",
        alarmTriggered: "DRONS NOTEIKTS!",
        confidence: "Ticamība",
        dismiss: "Aizvērt",
        
        // About section
        aboutContent: "Drona Sargs ir uz mākslīgo intelektu balstīta skaņas noteikšanas sistēma, kas izstrādāta, lai identificētu FPV dronus pēc to raksturīgā skaņas paraksta. Izmantojot TensorFlow.js, šī tīmekļa lietojumprogramma analizē audio reāllaikā, lai ar augstu precizitāti noteiktu dronu skaņas.",
        systemUsage: "Sistēma izmanto TensorFlow.js un iepriekš apmācītu modeli, lai noteiktu dronu skaņas jūsu vidē.",
        howItWorks: "Kā tas darbojas",
        howToUse: "Kā lietot",
        howToUseStep1: "Atļaujiet mikrofona piekļuvi, kad pārlūks to pieprasa",
        howToUseStep2: "Pagaidiet, kamēr modelis ielādējas",
        howToUseStep3: "Noklikšķiniet uz pogas 'Sākt noteikšanu', lai sāktu skaņas noteikšanu",
        howToUseStep4: "Sistēma parādīs brīdinājumu, kad tā noteiks FPV drona skaņas",
        howToUseStep5: "Noklikšķiniet uz 'Apturēt noteikšanu', lai pauzētu noteikšanu",
        note: "Piezīme:",
        microphoneAccessNote: "Šai sistēmai ir nepieciešama mikrofona piekļuve, lai darbotos. Ja jūs noraidāt piekļuvi, jums to būs jāiespējo pārlūka iestatījumos un jāpārlādē lapa.",
        privacyInfo: "Privātuma informācija",
        
        // Footer
        poweredBy: "Darbina",
        inCollaborationWith: "Sadarbībā ar",
        copyright: "Drona Sargs - Uz MI balstīta skaņas noteikšanas sistēma",
        
        // Technical
        browserNotSupported: "Jūsu pārlūks neatbalsta audio elementu.",
        
        // Banner
        workInProgress: "Darbs procesā, noklikšķiniet",
        forSupport: "šeit atbalstam"
    }
};
