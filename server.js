require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const axios = require('axios');
const path = require('path');

const app = express();

// 📌 Перевіряємо, чи змінні завантажились правильно
console.log("MongoDB URI:", process.env.MONGODB_URI);
console.log("Poster Client ID:", process.env.POSTER_CLIENT_ID);
console.log("Redirect URI:", process.env.REDIRECT_URI);

// 📌 Підключення до MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('✅ Підключено до MongoDB');
    })
    .catch(err => {
        console.error('❌ Помилка підключення до MongoDB:', err);
    });

// 📌 Налаштування сесій
app.use(session({
    secret: process.env.SESSION_SECRET || 'defaultsecret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // У production потрібно поставити true і додати HTTPS
}));

// 📌 Статичні файли
app.use(express.static(path.join(__dirname, 'public')));

// 📌 Головна сторінка
app.get('/', (req, res) => {
    res.send('<h1>Poster API Auth</h1><a href="/auth">Авторизуватися</a>');
});

// 📌 Редірект на авторизацію Poster
app.get('/auth', (req, res) => {
    const authUrl = `https://joinposter.com/api/auth?client_id=${process.env.POSTER_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}`;
    res.redirect(authUrl);
});

// 📌 Обробка колбеку після авторизації
app.get('/auth/callback', async (req, res) => {
    const { code, account } = req.query;

    if (!code || !account) {
        return res.status(400).send('❌ Помилка авторизації: відсутній код або акаунт');
    }

    console.log("📥 Callback Params:", { code, account });
    console.log("🔄 Запит на отримання access_token...");

    try {
        console.log("Application ID:", process.env.POSTER_CLIENT_ID); // Виведення значення POSTER_CLIENT_ID для перевірки

        const tokenResponse = await axios.post('https://joinposter.com/api/v2/auth/manage', null, {
            params: {
                application_id: process.env.POSTER_CLIENT_ID,  // Переконайтеся, що це значення правильне
                application_secret: process.env.POSTER_CLIENT_SECRET,
                grant_type: 'authorization_code',
                redirect_uri: process.env.REDIRECT_URI,
                code: code
            }
        });

        console.log("✅ Token Response:", tokenResponse.data);

        req.session.accessToken = tokenResponse.data.access_token;
        req.session.account = account;

        res.send('<h2>Авторизація успішна!</h2><a href="/profile">Перейти до профілю</a>');
    } catch (error) {
        console.error('❌ Помилка при авторизації:', error.response ? error.response.data : error.message);
        res.status(500).send('❌ Сталася помилка при авторизації.');
    }
});

// 📌 Отримання профілю користувача
app.get('/profile', async (req, res) => {
    if (!req.session.accessToken) {
        return res.status(401).send('❌ Не авторизований. <a href="/auth">Авторизуватися</a>');
    }

    try {
        const profileResponse = await axios.post(`https://joinposter.com/api/v2/auth/info`, null, {
            params: { token: req.session.accessToken }
        });

        res.json(profileResponse.data);
    } catch (error) {
        console.error('❌ Помилка отримання профілю:', error.response ? error.response.data : error.message);
        res.status(500).send('❌ Сталася помилка при отриманні профілю.');
    }
});

// 📌 Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Сервер працює на http://localhost:${PORT}`);
});
