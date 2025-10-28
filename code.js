/* eslint-disable */
// [НАЧАЛО КОДА]
class UltimateFirebaseExtension {
    constructor(runtime) {
        this.runtime = runtime;
        this.firebase = null;
        this.auth = null;
        this.db = null;
        this.firestore = null;
        this.storage = null;
        this.functions = null;
        this.currentUser = null;
        this.phoneConfirmationResult = null;
        this.mfaResolver = null;
        this.persistenceType = 'local';
        this.lastErrorMessage = '';
        this.lastReceivedData = '';
        this.lastFirestoreQueryResult = '';
        this.lastFunctionResult = '';

        this.dbListeners = new Map();
        this.runtime.on('PROJECT_STOP_ALL', () => {
            if (this.db) { this.dbListeners.forEach((listener, path) => this.db.ref(path).off('value', listener)); }
            this.dbListeners.clear();
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
                { blockType: Scratch.BlockType.LABEL, text: '🗂️ Cloud Firestore' },
                { opcode: 'firestoreAddDoc', blockType: Scratch.BlockType.REPORTER, text: 'добавить документ [DATA] в коллекцию [PATH]', arguments: { DATA: { type: Scratch.ArgumentType.STRING, defaultValue: '{"name":"Alex", "score":100}' }, PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'players' }}},
                { opcode: 'firestoreSetDoc', blockType: Scratch.BlockType.COMMAND, text: 'задать документ [DATA] по пути [PATH]', arguments: { DATA: { type: Scratch.ArgumentType.STRING, defaultValue: '{"level":5}' }, PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'players/some-id' }}},
                { opcode: 'firestoreGetDoc', blockType: Scratch.BlockType.REPORTER, text: 'прочитать документ по пути [PATH]', arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'players/some-id' }}},
                { opcode: 'firestoreDeleteDoc', blockType: Scratch.BlockType.COMMAND, text: 'удалить документ по пути [PATH]', arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'players/some-id' }}},
                '---',
                { blockType: Scratch.BlockType.LABEL, text: '☁️ Cloud Storage' },
                { opcode: 'storageUploadText', blockType: Scratch.BlockType.COMMAND, text: 'загрузить текст [TEXT_DATA] в файл по пути [PATH]', arguments: { TEXT_DATA: { type: Scratch.ArgumentType.STRING, defaultValue: 'Hello World!' }, PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'saves/save1.txt' }}},
                { opcode: 'storageGetURL', blockType: Scratch.BlockType.REPORTER, text: 'получить URL для скачивания файла [PATH]', arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'images/logo.png' }}},
                { opcode: 'storageDeleteFile', blockType: Scratch.BlockType.COMMAND, text: 'удалить файл по пути [PATH]', arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'saves/old_save.txt' }}},
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
                
                // [НОВЫЙ БЛОК] Добавлен блок для удаления данных
                { opcode: 'deleteData', blockType: Scratch.BlockType.COMMAND, text: 'Удалить данные по пути [PATH]', arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'users/player1/temp' }}},
                
                // [ИЗМЕНЕНО] Опкод переименован с setDeleteOnDisconnect на setOnDisconnect для ясности
                { opcode: 'setOnDisconnect', blockType: Scratch.BlockType.COMMAND, text: 'При отключении установить по пути [PATH] значение [VALUE]', arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'users/player1/online' }, VALUE: { type: Scratch.ArgumentType.STRING, defaultValue: 'false' }}},
                
                // [НОВЫЙ БЛОК] Добавлен блок для удаления по пути при отключении
                { opcode: 'removeOnDisconnect', blockType: Scratch.BlockType.COMMAND, text: 'При отключении удалить путь [PATH]', arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'users/player1/temp_presence' }}},
                
                { opcode: 'cancelOnDisconnect', blockType: Scratch.BlockType.COMMAND, text: 'Отменить команду при отключении для пути [PATH]', arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'users/player1/online' }}},
                { opcode: 'readData', blockType: Scratch.BlockType.REPORTER, text: 'прочитать данные по пути [PATH]', arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'users/player1/score' }}},
                { opcode: 'listenForData', blockType: Scratch.BlockType.HAT, text: 'Когда данные по пути [PATH] изменяются', isEdgeActivated: false, arguments: { PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'chats/main' }}},
                { opcode: 'getLastReceivedData', blockType: Scratch.BlockType.REPORTER, text: 'Последние полученные данные'},
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
                userFields: { acceptReporters: true, items: ['Email', 'UID', 'Display Name', 'Phone Number', 'Photo URL', 'Почта подтверждена?'] }
            }
        };
    }
    
    _handleError(error, type) { console.error(`Firebase Error (${type}):`, error); this.lastErrorMessage = error.message; switch(type) { case 'auth': this.runtime.startHats('ultimateFirebase_onAuthError'); break; case 'db': this.runtime.startHats('ultimateFirebase_onDbError'); break; case 'mfa': this.runtime.startHats('ultimateFirebase_onMfaError'); break; case 'firestore': case 'storage': case 'functions': this.runtime.startHats('ultimateFirebase_onDbError'); break; } }
    _isReady(service) { if (!this.firebase) { this._handleError({ message: 'Firebase не инициализирован!' }, 'auth'); return false; } if (service && !this[service]) { this._handleError({ message: `Сервис ${service} не доступен.` }, 'auth'); return false; } return true; }
    _parseValue(value) { try { return JSON.parse(value); } catch (e) { return value; } }
    
    loadAndConfigure(args) { this._setupRecaptchaContainer(); const firebaseConfig = { apiKey: args.API_KEY, authDomain: `${args.PROJECT_ID}.firebaseapp.com`, projectId: args.PROJECT_ID, databaseURL: args.DB_URL, storageBucket: `${args.PROJECT_ID}.appspot.com`}; const loadScript = src => new Promise((resolve, reject) => { if (document.querySelector(`script[src="${src}"]`)) return resolve(); const s = document.createElement('script'); s.src = src; s.onload = resolve; s.onerror = () => reject(`Ошибка загрузки скрипта: ${src}`); document.head.appendChild(s); }); return Promise.all([ loadScript("https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"), loadScript("https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"), loadScript("https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js"), loadScript("https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js"), loadScript("https://www.gstatic.com/firebasejs/8.10.1/firebase-storage.js"), loadScript("https://www.gstatic.com/firebasejs/8.10.1/firebase-functions.js") ]).then(() => { if (!window.firebase.apps.length) { this.firebase = window.firebase.initializeApp(firebaseConfig); } else { this.firebase = window.firebase.app(); } this.auth = firebase.auth(); this.db = firebase.database(); this.firestore = firebase.firestore(); this.storage = firebase.storage(); this.functions = firebase.functions(); this.auth.onAuthStateChanged(user => { this.currentUser = user; }); console.log("Firebase Full Suite SDK загружен и настроен."); try { window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', { 'size': 'invisible' }); } catch (e) { console.warn("Recaptcha Verifier не удалось инициализировать. Вход по телефону может не работать."); } }).catch(error => { this._handleError(error, 'auth'); }); }
    
    onAuthError() { return false; }
    onDbError() { return false; }
    onMfaError() { return false; }
    getLastError() { return this.lastErrorMessage; }
    clearLastError() { this.lastErrorMessage = ''; }
    
    setAuthPersistence(args) { if (!this._isReady('auth')) return; this.persistenceType = (args.PERSISTENCE_TYPE === 'Навсегда (по умолчанию)') ? 'local' : 'session'; }
    _getPersistence() { return this.persistenceType === 'local' ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION; }
    
    signUp(args) { if (!this._isReady('auth')) return; return this.auth.setPersistence(this._getPersistence()).then(() => this.auth.createUserWithEmailAndPassword(args.EMAIL, args.PASSWORD)).catch(error => this._handleError(error, 'auth')); }
    signIn(args) { if (!this._isReady('auth')) return; return this.auth.setPersistence(this._getPersistence()).then(() => this.auth.signInWithEmailAndPassword(args.EMAIL, args.PASSWORD)).catch(error => { if (error.code === 'auth/multi-factor-required') { this.mfaResolver = error.resolver; this.runtime.startHats('ultimateFirebase_whenMfaRequired'); } else { this._handleError(error, 'auth'); } }); }
    signInWithProvider(args) { if (!this._isReady('auth')) return; return this.auth.setPersistence(this._getPersistence()).then(() => { if (args.PROVIDER === 'Anonymous') { return this.auth.signInAnonymously(); } let p; switch (args.PROVIDER) { case 'Google': p = new firebase.auth.GoogleAuthProvider(); break; case 'Microsoft': p = new firebase.auth.OAuthProvider('microsoft.com'); break; case 'GitHub': p = new firebase.auth.GithubAuthProvider(); break; case 'Apple': p = new firebase.auth.OAuthProvider('apple.com'); break; default: return Promise.reject("Неизвестный провайдер"); } return this.auth.signInWithPopup(p); }).catch(error => this._handleError(error, 'auth')); }
    
    signInWithToken(args) { if (!this._isReady('auth')) return; return this.auth.setPersistence(this._getPersistence()).then(() => this.auth.signInWithCustomToken(args.TOKEN)).catch(error => this._handleError(error, 'auth')); }

    signOut() { if (!this._isReady('auth')) return; return this.auth.signOut(); }
    isUserLoggedIn() { return !!this.currentUser; }
    getCurrentUser(args) { if (!this.currentUser) return ''; switch(args.FIELD) { case 'Email': return this.currentUser.email; case 'UID': return this.currentUser.uid; case 'Display Name': return this.currentUser.displayName; case 'Phone Number': return this.currentUser.phoneNumber; case 'Photo URL': return this.currentUser.photoURL; case 'Почта подтверждена?': return this.currentUser.emailVerified; default: return ''; } }

    getCurrentUserIDToken() {
        if (!this.currentUser) return Promise.resolve('');
        return this.currentUser.getIdToken(true) // true для принудительного обновления
            .catch(e => {
                this._handleError(e, 'auth');
                return ''; // Возвращаем пустую строку в случае ошибки
            });
    }

    updateUserProfile(args) { if (!this.currentUser) return this._handleError({message:'Пользователь не вошел'},'auth'); return this.currentUser.updateProfile({ displayName: args.NAME, photoURL: args.PHOTO_URL }).catch(e => this._handleError(e, 'auth')); }
    updateUserPassword(args) { if (!this.currentUser) return this._handleError({message:'Пользователь не вошел'},'auth'); return this.currentUser.updatePassword(args.NEW_PASSWORD).catch(e => this._handleError(e, 'auth')); }
    
    sendVerificationEmail() { if (!this.currentUser) return this._handleError({message:'Пользователь не вошел'},'auth'); return this.currentUser.sendEmailVerification().catch(e => this._handleError(e, 'auth')); }
    sendPasswordReset(args) { if (!this._isReady('auth')) return; return this.auth.sendPasswordResetEmail(args.EMAIL).catch(e => this._handleError(e, 'auth')); }
    updateUserEmail(args) { if (!this.currentUser) return this._handleError({message:'Пользователь не вошел'},'auth'); return this.currentUser.updateEmail(args.NEW_EMAIL).catch(e => this._handleError(e, 'auth')); }
    
    sendVerificationCode(args) { if (!this._isReady('auth')) return; const appVerifier = window.recaptchaVerifier; return this.auth.signInWithPhoneNumber(args.PHONE_NUMBER, appVerifier).then(confirmationResult => { this.phoneConfirmationResult = confirmationResult; }).catch(error => this._handleError(error, 'auth')); }
    signInWithPhoneCode(args) { if (!this.phoneConfirmationResult) { this._handleError({ message: 'Сначала отправьте код подтверждения!' }, 'auth'); return; } return this.phoneConfirmationResult.confirm(args.CODE).catch(error => this._handleError(error, 'auth')); }
    
    enrollMfa(args) { if (!this.currentUser) { this._handleError({ message: 'Для подключения 2FA нужно войти в аккаунт.' }, 'mfa'); return; } const appVerifier = window.recaptchaVerifier; const phoneInfoOptions = { phoneNumber: args.PHONE_NUMBER, session: this.currentUser.multiFactor.session }; const phoneAuthProvider = new firebase.auth.PhoneAuthProvider(); return phoneAuthProvider.verifyPhoneNumber(phoneInfoOptions, appVerifier).then(verificationId => { const code = prompt('Введите код из СМС для подключения 2FA:'); if (!code) return; const assertion = firebase.auth.PhoneMultiFactorGenerator.assertion(verificationId, code); return this.currentUser.multiFactor.enroll(assertion, `My Phone`); }).catch(error => this._handleError(error, 'mfa')); }
    whenMfaRequired() { return false; }
    getMfaHint() { if (!this.mfaResolver) return ''; return this.mfaResolver.hints[0].displayName || this.mfaResolver.hints[0].phoneNumber; }
    completeSignInWithMfaCode(args) { if (!this.mfaResolver) return; const cred = firebase.auth.PhoneMultiFactorGenerator.assertion( this.mfaResolver.hints[0].verificationId, args.CODE ); return this.mfaResolver.resolveSignIn(cred).then(() => { this.mfaResolver = null; }).catch(error => this._handleError(error, 'mfa')); }
    
    firestoreAddDoc(args) { if (!this._isReady('firestore')) return Promise.resolve(''); return this.firestore.collection(args.PATH).add(this._parseValue(args.DATA)).then(docRef => docRef.id).catch(e => { this._handleError(e, 'firestore'); return ''; }); }
    firestoreSetDoc(args) { if (!this._isReady('firestore')) return; const docPath = args.PATH.split('/'); const docId = docPath.pop(); const colPath = docPath.join('/'); return this.firestore.collection(colPath).doc(docId).set(this._parseValue(args.DATA), { merge: true }).catch(e => this._handleError(e, 'firestore')); }
    firestoreGetDoc(args) { if (!this._isReady('firestore')) return Promise.resolve(''); return this.firestore.doc(args.PATH).get().then(doc => doc.exists ? JSON.stringify(doc.data()) : '').catch(e => { this._handleError(e, 'firestore'); return ''; }); }
    firestoreDeleteDoc(args) { if (!this._isReady('firestore')) return; return this.firestore.doc(args.PATH).delete().catch(e => this._handleError(e, 'firestore')); }
    
    storageUploadText(args) { if (!this._isReady('storage')) return; return this.storage.ref(args.PATH).putString(args.TEXT_DATA).catch(e => this._handleError(e, 'storage')); }
    storageGetURL(args) { if (!this._isReady('storage')) return Promise.resolve(''); return this.storage.ref(args.PATH).getDownloadURL().catch(e => { this._handleError(e, 'storage'); return ''; }); }
    storageDeleteFile(args) { if (!this._isReady('storage')) return; return this.storage.ref(args.PATH).delete().catch(e => this._handleError(e, 'storage')); }
    
    functionsCall(args) { if (!this._isReady('functions')) return; const callable = this.functions.httpsCallable(args.NAME); return callable(this._parseValue(args.DATA)).then(result => { this.lastFunctionResult = JSON.stringify(result.data); this.runtime.startHats('ultimateFirebase_onFunctionResult'); }).catch(e => this._handleError(e, 'functions')); }
    onFunctionResult() { return false; }
    getFunctionResult() { return this.lastFunctionResult; }

    _getHttpsFunctionUrl(endpoint) { if (!this.firebase || !this.firebase.options.projectId) { this._handleError({ message: 'Firebase не настроен или отсутствует ID проекта.' }, 'functions'); return null; } const projectId = this.firebase.options.projectId; return `https://us-central1-${projectId}.cloudfunctions.net/${endpoint}`; }
    httpsCallGet(args) { if (!this._isReady('functions')) return; const url = this._getHttpsFunctionUrl(args.ENDPOINT); if (!url) return; return fetch(url).then(response => { if (!response.ok) { throw new Error(`HTTP ошибка! Статус: ${response.status}`); } return response.json(); }).then(data => { this.lastFunctionResult = JSON.stringify(data); this.runtime.startHats('ultimateFirebase_onFunctionResult'); }).catch(e => this._handleError(e, 'functions')); }
    httpsCallPost(args) { if (!this._isReady('functions')) return; const url = this._getHttpsFunctionUrl(args.ENDPOINT); if (!url) return; const postData = this._parseValue(args.DATA); return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(postData), }).then(response => { if (!response.ok) { throw new Error(`HTTP ошибка! Статус: ${response.status}`); } return response.json(); }).then(data => { this.lastFunctionResult = JSON.stringify(data); this.runtime.startHats('ultimateFirebase_onFunctionResult'); }).catch(e => this._handleError(e, 'functions')); }

    writeData(args) { if (!this._isReady('db')) return; return this.db.ref(args.PATH).set(this._parseValue(args.VALUE)).catch(error => this._handleError(error, 'db')); }

    // [НОВАЯ ФУНКЦИЯ] Удаление данных по пути
    deleteData(args) {
        if (!this._isReady('db')) return;
        // Удаление данных в RTDB (эквивалентно .set(null))
        return this.db.ref(args.PATH).remove()
            .catch(error => this._handleError(error, 'db'));
    }
    
    // [ИЗМЕНЕНО] Функция переименована с setDeleteOnDisconnect на setOnDisconnect
    setOnDisconnect(args) {
        if (!this._isReady('db')) return;
        const path = args.PATH;
        const value = this._parseValue(args.VALUE);
        
        const ref = this.db.ref(path);
        
        // Сначала очищаем старую команду (на всякий случай)
        ref.onDisconnect().cancel(); 
        
        // Устанавливаем новую команду
        return ref.onDisconnect().set(value)
            .catch(error => this._handleError(error, 'db'));
    }

    // [НОВАЯ ФУНКЦИЯ] Установка команды удаления на случай отключения
    removeOnDisconnect(args) {
        if (!this._isReady('db')) return;
        const path = args.PATH;
        const ref = this.db.ref(path);

        // Очищаем старые команды
        ref.onDisconnect().cancel();

        // Устанавливаем команду на удаление
        return ref.onDisconnect().remove()
            .catch(error => this._handleError(error, 'db'));
    }
    
    cancelOnDisconnect(args) {if (!this._isReady('db')) return;return this.db.ref(args.PATH).onDisconnect().cancel().catch(error => this._handleError(error, 'db'));}
    
    readData(args) { if (!this._isReady('db')) return Promise.resolve(''); return this.db.ref(args.PATH).get().then(snapshot => { if (!snapshot.exists()) { return ''; } const data = snapshot.val(); if (typeof data === 'object' && data !== null) { return JSON.stringify(data); } return data; }).catch(error => { this._handleError(error, 'db'); return 'ОШИБКА'; }); }
    listenForData(args) { if (!this._isReady('db')) return false; const path = args.PATH; if (this.dbListeners.has(path)) return; const listener = this.db.ref(path).on('value', snapshot => { const data = snapshot.val(); this.lastReceivedData = (data && typeof data === 'object') ? JSON.stringify(data) : data; this.runtime.startHats('ultimateFirebase_listenForData', { PATH: path }); }, error => this._handleError(error, 'db')); this.dbListeners.set(path, listener); return false; }
    getLastReceivedData() { return this.lastReceivedData; }
}

Scratch.extensions.register(new UltimateFirebaseExtension(Scratch.vm.runtime));
// [КОНЕЦ КОДА]
