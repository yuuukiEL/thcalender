require('dotenv').config({ path: '../.env' });

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');

const app = express();
const FLASK_API_URL = 'http://localhost:5000'; // FlaskのAPIエンドポイント

// ミドルウェアの設定
app.use(express.static('public'));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: '@#@$MYSIGN#@$#$',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // 開発環境ではfalse
}));

// テンプレートエンジンの設定
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// Google OAuth2クライアントの設定
const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
);

// ルーティング
app.get('/', async (req, res) => {
    if (!req.session.credentials) {
        return res.redirect('/login');
    }
    
    try {
        // Flaskバックエンドからユーザー情報を取得
        const response = await axios.get(`${FLASK_API_URL}/api/user`, {
            headers: {
                'Authorization': `Bearer ${req.session.credentials.access_token}`
            }
        });
        
        res.render('calendar_form', {
            user: response.data,
            google_maps_api_key: process.env.GOOGLE_MAPS_API_KEY
        });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.redirect('/login');
    }
});

app.get('/login', (req, res) => {
    res.render('login', { 
        current_user: req.session.user || null 
    });
});

app.get('/authorize', (req, res) => {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email'
        ],
        prompt: 'select_account'
    });
    res.redirect(authUrl);
});

app.get('/oauth2callback', async (req, res) => {
    try {
        const { tokens } = await oauth2Client.getToken(req.query.code);
        req.session.credentials = tokens;
        
        // Flaskバックエンドに認証情報を送信
        await axios.post(`${FLASK_API_URL}/api/auth`, { tokens });
        
        res.redirect('/');
    } catch (error) {
        console.error('Error during authentication:', error);
        res.redirect('/login');
    }
});

app.get('/switch_account', (req, res) => {
    req.session.destroy();
    res.redirect('/authorize');
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// FlaskのAPIエンドポイントへのプロキシ
app.post('/api/create_event', async (req, res) => {
    try {
        const response = await axios.post(
            `${FLASK_API_URL}/api/create_event`,
            req.body,
            {
                headers: {
                    'Authorization': `Bearer ${req.session.credentials.access_token}`
                }
            }
        );
        res.json(response.data);
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ error: 'Failed to create event' });
    }
});

// サーバーの起動
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});