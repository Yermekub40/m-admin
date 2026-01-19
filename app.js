require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const apiRouter = require('./routes/api');
const authRouter = require('./routes/auth');
const { syncDatabase } = require('./models');

const app = express();

// Middleware
app.use(logger('dev'));

// CORS конфигурациясы
const allowedOrigins = [
  'https://m-admin.tegin.kz',
  'http://localhost:3000',
  'http://localhost:5987',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5987'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Same-origin request (browser-дан cookie жібергенде origin undefined болады)
    if (!origin) {
      // Same-origin request (cookie жіберу үшін)
      return callback(null, true);
    }
    
    // Production domain тексеру
    if (allowedOrigins.includes(origin) || 
        origin.includes('localhost') || 
        origin.includes('127.0.0.1') ||
        origin.includes('m-admin.tegin.kz')) {
      callback(null, true);
    } else {
      console.warn('CORS: Blocked origin:', origin);
      callback(new Error('CORS policy: Origin not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie']
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Session middleware
const isProduction = process.env.NODE_ENV === 'production';
const isHTTPS = process.env.HTTPS === 'true' || isProduction;

const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'm-admin-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  name: 'm-admin.sid',
  cookie: {
    secure: isHTTPS, // HTTPS-те true болуы керек
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 сағат
    sameSite: 'lax', // HTTPS-те 'lax' жұмыс істейді
    // domain орнатпау - тек m-admin.tegin.kz үшін, басқа subdomain-дер үшін қажет емес
    // Егер бірнеше subdomain-дер үшін қажет болса: domain: '.tegin.kz'
  },
  // Сессияны дұрыс сақтау үшін
  rolling: true, // Әр request-те cookie уақытын жаңарту
  proxy: isProduction // Production-да proxy (nginx) арқылы өтсе true
};

// Production-да trust proxy орнату (nginx/reverse proxy үшін)
if (isProduction) {
  app.set('trust proxy', 1);
}

app.use(session(sessionConfig));

app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/auth', authRouter);
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api', apiRouter);

// Базаны синхрондау
syncDatabase();

module.exports = app;
