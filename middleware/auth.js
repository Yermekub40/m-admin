const { User } = require('../models');

// Аутентификацияны тексеру middleware
const requireAuth = async (req, res, next) => {
  try {
    // Сессияны тексеру
    if (!req.session) {
      console.log('Auth middleware: No session object');
      return res.status(401).json({
        success: false,
        message: 'Кіру қажет'
      });
    }

    // Сессия ID-ін тексеру
    if (!req.sessionID) {
      console.log('Auth middleware: No session ID');
      return res.status(401).json({
        success: false,
        message: 'Кіру қажет'
      });
    }

    // User ID-ін тексеру
    if (!req.session.userId) {
      console.log('Auth middleware: No userId in session', {
        sessionId: req.sessionID,
        sessionKeys: Object.keys(req.session || {})
      });
      return res.status(401).json({
        success: false,
        message: 'Кіру қажет'
      });
    }

    const user = await User.findByPk(req.session.userId);
    if (!user || !user.isActive) {
      console.log('Auth middleware: User not found or inactive', {
        userId: req.session.userId,
        userFound: !!user,
        isActive: user?.isActive
      });
      req.session.destroy();
      return res.status(401).json({
        success: false,
        message: 'Пайдаланушы табылмады немесе белсенді емес'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Аутентификация қатесі',
      error: error.message
    });
  }
};

// Рөл бойынша тексеру middleware
const requireRole = (...roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Кіру қажет'
        });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Бұл әрекетті орындауға құқығыңыз жоқ'
        });
      }

      next();
    } catch (error) {
      console.error('Role middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Рөлді тексеру қатесі',
        error: error.message
      });
    }
  };
};

// HTML беттер үшін аутентификацияны тексеру
const requireAuthHTML = async (req, res, next) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.redirect('/login');
    }

    const user = await User.findByPk(req.session.userId);
    if (!user || !user.isActive) {
      req.session.destroy();
      return res.redirect('/login');
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth HTML middleware error:', error);
    res.redirect('/login');
  }
};

module.exports = {
  requireAuth,
  requireRole,
  requireAuthHTML
};

