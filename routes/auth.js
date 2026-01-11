const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');

// Кіру
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('Login attempt:', { username, hasPassword: !!password });

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Пайдаланушы аты және пароль қажет'
      });
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      console.log('User not found:', username);
      return res.status(401).json({
        success: false,
        message: 'Пайдаланушы аты немесе пароль дұрыс емес'
      });
    }

    if (!user.isActive) {
      console.log('User inactive:', username);
      return res.status(401).json({
        success: false,
        message: 'Пайдаланушы белсенді емес'
      });
    }

    const isPasswordValid = await user.checkPassword(password);
    console.log('Password validation:', isPasswordValid);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Пайдаланушы аты немесе пароль дұрыс емес'
      });
    }

    // Сессияны сақтау
    req.session.userId = user.id;
    req.session.userRole = user.role;
    req.session.username = user.username;

    // Сессияны сақтау
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({
          success: false,
          message: 'Сессияны сақтау кезінде қате пайда болды',
          error: err.message
        });
      }

      console.log('Session saved:', {
        sessionId: req.sessionID,
        userId: req.session.userId,
        username: req.session.username,
        role: req.session.userRole,
        cookie: req.session.cookie
      });

      res.json({
        success: true,
        message: 'Кіру сәтті',
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          fullName: user.fullName
        }
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Кіру кезінде қате пайда болды',
      error: error.message
    });
  }
});

// Шығу
router.post('/logout', requireAuth, async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({
          success: false,
          message: 'Шығу кезінде қате пайда болды'
        });
      }
      res.json({
        success: true,
        message: 'Шығу сәтті'
      });
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Шығу кезінде қате пайда болды',
      error: error.message
    });
  }
});

// Ағымдағы пайдаланушыны алу
router.get('/me', requireAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role,
        fullName: req.user.fullName
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Пайдаланушыны алу кезінде қате пайда болды',
      error: error.message
    });
  }
});

// Пайдаланушылар тізімін алу (тек админ)
router.get('/users', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'role', 'fullName', 'isActive', 'createdAt', 'updatedAt'],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Пайдаланушыларды алу кезінде қате пайда болды',
      error: error.message
    });
  }
});

// Жаңа пайдаланушыны қосу (тек админ)
router.post('/users', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { username, password, role, fullName } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Пайдаланушы аты, пароль және рөл қажет'
      });
    }

    if (!['admin', 'engineer-technologist', 'operator'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Дұрыс емес рөл'
      });
    }

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Бұл пайдаланушы аты бос емес'
      });
    }

    const user = await User.create({
      username,
      password,
      role,
      fullName: fullName || null
    });

    res.status(201).json({
      success: true,
      message: 'Пайдаланушы сәтті қосылды',
      data: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Пайдаланушыны қосу кезінде қате пайда болды',
      error: error.message
    });
  }
});

module.exports = router;

