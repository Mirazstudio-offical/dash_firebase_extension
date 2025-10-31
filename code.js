/* eslint-disable */
// [НАЧАLO КОДА]
class UltimateFirebaseExtension {
    constructor(runtime) {
        this.runtime = runtime;
        this.firebase = null;
        this.auth = null;
        this.db = null;
        this.firestore = null;
        this.storage = null;
        this.functions = null;
        this.analytics = null;
        this.remoteConfig = null;
        this.performance = null; // [НОВОЕ] Для Performance
        this.currentUser = null;
        this.phoneConfirmationResult = null;
        this.mfaResolver = null;
        this.persistenceType = 'local';
        this.lastErrorMessage = '';
        this.lastReceivedData = ''; // Для RTDB
        this.lastFirestoreData = ''; // Для слушателей Firestore
        this.lastFirestoreQueryResult = ''; // Для запросов Firestore
        this.lastRtdbQueryResult = ''; // [НОВОЕ] Для запросов RTDB
        this.lastFunctionResult = '';

        this.dbListeners = new Map();
        this.firestoreListeners = new Map();
        this.traces = new Map(); // [НОВОЕ] Для Performance

        this.runtime.on('PROJECT_STOP_ALL', () => {
            if (this.db) { this.dbListeners.forEach((listener, path) => this.db.ref(path).off('value', listener)); }
            this.dbListeners.clear();
            
            if (this.firestore) { this.firestoreListeners.forEach(unsubscribe => unsubscribe()); }
            this.firestoreListeners.clear();

            this.traces.clear(); // [НОВОЕ] Очищаем трассировки
            this.mfaResolver = null;
            this.phoneConfirmationResult = null;
        });
    }

    _setupRecaptchaContainer() { if (document.getElementById('recaptcha-container')) return; const c = document.createElement('div'); c.id = 'recaptcha-container'; document.body.appendChild(c);
    }

    getInfo() {
        return {
            id: 'ultimateFirebase',
            name: 'FirebaseAPI',
            color1: '#C0C0C0',
            blockIconURI: 'https://www.gstatic.com/mobilesdk/240501_mobilesdk/firebase_64dp.png', 
            blocks: [
                { opcode: 'loadAndConfigure', blockType: Scratch.BlockType.COMMAND, text: 'Подключить Firebase: URL [DB_URL] API ключ [API_KEY] ID проекта [PROJECT_ID]', arguments: { DB_URL: { type: Scratch.ArgumentType.STRING, defaultValue: 'https://project-id.firebaseio.com' }, API_KEY: { type: Scratch.ArgumentType.STRING, defaultValue: 'AIzaSy...' }, PROJECT_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'your-project-id' }}},
                '---',
                { blockType: Scratch.BlockType.LABEL, text: 'Аутентификация и Профиль' },
                { opcode: 'setAuthPersistence', blockType: Scratch.BlockType.COMMAND, text: 'Сохранять вход [PERSISTENCE_TYPE]', arguments: { PERSISTENCE_TYPE: { type: Scratch.ArgumentType.STRING, menu: 'persistenceOptions' }}},
                { opcode: 'signUp', blockType: Scratch.BlockType.COMMAND, text: 'Зарегистрировать email [EMAIL] пароль [PASSWORD]', arguments: { EMAIL: { type: Scratch.ArgumentType.STRING }, PASSWORD: { type: Scratch.ArgumentType.STRING, inputType: Scratch.ArgumentType.PASSWORD }}},
                { opcode: 'signIn', blockType: Scratch.BlockType.COMMAND, text: 'Войти как email [EMAIL] пароль [PASSWORD]', arguments: { EMAIL: { type: Scratch.ArgumentType.STRING }, PASSWORD: { type: Scratch.ArgumentType.STRING, inputType: Scratch.ArgumentType.PASSWORD }}},
                { opcode: 'signInWithProvider', blockType: Scratch.BlockType.COMMAND, text: 'Войти с помощью [PROVIDER]', arguments: { PROVIDER: { type: Scratch.ArgumentType.STRING, menu: 'providers' }}},
                { opcode: 'signInWithToken', blockType: Scratch.BlockType.COMMAND, text: 'Войти по токену [TOKEN]', arguments: { TOKEN: { type: Scratch.ArgumentType.STRING, defaultValue: 'eyJhbGciOi...' }}},
                { opcode: 'signOut', blockType: Scratch.BlockType.COMMAND, text: 'Выйти из аккаунта'},
                { opcode: 'getCurrentUser', blockType: Scratch.BlockType.REPORTER, text: 'Данные текущего пользователя [FIELD]', arguments: { FIELD: { type: Scratch.ArgumentType.STRING, menu: 'userFields' } } },
                { opcode: 'getCurrentUserIDToken', blockType: Scratch.BlockType.REPORTER, text: 'ID токен текущего пользователя'},
                { opcode: 'isUserLoggedIn', blockType: Scratch.BlockType.BOOLEAN, text: 'Пользователь вошел в систему?' },
                { opcode: 'updateUserProfile', blockType: Scratch.BlockType.COMMAND, text: 'Обновить профиль: имя [NAME] URL фото [PHOTO_URL]', arguments: { NAME: { type: Scratch.ArgumentType.STRING }, PHOTO_URL: { type: Scratch.ArgumentType.STRING }}},
                { opcode: 'updateUserPassword', blockType: Scratch.BlockType.COMMAND, text: 'Изменить пароль на [NEW_PASSWORD]', arguments: { NEW_PASSWORD: { type: Scratch.ArgumentType.STRING, inputType: Scratch.ArgumentType.PASSWORD }}},
                
                // [НОВЫЕ] Блоки управления аккаунтом
                { opcode: 'reauthenticateUser', blockType: Scratch.BlockType.COMMAND, text: 'Подтвердить пароль [PASSWORD] для безопасной операции', arguments: { PASSWORD: { type: Scratch.ArgumentType.STRING, inputType: Scratch.ArgumentType.PASSWORD }}},
                { opcode: 'deleteUser', blockType: Scratch.BlockType.COMMAND, text: 'Удалить аккаунт текущего пользователя' },

                '---',
                { blockType: Scratch.BlockType.LABEL, text: 'Управление Email и Телефоном' },
                { opcode: 'sendVerificationEmail', blockType: Scratch.BlockType.COMMAND, text: 'отправить письмо для верификации почты' },
                { opcode: 'sendPasswordReset', blockType: Scratch.BlockType.COMMAND, text: 'отправить письмо для сброса пароля на email [EMAIL]', arguments: { EMAIL: { type: Scratch.ArgumentType.STRING }}},
                { opcode: 'updateUserEmail', blockType: Scratch.BlockType.COMMAND, text: 'изменить email текущего пользователя на [NEW_EMAIL]', arguments: { NEW_EMAIL: { type: Scratch.ArgumentType.STRING }}},
                { opcode: 'sendVerificationCode', blockType: Scratch.BlockType.COMMAND, text: 'Отправить код на телефон [PHONE_NUMBER]', arguments: { PHONE_NUMBER: { type: Scratch.ArgumentType.STRING, defaultValue: '+12345678900' }}},
                { opcode: 'signInWithPhoneCode', blockType: Scratch.BlockType.COMMAND, text: 'Войти с помощью кода [CODE]', arguments: { CODE: { type: Scratch.ArgumentType.STRING }}},
                '---',
                { blockType: Scratch.BlockType.LABEL, text: 'Двухфакторная Аутентификация (MFA)' },
                { opcode: 'enrollMfa', blockType: Scratch.BlockType.COMMAND, text: 'Подключить 2FA для телефона [PHONE_NUMBER]', arguments: { PHONE_NUMBER: { type: Scratch.ArgumentType.STRING, defaultValue: '+12345678900' }}},
                { opcode: 'whenMfaRequired', blockType: Scratch.BlockType.HAT, text: 'Когда требуется второй фактор (2FA)', isEdgeActivated: false },
                { opcode: 'getMfaHint', blockType: Scratch.BlockType.REPORTER, text: 'Подсказка для второго фактора' },
                { opcode: 'completeSignInWithMfaCode', blockType: Scratch.BlockType.COMMAND, text: 'Завершить вход с 2FA кодом [CODE]', arguments: { CODE: { type: Scratch.ArgumentType.STRING }}},
                '---',
                { blockType: Scratch.BlockType.LABEL, text: '🗂️ Cloud Firestore (Документы)' },
                { opcode: 'firestoreAddDoc', blockType: Scratch.BlockType.REPORTER, text: 'добавить документ [DATA] в коллекцию [PATH]', arguments: { DATA: { type: Scratch.ArgumentType.STRING, defaultValue: '{"name":"Alex", "score":100}' }, PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'players' }}},
                { opcode: 'firestoreSetDoc', blockType: Scratch.BlockType.COMMAND, text: 'задать документ [DATA] по пути [PATH]', arguments: { DATA: { type: Scratch.ArgumentType.STRING, defaultValue: '{"level":5}' }, PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'players/some-id' }}},
                { opcode: 'firestoreGetDoc', blockType: Scratch.BlockType.REPORTER, text: 'прочитать документ по пути [PATH]', arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'players/some-id' }}},
                { opcode: 'firestoreDeleteDoc', blockType: Scratch.BlockType.COMMAND, text: 'удалить документ по пути [PATH]', arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'players/some-id' }}},

                '---',
                { blockType: Scratch.BlockType.LABEL, text: '🗂️ Firestore (Запросы и Слушатели)' },
                // [ИЗМЕНЕНО] Блок запроса стал мощнее
                { opcode: 'firestoreQuery', blockType: Scratch.BlockType.COMMAND, text: 'Найти в [PATH] где [FIELD] [OP] [VALUE] сортировать [SORT_BY] [SORT_DIR] лимит [LIMIT]', arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'players' }, FIELD: { type: Scratch.ArgumentType.STRING, defaultValue: 'score' }, OP: { type: Scratch.ArgumentType.STRING, menu: 'firestoreOps' }, VALUE: { type: Scratch.ArgumentType.STRING, defaultValue: '100' }, SORT_BY: { type: Scratch.ArgumentType.STRING, defaultValue: 'score' }, SORT_DIR: { type: Scratch.ArgumentType.STRING, menu: 'sortDir' }, LIMIT: { type: Scratch.ArgumentType.NUMBER } }},
                { opcode: 'onFirestoreQuery', blockType: Scratch.BlockType.HAT, text: 'Когда запрос Firestore выполнен' },
                { opcode: 'getFirestoreQueryResult', blockType: Scratch.BlockType.REPORTER, text: 'результат запроса Firestore' },
                { opcode: 'listenForDoc', blockType: Scratch.BlockType.HAT, text: 'Когда документ [PATH] изменяется', isEdgeActivated: false, arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'players/player1' }}},
                { opcode: 'listenForCollection', blockType: Scratch.BlockType.HAT, text: 'Когда коллекция [PATH] изменяется', isEdgeActivated: false, arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'chat' }}},
                { opcode: 'getLastFirestoreData', blockType: Scratch.BlockType.REPORTER, text: 'последние данные из Firestore' },
                { opcode: 'firestoreStopAllListeners', blockType: Scratch.BlockType.COMMAND, text: 'остановить всех слушателей Firestore' },
                
                '---',
                { blockType: Scratch.BlockType.LABEL, text: '☁️ Cloud Storage' },
                { opcode: 'storageUploadText', blockType: Scratch.BlockType.COMMAND, text: 'загрузить текст [TEXT_DATA] в файл по пути [PATH]', arguments: { TEXT_DATA: { type: Scratch.ArgumentType.STRING, defaultValue: 'Hello World!' }, PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'saves/save1.txt' }}},
                // [НОВЫЙ БЛОК] Загрузка Data URL
                { opcode: 'storageUploadDataURL', blockType: Scratch.BlockType.COMMAND, text: 'Загрузить Data URL [DATA_URL] как файл [PATH]', arguments: { DATA_URL: { type: Scratch.ArgumentType.STRING, defaultValue: 'data:image/png;base64,iVBORw0KG...' }, PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'images/myAvatar.png' }}},
                { opcode: 'storageGetURL', blockType: Scratch.BlockType.REPORTER, text: 'получить URL для скачивания файла [PATH]', arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'images/logo.png' }}},
                { opcode: 'storageDeleteFile', blockType: Scratch.BlockType.COMMAND, text: 'удалить файл по пути [PATH]', arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'saves/old_save.txt' }}},
                
                '---',
                { blockType: Scratch.BlockType.LABEL, text: '📊 Analytics' },
                { opcode: 'analyticsLogEvent', blockType: Scratch.BlockType.COMMAND, text: 'Записать событие [NAME] с данными [DATA]', arguments: { NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'level_complete' }, DATA: { type: Scratch.ArgumentType.STRING, defaultValue: '{"level_name":"Level 1", "score": 100}' }}},
                { opcode: 'analyticsSetUserProperty', blockType: Scratch.BlockType.COMMAND, text: 'Установить свойство пользователя [KEY] в [VALUE]', arguments: { KEY: { type: Scratch.ArgumentType.STRING, defaultValue: 'favorite_character' }, VALUE: { type: Scratch.ArgumentType.STRING, defaultValue: 'wizard' }}},
                
                // [НОВЫЕ] Блоки Performance
                '---',
                { blockType: Scratch.BlockType.LABEL, text: '⏱️ Мониторинг Производительности' },
                { opcode: 'perfStartTrace', blockType: Scratch.BlockType.COMMAND, text: 'Начать отслеживание [TRACE_NAME]', arguments: { TRACE_NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'load_level_1' }}},
                { opcode: 'perfStopTrace', blockType: Scratch.BlockType.COMMAND, text: 'Остановить отслеживание [TRACE_NAME]', arguments: { TRACE_NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'load_level_1' }}},

                '---',
                { blockType: Scratch.BlockType.LABEL, text: '⚙️ Remote Config' },
                { opcode: 'remoteConfigSetDefaults', blockType: Scratch.BlockType.COMMAND, text: 'Задать настройки по умолчанию [DEFAULTS]', arguments: { DEFAULTS: { type: Scratch.ArgumentType.STRING, defaultValue: '{"welcome_message":"Hello", "difficulty": 1}' }}},
                { opcode: 'remoteConfigFetch', blockType: Scratch.BlockType.COMMAND, text: 'Получить и активировать настройки с сервера' },
                { opcode: 'onRemoteConfigFetched', blockType: Scratch.BlockType.HAT, text: 'Когда настройки с сервера получены' },
                { opcode: 'remoteConfigGetValue', blockType: Scratch.BlockType.REPORTER, text: 'Получить настройку [KEY]', arguments: { KEY: { type: Scratch.ArgumentType.STRING, defaultValue: 'welcome_message' }}},

                '---',
                { blockType: Scratch.BlockType.LABEL, text: '🚀 Cloud Functions (Callable)' },
                { opcode: 'functionsCall', blockType: Scratch.BlockType.COMMAND, text: 'вызвать облачную функцию [NAME] с данными [DATA]', arguments: { NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'processPayment' }, DATA: { type: Scratch.ArgumentType.STRING, defaultValue: '{"amount":100, "currency":"USD"}' }}},
                { opcode: 'onFunctionResult', blockType: Scratch.BlockType.HAT, text: 'когда облачная функция вернула ответ'},
                { opcode: 'getFunctionResult', blockType: Scratch.BlockType.REPORTER, text: 'последний ответ от функции' },
                '---',
                { blockType: Scratch.BlockType.LABEL, text: '🌐 HTTPS Функции' },
                { opcode: 'httpsCallGet', blockType: Scratch.BlockType.COMMAND, text: 'HTTPS GET запрос на эндпоинт [ENDPOINT]', arguments: { ENDPOINT: { type: Scratch.ArgumentType.STRING, defaultValue: 'helloWorld' } } },
                { opcode: 'httpsCallPost', blockType: Scratch.BlockType.COMMAND, text: 'HTTPS POST запрос на эндпоинт [ENDPOINT] с данными [DATA]', arguments: { ENDPOINT: { type: Scratch.ArgumentType.STRING, defaultValue: 'processData' }, DATA: { type: Scratch.ArgumentType.STRING, defaultValue: '{"key":"value"}' } } },
                '---',
                { blockType: Scratch.BlockType.LABEL, text: 'База данных в реальном времени (старая)' },
                { opcode: 'writeData', blockType: Scratch.BlockType.COMMAND, text: 'Записать по пути [PATH] значение [VALUE]', arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'users/player1' }, VALUE: { type: Scratch.ArgumentType.STRING, defaultValue: '{"score": 100}' }}},
                { opcode: 'rtdbAtomicAdd', blockType: Scratch.BlockType.COMMAND, text: 'Безопасно прибавить к [PATH] число [VALUE]', arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'users/player1/score' }, VALUE: { type: Scratch.ArgumentType.NUMBER, defaultValue: 10 }}},
                { opcode: 'deleteData', blockType: Scratch.BlockType.COMMAND, text: 'Удалить данные по пути [PATH]', arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'users/player1/temp' }}},
                { opcode: 'setOnDisconnect', blockType: Scratch.BlockType.COMMAND, text: 'При отключении установить по пути [PATH] значение [VALUE]', arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'users/player1/online' }, VALUE: { type: Scratch.ArgumentType.STRING, defaultValue: 'false' }}},
                { opcode: 'removeOnDisconnect', blockType: Scratch.BlockType.COMMAND, text: 'При отключении удалить путь [PATH]', arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'users/player1/temp_presence' }}},
                { opcode: 'cancelOnDisconnect', blockType: Scratch.BlockType.COMMAND, text: 'Отменить команду при отключении для пути [PATH]', arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'users/player1/online' }}},
                { opcode: 'readData', blockType: Scratch.BlockType.REPORTER, text: 'прочитать данные по пути [PATH]', arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'users/player1/score' }}},
                { opcode: 'listenForData', blockType: Scratch.BlockType.HAT, text: 'Когда данные по пути [PATH] изменяются', isEdgeActivated: false, arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'chats/main' }}},
                { opcode: 'getLastReceivedData', blockType: Scratch.BlockType.REPORTER, text: 'Последние полученные данные (RTDB)'},
                
                // [НОВЫЕ] Блоки запросов RTDB
                '---',
                { blockType: Scratch.BlockType.LABEL, text: 'RTDB (Запросы для списков лидеров)' },
                { opcode: 'rtdbQuery', blockType: Scratch.BlockType.COMMAND, text: 'Найти в RTDB [PATH] сортировать по [SORT_BY] взять [LIMIT_TYPE] [LIMIT] шт', arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'scores' }, SORT_BY: { type: Scratch.ArgumentType.STRING, defaultValue: 'score' }, LIMIT_TYPE: { type: Scratch.ArgumentType.STRING, menu: 'limitType' }, LIMIT: { type: Scratch.ArgumentType.NUMBER, defaultValue: 10 } }},
                { opcode: 'onRtdbQuery', blockType: Scratch.BlockType.HAT, text: 'Когда запрос RTDB выполнен' },
                { opcode: 'getRtdbQueryResult', blockType: Scratch.BlockType.REPORTER, text: 'результат запроса RTDB' },
                
                '---',
                { blockType: Scratch.BlockType.LABEL, text: 'Обработка Ошибок' },
                { opcode: 'onAuthError', blockType: Scratch.BlockType.HAT, text: 'Когда произошла ошибка аутентификации'},
                { opcode: 'onDbError', blockType: Scratch.BlockType.HAT, text: 'Когда произошла ошибка базы данных'},
                { opcode: 'getLastError', blockType: Scratch.BlockType.REPORTER, text: 'последняя ошибка' },
                { opcode: 'clearLastError', blockType: Scratch.BlockType.COMMAND, text: 'очистить последнюю ошибку'},
            ],
            menus: {
                persistenceOptions: { acceptReporters: true, items: ['Навсегда (по умолчанию)', 'На одну сессию'] },
                providers: { acceptReporters: true, items: ['Google', 'Microsoft', 'GitHub', 'Apple', 'Anonymous'] },
                userFields: { acceptReporters: true, items: ['Email', 'UID', 'Display Name', 'Phone Number', 'Photo URL', 'Почта подтверждена?'] },
                firestoreOps: { acceptReporters: true, items: ['==', '!=', '<', '<=', '>', '>=', 'array-contains'] },
                // [НОВЫЕ] Меню
                sortDir: { acceptReporters: true, items: ['по убыванию', 'по возрастанию'] },
                limitType: { acceptReporters: true, items: ['первые', 'последние'] }
            }
        };
    }
    
    _handleError(error, type) { 
        console.error(`Firebase Error (${type}):`, error); 
        this.lastErrorMessage = error.message; 
        switch(type) { 
            case 'auth': this.runtime.startHats('ultimateFirebase_onAuthError'); break; 
            case 'db': this.runtime.startHats('ultimateFirebase_onDbError'); break; 
            case 'mfa': this.runtime.startHats('ultimateFirebase_onMfaError'); break; 
            case 'firestore': 
            case 'storage': 
            case 'functions': 
            case 'analytics':
            case 'remoteConfig':
            case 'performance': // [НОВОЕ]
                this.runtime.startHats('ultimateFirebase_onDbError');
                break; 
        } 
    }

    _isReady(service) { if (!this.firebase) { this._handleError({ message: 'Firebase не инициализирован!' }, 'auth'); return false; } if (service && !this[service]) { this._handleError({ message: `Сервис ${service} не доступен.` }, 'auth'); return false; } return true; }
    _parseValue(value) { try { return JSON.parse(value); } catch (e) { return value; } }
    
    loadAndConfigure(args) { 
        this._setupRecaptchaContainer(); 
        const firebaseConfig = { 
            apiKey: args.API_KEY, 
            authDomain: `${args.PROJECT_ID}.firebaseapp.com`, 
            projectId: args.PROJECT_ID, 
            databaseURL: args.DB_URL, 
            storageBucket: `${args.PROJECT_ID}.appspot.com`,
            appId: `1:${args.PROJECT_ID}:web:`, 
            measurementId: `G-`
        }; 

        const loadScript = src => new Promise((resolve, reject) => { 
            if (document.querySelector(`script[src="${src}"]`)) return resolve(); 
            const s = document.createElement('script'); 
            s.src = src; 
            s.onload = resolve; 
            s.onerror = () => reject(`Ошибка загрузки скрипта: ${src}`); 
            document.head.appendChild(s); 
        }); 
        
        // [ИЗМЕНЕНО] Добавлена загрузка Performance
        return Promise.all([ 
            loadScript("https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"), 
            loadScript("https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"), 
            loadScript("https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js"), 
            loadScript("https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js"), 
            loadScript("https://www.gstatic.com/firebasejs/8.10.1/firebase-storage.js"), 
            loadScript("https://www.gstatic.com/firebasejs/8.10.1/firebase-functions.js"),
            loadScript("https://www.gstatic.com/firebasejs/8.10.1/firebase-analytics.js"), 
            loadScript("https://www.gstatic.com/firebasejs/8.10.1/firebase-remote-config.js"),
            loadScript("https://www.gstatic.com/firebasejs/8.10.1/firebase-performance.js") // [НОВОЕ]
        ]).then(() => { 
            if (!window.firebase.apps.length) { 
                this.firebase = window.firebase.initializeApp(firebaseConfig); 
            } else { 
                this.firebase = window.firebase.app(); 
            } 
            this.auth = firebase.auth(); 
            this.db = firebase.database(); 
            this.firestore = firebase.firestore(); 
            this.storage = firebase.storage(); 
            this.functions = firebase.functions(); 
            this.analytics = firebase.analytics();
            this.remoteConfig = firebase.remoteConfig();
            this.performance = firebase.performance(); // [НОВОЕ]
            
            this.remoteConfig.settings = {
                minimumFetchIntervalMillis: 3600000,
                fetchTimeoutMillis: 60000 
            };
            this.remoteConfig.defaultConfig = {};

            this.auth.onAuthStateChanged(user => { this.currentUser = user; }); 
            console.log("Firebase Full Suite SDK загружен и настроен."); 
            try { 
                window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', { 'size': 'invisible' }); 
            } catch (e) { 
                console.warn("Recaptcha Verifier не удалось инициализировать. Вход по телефону может не работать."); 
            } 
        }).catch(error => { this._handleError(error, 'auth'); }); 
    }
    
    onAuthError() { return false; }
    onDbError() { return false; }
    onMfaError() { return false; }
    getLastError() { return this.lastErrorMessage; }
    clearLastError() { this.lastErrorMessage = ''; }
    
    // --- Аутентификация ---
    setAuthPersistence(args) { if (!this._isReady('auth')) return; this.persistenceType = (args.PERSISTENCE_TYPE === 'Навсегда (по умолчанию)') ? 'local' : 'session'; }
    _getPersistence() { return this.persistenceType === 'local' ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION; }
    
    signUp(args) { if (!this._isReady('auth')) return; return this.auth.setPersistence(this._getPersistence()).then(() => this.auth.createUserWithEmailAndPassword(args.EMAIL, args.PASSWORD)).catch(error => this._handleError(error, 'auth')); }
    signIn(args) { if (!this._isReady('auth')) return; return this.auth.setPersistence(this._getPersistence()).then(() => this.auth.signInWithEmailAndPassword(args.EMAIL, args.PASSWORD)).catch(error => { if (error.code === 'auth/multi-factor-required') { this.mfaResolver = error.resolver; this.runtime.startHats('ultimateFirebase_whenMfaRequired'); } else { this._handleError(error, 'auth'); } }); }
    signInWithProvider(args) { if (!this._isReady('auth')) return; return this.auth.setPersistence(this._getPersistence()).then(() => { if (args.PROVIDER === 'Anonymous') { return this.auth.signInAnonymously(); } let p; switch (args.PROVIDER) { case 'Google': p = new firebase.auth.GoogleAuthProvider(); break; case 'Microsoft': p = new firebase.auth.OAuthProvider('microsoft.com'); break; case 'GitHub': p = new firebase.auth.GithubAuthProvider(); break; case 'Apple': p = new firebase.auth.OAuthProvider('apple.com'); break; default: return Promise.reject("Неизвестный провайдер"); } return this.auth.signInWithPopup(p); }).catch(error => this._handleError(error, 'auth')); }
    signInWithToken(args) { if (!this._isReady('auth')) return; return this.auth.setPersistence(this._getPersistence()).then(() => this.auth.signInWithCustomToken(args.TOKEN)).catch(error => this._handleError(error, 'auth')); }
    signOut() { if (!this._isReady('auth')) return; return this.auth.signOut(); }
    isUserLoggedIn() { return !!this.currentUser; }
    getCurrentUser(args) { if (!this.currentUser) return ''; switch(args.FIELD) { case 'Email': return this.currentUser.email; case 'UID': return this.currentUser.uid; case 'Display Name': return this.currentUser.displayName; case 'Phone Number': return this.currentUser.phoneNumber; case 'Photo URL': return this.currentUser.photoURL; case 'Почта подтверждена?': return this.currentUser.emailVerified; default: return ''; } }
    getCurrentUserIDToken() { if (!this.currentUser) return Promise.resolve(''); return this.currentUser.getIdToken(true).catch(e => { this._handleError(e, 'auth'); return ''; }); }
    updateUserProfile(args) { if (!this.currentUser) return this._handleError({message:'Пользователь не вошел'},'auth'); return this.currentUser.updateProfile({ displayName: args.NAME, photoURL: args.PHOTO_URL }).catch(e => this._handleError(e, 'auth')); }
    updateUserPassword(args) { if (!this.currentUser) return this._handleError({message:'Пользователь не вошел'},'auth'); return this.currentUser.updatePassword(args.NEW_PASSWORD).catch(e => this._handleError(e, 'auth')); }
    sendVerificationEmail() { if (!this.currentUser) return this._handleError({message:'Пользователь не вошел'},'auth'); return this.currentUser.sendEmailVerification().catch(e => this._handleError(e, 'auth')); }
    sendPasswordReset(args) { if (!this._isReady('auth')) return; return this.auth.sendPasswordResetEmail(args.EMAIL).catch(e => this._handleError(e, 'auth')); }
    updateUserEmail(args) { if (!this.currentUser) return this._handleError({message:'Пользователь не вошел'},'auth'); return this.currentUser.updateEmail(args.NEW_EMAIL).catch(e => this._handleError(e, 'auth')); }
    
    // [НОВОЕ] --- Управление аккаунтом ---
    reauthenticateUser(args) {
        if (!this.currentUser) return this._handleError({message:'Пользователь не вошел'},'auth');
        const credential = firebase.auth.EmailAuthProvider.credential(this.currentUser.email, args.PASSWORD);
        return this.currentUser.reauthenticateWithCredential(credential)
            .catch(e => this._handleError(e, 'auth'));
    }
    
    deleteUser() {
        if (!this.currentUser) return this._handleError({message:'Пользователь не вошел'},'auth');
        return this.currentUser.delete()
            .then(() => { this.currentUser = null; })
            .catch(e => {
                if (e.code === 'auth/requires-recent-login') {
                    this._handleError({message: 'Требуется недавний вход! Сначала используйте блок "Подтвердить пароль".'}, 'auth');
                } else {
                    this._handleError(e, 'auth');
                }
            });
    }

    // --- Телефон и MFA ---
    sendVerificationCode(args) { if (!this._isReady('auth')) return; const appVerifier = window.recaptchaVerifier; return this.auth.signInWithPhoneNumber(args.PHONE_NUMBER, appVerifier).then(confirmationResult => { this.phoneConfirmationResult = confirmationResult; }).catch(error => this._handleError(error, 'auth')); }
    signInWithPhoneCode(args) { if (!this.phoneConfirmationResult) { this._handleError({ message: 'Сначала отправьте код подтверждения!' }, 'auth'); return; } return this.phoneConfirmationResult.confirm(args.CODE).catch(error => this._handleError(error, 'auth')); }
    enrollMfa(args) { if (!this.currentUser) { this._handleError({ message: 'Для подключения 2FA нужно войти в аккаунт.' }, 'mfa'); return; } const appVerifier = window.recaptchaVerifier; const phoneInfoOptions = { phoneNumber: args.PHONE_NUMBER, session: this.currentUser.multiFactor.session }; const phoneAuthProvider = new firebase.auth.PhoneAuthProvider(); return phoneAuthProvider.verifyPhoneNumber(phoneInfoOptions, appVerifier).then(verificationId => { const code = prompt('Введите код из СМС для подключения 2FA:'); if (!code) return; const assertion = firebase.auth.PhoneMultiFactorGenerator.assertion(verificationId, code); return this.currentUser.multiFactor.enroll(assertion, `My Phone`); }).catch(error => this._handleError(error, 'mfa')); }
    whenMfaRequired() { return false; }
    getMfaHint() { if (!this.mfaResolver) return ''; return this.mfaResolver.hints[0].displayName || this.mfaResolver.hints[0].phoneNumber; }
    completeSignInWithMfaCode(args) { if (!this.mfaResolver) return; const cred = firebase.auth.PhoneMultiFactorGenerator.assertion( this.mfaResolver.hints[0].verificationId, args.CODE ); return this.mfaResolver.resolveSignIn(cred).then(() => { this.mfaResolver = null; }).catch(error => this._handleError(error, 'mfa')); }
    
    // --- Firestore (Документы) ---
    firestoreAddDoc(args) { if (!this._isReady('firestore')) return Promise.resolve(''); return this.firestore.collection(args.PATH).add(this._parseValue(args.DATA)).then(docRef => docRef.id).catch(e => { this._handleError(e, 'firestore'); return ''; }); }
    firestoreSetDoc(args) { if (!this._isReady('firestore')) return; const docPath = args.PATH.split('/'); const docId = docPath.pop(); const colPath = docPath.join('/'); return this.firestore.collection(colPath).doc(docId).set(this._parseValue(args.DATA), { merge: true }).catch(e => this._handleError(e, 'firestore')); }
    firestoreGetDoc(args) { if (!this._isReady('firestore')) return Promise.resolve(''); return this.firestore.doc(args.PATH).get().then(doc => doc.exists ? JSON.stringify(doc.data()) : '').catch(e => { this._handleError(e, 'firestore'); return ''; }); }
    firestoreDeleteDoc(args) { if (!this._isReady('firestore')) return; return this.firestore.doc(args.PATH).delete().catch(e => this._handleError(e, 'firestore')); }
    
    // --- Firestore (Запросы и Слушатели) ---
    _formatFirestoreSnapshot(snapshot) {
        if (!snapshot.exists && !snapshot.docs) return '';
        if (snapshot.exists) { return JSON.stringify(snapshot.data()); }
        const docs = [];
        snapshot.forEach(doc => { docs.push({ id: doc.id, ...doc.data() }); });
        return JSON.stringify(docs);
    }
    
    // [ИЗМЕНЕНО] Функция запроса стала намного мощнее
    firestoreQuery(args) {
        if (!this._isReady('firestore')) return;
        
        let query = this.firestore.collection(args.PATH);
        
        // 1. Фильтр (WHERE)
        if (args.FIELD) {
            query = query.where(args.FIELD, args.OP, this._parseValue(args.VALUE));
        }
        
        // 2. Сортировка (ORDER BY)
        if (args.SORT_BY) {
            query = query.orderBy(args.SORT_BY, args.SORT_DIR === 'по убыванию' ? 'desc' : 'asc');
        }
        
        // 3. Лимит (LIMIT)
        if (args.LIMIT && Number(args.LIMIT) > 0) {
            query = query.limit(Number(args.LIMIT));
        }

        // Выполнение запроса
        return query.get()
            .then(querySnapshot => {
                this.lastFirestoreQueryResult = this._formatFirestoreSnapshot(querySnapshot);
                this.runtime.startHats('ultimateFirebase_onFirestoreQuery');
            })
            .catch(e => this._handleError(e, 'firestore'));
    }
    onFirestoreQuery() { return false; }
    getFirestoreQueryResult() { return this.lastFirestoreQueryResult; }

    listenForDoc(args) {
        if (!this._isReady('firestore')) return false;
        const path = args.PATH;
        if (this.firestoreListeners.has(path)) { this.firestoreListeners.get(path)(); }
        const unsubscribe = this.firestore.doc(path).onSnapshot(doc => {
            this.lastFirestoreData = this._formatFirestoreSnapshot(doc);
            this.runtime.startHats('ultimateFirebase_listenForDoc', { PATH: path });
        }, error => this._handleError(error, 'firestore'));
        this.firestoreListeners.set(path, unsubscribe);
        return false;
    }
    listenForCollection(args) {
        if (!this._isReady('firestore')) return false;
        const path = args.PATH;
        if (this.firestoreListeners.has(path)) { this.firestoreListeners.get(path)(); }
        const unsubscribe = this.firestore.collection(path).onSnapshot(querySnapshot => {
            this.lastFirestoreData = this._formatFirestoreSnapshot(querySnapshot);
            this.runtime.startHats('ultimateFirebase_listenForCollection', { PATH: path });
        }, error => this._handleError(error, 'firestore'));
        this.firestoreListeners.set(path, unsubscribe);
        return false;
    }
    getLastFirestoreData() { return this.lastFirestoreData; }
    firestoreStopAllListeners() { this.firestoreListeners.forEach(unsubscribe => unsubscribe()); this.firestoreListeners.clear(); console.log('Все слушатели Firestore остановлены.'); }
    
    // --- Cloud Storage ---
    storageUploadText(args) { if (!this._isReady('storage')) return; return this.storage.ref(args.PATH).putString(args.TEXT_DATA).catch(e => this._handleError(e, 'storage')); }
    
    // [НОВОЕ] --- Загрузка Data URL ---
    storageUploadDataURL(args) {
        if (!this._isReady('storage')) return;
        // Используем 'data_url' формат для putString
        return this.storage.ref(args.PATH).putString(args.DATA_URL, 'data_url')
            .catch(e => this._handleError(e, 'storage'));
    }

    storageGetURL(args) { if (!this._isReady('storage')) return Promise.resolve(''); return this.storage.ref(args.PATH).getDownloadURL().catch(e => { this._handleError(e, 'storage'); return ''; }); }
    storageDeleteFile(args) { if (!this._isReady('storage')) return; return this.storage.ref(args.PATH).delete().catch(e => this._handleError(e, 'storage')); }
    
    // --- Analytics ---
    analyticsLogEvent(args) { if (!this._isReady('analytics')) return; try { const data = this._parseValue(args.DATA); this.analytics.logEvent(args.NAME, data); } catch (e) { this._handleError(e, 'analytics'); } }
    analyticsSetUserProperty(args) { if (!this._isReady('analytics')) return; try { this.analytics.setUserProperties({ [args.KEY]: args.VALUE }); } catch (e) { this._handleError(e, 'analytics'); } }

    // [НОВОЕ] --- Performance ---
    perfStartTrace(args) {
        if (!this._isReady('performance')) return;
        const traceName = args.TRACE_NAME;
        if (this.traces.has(traceName)) return; // Уже отслеживается
        const trace = this.performance.trace(traceName);
        trace.start();
        this.traces.set(traceName, trace);
    }
    
    perfStopTrace(args) {
        if (!this._isReady('performance')) return;
        const traceName = args.TRACE_NAME;
        if (!this.traces.has(traceName)) return; // Не было запущено
        const trace = this.traces.get(traceName);
        trace.stop();
        this.traces.delete(traceName);
    }

    // --- Remote Config ---
    remoteConfigSetDefaults(args) { if (!this._isReady('remoteConfig')) return; try { this.remoteConfig.defaultConfig = this._parseValue(args.DEFAULTS); } catch (e) { this._handleError(e, 'remoteConfig'); } }
    remoteConfigFetch() { if (!this._isReady('remoteConfig')) return; return this.remoteConfig.fetchAndActivate().then(() => { this.runtime.startHats('ultimateFirebase_onRemoteConfigFetched'); }).catch(e => this._handleError(e, 'remoteConfig')); }
    onRemoteConfigFetched() { return false; }
    remoteConfigGetValue(args) { if (!this._isReady('remoteConfig')) return ''; return this.remoteConfig.getValue(args.KEY).asString(); }

    // --- Cloud Functions ---
    functionsCall(args) { if (!this._isReady('functions')) return; const callable = this.functions.httpsCallable(args.NAME); return callable(this._parseValue(args.DATA)).then(result => { this.lastFunctionResult = JSON.stringify(result.data); this.runtime.startHats('ultimateFirebase_onFunctionResult'); }).catch(e => this._handleError(e, 'functions')); }
    onFunctionResult() { return false; }
    getFunctionResult() { return this.lastFunctionResult; }
    _getHttpsFunctionUrl(endpoint) { if (!this.firebase || !this.firebase.options.projectId) { this._handleError({ message: 'Firebase не настроен или отсутствует ID проекта.' }, 'functions'); return null; } const projectId = this.firebase.options.projectId; return `https://us-central1-${projectId}.cloudfunctions.net/${endpoint}`; }
    httpsCallGet(args) { if (!this._isReady('functions')) return; const url = this._getHttpsFunctionUrl(args.ENDPOINT); if (!url) return; return fetch(url).then(response => { if (!response.ok) { throw new Error(`HTTP ошибка! Статус: ${response.status}`); } return response.json(); }).then(data => { this.lastFunctionResult = JSON.stringify(data); this.runtime.startHats('ultimateFirebase_onFunctionResult'); }).catch(e => this._handleError(e, 'functions')); }
    httpsCallPost(args) { if (!this._isReady('functions')) return; const url = this._getHttpsFunctionUrl(args.ENDPOINT); if (!url) return; const postData = this._parseValue(args.DATA); return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(postData), }).then(response => { if (!response.ok) { throw new Error(`HTTP ошибка! Статус: ${response.status}`); } return response.json(); }).then(data => { this.lastFunctionResult = JSON.stringify(data); this.runtime.startHats('ultimateFirebase_onFunctionResult'); }).catch(e => this._handleError(e, 'functions')); }

    // --- Realtime Database (RTDB) ---
    writeData(args) { if (!this._isReady('db')) return; return this.db.ref(args.PATH).set(this._parseValue(args.VALUE)).catch(error => this._handleError(error, 'db')); }
    rtdbAtomicAdd(args) { if (!this._isReady('db')) return; const value = Number(args.VALUE) || 0; return this.db.ref(args.PATH).set(firebase.database.ServerValue.increment(value)).catch(error => this._handleError(error, 'db')); }
    deleteData(args) { if (!this._isReady('db')) return; return this.db.ref(args.PATH).remove().catch(error => this._handleError(error, 'db')); }
    setOnDisconnect(args) { if (!this._isReady('db')) return; const ref = this.db.ref(args.PATH); ref.onDisconnect().cancel(); return ref.onDisconnect().set(this._parseValue(args.VALUE)).catch(error => this._handleError(error, 'db')); }
    removeOnDisconnect(args) { if (!this._isReady('db')) return; const ref = this.db.ref(args.PATH); ref.onDisconnect().cancel(); return ref.onDisconnect().remove().catch(error => this._handleError(error, 'db')); }
    cancelOnDisconnect(args) {if (!this._isReady('db')) return;return this.db.ref(args.PATH).onDisconnect().cancel().catch(error => this._handleError(error, 'db'));}
    readData(args) { if (!this._isReady('db')) return Promise.resolve(''); return this.db.ref(args.PATH).get().then(snapshot => { if (!snapshot.exists()) { return ''; } const data = snapshot.val(); if (typeof data === 'object' && data !== null) { return JSON.stringify(data); } return data; }).catch(error => { this._handleError(error, 'db'); return 'ОШИБКА'; }); }
    listenForData(args) { if (!this._isReady('db')) return false; const path = args.PATH; if (this.dbListeners.has(path)) return; const listener = this.db.ref(path).on('value', snapshot => { const data = snapshot.val(); this.lastReceivedData = (data && typeof data === 'object') ? JSON.stringify(data) : data; this.runtime.startHats('ultimateFirebase_listenForData', { PATH: path }); }, error => this._handleError(error, 'db')); this.dbListeners.set(path, listener); return false; }
    getLastReceivedData() { return this.lastReceivedData; }
    
    // [НОВОЕ] --- RTDB (Запросы) ---
    rtdbQuery(args) {
        if (!this._isReady('db')) return;
        
        let query = this.db.ref(args.PATH);
        
        // Сортировка (обязательна для лимитов)
        if (args.SORT_BY) {
            query = query.orderByChild(args.SORT_BY);
        } else {
            // Если поле не указано, RTDB требует сортировку
            // по ключу или значению для использования лимита.
            // Будем использовать по ключу.
            query = query.orderByKey();
        }
        
        // Лимит
        const limit = Number(args.LIMIT) || 10;
        if (args.LIMIT_TYPE === 'первые') {
            query = query.limitToFirst(limit);
        } else {
            query = query.limitToLast(limit);
        }
        
        return query.get().then(snapshot => {
            if (!snapshot.exists()) {
                this.lastRtdbQueryResult = '[]';
                this.runtime.startHats('ultimateFirebase_onRtdbQuery');
                return;
            }
            
            // RTDB возвращает объект. 
            // Чтобы сохранить порядок, нужно пройтись по нему.
            const results = [];
            snapshot.forEach(child => {
                results.push({
                    key: child.key,
                    ...child.val()
                });
            });
            
            this.lastRtdbQueryResult = JSON.stringify(results);
            this.runtime.startHats('ultimateFirebase_onRtdbQuery');
        }).catch(e => this._handleError(e, 'db'));
    }
    
    onRtdbQuery() { return false; }
    getRtdbQueryResult() { return this.lastRtdbQueryResult; }
}

Scratch.extensions.register(new UltimateFirebaseExtension(Scratch.vm.runtime));
// [КОНЕЦ КОДА]
