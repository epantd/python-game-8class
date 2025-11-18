// --- Настройка DOM элементов ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const messageElement = document.getElementById('message');
const codeInput = document.getElementById('codeInput'); // <textarea>
const winModal = document.getElementById('win-modal');
const introScreen = document.getElementById('intro-screen');
const gameContainer = document.getElementById('game-container');
const lessonTitle = document.getElementById('lesson-title');
const lessonSubtitle = document.getElementById('lesson-subtitle');
const lessonText = document.getElementById('lesson-text');
const variablesDisplay = document.getElementById('variables-display');
const gameCanvas = document.getElementById('gameCanvas');
const gameMainTitle = document.getElementById('game-main-title');
const teacherCommandInput = document.getElementById('teacherCommand'); 
const outputDisplay = document.getElementById('output-display');
const taskSidebar = document.getElementById('task-sidebar');
const currentTaskDisplay = document.getElementById('current-task-display');

// --- Система сохранения прогресса ---
const SHEET_URL = 'https://script.google.com/macros/s/AKfycbwIWOZEe2S1mubV60vXwNb8kKs3PS_4vO42ezM72s7fORFGWdlPJoY-_fS9bp0ihW8u-Q/exec';
// Автоматическое сохранение при каждом изменении прогресса
async function autoSaveProgress() {
    const studentData = JSON.parse(localStorage.getItem('studentData'));
    if (!studentData) return;
    
    // Сохраняем в localStorage (всегда работает)
    studentData.currentPart = currentPart;
    studentData.currentLevel = currentLevel;
    studentData.lastSave = new Date().toISOString();
    localStorage.setItem('studentData', JSON.stringify(studentData));
    
    // Пытаемся сохранить в Google Sheets (если нет CORS ошибки)
    try {
        const progressData = {
            action: 'update',
            firstName: studentData.firstName,
            lastName: studentData.lastName,
            timestamp: new Date().toISOString(),
            currentPart: currentPart,
            currentLevel: currentLevel,
            loginTime: studentData.loginTime
        };

        const response = await fetch(SHEET_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(progressData)
        });

        if (response.ok) {
            console.log('Прогресс автоматически сохранен в таблицу');
        }
    } catch (error) {
        console.log('Прогресс сохранен локально (автосохранение)');
    }
}

async function saveProgressToGoogleSheets(action = 'update') {
    const studentData = JSON.parse(localStorage.getItem('studentData'));
    if (!studentData) return;

    // Всегда сохраняем в localStorage
    studentData.currentPart = currentPart;
    studentData.currentLevel = currentLevel;
    studentData.lastSave = new Date().toISOString();
    localStorage.setItem('studentData', JSON.stringify(studentData));

    // Отправляем в Google Sheets в фоне (no-cors)
    const progressData = {
        action: action,
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        timestamp: new Date().toISOString(),
        currentPart: currentPart,
        currentLevel: currentLevel,
        loginTime: studentData.loginTime
    };

    // Отправляем без ожидания ответа
    fetch(SHEET_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(progressData)
    }).then(() => {
        console.log('✅ Данные отправлены в таблицу');
    }).catch(() => {
        console.log('⚠️ Данные сохранены локально (ошибка сети)');
    });
}


// --- Параметры Игры и Уровней ---
let currentPart = 1; 
let currentLevel = 0; 
const PLAYER_SIZE = 50;
const STEP_SIZE = 10;
const TEACHER_PASSWORD = 'python'; // ПАРОЛЬ ДЛЯ УЧИТЕЛЯ

// Переменные для эмуляции Python
let pythonVariables = {};
let consoleOutput = ""; // Переменная для накопления вывода print()

// Переменные для комбинированных уровней (Урок 3.6+)
let currentPassword = null;
let passwordBlockTouched = false;
let verifyBlockTouched = false;
let currentChallengeBlock = null; // Блок, с которым взаимодействует игрок

// Урок 1: Переменные и Присваивание (10 уровней)
const PART_1_LEVELS = [
    { id: '1.1', name: 'Уровень 1.1', checkType: 'assignment', variables: { name: 'Витя' }, answer: ["name = 'Витя'"], description: "Присвойте переменной <strong>строковое</strong> значение. (Не забудьте кавычки!)" },
    { id: '1.2', name: 'Уровень 1.2', checkType: 'assignment', variables: { age: 15 }, answer: ["age = 15"], description: "Присвойте переменной <strong>целое число</strong>." },
    { id: '1.3', name: 'Уровень 1.3', checkType: 'assignment', variables: { price: 9.99 }, answer: ["price = 9.99"], description: "Присвойте <strong>число с плавающей точкой</strong> (float)." },
    { id: '1.4', name: 'Уровень 1.4', checkType: 'assignment', variables: { is_ready: 'True' }, answer: ["is_ready = True"], description: "Присвойте <strong>логическое значение</strong> (True/False)." },
    { id: '1.5', name: 'Уровень 1.5', checkType: 'assignment', variables: { x: 50, y: 50 }, answer: ["x = 50", "y = 50"], description: "Присвойте значения двум разным переменным (с новой строки)." },
    // НОВЫЕ ЛИНЕЙНЫЕ АЛГОРИТМЫ (по учебнику)
    { 
        id: '1.6', name: 'Уровень 1.6: Периметр', 
        checkType: 'linear_algo', 
        expectedOutput: 'Периметр: 14\n', 
        testInputs: [
            { prompt: 'Длина: ', input: '4' }, 
            { prompt: 'Ширина: ', input: '3' }
        ], 
        description: "Вычислите периметр прямоугольника. Используйте `int(input(\"...\"))` для получения Длины и Ширины, и выведите результат. **Тестовые данные: Длина=4, Ширина=3, Периметр=14**" 
    },
    { 
        id: '1.7', name: 'Уровень 1.7: Расчет возраста', 
        checkType: 'linear_algo', 
        expectedOutput: 'Тебе примерно 12 лет!\n', 
        testInputs: [
            { prompt: 'Твой год рождения: ', input: '2012' }
        ], 
        description: "Рассчитайте возраст, используя `int(input(\"...\"))` для года рождения. Используйте 2024 как текущий год. **Тестовые данные: Год рождения=2012, Возраст=12**" 
    },
    // Возвращены старые арифметические уровни
    { id: '1.8', name: 'Уровень 1.8: Сложение', checkType: 'assignment_expr', variables: { first: 3, second: 5, third: 'first + second' }, answer: ["first = 3", "second = 5", "third = first + second"], description: "Используйте <strong>сложение</strong> (+) для вычисления 'third'. Три строки кода." },
    { id: '1.9', name: 'Уровень 1.9: Умножение', checkType: 'assignment_expr', variables: { count: 4, cost: 12, total_cost: 'count * cost' }, answer: ["count = 4", "cost = 12", "total_cost = count * cost"], description: "Используйте <strong>умножение</strong> (*) для вычисления 'total_cost'." },
    { id: '1.10', name: 'Уровень 1.10: Комбинация', checkType: 'assignment_expr', variables: { a: 10, b: 2, c: 'a * b - 5' }, answer: ["a = 10", "b = 2", "c = a * b - 5"], description: "Используйте <strong>комбинацию</strong> операций (*, -) для вычисления 'c'." }
];

// Урок 2: Оператор input() и Движение (10 уровней)
const PART_2_LEVELS = [
    { id: '2.1', startX: 50, startY: 175, targetX: 500, targetY: 175, description: "Дойдите до цели, используя <strong>только одну</strong> команду `move = int(input())`." }, 
    { id: '2.2', startX: 50, startY: 50, targetX: 50, targetY: 300, description: "Измените направление, используя <strong>только одну</strong> команду `turn = input()`, а затем введите `move = int(input())` вручную." }, 
    { id: '2.3', startX: 500, startY: 300, targetX: 100, targetY: 300, description: "Чтобы дойти, персонажу нужно сменить направление. (move или turn)" },
    { id: '2.4', startX: 50, startY: 300, targetX: 500, targetY: 50, description: "Нужно несколько команд, но вводите их <strong>по одной</strong> строке." }, 
    { id: '2.5', startX: 300, startY: 200, targetX: 300, targetY: 50, description: "Цель находится вверху. Используйте команды move и turn поочередно." }, 
    { id: '2.6', startX: 50, startY: 50, targetX: 500, targetY: 50, description: "Используйте <strong>две строки</strong>: `turn = input()` и `move = int(input())`, чтобы достичь цели за один 'запуск кода'." }, 
    { id: '2.7', startX: 500, startY: 50, targetX: 500, targetY: 350, description: "Цель внизу. Напишите `turn = input()` (вниз) и `move = input()`." }, 
    { id: '2.8', startX: 500, startY: 350, targetX: 50, targetY: 350, description: "Цель слева. Напишите `turn = input()` (влево) и `move = input()`." },
    { id: '2.9', startX: 300, startY: 300, targetX: 50, targetY: 50, description: "Сначала поверните <strong>влево</strong>, сделайте шаг, затем поверните <strong>вверх</strong> и сделайте второй шаг. (Четыре строки кода)." },
    { id: '2.10', startX: 50, startY: 350, targetX: 500, targetY: 50, description: "Путь вправо, потом вверх. Используйте <strong>четыре строки</strong>." }
];

// Урок 3: Функция print() (10 уровней)
const PART_3_LEVELS = [
    { id: '3.1', type: 'print', variables: {}, requiredCode: ["print('Привет, мир!')"], requiredOutput: "Привет, мир!\n", description: "Выведите на экран свою первую фразу: \"Привет, мир!\" (обязательно с кавычками)." },
    { id: '3.2', type: 'print', variables: { num: 10 }, requiredCode: ["num = 10", "print(num)"], requiredOutput: "10\n", description: "Выведите на экран значение переменной `num`. Код должен быть в две строки." },
    { id: '3.3', type: 'print', variables: { age: 15 }, requiredCode: ["age = 15", "print('Мне', age, 'лет')"], requiredOutput: "Мне 15 лет\n", description: "Переменная `age` содержит число. Выведите текст и переменную в одной команде <strong>через запятую</strong>." },
    { id: '3.4', type: 'print', variables: { a: 5, b: 10 }, requiredCode: ["a = 5", "b = 10", "print(a + b)"], requiredOutput: "15\n", description: "Выведите результат <strong>сложения</strong> двух переменных: `a` и `b`." },
    { id: '3.5', type: 'print', variables: { name: 'Вася', count: 3 }, requiredCode: ["name = 'Вася'", "count = 3", "print('У', name, count, 'яблока.')"], requiredOutput: "У Вася 3 яблока.\n", description: "Выведите комбинированный текст, используя обе переменные и строку <strong>через запятые</strong>." },
    // НОВЫЕ КОМБИНИРОВАННЫЕ УРОВНИ (print() + input() + movement)
    { 
        id: '3.6', type: 'combined', startX: 50, startY: 175, 
        passwordBlock: { x: 500, y: 175, type: 'password' },
        verifyBlock: { x: 50, y: 50, type: 'verify' },
        description: "Сначала дойдите до <strong>желтого</strong> блока, сделайте `print('Скажи пароль')`. Получите пароль. Затем идите к <strong>красному</strong> блоку и используйте `print('Пароль')`." 
    },
    { 
        id: '3.7', type: 'combined', startX: 50, startY: 300, 
        passwordBlock: { x: 500, y: 300, type: 'password' },
        verifyBlock: { x: 50, y: 50, type: 'verify' },
        description: "Сначала дойдите до <strong>желтого</strong> блока, сделайте `print('Скажи пароль')`. Получите пароль. Затем идите к <strong>красному</strong> блоку и используйте `print('Пароль')`."
    },
    { 
        id: '3.8', type: 'combined', startX: 50, startY: 50, 
        passwordBlock: { x: 500, y: 50, type: 'password' },
        verifyBlock: { x: 500, y: 300, type: 'verify' },
        description: "Двигайтесь вправо, затем вниз. Используйте `print()` для получения пароля и еще раз `print()` для его ввода."
    },
    { 
        id: '3.9', type: 'combined', startX: 300, startY: 200, 
        passwordBlock: { x: 50, y: 50, type: 'password' },
        verifyBlock: { x: 500, y: 350, type: 'verify' },
        description: "Вам нужно изменить направление дважды, чтобы получить и ввести пароль. Используйте <strong>две разные команды</strong> `print()`."
    },
    { 
        id: '3.10', type: 'combined', startX: 50, startY: 350, 
        passwordBlock: { x: 500, y: 50, type: 'password' },
        verifyBlock: { x: 50, y: 50, type: 'verify' },
        description: "Финальный уровень: пройдите полный путь, взаимодействуя с желтым и красным блоками, используя `print()` для получения и передачи пароля. Команды движения: `move = int(input())` и `turn = input()`."
    },
];

// --- Переменные состояния Игрока (для Part 2 & Combined) ---
let playerX;
let playerY;
let direction;

// --- Управление экранами ---

function updateTaskSidebar(taskText, levelId) {
    let partTitle = "";
    if (currentPart === 1) partTitle = "Урок 1: Присваивание и Алгоритмы";
    else if (currentPart === 2) partTitle = "Урок 2: input() и Движение";
    else if (currentPart === 3) partTitle = "Урок 3: print() и Комбинация";
    
    document.getElementById('sidebar-title').textContent = `${partTitle} (${levelId})`;
    currentTaskDisplay.innerHTML = taskText;
    taskSidebar.style.display = 'block';
}

function showIntroScreen() {
    introScreen.style.display = 'flex';
    gameContainer.style.opacity = '0'; 
    taskSidebar.style.display = 'none'; 
    
    if (currentPart === 1) {
        lessonSubtitle.textContent = 'Урок 1. Переменные, Присваивание и Линейные Алгоритмы';
        lessonText.innerHTML = `
            <strong>Переменная</strong> — это "коробочка" для хранения данных. <strong>Оператор присваивания (=)</strong> кладет значение в эту "коробочку".<br>
            В этом уроке вы также научитесь получать числовой ввод с помощью <strong>\`int(input())\`</strong>.<br><br>
            <strong>Твоя задача:</strong> Освоить присваивание и решение линейных задач.
        `;
        document.getElementById('start-game-btn').textContent = 'Начать Урок 1';
        
    } else if (currentPart === 2) {
        lessonSubtitle.textContent = 'Урок 2. Оператор input() и Управление';
        lessonText.innerHTML = `
            <strong>Оператор \`input()\`</strong> используется для получения данных от пользователя. Он приостанавливает выполнение и запрашивает ввод.<br><br>
            <strong>Твоя задача:</strong> Используй команды \`move = int(input())\` или \`turn = input()\` для достижения цели.
        `;
        document.getElementById('start-game-btn').textContent = 'Начать Урок 2';
        
    } else if (currentPart === 3) {
        lessonSubtitle.textContent = 'Урок 3. Функция print() и Комбинация Операторов';
        lessonText.innerHTML = `
            Первые 5 уровней посвящены \`print()\`. Уровни 3.6-3.10 комбинируют <strong>движение, \`print()\` и \`input()\`</strong>.<br><br>
            <strong>Твоя задача:</strong> Подойти к блоку, получить пароль, используя \`print()\`, а затем <strong>озвучить (вывести)</strong> его в другом блоке, используя <strong>print()</strong> с правильным паролем.
        `;
        document.getElementById('start-game-btn').textContent = 'Начать Урок 3';
    }
}

window.hideIntroAndStart = async function() {
    introScreen.style.display = 'none';
    gameContainer.style.opacity = '1'; 
    
    // Пытаемся загрузить сохраненный прогресс
    const studentData = JSON.parse(localStorage.getItem('studentData'));
    if (studentData && studentData.currentPart && studentData.currentLevel) {
        currentPart = studentData.currentPart;
        currentLevel = studentData.currentLevel;
        console.log('Прогресс загружен из localStorage:', { currentPart, currentLevel });
    }

    // Сброс видимости элементов
    variablesDisplay.style.display = 'none';
    gameCanvas.style.display = 'none';
    outputDisplay.style.display = 'none';
    codeInput.value = '';
    
    // Установка заголовка и видимости в зависимости от части
    if (currentPart === 1) {
        gameMainTitle.textContent = 'Урок 1: Присваивание и Алгоритмы';
        codeInput.placeholder = "каждая команда с новой строки";
    } else if (currentPart === 2) {
        gameMainTitle.textContent = 'Урок 2: Оператор input()';
        gameCanvas.style.display = 'block';
        codeInput.placeholder = "move = int(input()) или turn = input() (можно несколько)";
    } else if (currentPart === 3) {
        gameMainTitle.textContent = 'Урок 3: Функция print() и Комбинация';
        codeInput.placeholder = "print(...) / move = int(input()) / turn = input()";
    }
    
    startGame(currentLevel);
    
    // Сохраняем факт начала сессии
    saveProgressToGoogleSheets('login');
}

function showWinModal(isPartComplete = false) {
    if (isPartComplete) {
        const nextPart = currentPart + 1;
        let nextLessonText = "";
        if (nextPart === 2) nextLessonText = "Оператор input()";
        else if (nextPart === 3) nextLessonText = "Функция print()";
        else nextLessonText = "Игра пройдена!";

        winModal.querySelector('#modal-title').textContent = "Часть пройдена!";
        winModal.querySelector('#modal-text').innerHTML = `Ты молодец! Успешно освоил текущий урок. <br> Готов к следующему уроку: <strong>${nextLessonText}</strong>?`;
        document.getElementById('next-level-btn').textContent = nextPart <= 3 ? `Перейти к Уроку ${nextPart}` : 'Завершить игру';
    } else {
        winModal.querySelector('#modal-title').textContent = "Уровень пройден!";
        winModal.querySelector('#modal-text').textContent = "Правильно! Переходим к следующей задаче.";
        document.getElementById('next-level-btn').textContent = 'Следующий уровень';
    }
    document.getElementById('next-level-btn').style.display = 'inline-block'; 
    winModal.style.display = 'flex';
}

window.nextLevel = async function() {
    winModal.style.display = 'none';
    
    let currentLevelList = [];
    if (currentPart === 1) currentLevelList = PART_1_LEVELS;
    else if (currentPart === 2) currentLevelList = PART_2_LEVELS;
    else if (currentPart === 3) currentLevelList = PART_3_LEVELS;
    
    if (currentLevel + 1 < currentLevelList.length) {
        currentLevel++;
        // Сохраняем прогресс
        await saveProgressToGoogleSheets('update');
        startGame(currentLevel);
    } else {
        // Переход к следующей части
        currentPart++;
        await autoSaveProgress(); 
        currentLevel = 0;
        
        // Сохраняем прогресс
        await saveProgressToGoogleSheets('update');
        
        if (currentPart > 3) {
            winModal.querySelector('#modal-title').textContent = "Игра пройдена!";
            winModal.querySelector('#modal-text').textContent = "Поздравляем, ты настоящий кодер! Ты прошел все уроки!";
            document.getElementById('next-level-btn').style.display = 'none';
            winModal.style.display = 'flex';
        } else {
            showIntroScreen();
        }
    }
}

window.restartLevel = function() {
    winModal.style.display = 'none';
    startGame(currentLevel);
}

// --- Инициализация / Запуск Уровня ---

function startGame(levelIndex) {
    // Сброс всех игровых элементов
    variablesDisplay.style.display = 'none';
    gameCanvas.style.display = 'none';
    outputDisplay.style.display = 'none';
    outputDisplay.innerHTML = '';
    
    if (currentPart === 1) {
        startGamePart1(levelIndex);
        variablesDisplay.style.display = 'flex';
        outputDisplay.innerHTML = '--- Консоль вывода (print) ---<br>';
        consoleOutput = "--- Консоль вывода (print) ---\n";
    } else if (currentPart === 2) {
        startGamePart2(levelIndex);
        gameCanvas.style.display = 'block';
    } else if (currentPart === 3) {
        // В зависимости от типа уровня 3
        const levelData = PART_3_LEVELS[levelIndex];
        if (levelData.type === 'print') {
            startGamePart3Print(levelIndex);
            outputDisplay.style.display = 'block';
        } else if (levelData.type === 'combined') {
            startGamePart3Combined(levelIndex);
            gameCanvas.style.display = 'block';
            outputDisplay.style.display = 'block'; // Консоль тоже нужна
        }
    }
}

// --- ЛОГИКА ЧАСТИ 1: ПРИСВАИВАНИЕ и АРИФМЕТИКА / ЛИНЕЙНЫЕ АЛГОРИТМЫ ---

function startGamePart1(levelIndex) {
    const levelData = PART_1_LEVELS[levelIndex];
    
    gameMainTitle.textContent = 'Урок 1: Присваивание и Алгоритмы'; 
    messageElement.textContent = `${levelData.name}: Введите код.`; 

    updateTaskSidebar(levelData.description, levelData.id);

    codeInput.value = '';
    
    variablesDisplay.innerHTML = '';
    outputDisplay.style.display = 'none';

    if (levelData.checkType === 'assignment' || levelData.checkType === 'assignment_expr') {
        variablesDisplay.style.display = 'flex';
        outputDisplay.style.display = 'none';
        for (const [varName, varValue] of Object.entries(levelData.variables)) {
            const box = document.createElement('div');
            box.className = 'variable-box';
            const isExpression = typeof varValue === 'string' && isNaN(varValue);
            const valueDisplay = isExpression 
                                 ? `<p class="expression">${varValue}</p>`
                                 : `<p>${varValue}</p>`;

            box.innerHTML = `<h3>${varName}</h3>${valueDisplay}`;
            variablesDisplay.appendChild(box);
        }
    } else if (levelData.checkType === 'linear_algo') {
        variablesDisplay.style.display = 'none';
        outputDisplay.style.display = 'block';
    }
}

function checkAssignment(playerCode, levelAnswer) {
    const normalizeCode = (code) => {
        return code.toLowerCase().trim()
                   .split('\n')
                   .map(line => line.replace(/\s+/g, '').replace(/'/g, '"').trim())
                   .filter(line => line.length > 0)
                   .sort(); 
    };

    const normalizedPlayerLines = normalizeCode(playerCode);
    const normalizedAnswerLines = normalizeCode(levelAnswer.join('\n')); 

    if (normalizedPlayerLines.length !== normalizedAnswerLines.length) {
        return false;
    }
    const answerSet = new Set(normalizedAnswerLines);
    return normalizedPlayerLines.every(line => answerSet.has(line));
}

function checkLinearAlgo(playerCode, levelData) {
    // Сбрасываем переменные и консоль для эмуляции
    pythonVariables = {};
    consoleOutput = "--- Консоль вывода (print) ---\n";
    
    const lines = playerCode.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let inputCounter = 0;
    
    for (const line of lines) {
        
        // 1. Поиск input()
        const inputMatch = line.match(/(\w+)\s*=\s*int\s*\(\s*input\s*\(\s*(["'])([^"']*)\2\s*\)\s*\)/i);
        if (inputMatch) {
            const varName = inputMatch[1];
            const promptText = inputMatch[3];
            
            if (inputCounter >= levelData.testInputs.length) {
                return { success: false, message: `Слишком много команд input(). Ожидалось ${levelData.testInputs.length}.` };
            }
            
            const expectedPrompt = levelData.testInputs[inputCounter].prompt.trim();
            const simulatedInput = levelData.testInputs[inputCounter].input;
            
            // Проверка текста в input()
            if (promptText.trim() !== expectedPrompt) {
                 return { success: false, message: `Ошибка: Текст в input() не соответствует ожидаемому. Ожидали: "${expectedPrompt}", получили: "${promptText}"` };
            }

            // Эмуляция ввода
            pythonVariables[varName] = parseInt(simulatedInput);
            inputCounter++;
            continue;
        }

        // 2. Поиск assignment (Присваивание без input)
        const assignmentMatch = line.match(/^(\w+)\s*=\s*(.*)/);
        if (assignmentMatch) {
            const varName = assignmentMatch[1];
            const valueStr = assignmentMatch[2].trim();
            
            let value = evaluatePythonExpression(valueStr, pythonVariables);
            pythonVariables[varName] = value;
            continue;
        }

        // 3. Поиск print()
        if (line.startsWith('print')) {
            if (!emulatePrint(line)) {
                return { success: false, message: `Ошибка: Некорректный синтаксис print() в строке: ${line}` };
            }
            continue;
        }
        
        return { success: false, message: `Неизвестная команда или синтаксическая ошибка: ${line}` };
    }
    
    // Проверка, что все input'ы были использованы
    if (inputCounter !== levelData.testInputs.length) {
        return { success: false, message: `Недостаточно команд input(). Ожидалось ${levelData.testInputs.length}.` };
    }
    
    // Проверка финального вывода
    if (consoleOutput.includes(levelData.expectedOutput)) {
         return { success: true, message: "Правильно! Вывод соответствует ожидаемому." };
    } else {
        let detailMessage = `Ожидаемый вывод: \n>>> ${levelData.expectedOutput.replace(/\n/g, '[новая строка]\n>>> ')}\n`;
        detailMessage += `Ваш вывод: \n>>> ${consoleOutput.replace(/\n/g, '[новая строка]\n>>> ')}`;
        return { success: false, message: `Вывод не соответствует заданию! \n${detailMessage}` };
    }
}

// --- ЛОГИКА ЧАСТИ 2: INPUT() И ДВИЖЕНИЕ ---

function startGamePart2(levelIndex) {
    const levelData = PART_2_LEVELS[levelIndex];
    
    gameMainTitle.textContent = 'Урок 2: Оператор input()';

    playerX = levelData.startX;
    playerY = levelData.startY;
    direction = 'вправо'; 
    
    messageElement.textContent = `Урок 2 / ${levelData.id}. Введите код.`; 
    
    updateTaskSidebar(levelData.description, levelData.id);
    
    codeInput.value = '';
    drawGamePart2(); // Переименовано для ясности
}

function drawGamePart2() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const target = PART_2_LEVELS[currentLevel]; 

    ctx.fillStyle = 'green';
    ctx.fillRect(target.targetX, target.targetY, PLAYER_SIZE, PLAYER_SIZE);
    
    ctx.fillStyle = 'blue';
    ctx.fillRect(playerX, playerY, PLAYER_SIZE, PLAYER_SIZE);
    
    drawDirectionArrow();

    ctx.fillStyle = 'black';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Уровень: ${PART_2_LEVELS[currentLevel].id} | Направление: ${direction}`, 10, 20);
}

// --- ЛОГИКА ЧАСТИ 3: print() (Уровни 3.1-3.5) ---

function startGamePart3Print(levelIndex) {
    const levelData = PART_3_LEVELS[levelIndex];
    
    gameMainTitle.textContent = 'Урок 3: Функция print()';
    messageElement.textContent = `Урок 3 / ${levelData.id}. Введите код.`; 
    
    updateTaskSidebar(levelData.description, levelData.id);
    
    codeInput.value = '';
    outputDisplay.innerHTML = '';
    consoleOutput = ""; 
    pythonVariables = { }; 
    
    if (levelData.variables) {
        pythonVariables = { ...levelData.variables };
    }
}

// --- ЛОГИКА ЧАСТИ 3: Комбинированные (Уровни 3.6-3.10) ---

function generateRandomPassword() {
    const words = ['Код', 'Питон', 'Арифметика', 'Переменная', 'Консоль', 'Логика'];
    const nums = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const word = words[Math.floor(Math.random() * words.length)];
    const num = nums[Math.floor(Math.random() * nums.length)];
    return `${word}${num}`;
}

function startGamePart3Combined(levelIndex) {
    const levelData = PART_3_LEVELS[levelIndex];
    
    gameMainTitle.textContent = 'Урок 3: Комбинация print(), input(), move';
    messageElement.textContent = `Урок 3 / ${levelData.id}. Введите код.`;
    
    updateTaskSidebar(levelData.description, levelData.id);

    // Сброс состояния
    playerX = levelData.startX;
    playerY = levelData.startY;
    direction = 'вправо';
    currentPassword = generateRandomPassword();
    passwordBlockTouched = false;
    verifyBlockTouched = false;
    currentChallengeBlock = null;
    codeInput.value = '';
    outputDisplay.innerHTML = '--- Сброс консоли ---<br>';
    consoleOutput = "--- Сброс консоли ---\n";
    
    drawGamePart3Combined();
}

function drawGamePart3Combined() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const levelData = PART_3_LEVELS[currentLevel]; 

    // Блок 1 (Пароль - Желтый)
    ctx.fillStyle = passwordBlockTouched ? '#2ecc71' : '#f1c40f'; // Зеленый после касания
    ctx.fillRect(levelData.passwordBlock.x, levelData.passwordBlock.y, PLAYER_SIZE, PLAYER_SIZE);
    
    // Блок 2 (Проверка - Красный)
    ctx.fillStyle = verifyBlockTouched ? '#2ecc71' : '#e74c3c'; // Зеленый после касания
    ctx.fillRect(levelData.verifyBlock.x, levelData.verifyBlock.y, PLAYER_SIZE, PLAYER_SIZE);
    
    // Игрок
    ctx.fillStyle = 'blue';
    ctx.fillRect(playerX, playerY, PLAYER_SIZE, PLAYER_SIZE);
    
    drawDirectionArrow();

    ctx.fillStyle = 'black';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Уровень: ${levelData.id} | Направление: ${direction}`, 10, 20);
    ctx.fillText(`Пароль получен: ${passwordBlockTouched ? 'Да' : 'Нет'}`, 10, 40);
}

function checkCollision(x, y, block) {
    return x < block.x + PLAYER_SIZE &&
           x + PLAYER_SIZE > block.x &&
           y < block.y + PLAYER_SIZE &&
           y + PLAYER_SIZE > block.y;
}

function checkWinPart3Combined() {
    // Уровень пройден, если пароль получен И пароль введен (verifyBlockTouched)
    if (passwordBlockTouched && verifyBlockTouched) {
        // Добавляем небольшую задержку, чтобы убедиться, что консольный вывод виден
        setTimeout(() => { 
            if (currentLevel + 1 === PART_3_LEVELS.length) {
                showWinModal(true); 
            } else {
                showWinModal(false);
            }
        }, 50); 
        return true;
    }
    return false;
}

// --- Общие функции движения и взаимодействия ---

function drawDirectionArrow() {
    ctx.fillStyle = 'red'; ctx.beginPath();
    let x = playerX + PLAYER_SIZE / 2; let y = playerY + PLAYER_SIZE / 2;
    switch (direction) {
        case 'вправо': ctx.moveTo(x + 15, y); ctx.lineTo(x + 5, y - 10); ctx.lineTo(x + 5, y + 10); break;
        case 'влево': ctx.moveTo(x - 15, y); ctx.lineTo(x - 5, y - 10); ctx.lineTo(x - 5, y + 10); break;
        case 'вверх': ctx.moveTo(x, y - 15); ctx.lineTo(x - 10, y - 5); ctx.lineTo(x + 10, y - 5); break;
        case 'вниз': ctx.moveTo(x, y + 15); ctx.lineTo(x - 10, y + 5); ctx.lineTo(x + 10, y + 5); break;
    }
    ctx.closePath(); ctx.fill();
}

function fakeMoveInput(steps, drawFunction) {
    if (isNaN(steps)) { messageElement.textContent = `Ошибка! Значение '${steps}' не является числом.`; return false; }
    
    let actualSteps = steps * STEP_SIZE; let newX = playerX; let newY = playerY;
    switch (direction) {
        case 'вправо': newX += actualSteps; break; case 'влево': newX -= actualSteps; break;
        case 'вверх': newY -= actualSteps; break; case 'вниз': newY += actualSteps; break;
    }
    
    newX = Math.min(Math.max(newX, 0), canvas.width - PLAYER_SIZE);
    newY = Math.min(Math.max(newY, 0), canvas.height - PLAYER_SIZE);
    playerX = newX; playerY = newY;
    
    drawFunction(); 
    return true;
}

function fakeTurnInput(newDir, drawFunction) {
    const validDirections = ['вправо', 'влево', 'вверх', 'вниз'];
    const normalizedDir = newDir ? newDir.toLowerCase().trim() : '';
    if (validDirections.includes(normalizedDir)) {
        direction = normalizedDir; 
        drawFunction();
        return true;
    } else {
        messageElement.textContent = `Ошибка! Некорректное направление '${newDir}'. Используйте: вправо, влево, вверх, вниз.`;
        return false;
    }
}

// --- Общие функции print() и проверки ---

function emulatePrint(line) {
    const printMatch = line.match(/print\s*\(([^)]*)\)/);
    if (!printMatch) return false;

    const argsStr = printMatch[1].trim();
    // Используем более точный regex для разделения по запятой, игнорируя запятые внутри кавычек
    const parts = argsStr.split(/,\s*(?=(?:(?:[^"']*["']){2})*[^"']*$)/); 
    
    let sep = ' '; 
    let end = '\n'; 
    const outputItems = [];

    for (let part of parts) {
        part = part.trim();
        if (part.startsWith('sep=')) {
            sep = part.substring(4).replace(/"|'/g, '');
        } else if (part.startsWith('end=')) {
            end = part.substring(4).replace(/"|'/g, '');
        } else if (part.length > 0) {
            try {
                if ((part.startsWith("'") && part.endsWith("'")) || (part.startsWith('"') && part.endsWith('"'))) {
                    outputItems.push(part.slice(1, -1));
                } 
                else {
                    const evaluated = evaluatePythonExpression(part, pythonVariables);
                    outputItems.push(evaluated);
                }
                
            } catch (e) {
                outputItems.push(part);
            }
        }
    }

    const outputString = outputItems.join(sep) + end;
    consoleOutput += outputString;

    outputDisplay.innerHTML = consoleOutput.replace(/\n/g, '<br>');
    return true;
}

function emulatePrintPassword(line, levelData) {
    // 1. Команда print() для получения пароля (ЖЕЛТЫЙ БЛОК)
    if (line.trim().toLowerCase() === 'print("скажи пароль")' || line.trim().toLowerCase() === "print('скажи пароль')") {
        
        // --- ПРОВЕРКА СТОЛКНОВЕНИЯ ---
        if (!checkCollision(playerX, playerY, levelData.passwordBlock)) {
            messageElement.textContent = `Ошибка: Чтобы получить пароль, нужно подойти к ЖЕЛТОМУ блоку.`;
            return { success: false, win: false };
        }

        // --- ЛОГИКА ВЗАИМОДЕЙСТВИЯ (если столкновение есть) ---

        consoleOutput += `Скажи пароль\n`;
        // Если пароль уже получен, просто напоминаем его
        if (passwordBlockTouched) {
            consoleOutput += `Пароль: ${currentPassword} (Уже получен)\n`;
            messageElement.textContent = `Пароль уже получен: ${currentPassword}. Идите к КРАСНОМУ блоку.`;
        } else {
            // Генерируем и выводим рандомный пароль в первый раз
            const password = generateRandomPassword(); 
            currentPassword = password; // Обновляем текущий пароль
            consoleOutput += `Пароль: ${currentPassword}\n`;
            passwordBlockTouched = true;
            messageElement.textContent = `Пароль получен! Идите к КРАСНОМУ блоку.`;
        }
        
        outputDisplay.innerHTML = consoleOutput.replace(/\n/g, '<br>');
        drawGamePart3Combined();
        return { success: true, win: false };
    } 
    
    // 2. Команда print() для ввода пароля (КРАСНЫЙ БЛОК)
    
    // Если уровень уже завершен, игнорируем дальнейший ввод
    if (verifyBlockTouched) {
        return { success: true, win: true }; // Если уже выиграли, не блокируем, но и не меняем состояние
    }

    // Проверяем, ввел ли игрок print('ПАРОЛЬ') или print(ПАРОЛЬ)
    // Разрешаем print(ПАРОЛЬ) или print('ПАРОЛЬ')
    const passwordMatch = line.match(/print\s*\(([^)]*)\)/); // Более общий паттерн
    if (passwordMatch && passwordBlockTouched) {
        
        // --- ПРОВЕРКА СТОЛКНОВЕНИЯ ---
        if (!checkCollision(playerX, playerY, levelData.verifyBlock)) {
            messageElement.textContent = `Ошибка: Чтобы ввести пароль, нужно подойти к КРАСНОМУ блоку.`;
            return { success: false, win: false };
        }

        // --- ЛОГИКА ПРОВЕРКИ (если столкновение есть) ---
        // Извлекаем то, что внутри print(), и удаляем внешние кавычки
        const printedValueRaw = passwordMatch[1].trim();
        const printedValue = printedValueRaw.replace(/^['"]|['"]$/g, '');
        
        consoleOutput += `Введен пароль: ${printedValue}\n`;
        
        if (printedValue === currentPassword) {
            consoleOutput += `Пароль верный! Доступ получен.\n`;
            verifyBlockTouched = true;
            messageElement.textContent = "Пароль верный! Уровень завершен!";
            
            outputDisplay.innerHTML = consoleOutput.replace(/\n/g, '<br>');
            drawGamePart3Combined();
            
            // 🔥 Возвращаем win: true, чтобы executeCode немедленно остановился и показал модальное окно
            return { success: true, win: true }; 
            
        } else {
            consoleOutput += `Пароль неверный! Попробуйте снова.\n`;
            outputDisplay.innerHTML = consoleOutput.replace(/\n/g, '<br>');
            messageElement.textContent = "Неверный пароль. Попробуйте снова. Пароль был: " + currentPassword; // Добавлена подсказка
            return { success: true, win: false }; // Успешный синтаксис, но неверный пароль
        }
    }
    
    // Если это команда print(), но не соответствует ни одному из сценариев взаимодействия
    if (line.startsWith('print')) {
         // Попытка стандартного print
         if (emulatePrint(line)) {
            return { success: true, win: false };
         }
         return { success: false, win: false }; // Ошибка синтаксиса
    }

    return { success: false, win: false }; 
}

function checkPrintResult(playerCode, levelAnswer) {
    // ... (логика проверки print() для 3.1-3.5 без изменений) ...
    consoleOutput = "";
    outputDisplay.innerHTML = '';
    
    const lines = playerCode.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    for (const line of lines) {
        const assignmentMatch = line.match(/^(\w+)\s*=\s*(.*)/);
        if (assignmentMatch) {
            const varName = assignmentMatch[1];
            const valueStr = assignmentMatch[2].trim();
            
            let value = evaluatePythonExpression(valueStr, pythonVariables);
            pythonVariables[varName] = value;
            continue;
        }

        if (line.startsWith('print')) {
            if (!emulatePrint(line)) {
                return { success: false, message: `Ошибка: Некорректный синтаксис print() в строке: ${line}` };
            }
        }
    }
    
    const expected = levelAnswer.requiredOutput;
    const actual = consoleOutput;
    
    if (actual === expected) {
        return { success: true, message: "Правильно! Вывод соответствует ожидаемому." };
    } else {
        let detailMessage = `Ожидаемый вывод: \n>>> ${expected.replace(/\n/g, '[новая строка]\n>>> ')}\n`;
        detailMessage += `Ваш вывод: \n>>> ${actual.replace(/\n/g, '[новая строка]\n>>> ')}`;
        return { success: false, message: `Вывод не соответствует заданию! \n${detailMessage}` };
    }
}

function evaluatePythonExpression(expression, variables) {
    // ... (логика оценки выражений без изменений) ...
    try {
        let jsExpression = expression.replace(/(\w+)/g, (match) => {
            if (variables.hasOwnProperty(match)) {
                if (typeof variables[match] === 'string') {
                    return `'${variables[match]}'`;
                }
                return variables[match];
            }
            return match;
        });

        jsExpression = jsExpression.replace(/True/g, 'true').replace(/False/g, 'false');

        let result = eval(jsExpression);

        if (typeof result === 'boolean') {
            return result ? 'True' : 'False';
        }

        return result;

    } catch (e) {
        return expression; 
    }
}

// --- ФУНКЦИЯ: Режим Учителя ---

function handleTeacherMode() {
    const password = prompt("Режим Учителя: Введите пароль для доступа к уровням.");
    
    if (password !== TEACHER_PASSWORD) {
        messageElement.textContent = "Неверный пароль. Доступ запрещен.";
        return;
    }
    
    const targetLevelInput = prompt(
        `Пароль верный! Введите целевой уровень для перехода.
        
        Формат: Урок.Уровень (напр., 1.5, 2.7 или 3.2)
        Урок 1: 1.1 - 1.10
        Урок 2: 2.1 - 2.10
        Урок 3: 3.1 - 3.10`
    );

    if (!targetLevelInput) {
        messageElement.textContent = "Переход отменен.";
        return;
    }

    const [partStr, levelStr] = targetLevelInput.split('.');
    const targetPart = parseInt(partStr);
    const targetSubLevel = parseInt(levelStr);

    if (isNaN(targetPart) || isNaN(targetSubLevel)) {
        messageElement.textContent = "Неверный формат ввода. Используйте формат: ЧАСТЬ.УРОВЕНЬ (например, 1.5).";
        return;
    }

    let targetLevelIndex = -1;
    let maxLevelIndex = 0;
    
    if (targetPart === 1) {
        maxLevelIndex = PART_1_LEVELS.length;
        targetLevelIndex = targetSubLevel - 1;
    } else if (targetPart === 2) {
        maxLevelIndex = PART_2_LEVELS.length;
        targetLevelIndex = targetSubLevel - 1;
    } else if (targetPart === 3) {
        maxLevelIndex = PART_3_LEVELS.length;
        targetLevelIndex = targetSubLevel - 1;
    } else {
        messageElement.textContent = "Неизвестный номер урока. Доступны только Урок 1, 2 и 3.";
        return;
    }

    if (targetLevelIndex < 0 || targetLevelIndex >= maxLevelIndex) {
        messageElement.textContent = `Урок ${targetPart} имеет уровни от 1 до ${maxLevelIndex}. Введите корректный номер.`;
        return;
    }

    currentPart = targetPart;
    currentLevel = targetLevelIndex;
    messageElement.textContent = `Переход на Урок ${targetPart}, Уровень ${targetSubLevel}.`;
    
    winModal.style.display = 'none';
    introScreen.style.display = 'none';
    gameContainer.style.opacity = '1';
    
    startGame(currentLevel); 
}

// --- Главная Функция Выполнения Кода ---

window.executeCode = async function() {
    const code = codeInput.value.trim();
    messageElement.textContent = ''; 
    
    if (code.toLowerCase() === 'go') {
        handleTeacherMode();
        codeInput.value = ''; 
        return;
    }

    if (currentPart === 1) {
        // Логика Урока 1 (Присваивание И Линейные Алгоритмы)
        const levelData = PART_1_LEVELS[currentLevel];
        
        if (levelData.checkType === 'assignment' || levelData.checkType === 'assignment_expr') {
            // Старая логика проверки присваивания
            if (checkAssignment(code, levelData.answer)) { 
                messageElement.textContent = `Правильно! Код выполнен.`;
                
                // Сохраняем прогресс
                await saveProgressToGoogleSheets('update');
                
                if (currentLevel + 1 === PART_1_LEVELS.length) {
                    showWinModal(true); 
                } else {
                    showWinModal(false); 
                }
            } else {
                messageElement.textContent = `Неправильно! Проверь количество строк, синтаксис (кавычки для текста) и операторы.`;
            }
        } else if (levelData.checkType === 'linear_algo') {
            // НОВАЯ логика проверки линейных алгоритмов
            const result = checkLinearAlgo(code, levelData);
            outputDisplay.innerHTML = consoleOutput.replace(/\n/g, '<br>'); // Обновляем консоль после эмуляции
            messageElement.textContent = result.message;
            
            if (result.success) {
                // Сохраняем прогресс
                await saveProgressToGoogleSheets('update');
                
                if (currentLevel + 1 === PART_1_LEVELS.length) {
                    showWinModal(true); 
                } else {
                    showWinModal(false); 
                }
            }
        }

    } else if (currentPart === 2) {
        // Логика Урока 2
        const lines = code.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        let success = true;

        for (const line of lines) {
            if (!success) break; 

            if (line === 'move = int(input())') {
                // Имитация int(input()) для движения
                const inputSteps = prompt(`>>> ${line}\nСколько шагов сделать (введите ЦЕЛОЕ ЧИСЛО)?`);
                if (inputSteps !== null && inputSteps.trim() !== "") {
                    const steps = parseInt(inputSteps);
                    success = fakeMoveInput(steps, drawGamePart2);
                } else { 
                    messageElement.textContent = "Движение отменено. Выполнение кода остановлено.";
                    success = false; 
                }

            } else if (line === 'turn = input()') {
                const inputDir = prompt(`>>> ${line}\nКуда повернуть (введите 'вправо', 'влево', 'вверх' или 'вниз')?`);
                if (inputDir !== null && inputDir.trim() !== "") {
                     success = fakeTurnInput(inputDir, drawGamePart2);
                } else { 
                    messageElement.textContent = "Поворот отменен. Выполнение кода остановлено.";
                    success = false; 
                }

            } else {
                messageElement.textContent = `Ошибка синтаксиса на строке "${line}"! Должно быть: move = int(input()) или turn = input()`;
                success = false;
            }
        }
        
        if (success) {
            messageElement.textContent = `Код успешно выполнен.`;
            setTimeout(async () => {
                // checkWin() от Урока 2
                const target = PART_2_LEVELS[currentLevel];
                const playerCenter = { x: playerX + PLAYER_SIZE / 2, y: playerY + PLAYER_SIZE / 2 };
                const targetArea = {
                    x: target.targetX, y: target.targetY,
                    width: PLAYER_SIZE, height: PLAYER_SIZE
                };

                if (playerCenter.x >= targetArea.x && playerCenter.x <= targetArea.x + targetArea.width &&
                    playerCenter.y >= targetArea.y && playerCenter.y <= targetArea.y + targetArea.height) {
                    
                    // Сохраняем прогресс
                    await saveProgressToGoogleSheets('update');
                    
                    if (currentLevel + 1 === PART_2_LEVELS.length) {
                        showWinModal(true); 
                    } else {
                        showWinModal(false);
                    }
                }
            }, 100); 
        } 

    } else if (currentPart === 3) {
        const levelData = PART_3_LEVELS[currentLevel];
        
        if (levelData.type === 'print') {
            // Уровни 3.1-3.5 (Только print)
            const result = checkPrintResult(code, levelData);
            messageElement.textContent = result.message;
            
            if (result.success) {
                // Сохраняем прогресс
                await saveProgressToGoogleSheets('update');
                
                 if (currentLevel + 1 === PART_3_LEVELS.length) {
                    showWinModal(true); 
                } else {
                    showWinModal(false); 
                }
            }
        } else if (levelData.type === 'combined') {
            // Уровни 3.6-3.10 (Комбинированные)
            const lines = code.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            let success = true;

            for (const line of lines) {
                
                if (!success) break; 

                if (line.startsWith('move = int(input())')) {
                    const inputSteps = prompt(`>>> ${line}\nСколько шагов сделать (введите число)?`);
                    if (inputSteps !== null && inputSteps.trim() !== "") {
                        const steps = parseInt(inputSteps);
                        success = fakeMoveInput(steps, drawGamePart3Combined);
                    } else { 
                        messageElement.textContent = "Движение отменено. Выполнение кода остановлено.";
                        success = false; 
                    }

                } else if (line.startsWith('turn = input()')) {
                    const inputDir = prompt(`>>> ${line}\nКуда повернуть (введите 'вправо', 'влево', 'вверх' или 'вниз')?`);
                    if (inputDir !== null && inputDir.trim() !== "") {
                         success = fakeTurnInput(inputDir, drawGamePart3Combined);
                    } else { 
                        messageElement.textContent = "Поворот отменен. Выполнение кода остановлено.";
                        success = false; 
                    }

                } else if (line.startsWith('print')) {
                    // Обработка print() для взаимодействия с блоками
                    const printResult = emulatePrintPassword(line, levelData);
                    success = printResult.success;
                    
                    // ЕСЛИ ПАРОЛЬ ВВЕДЕН ВЕРНО -> НЕМЕДЛЕННЫЙ ВЫХОД
                    if (printResult.win) {
                        // Сохраняем прогресс
                        await saveProgressToGoogleSheets('update');
                        checkWinPart3Combined(); // Показывает модальное окно
                        return; // 🛑 Прерываем выполнение executeCode полностью
                    }
                    
                } else {
                    messageElement.textContent = `Ошибка синтаксиса на строке "${line}"! Должно быть: move = int(input()), turn = input(), или print(...)`;
                    success = false;
                }
            }
            
            // Финальная проверка после выполнения всех команд, если победа не была обработана внутри цикла
            if (success) { 
                // Не показываем сообщение "Код успешно выполнен", если только что завершили уровень.
                // Сообщение о завершении уровня будет в checkWinPart3Combined().
                if (!messageElement.textContent.includes('Пароль верный')) {
                    messageElement.textContent = `Код успешно выполнен. Проверьте консоль и положение.`;
                }
            }
        }
    }
}

// --- Запуск игры при загрузке страницы ---
lessonTitle.textContent = 'Уроки Python 8 класс';

showIntroScreen();




