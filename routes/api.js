const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const axios = require('axios');
const { ProcessData } = require('../models');
const mlService = require('../services/mlService');
const { requireAuth } = require('../middleware/auth');
require('dotenv').config();

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:5000';

// Барлық API маршруттарын аутентификациямен қорғау
router.use(requireAuth);

// Multer конфигурациясы - файлды жадқа сақтамай, жадта өңдеу
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Тек Excel файлдарды (.xlsx, .xls) жүктеуге болады'), false);
    }
  }
});

// Барлық деректерді алу
router.get('/process-data', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const { count, rows } = await ProcessData.findAndCountAll({
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Деректерді алу кезінде қате пайда болды',
      error: error.message
    });
  }
});

// Жаңа деректерді сақтау
router.post('/process-data', async (req, res) => {
  try {
    const { x1, x2, x3, x4, x5, x6, y1, y2 } = req.body;
    
    // Валидация
    if (!x1 || !x2 || !x3 || !x4 || !x5 || !x6 || !y1 || !y2) {
      return res.status(400).json({
        success: false,
        message: 'Барлық параметрлер толтырылуы керек'
      });
    }
    
    const processData = await ProcessData.create({
      x1: parseFloat(x1),
      x2: parseFloat(x2),
      x3: parseFloat(x3),
      x4: parseFloat(x4),
      x5: parseFloat(x5),
      x6: parseFloat(x6),
      y1: parseFloat(y1),
      y2: parseFloat(y2)
    });
    
    res.status(201).json({
      success: true,
      message: 'Деректер сәтті сақталды',
      data: processData
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Деректерді сақтау кезінде қате пайда болды',
      error: error.message
    });
  }
});

// (Moved) The parameterized routes for individual process data items are defined
// after static routes like /latest, /stats, /history to avoid conflicts where
// 'history' or 'latest' would be interpreted as an :id.

// Соңғы деректерді алу
router.get('/process-data/latest', async (req, res) => {
  try {
    const processData = await ProcessData.findOne({
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      data: processData
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Соңғы деректерді алу кезінде қате пайда болды',
      error: error.message
    });
  }
});

// Статистика алу
router.get('/process-data/stats', async (req, res) => {
  try {
    const total = await ProcessData.count();
    
    const latest = await ProcessData.findOne({
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      data: {
        total,
        latest
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Статистика алу кезінде қате пайда болды',
      error: error.message
    });
  }
});

// Исторические данные (уақыт бойынша)
router.get('/process-data/history', async (req, res) => {
  try {
    const { period = '24h' } = req.query;
    const { Op } = require('sequelize');
    
    // Период бойынша уақыт шегі
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '1h':
        startDate.setHours(now.getHours() - 1);
        break;
      case '6h':
        startDate.setHours(now.getHours() - 6);
        break;
      case '24h':
        startDate.setHours(now.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      default:
        startDate.setHours(now.getHours() - 24);
    }
    
    const data = await ProcessData.findAll({
      where: {
        createdAt: {
          [Op.gte]: startDate
        }
      },
      order: [['createdAt', 'ASC']],
      limit: 1000 // Максимум 1000 нүкте
    });
    
    res.json({
      success: true,
      data: data,
      period: period,
      startDate: startDate,
      endDate: now
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Исторические данные алу кезінде қате пайда болды',
      error: error.message
    });
  }
});

  // Parameterized routes for individual process data items (placed after static routes)
  // Деректерді жаңарту
  router.put('/process-data/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { x1, x2, x3, x4, x5, x6, y1, y2 } = req.body;
    
      const processData = await ProcessData.findByPk(id);
      if (!processData) {
        return res.status(404).json({
          success: false,
          message: 'Деректер табылмады'
        });
      }
    
      await processData.update({
        x1: x1 ? parseFloat(x1) : processData.x1,
        x2: x2 ? parseFloat(x2) : processData.x2,
        x3: x3 ? parseFloat(x3) : processData.x3,
        x4: x4 ? parseFloat(x4) : processData.x4,
        x5: x5 ? parseFloat(x5) : processData.x5,
        x6: x6 ? parseFloat(x6) : processData.x6,
        y1: y1 ? parseFloat(y1) : processData.y1,
        y2: y2 ? parseFloat(y2) : processData.y2
      });
    
      res.json({
        success: true,
        message: 'Деректер сәтті жаңартылды',
        data: processData
      });
    } catch (error) {
      console.error('API Error:', error);
      res.status(500).json({
        success: false,
        message: 'Деректерді жаңарту кезінде қате пайда болды',
        error: error.message
      });
    }
  });

  // Деректерді жою
  router.delete('/process-data/:id', async (req, res) => {
    try {
      const { id } = req.params;
    
      const processData = await ProcessData.findByPk(id);
      if (!processData) {
        return res.status(404).json({
          success: false,
          message: 'Деректер табылмады'
        });
      }
    
      await processData.destroy();
    
      res.json({
        success: true,
        message: 'Деректер сәтті жойылды'
      });
    } catch (error) {
      console.error('API Error:', error);
      res.status(500).json({
        success: false,
        message: 'Деректерді жою кезінде қате пайда болды',
        error: error.message
      });
    }
  });

  // Жеке деректерді алу
  router.get('/process-data/:id', async (req, res) => {
    try {
      const { id } = req.params;
    
      const processData = await ProcessData.findByPk(id);
      if (!processData) {
        return res.status(404).json({
          success: false,
          message: 'Деректер табылмады'
        });
      }
    
      res.json({
        success: true,
        data: processData
      });
    } catch (error) {
      console.error('API Error:', error);
      res.status(500).json({
        success: false,
        message: 'Деректерді алу кезінде қате пайда болды',
        error: error.message
      });
    }
  });

// ========== ML API Endpoints ==========

// ML сервисі дұрыс жұмыс істеп тұрғанын тексеру
router.get('/ml/health', async (req, res) => {
  try {
    const health = await mlService.checkHealth();
    // ML API жауабын тікелей қайтару (status, models_loaded, reverse_model_loaded, т.б.)
    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      models_loaded: false,
      reverse_model_loaded: false,
      fuzzy_model_loaded: false,
      hybrid_model_loaded: false,
      error: error.message
    });
  }
});

// Прямая болжау: x1-x6 → y1, y2
router.post('/ml/predict', async (req, res) => {
  try {
    const { x1, x2, x3, x4, x5, x6 } = req.body;
    
    // Валидация
    if (!x1 || !x2 || !x3 || !x4 || !x5 || !x6) {
      return res.status(400).json({
        success: false,
        message: 'Барлық кіріс параметрлері (x1-x6) қажет'
      });
    }
    
    const result = await mlService.predict({ x1, x2, x3, x4, x5, x6 });
    
    if (result.success) {
      res.json({
        success: true,
        prediction: {
          y1: result.y1,
          y2: result.y2
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'ML болжау қатесі',
        error: result.error
      });
    }
  } catch (error) {
    console.error('ML Predict Error:', error);
    res.status(500).json({
      success: false,
      message: 'Болжау кезінде қате пайда болды',
      error: error.message
    });
  }
});

// Кері бағыттағы болжау: y1, y2 → x1-x6 (ML модель)
router.post('/ml/reverse-predict', async (req, res) => {
  const startTime = Date.now();
  console.log('\n=== КЕРІ БАҒЫТТАҒЫ БОЛЖАУ ЗАПРОСЫ ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  
  try {
    const { y1, y2 } = req.body;
    console.log(`Параметрлер: y1=${y1}, y2=${y2}`);
    
    // Валидация
    if (y1 === undefined || y1 === null || y2 === undefined || y2 === null) {
      console.error('Валидация қатесі: y1 немесе y2 жоқ');
      return res.status(400).json({
        success: false,
        message: 'y1 және y2 параметрлері қажет',
        received: { y1, y2 }
      });
    }
    
    const parsedY1 = parseFloat(y1);
    const parsedY2 = parseFloat(y2);
    
    if (isNaN(parsedY1) || isNaN(parsedY2)) {
      console.error(`Валидация қатесі: Сан емес мәндер - y1=${y1} (${typeof y1}), y2=${y2} (${typeof y2})`);
      return res.status(400).json({
        success: false,
        message: 'y1 және y2 сан болуы керек',
        received: { y1, y2 }
      });
    }
    
    console.log(`Парсингтелген мәндер: y1=${parsedY1}, y2=${parsedY2}`);
    console.log('ML сервиске шақыру...');
    
    const result = await mlService.reversePredict({
      y1: parsedY1,
      y2: parsedY2
    });
    
    console.log('ML сервис жауабы:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      const duration = Date.now() - startTime;
      console.log(`✅ Сәтті! Уақыт: ${duration}ms`);
      console.log('==========================================\n');
      
      res.json({
        success: true,
        prediction: {
          x1: result.x1,
          x2: result.x2,
          x3: result.x3,
          x4: result.x4,
          x5: result.x5,
          x6: result.x6
        }
      });
    } else {
      const duration = Date.now() - startTime;
      console.error(`❌ ML сервис қатесі: ${result.error}`);
      console.log(`Уақыт: ${duration}ms`);
      console.log('==========================================\n');
      
      res.status(500).json({
        success: false,
        message: 'Кері бағыттағы ML болжау қатесі',
        error: result.error,
        details: result
      });
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ EXCEPTION:', error);
    console.error('Stack trace:', error.stack);
    console.log(`Уақыт: ${duration}ms`);
    console.log('==========================================\n');
    
    res.status(500).json({
      success: false,
      message: 'Кері бағыттағы болжау кезінде қате пайда болды',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Обратная оптимизация: y1, y2 → x1-x6
router.post('/ml/optimize', async (req, res) => {
  try {
    const { y1, y2, weights, method } = req.body;
    
    // Валидация
    if (!y1 || !y2) {
      return res.status(400).json({
        success: false,
        message: 'y1 және y2 параметрлері қажет'
      });
    }
    
    const result = await mlService.optimize(
      { y1: parseFloat(y1), y2: parseFloat(y2) },
      { weights, method }
    );
    
    if (result.success) {
      res.json({
        success: true,
        optimal_parameters: result.optimal_parameters,
        predicted_y1: result.predicted_y1,
        predicted_y2: result.predicted_y2,
        target_y1: result.target_y1,
        target_y2: result.target_y2,
        error_y1: result.error_y1,
        error_y2: result.error_y2
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'ML оптимизация қатесі',
        error: result.error
      });
    }
  } catch (error) {
    console.error('ML Optimize Error:', error);
    res.status(500).json({
      success: false,
      message: 'Оптимизация кезінде қате пайда болды',
      error: error.message
    });
  }
});

// Feature Importance
router.get('/ml/feature-importance', async (req, res) => {
  try {
    const result = await mlService.getFeatureImportance();
    
    if (result.success) {
      res.json({
        success: true,
        importance: result.importance
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Feature importance қатесі',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Feature Importance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Feature importance алу кезінде қате пайда болды',
      error: error.message
    });
  }
});

// Модель метрикалары
router.get('/ml/metrics', async (req, res) => {
  try {
    const result = await mlService.getMetrics();
    
    if (result.success) {
      res.json({
        success: true,
        metrics: result.metrics
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Метрикалар қатесі',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Metrics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Метрикалар алу кезінде қате пайда болды',
      error: error.message
    });
  }
});

// Модельдер туралы толық ақпарат
router.get('/ml/model-info', async (req, res) => {
  try {
    const result = await mlService.getModelInfo();
    
    if (result.success) {
      res.json({
        success: true,
        modelInfo: result.modelInfo,
        modelDirectory: result.modelDirectory
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Модель ақпараттары қатесі',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Model Info Error:', error);
    res.status(500).json({
      success: false,
      message: 'Модель ақпараттарын алу кезінде қате пайда болды',
      error: error.message
    });
  }
});

// Fuzzy Logic болжау: x1-x6 → y1, y2
router.post('/ml/fuzzy/predict', async (req, res) => {
  try {
    const { x1, x2, x3, x4, x5, x6 } = req.body;
    
    // Валидация
    if (!x1 || !x2 || !x3 || !x4 || !x5 || !x6) {
      return res.status(400).json({
        success: false,
        message: 'Барлық кіріс параметрлері (x1-x6) қажет'
      });
    }
    
    const response = await axios.post(
      `${ML_API_URL}/fuzzy/predict`,
      { x1, x2, x3, x4, x5, x6 },
      { timeout: 30000 }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('Fuzzy Predict Error:', error);
    res.status(500).json({
      success: false,
      message: 'Fuzzy Logic болжау қатесі',
      error: error.response?.data?.error || error.message
    });
  }
});

// Гибридті болжау: Fuzzy Logic + ML модельдер
router.post('/ml/hybrid/predict', async (req, res) => {
  try {
    const { x1, x2, x3, x4, x5, x6, fuzzy_weight, ml_weight, use_fuzzy_only, use_ml_only } = req.body;
    
    // Валидация
    if (!x1 || !x2 || !x3 || !x4 || !x5 || !x6) {
      return res.status(400).json({
        success: false,
        message: 'Барлық кіріс параметрлері (x1-x6) қажет'
      });
    }
    
    const payload = { x1, x2, x3, x4, x5, x6 };
    if (fuzzy_weight !== undefined) payload.fuzzy_weight = fuzzy_weight;
    if (ml_weight !== undefined) payload.ml_weight = ml_weight;
    if (use_fuzzy_only !== undefined) payload.use_fuzzy_only = use_fuzzy_only;
    if (use_ml_only !== undefined) payload.use_ml_only = use_ml_only;
    
    const response = await axios.post(
      `${ML_API_URL}/hybrid/predict`,
      payload,
      { timeout: 30000 }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('Hybrid Predict Error:', error);
    res.status(500).json({
      success: false,
      message: 'Гибридті болжау қатесі',
      error: error.response?.data?.error || error.message
    });
  }
});

// Excel файл жүктеу және деректерді импорттау
router.post('/process-data/upload-excel', upload.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Файл жүктелмеді'
      });
    }

    // Excel файлды оқу
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    
    // Sheet1 листін алу
    const sheetName = 'Sheet1';
    if (!workbook.SheetNames.includes(sheetName)) {
      return res.status(400).json({
        success: false,
        message: `"${sheetName}" листі табылмады. Қолжетімді листер: ${workbook.SheetNames.join(', ')}`
      });
    }
    
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (data.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Excel файлда деректер жоқ (кем дегенде баған атаулары мен бір жол деректер қажет)'
      });
    }
    
    // Бірінші қатар - баған атаулары (properties name list)
    const headers = data[0].map(h => String(h).trim().toLowerCase());
    
    // Баған атауларын тексеру
    const requiredColumns = ['x1', 'x2', 'x3', 'x4', 'x5', 'x6', 'y1', 'y2'];
    const columnIndices = {};
    
    requiredColumns.forEach(col => {
      const index = headers.findIndex(h => h === col.toLowerCase());
      if (index === -1) {
        throw new Error(`Баған "${col}" табылмады. Табылған бағандар: ${headers.join(', ')}`);
      }
      columnIndices[col] = index;
    });
    
    // Деректерді өңдеу және базаға салу
    const rowsToInsert = [];
    let skippedRows = 0;
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Бос жолдарды өткізіп жіберу
      if (!row || row.length === 0 || row.every(cell => cell === null || cell === undefined || cell === '')) {
        skippedRows++;
        continue;
      }
      
      try {
        const x1 = parseFloat(row[columnIndices.x1]);
        const x2 = parseFloat(row[columnIndices.x2]);
        const x3 = parseFloat(row[columnIndices.x3]);
        const x4 = parseFloat(row[columnIndices.x4]);
        const x5 = parseFloat(row[columnIndices.x5]);
        const x6 = parseFloat(row[columnIndices.x6]);
        const y1 = parseFloat(row[columnIndices.y1]);
        const y2 = parseFloat(row[columnIndices.y2]);
        
        // Валидация
        if (isNaN(x1) || isNaN(x2) || isNaN(x3) || isNaN(x4) || isNaN(x5) || isNaN(x6) || 
            isNaN(y1) || isNaN(y2)) {
          skippedRows++;
          continue;
        }
        
        rowsToInsert.push({
          x1,
          x2,
          x3,
          x4,
          x5,
          x6,
          y1,
          y2
        });
      } catch (error) {
        skippedRows++;
        console.error(`Жол ${i + 1} өңдеу қатесі:`, error);
        continue;
      }
    }
    
    if (rowsToInsert.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Жарамды деректер табылмады'
      });
    }
    
    // Базаға салу (bulk insert)
    const insertedData = await ProcessData.bulkCreate(rowsToInsert, {
      ignoreDuplicates: false,
      validate: true
    });
    
    res.json({
      success: true,
      message: 'Excel файл сәтті өңделді',
      inserted: insertedData.length,
      skipped: skippedRows,
      total: data.length - 1
    });
    
  } catch (error) {
    console.error('Excel файл өңдеу қатесі:', error);
    res.status(500).json({
      success: false,
      message: 'Excel файлды өңдеу кезінде қате пайда болды',
      error: error.message
    });
  }
});

module.exports = router;
