// ==================== FIREBASE КОНФИГУРАЦИЯ ====================
const firebaseConfig = {
    apiKey: "AIzaSyBTibyssRECMbEuTlCJWBqTWUTI_vhetFA",
    authDomain: "eduaipro-546b7.firebaseapp.com",
    projectId: "eduaipro-546b7",
    storageBucket: "eduaipro-546b7.firebasestorage.app",
    messagingSenderId: "184005321510",
    appId: "1:184005321510:web:537c974f4bfa9040e997e7",
    measurementId: "G-89Y5P1WR9T"
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================
let currentUser = null;

// ==================== ДОСТИЖЕНИЯ (ACHIEVEMENTS) ====================
const achievementsList = [
    { id: 'first_course', name: '🌱 Первые шаги', description: 'Пройден первый курс', icon: 'fa-seedling', condition: (stats) => stats.totalCourses >= 1 },
    { id: 'beginner', name: '📚 Ученик', description: 'Пройдено 3 курса', icon: 'fa-graduation-cap', condition: (stats) => stats.totalCourses >= 3 },
    { id: 'enthusiast', name: '🔥 Энтузиаст', description: 'Пройдено 5 курсов', icon: 'fa-fire', condition: (stats) => stats.totalCourses >= 5 },
    { id: 'expert', name: '🏆 Эксперт', description: 'Пройдено 10 курсов', icon: 'fa-trophy', condition: (stats) => stats.totalCourses >= 10 },
    { id: 'master', name: '👑 Мастер', description: 'Пройдено 15 курсов', icon: 'fa-crown', condition: (stats) => stats.totalCourses >= 15 },
    { id: 'perfect_score', name: '⭐ Идеальный результат', description: '100% на практическом задании', icon: 'fa-star', condition: (stats) => stats.perfectScores >= 1 },
    { id: 'streak_3', name: '📅 3 дня подряд', description: 'Учитесь 3 дня подряд', icon: 'fa-calendar-check', condition: (stats) => stats.streak >= 3 },
    { id: 'streak_7', name: '📅 7 дней подряд', description: 'Учитесь 7 дней подряд', icon: 'fa-calendar-week', condition: (stats) => stats.streak >= 7 },
    { id: 'streak_30', name: '📅 30 дней подряд', description: 'Учитесь 30 дней подряд', icon: 'fa-calendar-alt', condition: (stats) => stats.streak >= 30 },
    { id: 'frontend_dev', name: '🎨 Frontend-разработчик', description: 'Пройден курс по фронтенду', icon: 'fa-code', condition: (stats) => stats.courseCategories?.frontend >= 1 },
    { id: 'backend_dev', name: '⚙️ Backend-разработчик', description: 'Пройден курс по бекенду', icon: 'fa-server', condition: (stats) => stats.courseCategories?.backend >= 1 },
    { id: 'fullstack', name: '🌐 Fullstack-разработчик', description: 'Пройдены и фронтенд, и бекенд', icon: 'fa-layer-group', condition: (stats) => stats.courseCategories?.frontend >= 1 && stats.courseCategories?.backend >= 1 },
    { id: 'database_guru', name: '🗄️ Гуру баз данных', description: 'Пройдены 2 курса по БД', icon: 'fa-database', condition: (stats) => stats.courseCategories?.database >= 2 },
    { id: 'pythonista', name: '🐍 Pythonista', description: 'Пройден курс Python', icon: 'fa-python', condition: (stats) => stats.courseTitles?.includes('Python с нуля до профи') },
    { id: 'js_ninja', name: '🥷 JS Ninja', description: 'Пройден курс JavaScript/TypeScript', icon: 'fa-js', condition: (stats) => stats.courseTitles?.includes('JavaScript/TypeScript полный курс') },
    { id: 'react_master', name: '⚛️ React Master', description: 'Пройден курс React.js', icon: 'fa-react', condition: (stats) => stats.courseTitles?.includes('React.js с хуками и контекстом') }
];

// Функция для получения количества уроков (работает и с массивом, и с числом)
function getLessonsCount(course) {
    if (Array.isArray(course.lessons)) {
        return course.lessons.length;
    }
    return course.lessons || 5;
}

// Функция для обновления достижений пользователя
function updateUserAchievements(userId, courseProgressList) {
    let totalCourses = 0;
    let perfectScores = 0;
    let courseCategories = { frontend: 0, backend: 0, database: 0, programming: 0, devops: 0 };
    let courseTitles = [];
    
    for (const progress of courseProgressList) {
        if (progress.completed) {
            totalCourses++;
            if (progress.quizScore === 100) perfectScores++;
            const course = coursesData.find(c => c.id === progress.courseId);
            if (course) {
                courseTitles.push(course.title);
                if (course.category) {
                    courseCategories[course.category] = (courseCategories[course.category] || 0) + 1;
                }
            }
        }
    }
    
    const streak = calculateStreak(courseProgressList.filter(p => p.completed));
    
    const stats = {
        totalCourses,
        perfectScores,
        streak,
        courseCategories,
        courseTitles
    };
    
    const earnedAchievements = [];
    for (const ach of achievementsList) {
        if (ach.condition(stats)) {
            earnedAchievements.push(ach.id);
        }
    }
    
    localStorage.setItem(`achievements_${userId}`, JSON.stringify(earnedAchievements));
    
    const previousAchievements = JSON.parse(localStorage.getItem(`achievements_${userId}_prev`) || '[]');
    const newAchievements = earnedAchievements.filter(a => !previousAchievements.includes(a));
    if (newAchievements.length > 0) {
        showAchievementNotification(newAchievements.map(id => achievementsList.find(a => a.id === id)));
        localStorage.setItem(`achievements_${userId}_prev`, JSON.stringify(earnedAchievements));
    }
    
    return earnedAchievements;
}

function showAchievementNotification(newAchievements) {
    for (const ach of newAchievements) {
        const notification = document.createElement('div');
        notification.className = 'fixed bottom-4 right-4 bg-card border border-accent-primary rounded-xl p-4 shadow-2xl z-50 animate-bounce-in';
        notification.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-accent-primary/20 rounded-full flex items-center justify-center">
                    <i class="fas ${ach.icon} text-accent-primary text-2xl"></i>
                </div>
                <div>
                    <p class="text-xs text-accent-primary">Новое достижение!</p>
                    <p class="font-bold text-white">${ach.name}</p>
                    <p class="text-xs text-gray-400">${ach.description}</p>
                </div>
            </div>
        `;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.5s';
            setTimeout(() => notification.remove(), 500);
        }, 4000);
    }
}

function getUserAchievements(userId) {
    const saved = localStorage.getItem(`achievements_${userId}`);
    return saved ? JSON.parse(saved) : [];
}

// ==================== РАСШИРЕННЫЕ IT-КУРСЫ ====================
const coursesData = [
    { id: 1, title: 'Python с нуля до профи', description: 'Полный курс Python: от основ до продвинутых тем, ООП, библиотеки', icon: 'fa-python', category: 'programming', duration: '5 часов', 
        lessons: [
            { title: 'Установка и первая программа', content: '<p>Установите Python с официального сайта. Первая программа:</p><pre><code>print("Hello, Knowlly!")</code></pre>' },
            { title: 'Переменные и типы данных', content: '<p>В Python переменные создаются автоматически.</p><ul><li>int — целые числа</li><li>float — числа с плавающей точкой</li><li>str — строки</li><li>bool — логический тип</li></ul>' },
            { title: 'Условные операторы', content: '<p>if, elif, else для ветвления логики.</p><pre><code>if score >= 90:\n    print("Отлично!")\nelif score >= 75:\n    print("Хорошо")\nelse:\n    print("Нужно учиться")</code></pre>' },
            { title: 'Циклы for и while', content: '<p>Циклы для повторения операций.</p><pre><code>for i in range(5):\n    print(i)\n\nwhile count < 5:\n    print(count)\n    count += 1</code></pre>' },
            { title: 'Функции', content: '<p>Функции для организации кода.</p><pre><code>def greet(name):\n    return f"Привет, {name}!"</code></pre>' },
            { title: 'Списки и срезы', content: '<p>Работа со списками.</p><pre><code>numbers = [1, 2, 3, 4, 5]\nnumbers.append(6)\nfirst_two = numbers[:2]</code></pre>' },
            { title: 'Объектно-ориентированное программирование', content: '<p>Классы и объекты.</p><pre><code>class Student:\n    def __init__(self, name):\n        self.name = name</code></pre>' },
            { title: 'Работа с файлами и модулями', content: '<p>Чтение и запись файлов, импорт модулей.</p><pre><code>with open("file.txt", "w") as f:\n    f.write("Hello!")</code></pre>' }
        ],
        quiz: [
            { question: 'Какой оператор используется для вывода в Python?', options: ['input()', 'print()', 'output()', 'write()'], correct: 1 },
            { question: 'Какой тип данных используется для целых чисел?', options: ['str', 'int', 'float', 'bool'], correct: 1 },
            { question: 'Как создать список в Python?', options: ['{}', '[]', '()', '<>'], correct: 1 },
            { question: 'Что делает функция len()?', options: ['Сортирует', 'Возвращает длину', 'Удаляет элемент', 'Добавляет элемент'], correct: 1 },
            { question: 'Какой цикл используется для перебора элементов?', options: ['while', 'for', 'do-while', 'foreach'], correct: 1 },
            { question: 'Как объявить функцию в Python?', options: ['func myFunc():', 'def myFunc():', 'function myFunc():', 'create myFunc():'], correct: 1 }
        ]
    },
    { id: 2, title: 'JavaScript/TypeScript полный курс', description: 'Современный JavaScript, TypeScript, асинхронность, React основы', icon: 'fa-js', category: 'programming', duration: '6 часов',
        lessons: [
            { title: 'Введение в JavaScript', content: '<pre><code>console.log("Hello, Knowlly!");\nlet name = "Knowlly";\nconst PI = 3.14;</code></pre>' },
            { title: 'Типы данных и операции', content: '<p>Основные типы: string, number, boolean, null, undefined, object, array.</p>' },
            { title: 'Функции и стрелочные функции', content: '<pre><code>const sum = (a, b) => a + b;\nfunction multiply(a, b) { return a * b; }</code></pre>' },
            { title: 'Массивы и объекты', content: '<pre><code>const arr = [1, 2, 3];\nconst obj = { name: "Knowlly" };</code></pre>' },
            { title: 'Асинхронность: Promises и async/await', content: '<pre><code>const data = await fetchData();</code></pre>' },
            { title: 'TypeScript: типы и интерфейсы', content: '<pre><code>interface User {\n    id: number;\n    name: string;\n}</code></pre>' },
            { title: 'DOM манипуляции и события', content: '<pre><code>element.addEventListener("click", () => {})</code></pre>' },
            { title: 'Модули и сборка', content: '<pre><code>export const PI = 3.14;\nimport { PI } from "./math";</code></pre>' }
        ],
        quiz: [
            { question: 'Как объявить переменную в JS?', options: ['var', 'let', 'const', 'Все варианты'], correct: 3 },
            { question: 'Что такое замыкание?', options: ['Цикл', 'Функция с доступом к внешней области', 'Массив', 'Объект'], correct: 1 },
            { question: 'Какой метод превращает JSON в объект?', options: ['JSON.stringify()', 'JSON.parse()', 'JSON.toObject()', 'JSON.convert()'], correct: 1 },
            { question: 'Что делает оператор `===`?', options: ['Присваивание', 'Строгое сравнение', 'Нестрогое сравнение', 'Сложение'], correct: 1 },
            { question: 'Как создать промис?', options: ['new Promise()', 'Promise.create()', 'new Async()', 'Promise()'], correct: 0 },
            { question: 'Что делает метод map()?', options: ['Фильтрует массив', 'Преобразует каждый элемент', 'Сортирует массив', 'Находит элемент'], correct: 1 }
        ]
    },
    { id: 3, title: 'Базы данных SQL (PostgreSQL/MySQL)', description: 'SQL запросы, индексы, транзакции, оптимизация', icon: 'fa-database', category: 'database', duration: '4 часа',
        lessons: [
            { title: 'Введение в SQL', content: '<p>SQL — язык структурированных запросов.</p>' },
            { title: 'SELECT и фильтрация', content: '<pre><code>SELECT * FROM users WHERE age > 18;</code></pre>' },
            { title: 'Сортировка и группировка', content: '<pre><code>SELECT category, COUNT(*) FROM products GROUP BY category;</code></pre>' },
            { title: 'JOIN и объединение таблиц', content: '<pre><code>SELECT * FROM orders JOIN users ON orders.user_id = users.id;</code></pre>' },
            { title: 'Подзапросы и CTE', content: '<pre><code>SELECT * FROM products WHERE price > (SELECT AVG(price) FROM products);</code></pre>' },
            { title: 'Индексы и оптимизация', content: '<pre><code>CREATE INDEX idx_email ON users(email);</code></pre>' },
            { title: 'Транзакции и ACID', content: '<pre><code>BEGIN TRANSACTION; COMMIT; ROLLBACK;</code></pre>' }
        ],
        quiz: [
            { question: 'Что означает SQL?', options: ['Structured Query Language', 'Simple Query Language', 'Standard Query Logic', 'System Query Language'], correct: 0 },
            { question: 'Какой оператор для выборки данных?', options: ['INSERT', 'UPDATE', 'SELECT', 'DELETE'], correct: 2 },
            { question: 'Что такое первичный ключ?', options: ['Уникальный идентификатор', 'Внешний ключ', 'Индекс', 'Триггер'], correct: 0 },
            { question: 'Что делает WHERE?', options: ['Фильтрует строки', 'Сортирует', 'Группирует', 'Объединяет'], correct: 0 },
            { question: 'Какой JOIN возвращает только совпадающие записи?', options: ['LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'FULL JOIN'], correct: 2 },
            { question: 'Что такое индекс в БД?', options: ['Ускоряет поиск', 'Замедляет поиск', 'Тип данных', 'Ключ'], correct: 0 }
        ]
    },
    { id: 4, title: 'MongoDB и NoSQL', description: 'Документо-ориентированные БД, агрегации, масштабирование', icon: 'fa-leaf', category: 'database', duration: '3.5 часа',
        lessons: [
            { title: 'Введение в MongoDB', content: '<p>MongoDB — документо-ориентированная NoSQL база данных.</p>' },
            { title: 'CRUD операции', content: '<pre><code>db.users.insertOne({ name: "Alice" });\ndb.users.find({ age: { $gt: 25 } });</code></pre>' },
            { title: 'Запросы и фильтрация', content: '<pre><code>db.users.find({ $or: [{ age: { $lt: 18 } }, { age: { $gt: 65 } }] });</code></pre>' },
            { title: 'Агрегации', content: '<pre><code>db.orders.aggregate([{ $match: { status: "completed" } }, { $group: { _id: "$customerId", total: { $sum: "$amount" } } }]);</code></pre>' },
            { title: 'Индексы в MongoDB', content: '<pre><code>db.users.createIndex({ email: 1 });</code></pre>' },
            { title: 'Репликация и шардирование', content: '<p>Масштабирование MongoDB: репликация для отказоустойчивости, шардирование для горизонтального масштабирования.</p>' }
        ],
        quiz: [
            { question: 'Как хранятся данные в MongoDB?', options: ['Таблицы', 'Документы JSON', 'Графы', 'Ключ-значение'], correct: 1 },
            { question: 'Что такое _id в MongoDB?', options: ['Первичный ключ', 'Индекс', 'Связь', 'Тип'], correct: 0 },
            { question: 'Какой метод для поиска?', options: ['find()', 'search()', 'select()', 'get()'], correct: 0 },
            { question: 'Что такое коллекция?', options: ['База данных', 'Аналог таблицы', 'Документ', 'Поле'], correct: 1 },
            { question: 'Что делает оператор $group?', options: ['Группирует документы', 'Фильтрует', 'Сортирует', 'Ограничивает'], correct: 0 },
            { question: 'Что такое шардирование?', options: ['Горизонтальное масштабирование', 'Вертикальное', 'Резервирование', 'Шифрование'], correct: 0 }
        ]
    },
    { id: 5, title: 'Веб-разработка (HTML, CSS, Flexbox, Grid)', description: 'Современная вёрстка, адаптивность, анимации', icon: 'fa-globe', category: 'frontend', duration: '4 часа',
        lessons: [
            { title: 'HTML5 основы', content: '<pre><code>&lt;!DOCTYPE html&gt;\n&lt;html&gt;&lt;head&gt;&lt;title&gt;Страница&lt;/title&gt;&lt;/head&gt;&lt;body&gt;&lt;h1&gt;Заголовок&lt;/h1&gt;&lt;/body&gt;&lt;/html&gt;</code></pre>' },
            { title: 'CSS3 стилизация', content: '<pre><code>body { font-family: Arial; }\n.container { max-width: 1200px; margin: 0 auto; }</code></pre>' },
            { title: 'Flexbox', content: '<pre><code>.container { display: flex; justify-content: space-between; align-items: center; }</code></pre>' },
            { title: 'CSS Grid', content: '<pre><code>.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }</code></pre>' },
            { title: 'Адаптивный дизайн', content: '<pre><code>@media (max-width: 768px) { .container { padding: 0 15px; } }</code></pre>' },
            { title: 'Анимации и transitions', content: '<pre><code>.card { transition: transform 0.3s; }\n.card:hover { transform: translateY(-10px); }</code></pre>' },
            { title: 'CSS переменные', content: '<pre><code>:root { --primary-color: #BB86FC; }\n.button { background: var(--primary-color); }</code></pre>' }
        ],
        quiz: [
            { question: 'Что означает HTML?', options: ['Hyper Text Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyper Transfer Markup Language'], correct: 0 },
            { question: 'Какой тег для ссылки?', options: ['<link>', '<a>', '<href>', '<url>'], correct: 1 },
            { question: 'Как подключить CSS?', options: ['<style>', '<css>', '<link>', '<script>'], correct: 2 },
            { question: 'Что такое Flexbox?', options: ['Система верстки', 'База данных', 'Язык', 'Фреймворк'], correct: 0 },
            { question: 'Как сделать адаптивность?', options: ['Media Queries', 'JavaScript', 'PHP', 'SQL'], correct: 0 },
            { question: 'Что делает свойство display: none?', options: ['Скрывает элемент', 'Удаляет', 'Делает невидимым', 'Блокирует'], correct: 0 }
        ]
    },
    { id: 6, title: 'React.js с хуками и контекстом', description: 'Компоненты, хуки, состояние, роутинг, Redux', icon: 'fa-react', category: 'frontend', duration: '6 часов',
        lessons: [
            { title: 'Введение в React и JSX', content: '<pre><code>function App() { return &lt;h1&gt;Hello Knowlly!&lt;/h1&gt;; }</code></pre>' },
            { title: 'Компоненты и Props', content: '<pre><code>function Greeting({ name }) { return &lt;p&gt;Hello, {name}!&lt;/p&gt;; }</code></pre>' },
            { title: 'useState — управление состоянием', content: '<pre><code>const [count, setCount] = useState(0);</code></pre>' },
            { title: 'useEffect — побочные эффекты', content: '<pre><code>useEffect(() => { fetchData(); }, []);</code></pre>' },
            { title: 'useContext — глобальное состояние', content: '<pre><code>const theme = useContext(ThemeContext);</code></pre>' },
            { title: 'React Router DOM', content: '<pre><code>&lt;Route path="/" element={&lt;Home /&gt;} /&gt;</code></pre>' },
            { title: 'Redux Toolkit', content: '<pre><code>const store = configureStore({ reducer });</code></pre>' },
            { title: 'Оптимизация: memo, useCallback, useMemo', content: '<pre><code>const memoizedValue = useMemo(() => compute(data), [data]);</code></pre>' }
        ],
        quiz: [
            { question: 'Что такое React?', options: ['Библиотека UI', 'Фреймворк', 'Язык', 'База данных'], correct: 0 },
            { question: 'Что такое JSX?', options: ['Расширение JS', 'CSS', 'HTML', 'JSON'], correct: 0 },
            { question: 'Что такое useState?', options: ['Хук состояния', 'Хук эффекта', 'Хук контекста', 'Хук рефа'], correct: 0 },
            { question: 'Что такое useEffect?', options: ['Хук для побочных эффектов', 'Хук состояния', 'Хук рефа', 'Хук контекста'], correct: 0 },
            { question: 'Что делает React.memo?', options: ['Мемоизация компонента', 'Создание', 'Удаление', 'Обновление'], correct: 0 },
            { question: 'Что такое Virtual DOM?', options: ['Копия DOM в памяти', 'Настоящий DOM', 'CSSOM', 'Shadow DOM'], correct: 0 }
        ]
    },
    { id: 7, title: 'Node.js и Express (Backend)', description: 'Серверная разработка, REST API, middleware, JWT', icon: 'fa-node', category: 'backend', duration: '5 часов',
        lessons: [
            { title: 'Введение в Node.js', content: '<pre><code>const http = require("http");\nhttp.createServer((req, res) => res.end("Hello")).listen(3000);</code></pre>' },
            { title: 'Express.js основы', content: '<pre><code>const express = require("express");\nconst app = express();\napp.get("/", (req, res) => res.send("Hello"));</code></pre>' },
            { title: 'Маршрутизация и параметры', content: '<pre><code>app.get("/users/:id", (req, res) => res.json({ id: req.params.id }));</code></pre>' },
            { title: 'Middleware в Express', content: '<pre><code>app.use((req, res, next) => { console.log(req.method); next(); });</code></pre>' },
            { title: 'JWT аутентификация', content: '<pre><code>const token = jwt.sign({ id: user.id }, SECRET);</code></pre>' },
            { title: 'Работа с базами данных', content: '<pre><code>const result = await pool.query("SELECT * FROM users");</code></pre>' },
            { title: 'WebSockets с Socket.io', content: '<pre><code>io.on("connection", (socket) => { socket.on("message", (data) => io.emit("message", data)); });</code></pre>' }
        ],
        quiz: [
            { question: 'Что такое Node.js?', options: ['Среда JS на сервере', 'Библиотека', 'Фреймворк', 'База данных'], correct: 0 },
            { question: 'Какой модуль для сервера?', options: ['http', 'fs', 'path', 'os'], correct: 0 },
            { question: 'Что такое npm?', options: ['Менеджер пакетов', 'Язык', 'База данных', 'Сервер'], correct: 0 },
            { question: 'Что такое Express?', options: ['Фреймворк', 'База данных', 'ORM', 'Шаблонизатор'], correct: 0 },
            { question: 'Что такое middleware?', options: ['Промежуточное ПО', 'База данных', 'Роутер', 'Контроллер'], correct: 0 },
            { question: 'Что такое JWT?', options: ['JSON Web Token', 'База данных', 'Шифрование', 'Формат'], correct: 0 }
        ]
    },
    { id: 8, title: 'Docker и контейнеризация', description: 'Контейнеры, Dockerfile, docker-compose, Kubernetes', icon: 'fa-docker', category: 'devops', duration: '4 часа',
        lessons: [
            { title: 'Что такое Docker?', content: '<p>Docker — платформа для контейнеризации приложений.</p>' },
            { title: 'Dockerfile', content: '<pre><code>FROM node:18\nWORKDIR /app\nCOPY . .\nRUN npm install\nCMD ["npm", "start"]</code></pre>' },
            { title: 'Docker команды', content: '<pre><code>docker build -t my-app .\ndocker run -p 3000:3000 my-app</code></pre>' },
            { title: 'Docker Compose', content: '<pre><code>services:\n  app:\n    build: .\n    ports:\n      - "3000:3000"</code></pre>' },
            { title: 'Volumes и сети', content: '<pre><code>docker volume create my-volume\ndocker network create my-network</code></pre>' },
            { title: 'Введение в Kubernetes', content: '<p>Kubernetes — оркестрация контейнеров. Pod, Deployment, Service.</p>' }
        ],
        quiz: [
            { question: 'Что такое Docker?', options: ['Платформа контейнеризации', 'База данных', 'Язык программирования', 'Фреймворк'], correct: 0 },
            { question: 'Какой файл описывает сборку образа?', options: ['Dockerfile', 'docker-compose.yml', 'package.json', 'config.yml'], correct: 0 },
            { question: 'Какая команда собирает образ?', options: ['docker build', 'docker run', 'docker create', 'docker start'], correct: 0 },
            { question: 'Что делает docker-compose?', options: ['Запуск нескольких контейнеров', 'Сборка образов', 'Удаление контейнеров', 'Логирование'], correct: 0 },
            { question: 'Что такое контейнер?', options: ['Изолированное окружение', 'Виртуальная машина', 'Сервер', 'База данных'], correct: 0 },
            { question: 'Что такое Kubernetes?', options: ['Оркестрация контейнеров', 'База данных', 'Язык', 'Фреймворк'], correct: 0 }
        ]
    },
    { id: 9, title: 'Git и GitHub (контроль версий)', description: 'Система контроля версий, ветвление, совместная работа', icon: 'fa-git-alt', category: 'devops', duration: '3 часа',
        lessons: [
            { title: 'Основы Git', content: '<pre><code>git init\ngit add .\ngit commit -m "message"\ngit status\ngit log</code></pre>' },
            { title: 'Ветвление (Branches)', content: '<pre><code>git branch feature\ngit checkout feature\ngit merge feature</code></pre>' },
            { title: 'Слияние и разрешение конфликтов', content: '<p>При конфликте нужно вручную разрешить и выполнить git add и git commit.</p>' },
            { title: 'Работа с удалённым репозиторием', content: '<pre><code>git remote add origin url\ngit push -u origin main\ngit pull origin main\ngit clone url</code></pre>' },
            { title: 'Pull Requests', content: '<p>Pull Request — запрос на слияние изменений на GitHub.</p>' },
            { title: 'Git Flow', content: '<p>main — продакшен, develop — разработка, feature/* — новые функции, hotfix/* — исправления.</p>' }
        ],
        quiz: [
            { question: 'Какая команда создаёт новый репозиторий?', options: ['git init', 'git start', 'git create', 'git new'], correct: 0 },
            { question: 'Какая команда показывает статус?', options: ['git status', 'git check', 'git log', 'git diff'], correct: 0 },
            { question: 'Как создать новую ветку?', options: ['git branch new', 'git checkout -b new', 'git branch -c new', 'git new-branch'], correct: 1 },
            { question: 'Как отправить изменения на GitHub?', options: ['git push', 'git pull', 'git commit', 'git send'], correct: 0 },
            { question: 'Что такое Pull Request?', options: ['Запрос на слияние', 'Запрос на удаление', 'Запрос на создание', 'Запрос на копирование'], correct: 0 },
            { question: 'Как клонировать репозиторий?', options: ['git clone', 'git copy', 'git download', 'git get'], correct: 0 }
        ]
    },
    { id: 10, title: 'API и RESTful сервисы', description: 'Проектирование API, REST принципы, OpenAPI, Postman', icon: 'fa-plug', category: 'backend', duration: '3.5 часа',
        lessons: [
            { title: 'Что такое REST API?', content: '<ul><li>GET — получение</li><li>POST — создание</li><li>PUT — обновление</li><li>DELETE — удаление</li></ul>' },
            { title: 'HTTP статусы', content: '<p>2xx — успех, 3xx — редирект, 4xx — ошибка клиента, 5xx — ошибка сервера</p>' },
            { title: 'Аутентификация в API', content: '<pre><code>headers: { "Authorization": "Bearer token" }</code></pre>' },
            { title: 'OpenAPI (Swagger) спецификация', content: '<p>Спецификация для описания API в формате YAML/JSON.</p>' },
            { title: 'Тестирование API с Postman', content: '<p>Postman — инструмент для тестирования и документации API.</p>' },
            { title: 'Rate Limiting и пагинация', content: '<pre><code>GET /api/users?page=2&limit=20</code></pre>' }
        ],
        quiz: [
            { question: 'Какой метод используется для получения данных?', options: ['GET', 'POST', 'PUT', 'DELETE'], correct: 0 },
            { question: 'Какой статус означает успешный GET запрос?', options: ['200', '201', '400', '404'], correct: 0 },
            { question: 'Какой статус означает не найдено?', options: ['200', '201', '400', '404'], correct: 3 },
            { question: 'Что такое REST?', options: ['Архитектурный стиль', 'База данных', 'Язык', 'Фреймворк'], correct: 0 },
            { question: 'Какой метод используется для создания ресурса?', options: ['GET', 'POST', 'PUT', 'DELETE'], correct: 1 },
            { question: 'Какой заголовок используется для авторизации Bearer?', options: ['Authorization', 'Auth', 'Token', 'Bearer'], correct: 0 }
        ]
    },
    { id: 11, title: 'TypeScript: продвинутый уровень', description: 'Типы, дженерики, утилиты, декораторы', icon: 'fa-code', category: 'programming', duration: '4 часа',
        lessons: [
            { title: 'Базовые типы и интерфейсы', content: '<pre><code>interface User { id: number; name: string; email?: string; }</code></pre>' },
            { title: 'Union, Intersection и Literal типы', content: '<pre><code>type Status = "pending" | "success" | "error";\ntype Worker = Person & Employee;</code></pre>' },
            { title: 'Дженерики (Generics)', content: '<pre><code>function identity<T>(arg: T): T { return arg; }</code></pre>' },
            { title: 'Utility Types', content: '<pre><code>Partial<T>, Required<T>, Readonly<T>, Pick<T, K>, Omit<T, K>, Record<K, T></code></pre>' },
            { title: 'Декораторы', content: '<pre><code>@sealed\nclass Greeter { }</code></pre>' },
            { title: 'Пространства имён и модули', content: '<pre><code>export const PI = 3.14;\nimport { PI } from "./math";</code></pre>' }
        ],
        quiz: [
            { question: 'Какой тип используется для опционального поля?', options: ['?', '!', '*', 'optional'], correct: 0 },
            { question: 'Что делает Partial<T>?', options: ['Делает все поля опциональными', 'Делает все поля обязательными', 'Удаляет поля', 'Добавляет поля'], correct: 0 },
            { question: 'Что такое дженерики?', options: ['Параметризованные типы', 'Функции', 'Классы', 'Интерфейсы'], correct: 0 },
            { question: 'Какой символ используется для Union?', options: ['|', '&', '?', '!'], correct: 0 },
            { question: 'Что делает Pick<T, K>?', options: ['Выбирает указанные поля', 'Удаляет поля', 'Делает поля опциональными', 'Добавляет поля'], correct: 0 },
            { question: 'Что такое interface?', options: ['Описание структуры объекта', 'Функция', 'Класс', 'Переменная'], correct: 0 }
        ]
    }
];

// Вспомогательная функция для получения количества уроков
function getLessonsCount(course) {
    if (Array.isArray(course.lessons)) {
        return course.lessons.length;
    }
    return course.lessons || 5;
}

// Функция для получения данных курса
function getCourseById(id) {
    return coursesData.find(c => c.id === id);
}

// Сохранение прогресса курса в localStorage
function saveCourseProgress(userId, courseId, completedLessons, quizScore, completed) {
    const progressKey = `course_progress_${userId}_${courseId}`;
    const progress = {
        userId,
        courseId,
        completedLessons: completedLessons || [],
        quizScore: quizScore || 0,
        completed: completed || false,
        lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(progressKey, JSON.stringify(progress));
    return progress;
}

function getCourseProgress(userId, courseId) {
    const progressKey = `course_progress_${userId}_${courseId}`;
    const saved = localStorage.getItem(progressKey);
    if (saved) {
        return JSON.parse(saved);
    }
    return {
        userId,
        courseId,
        completedLessons: [],
        quizScore: 0,
        completed: false,
        lastUpdated: null
    };
}

// ==================== ФУНКЦИИ АУТЕНТИФИКАЦИИ ====================
function updateAuthUI() {
    const authButtons = document.getElementById('authButtons');
    if (!authButtons) return;

    if (currentUser) {
        const isAdmin = currentUser.email === 'admin@eduaipro.com';
        authButtons.innerHTML = `
            <div class="relative">
                <button onclick="toggleUserMenu()" class="flex items-center space-x-2 px-4 py-2 bg-card border border-default rounded-lg hover:border-accent-primary transition">
                    <i class="fas fa-user-circle text-accent-primary text-xl"></i>
                    <span class="font-medium">${currentUser.displayName || currentUser.email}</span>
                    ${isAdmin ? '<span class="ml-2 text-xs bg-accent-primary text-black px-2 py-1 rounded-full">Admin</span>' : ''}
                </button>
                <div id="userMenu" class="hidden absolute right-0 mt-2 w-48 bg-card rounded-lg border border-default py-2 z-50">
                    ${isAdmin ? '<a href="admin.html" class="block px-4 py-2 text-accent-primary hover:bg-elevated transition"><i class="fas fa-shield-alt mr-2"></i>Админ-панель</a>' : ''}
                    <a href="dashboard.html" class="block px-4 py-2 text-gray-300 hover:bg-elevated transition">
                        <i class="fas fa-tachometer-alt mr-2"></i>Панель управления
                    </a>
                    <button onclick="logout()" class="w-full text-left px-4 py-2 text-red-500 hover:bg-elevated transition">
                        <i class="fas fa-sign-out-alt mr-2"></i>Выйти
                    </button>
                </div>
            </div>
        `;
    } else {
        authButtons.innerHTML = `
            <button onclick="showLogin()" class="px-4 py-2 text-accent-primary font-medium hover:text-white transition">Войти</button>
            <button onclick="showRegister()" class="px-6 py-2 btn-primary rounded-lg font-medium transition">Регистрация</button>
        `;
    }
}

function toggleUserMenu() {
    const menu = document.getElementById('userMenu');
    if (menu) menu.classList.toggle('hidden');
}

document.addEventListener('click', function(event) {
    const menu = document.getElementById('userMenu');
    const button = event.target.closest('button');
    if (menu && !menu.contains(event.target) && (!button || !button.onclick?.toString().includes('toggleUserMenu'))) {
        menu.classList.add('hidden');
    }
});

function showLogin() { document.getElementById('loginModal').classList.remove('hidden'); }
function showRegister() { document.getElementById('registerModal').classList.remove('hidden'); }
function closeModal(modalId) { document.getElementById(modalId).classList.add('hidden'); }
function switchToRegister() { closeModal('loginModal'); showRegister(); }
function switchToLogin() { closeModal('registerModal'); showLogin(); }

async function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await userCredential.user.updateProfile({ displayName: name });
        
        await db.collection('users').doc(userCredential.user.uid).set({
            uid: userCredential.user.uid,
            name: name,
            email: email,
            role: 'user',
            createdAt: new Date().toISOString()
        });
        
        currentUser = userCredential.user;
        closeModal('registerModal');
        updateAuthUI();
        window.location.href = 'dashboard.html';
    } catch (error) {
        alert('Ошибка регистрации: ' + error.message);
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        currentUser = userCredential.user;
        closeModal('loginModal');
        updateAuthUI();
        
        if (email === 'admin@eduaipro.com') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'dashboard.html';
        }
    } catch (error) {
        alert('Ошибка входа: ' + error.message);
    }
}

async function logout() {
    await auth.signOut();
    currentUser = null;
    updateAuthUI();
    window.location.href = 'index.html';
}

// ==================== СТРАНИЦА КУРСОВ ====================
function loadCourses() {
    const grid = document.getElementById('coursesGrid');
    if (!grid) return;
    
    grid.innerHTML = coursesData.map(course => {
        const lessonsCount = getLessonsCount(course);
        return `
            <div class="card-hover rounded-xl p-6">
                <div class="w-14 h-14 bg-elevated rounded-xl flex items-center justify-center mb-4">
                    <i class="fab ${course.icon} text-accent-primary text-2xl"></i>
                </div>
                <h3 class="text-xl font-bold mb-2 text-white">${course.title}</h3>
                <p class="text-gray-400 text-sm mb-3">${course.description}</p>
                <div class="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span><i class="far fa-clock mr-1"></i>${course.duration || '2 часа'}</span>
                    <span><i class="fas fa-book-open mr-1"></i>${lessonsCount} уроков</span>
                </div>
                <button onclick="openCourse(${course.id})" class="w-full py-2 btn-primary rounded-lg font-medium transition">
                    Начать обучение <i class="fas fa-arrow-right ml-2"></i>
                </button>
            </div>
        `;
    }).join('');
}

function filterCourses(category) {
    const grid = document.getElementById('coursesGrid');
    if (!grid) return;
    const filtered = category === 'all' ? coursesData : coursesData.filter(c => c.category === category);
    grid.innerHTML = filtered.map(course => {
        const lessonsCount = getLessonsCount(course);
        return `
            <div class="card-hover rounded-xl p-6">
                <div class="w-14 h-14 bg-elevated rounded-xl flex items-center justify-center mb-4">
                    <i class="fab ${course.icon} text-accent-primary text-2xl"></i>
                </div>
                <h3 class="text-xl font-bold mb-2 text-white">${course.title}</h3>
                <p class="text-gray-400 text-sm mb-3">${course.description}</p>
                <div class="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span><i class="far fa-clock mr-1"></i>${course.duration || '2 часа'}</span>
                    <span><i class="fas fa-book-open mr-1"></i>${lessonsCount} уроков</span>
                </div>
                <button onclick="openCourse(${course.id})" class="w-full py-2 btn-primary rounded-lg font-medium transition">
                    Начать обучение <i class="fas fa-arrow-right ml-2"></i>
                </button>
            </div>
        `;
    }).join('');
}

function openCourse(courseId) {
    if (!currentUser) {
        showLogin();
        return;
    }
    sessionStorage.setItem('currentCourseId', courseId);
    window.location.href = 'course-detail.html';
}

// ==================== ПАНЕЛЬ ПОЛЬЗОВАТЕЛЯ ====================
async function loadDashboardData() {
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('dashboardUserName').textContent = currentUser.displayName || currentUser.email;
    
    const completedCoursesList = [];
    let totalCorrectAnswers = 0;
    let totalPointsSum = 0;
    
    for (const course of coursesData) {
        const progress = getCourseProgress(currentUser.uid, course.id);
        if (progress.completed) {
            completedCoursesList.push(progress);
            const correctInCourse = Math.round((progress.quizScore / 100) * (course.quiz?.length || 5));
            totalCorrectAnswers += correctInCourse;
            totalPointsSum += progress.quizScore;
        }
    }
    
    const totalCompleted = completedCoursesList.length;
    
    document.getElementById('completedCourses').textContent = totalCompleted;
    document.getElementById('correctAnswers').textContent = totalCorrectAnswers;
    document.getElementById('totalPoints').textContent = totalPointsSum;
    document.getElementById('currentStreak').textContent = calculateStreak(completedCoursesList);
    
    const userAchievements = getUserAchievements(currentUser.uid);
    const achievementsContainer = document.getElementById('achievementsDashboard');
    if (achievementsContainer && userAchievements.length > 0) {
        achievementsContainer.classList.remove('hidden');
        const earnedAchs = achievementsList.filter(a => userAchievements.includes(a.id));
        document.getElementById('achievementsListDashboard').innerHTML = earnedAchs.map(ach => `
            <div class="flex items-center gap-2 px-3 py-2 bg-elevated rounded-lg border border-accent-primary/30">
                <i class="fas ${ach.icon} text-accent-primary"></i>
                <span class="text-sm text-white">${ach.name}</span>
            </div>
        `).join('');
    }
    
    loadProgressChart(completedCoursesList);
    loadRecentActivity(completedCoursesList);
    loadAvailableCourses();
}

function calculateStreak(progressList) {
    if (progressList.length === 0) return 0;
    const dates = progressList.map(p => new Date(p.lastUpdated).toDateString());
    const uniqueDates = [...new Set(dates)].sort((a, b) => new Date(b) - new Date(a));
    let streak = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
        streak = 1;
        for (let i = 1; i < uniqueDates.length; i++) {
            const diff = (new Date(uniqueDates[i-1]) - new Date(uniqueDates[i])) / 86400000;
            if (diff === 1) streak++;
            else break;
        }
    }
    return streak;
}

function loadProgressChart(progressList) {
    const ctx = document.getElementById('progressChart');
    if (!ctx) return;
    const last10 = progressList.slice(-10);
    const labels = last10.map((p, i) => `Курс ${i+1}`);
    const scores = last10.map(p => p.quizScore);
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.length > 0 ? labels : ['Нет данных'],
            datasets: [{
                label: 'Результат (%)',
                data: scores.length > 0 ? scores : [0],
                borderColor: '#BB86FC',
                backgroundColor: 'rgba(187, 134, 252, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 100, grid: { color: '#333333' } }, x: { grid: { color: '#333333' } } } }
    });
}

function loadRecentActivity(progressList) {
    const container = document.getElementById('recentActivity');
    const recent = progressList.slice(-5).reverse();
    if (recent.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">Нет активности</p>';
        return;
    }
    container.innerHTML = recent.map(p => {
        const course = coursesData.find(c => c.id === p.courseId);
        return `
            <div class="flex items-center justify-between p-3 bg-card rounded-lg border border-default">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-elevated rounded-lg flex items-center justify-center">
                        <i class="fas fa-check-circle text-accent-secondary"></i>
                    </div>
                    <div>
                        <p class="font-medium text-white">${course?.title || 'Курс'}</p>
                        <p class="text-sm text-gray-500">${new Date(p.lastUpdated).toLocaleDateString('ru-RU')}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="font-bold text-accent-primary">${p.quizScore}%</p>
                </div>
            </div>
        `;
    }).join('');
}

function loadAvailableCourses() {
    const container = document.getElementById('availableTests');
    if (!container) return;
    container.innerHTML = coursesData.map(course => {
        const progress = currentUser ? getCourseProgress(currentUser.uid, course.id) : null;
        const status = progress?.completed ? '✅ Пройден' : (progress?.completedLessons?.length > 0 ? '📖 В процессе' : '🆕 Новый');
        const lessonsCount = getLessonsCount(course);
        return `
            <div class="p-4 border border-default rounded-lg hover:border-accent-primary transition cursor-pointer bg-card" onclick="openCourse(${course.id})">
                <div class="flex items-center space-x-3">
                    <div class="w-12 h-12 bg-elevated rounded-lg flex items-center justify-center">
                        <i class="fab ${course.icon} text-accent-primary text-xl"></i>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center justify-between">
                            <h4 class="font-bold text-white">${course.title}</h4>
                            <span class="text-xs ${progress?.completed ? 'text-accent-secondary' : 'text-gray-500'}">${status}</span>
                        </div>
                        <p class="text-sm text-gray-400">${course.description.substring(0, 50)}...</p>
                        <div class="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span><i class="far fa-clock mr-1"></i>${course.duration || '2 часа'}</span>
                            <span><i class="fas fa-book-open mr-1"></i>${lessonsCount} уроков</span>
                        </div>
                    </div>
                    <i class="fas fa-chevron-right text-gray-500"></i>
                </div>
            </div>
        `;
    }).join('');
}

// ==================== АДМИН-ПАНЕЛЬ ====================
async function loadAdminData() {
    if (!currentUser || currentUser.email !== 'admin@eduaipro.com') {
        window.location.href = 'index.html';
        return;
    }

    const usersSnapshot = await db.collection('users').get();
    const users = [];
    usersSnapshot.forEach(doc => users.push({ id: doc.id, ...doc.data() }));
    
    const regularUsers = users.filter(u => u.role !== 'admin');
    const admins = users.filter(u => u.role === 'admin');
    
    let totalCompletedCourses = 0;
    let totalScores = 0;
    let scoreCount = 0;
    
    for (const user of regularUsers) {
        for (const course of coursesData) {
            const progress = getCourseProgress(user.uid, course.id);
            if (progress.completed) {
                totalCompletedCourses++;
                totalScores += progress.quizScore || 0;
                scoreCount++;
            }
        }
    }
    
    const avgScore = scoreCount > 0 ? Math.round(totalScores / scoreCount) : 0;
    
    const totalUsersEl = document.getElementById('totalUsers');
    const totalAdminsEl = document.getElementById('totalAdmins');
    const totalTestsEl = document.getElementById('totalTests');
    const avgScoreEl = document.getElementById('avgScore');
    
    if (totalUsersEl) totalUsersEl.textContent = regularUsers.length;
    if (totalAdminsEl) totalAdminsEl.textContent = admins.length;
    if (totalTestsEl) totalTestsEl.textContent = totalCompletedCourses;
    if (avgScoreEl) avgScoreEl.textContent = `${avgScore}%`;
    
    loadAdminUsersTable(regularUsers);
    loadAdminResultsTable(regularUsers);
}

function loadAdminUsersTable(users) {
    const container = document.getElementById('adminUsersTable');
    if (!container) return;
    
    if (users.length === 0) {
        container.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-gray-500">Нет зарегистрированных пользователей</td></tr>';
        return;
    }
    
    container.innerHTML = users.map(user => {
        let totalCourses = 0;
        let totalScore = 0;
        for (const course of coursesData) {
            const progress = getCourseProgress(user.uid, course.id);
            if (progress.completed) {
                totalCourses++;
                totalScore += progress.quizScore || 0;
            }
        }
        const avgUserScore = totalCourses > 0 ? Math.round(totalScore / totalCourses) : 0;
        
        return `
            <tr class="border-b border-default hover:bg-elevated">
                <td class="py-3 px-4 font-medium text-white">${escapeHtml(user.name)}</td>
                <td class="py-3 px-4 text-gray-300">${escapeHtml(user.email)}</td>
                <td class="py-3 px-4 text-gray-400">${new Date(user.createdAt).toLocaleDateString('ru-RU')}</td>
                <td class="py-3 px-4 text-center">
                    <span class="font-bold text-white">${totalCourses}</span>
                    <span class="text-xs text-gray-500">(ср. ${avgUserScore}%)</span>
                </td>
                <td class="py-3 px-4">
                    <button onclick="viewUserDetails('${user.uid}')" class="text-accent-primary hover:text-accent-secondary mr-3" title="Просмотр">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="deleteUser('${user.uid}')" class="text-red-500 hover:text-red-400" title="Удалить">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

async function viewUserDetails(userId) {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return;
    const user = userDoc.data();
    
    const userProgress = [];
    for (const course of coursesData) {
        const progress = getCourseProgress(userId, course.id);
        if (progress.completed) {
            userProgress.push({ course, progress });
        }
    }
    
    let resultsHtml = '';
    if (userProgress.length === 0) {
        resultsHtml = '<p class="text-gray-500">Нет пройденных курсов</p>';
    } else {
        resultsHtml = '<div class="space-y-2 max-h-96 overflow-y-auto">';
        userProgress.forEach(({ course, progress }) => {
            const lessonsCount = getLessonsCount(course);
            resultsHtml += `
                <div class="flex justify-between items-center p-3 bg-elevated rounded-lg border border-default">
                    <div>
                        <p class="font-medium text-white">${course.title}</p>
                        <p class="text-xs text-gray-500">${new Date(progress.lastUpdated).toLocaleString('ru-RU')}</p>
                    </div>
                    <div class="text-right">
                        <p class="font-bold ${progress.quizScore >= 75 ? 'text-accent-secondary' : progress.quizScore >= 60 ? 'text-yellow-500' : 'text-red-500'}">${progress.quizScore}%</p>
                        <p class="text-xs text-gray-500">${progress.completedLessons.length}/${lessonsCount} уроков</p>
                    </div>
                </div>
            `;
        });
        resultsHtml += '</div>';
    }
    
    const modalHtml = `
        <div id="userDetailModal" class="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
            <div class="bg-card rounded-2xl max-w-2xl w-full p-6 border border-default">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-2xl font-bold text-white">${escapeHtml(user.name)}</h2>
                    <button onclick="closeUserDetailModal()" class="text-gray-400 hover:text-gray-300">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                <div class="mb-4 p-3 bg-elevated rounded-lg">
                    <p><strong class="text-gray-300">Email:</strong> <span class="text-gray-400">${escapeHtml(user.email)}</span></p>
                    <p><strong class="text-gray-300">Зарегистрирован:</strong> <span class="text-gray-400">${new Date(user.createdAt).toLocaleString('ru-RU')}</span></p>
                    <p><strong class="text-gray-300">Пройдено курсов:</strong> <span class="text-white">${userProgress.length}</span></p>
                    <p><strong class="text-gray-300">Средний балл:</strong> <span class="text-accent-primary">${userProgress.length > 0 ? Math.round(userProgress.reduce((s, { progress }) => s + progress.quizScore, 0) / userProgress.length) : 0}%</span></p>
                </div>
                <h3 class="font-bold mb-3 text-white">Пройденные курсы:</h3>
                ${resultsHtml}
                <div class="mt-6 flex justify-end">
                    <button onclick="closeUserDetailModal()" class="px-4 py-2 bg-elevated border border-default rounded-lg hover:border-accent-primary transition text-gray-300">Закрыть</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function closeUserDetailModal() {
    const modal = document.getElementById('userDetailModal');
    if (modal) modal.remove();
}

async function loadAdminResultsTable(users) {
    const container = document.getElementById('adminResultsTable');
    if (!container) return;
    
    const allProgress = [];
    for (const user of users) {
        for (const course of coursesData) {
            const progress = getCourseProgress(user.uid, course.id);
            if (progress.completed) {
                allProgress.push({ user, course, progress });
            }
        }
    }
    
    const sorted = allProgress.sort((a, b) => new Date(b.progress.lastUpdated) - new Date(a.progress.lastUpdated)).slice(0, 30);
    
    if (sorted.length === 0) {
        container.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-gray-500">Нет результатов курсов</td></tr>';
        return;
    }
    
    container.innerHTML = sorted.map(({ user, course, progress }) => {
        const lessonsCount = getLessonsCount(course);
        return `
            <tr class="border-b border-default hover:bg-elevated">
                <td class="py-3 px-4 font-medium text-white">${escapeHtml(user.name)}</td>
                <td class="py-3 px-4 text-gray-300">${course.title}</td>
                <td class="py-3 px-4">
                    <span class="px-2 py-1 rounded-full text-xs font-bold ${progress.quizScore >= 75 ? 'bg-accent-secondary/20 text-accent-secondary' : progress.quizScore >= 60 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-500'}">
                        ${progress.quizScore}%
                    </span>
                </td>
                <td class="py-3 px-4 text-gray-400">${progress.completedLessons?.length || 0}/${lessonsCount} уроков</td>
                <td class="py-3 px-4 text-sm text-gray-500">${new Date(progress.lastUpdated).toLocaleString('ru-RU')}</td>
            </tr>
        `;
    }).join('');
}

async function deleteUser(userId) {
    if (confirm('Удалить пользователя? Все его данные также будут удалены.')) {
        await db.collection('users').doc(userId).delete();
        for (const course of coursesData) {
            localStorage.removeItem(`course_progress_${userId}_${course.id}`);
        }
        location.reload();
    }
}

async function resetAllData() {
    if (confirm('ВНИМАНИЕ! Это удалит ВСЕХ пользователей (кроме админа) и все результаты. Продолжить?')) {
        const usersSnapshot = await db.collection('users').get();
        const batch = db.batch();
        
        usersSnapshot.forEach(doc => {
            const user = doc.data();
            if (user.email !== 'admin@eduaipro.com') {
                batch.delete(doc.ref);
            }
        });
        
        await batch.commit();
        alert('Все данные сброшены. Админ сохранен.');
        location.reload();
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

async function loadStatsForIndex() {
    const usersSnapshot = await db.collection('users').get();
    const regularUsers = usersSnapshot.docs.filter(doc => doc.data().role !== 'admin');
    
    let totalCompleted = 0;
    for (const user of regularUsers) {
        for (const course of coursesData) {
            const progress = getCourseProgress(user.id, course.id);
            if (progress.completed) totalCompleted++;
        }
    }
    
    const studentsEl = document.getElementById('statsStudents');
    const testsEl = document.getElementById('statsTests');
    if (studentsEl) studentsEl.textContent = regularUsers.length;
    if (testsEl) testsEl.textContent = totalCompleted;
}

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
auth.onAuthStateChanged(async (user) => {
    currentUser = user;
    updateAuthUI();
    
    if (document.getElementById('statsStudents')) {
        await loadStatsForIndex();
    }
    
    if (document.getElementById('coursesGrid')) {
        loadCourses();
        const heroSection = document.querySelector('#coursesGrid')?.previousElementSibling;
        if (heroSection && heroSection.classList && heroSection.classList.contains('text-center')) {
            const filterContainer = document.createElement('div');
            filterContainer.className = 'flex justify-center space-x-4 mb-12 flex-wrap gap-3';
            filterContainer.innerHTML = `
                <button onclick="filterCourses('all')" class="px-5 py-2 rounded-full bg-accent-primary text-black font-medium transition">Все курсы (${coursesData.length})</button>
                <button onclick="filterCourses('programming')" class="px-5 py-2 rounded-full bg-elevated border border-default hover:border-accent-primary transition font-medium text-gray-300">💻 Программирование</button>
                <button onclick="filterCourses('database')" class="px-5 py-2 rounded-full bg-elevated border border-default hover:border-accent-primary transition font-medium text-gray-300">🗄️ Базы данных</button>
                <button onclick="filterCourses('frontend')" class="px-5 py-2 rounded-full bg-elevated border border-default hover:border-accent-primary transition font-medium text-gray-300">🎨 Frontend</button>
                <button onclick="filterCourses('backend')" class="px-5 py-2 rounded-full bg-elevated border border-default hover:border-accent-primary transition font-medium text-gray-300">⚙️ Backend</button>
                <button onclick="filterCourses('devops')" class="px-5 py-2 rounded-full bg-elevated border border-default hover:border-accent-primary transition font-medium text-gray-300">🚀 DevOps</button>
            `;
            heroSection.parentNode.insertBefore(filterContainer, document.getElementById('coursesGrid'));
        }
    }
    
    if (document.getElementById('dashboardUserName')) {
        await loadDashboardData();
    }
    
    if (document.getElementById('adminStats')) {
        await loadAdminData();
    }
});