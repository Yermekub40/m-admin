const express = require('express');
const path = require('path');
const router = express.Router();
const { requireAuthHTML } = require('../middleware/auth');

/* GET home page. */
router.get('/', requireAuthHTML, function(req, res, next) {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

/* GET login page. */
router.get('/login', function(req, res, next) {
  // Егер пайдаланушы кірген болса, басты бетке бағыттау
  if (req.session && req.session.userId) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

/* GET reports page. */
router.get('/reports', requireAuthHTML, function(req, res, next) {
  res.sendFile(path.join(__dirname, '../public/reports.html'));
});

/* GET ML API management page. */
router.get('/ml-api', requireAuthHTML, function(req, res, next) {
  res.sendFile(path.join(__dirname, '../public/ml-api.html'));
});

module.exports = router;
