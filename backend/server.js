const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const db = require('./db');
const databaseService = require('./database-service');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());

// Middleware для логирования всех запросов
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

// Тестовый эндпоинт
app.get('/', (req, res) => {
  res.json({ 
    message: 'Сервер работает!',
    endpoints: [
      'GET /api',
      'GET /api/posts',
      'GET /api/stories', 
      'GET /api/posts/:id',
      'POST /register',
      'POST /login'
    ]
  });
});

// Тестовый эндпоинт для API
app.get('/api', (req, res) => {
  res.json({ 
    message: 'API работает!',
    endpoints: [
      'GET /api/posts',
      'GET /api/stories', 
      'GET /api/posts/:id',
      'POST /register',
      'POST /login'
    ]
  });
});

// API для получения постов
app.get('/api/posts', async (req, res) => {
  try {
    console.log('📡 Запрос постов...');
    const posts = await databaseService.getPosts();
    
    // ВРЕМЕННАЯ ПРОВЕРКА АДРЕСОВ
    console.log('📍 Проверка адресов в ответе API:');
    posts.forEach((post, index) => {
      console.log(`Пост ${index + 1}: ID=${post.id}, Address="${post.address}"`);
    });
    
    console.log(`✅ Отправлено ${posts.length} постов`);
    res.json(posts);
  } catch (error) {
    console.error('❌ Ошибка при получении постов:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// API для получения историй
app.get('/api/stories', async (req, res) => {
  try {
    console.log('📡 Запрос историй...');
    const stories = await databaseService.getStories();
    console.log(`✅ Отправлено ${stories.length} историй`);
    res.json(stories);
  } catch (error) {
    console.error('❌ Ошибка при получении историй:', error);
    res.status(500).json({ error: 'Failed to fetch stories' });
  }
});

// API для получения поста по ID
app.get('/api/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📡 Запрос поста ${id}...`);
    const post = await databaseService.getPostById(id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    console.log(`✅ Пост ${id} отправлен`);
    res.json(post);
  } catch (error) {
    console.error('❌ Ошибка при получении поста:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Эндпоинт для регистрации
app.post('/register', async (req, res) => {
  const { email, name, surname, password, role } = req.body;

  if (!email || !name || !password || !role) {
    return res.status(400).json({ error: 'Все поля обязательны (кроме surname для company)' });
  }

  if (role !== 'user' && role !== 'company') {
    return res.status(400).json({ error: 'Role должен быть "user" или "company"' });
  }

  // Хешируем пароль
  const saltRounds = 10;
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Вставляем в БД
    db.run(
      `INSERT INTO users (email, name, surname, password, role) VALUES (?, ?, ?, ?, ?)`,
      [email, name, surname || null, hashedPassword, role],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'Email уже зарегистрирован' });
          }
          return res.status(500).json({ error: 'Ошибка сервера' });
        }
        res.status(201).json({ 
          message: 'Пользователь зарегистрирован', 
          userId: this.lastID 
        });
      }
    );
  } catch (error) {
    console.error('❌ Ошибка хеширования:', error);
    res.status(500).json({ error: 'Ошибка хеширования' });
  }
});

// Эндпоинт для логина
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email и пароль обязательны' });
  }

  // Ищем пользователя
  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err) {
      console.error('❌ Ошибка БД при логине:', err);
      return res.status(500).json({ error: 'Ошибка сервера' });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    // Проверяем пароль
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    // Успех — возвращаем данные (без пароля)
    const { password: _, ...safeUser } = user;
    
    // Добавляем handle для фронтенда
    const userWithHandle = {
      ...safeUser,
      handle: email.split('@')[0].toLowerCase()
    };
    
    console.log(`✅ Успешный логин: ${email}`);
    res.json({ 
      message: 'Логин успешен', 
      user: userWithHandle 
    });
  });
});

// Обработка несуществующих маршрутов
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Маршрут не найден',
    path: req.path,
    method: req.method,
    availableEndpoints: [
      'GET /',
      'GET /api',
      'GET /api/posts',
      'GET /api/stories',
      'GET /api/posts/:id',
      'POST /register',
      'POST /login'
    ]
  });
});

// Обработка ошибок
app.use((error, req, res, next) => {
  console.error('❌ Необработанная ошибка:', error);
  res.status(500).json({ 
    error: 'Внутренняя ошибка сервера',
    message: error.message 
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📍 Локальный доступ: http://localhost:${PORT}`);
  console.log(`🌐 Сетевой доступ: http://192.168.0.116:${PORT}`);
  console.log(`📊 API доступно по адресу: http://192.168.0.116:${PORT}/api`);
});