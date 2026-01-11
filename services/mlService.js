/**
 * ML сервисіне қосылу клиенті
 * Python Flask API-ға HTTP шақырулар жасайды
 */
const axios = require('axios');
require('dotenv').config();

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:5000';

class MLService {
  constructor() {
    this.baseURL = ML_API_URL;
    this.timeout = 30000; // 30 секунд (оптимизация уақыт алады)
  }

  /**
   * ML сервисі дұрыс жұмыс істеп тұрғанын тексеру
   */
  async checkHealth() {
    try {
      const response = await axios.get(`${this.baseURL}/health`, {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      console.error('ML сервисі қолжетімсіз:', error.message);
      return { 
        status: 'error', 
        models_loaded: false,
        reverse_model_loaded: false,
        fuzzy_model_loaded: false,
        hybrid_model_loaded: false
      };
    }
  }

  /**
   * Прямая болжау: x1-x6 → y1, y2
   * @param {Object} inputs - {x1, x2, x3, x4, x5, x6}
   * @returns {Promise<Object>} {y1, y2}
   */
  async predict(inputs) {
    try {
      const response = await axios.post(
        `${this.baseURL}/predict`,
        inputs,
        { timeout: this.timeout }
      );

      if (response.data.success) {
        return {
          success: true,
          y1: response.data.y1,
          y2: response.data.y2
        };
      } else {
        throw new Error(response.data.error || 'Болжау қатесі');
      }
    } catch (error) {
      console.error('ML болжау қатесі:', error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * Кері бағыттағы болжау: y1, y2 → x1-x6 (ML модель)
   * @param {Object} targets - {y1, y2}
   * @returns {Promise<Object>} {x1, x2, x3, x4, x5, x6}
   */
  async reversePredict(targets) {
    console.log('[MLService] reversePredict шақырылды');
    console.log('[MLService] Кіріс параметрлер:', JSON.stringify(targets, null, 2));
    console.log('[MLService] ML API URL:', `${this.baseURL}/reverse-predict`);
    
    try {
      console.log('[MLService] HTTP POST запрос жіберілуде...');
      const response = await axios.post(
        `${this.baseURL}/reverse-predict`,
        targets,
        { 
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('[MLService] HTTP статус:', response.status);
      console.log('[MLService] HTTP жауап:', JSON.stringify(response.data, null, 2));

      if (response.data.success) {
        console.log('[MLService] ✅ Сәтті болжау алынды');
        return {
          success: true,
          x1: response.data.x1,
          x2: response.data.x2,
          x3: response.data.x3,
          x4: response.data.x4,
          x5: response.data.x5,
          x6: response.data.x6
        };
      } else {
        const errorMsg = response.data.error || 'Кері бағыттағы болжау қатесі';
        console.error('[MLService] ❌ ML API қатесі:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('[MLService] ❌ EXCEPTION:', error.message);
      
      if (error.response) {
        // HTTP қате жауабы
        console.error('[MLService] HTTP статус:', error.response.status);
        console.error('[MLService] HTTP қате деректері:', JSON.stringify(error.response.data, null, 2));
        
        return {
          success: false,
          error: error.response.data?.error || error.response.data?.message || error.message,
          httpStatus: error.response.status,
          httpData: error.response.data
        };
      } else if (error.request) {
        // Запрос жіберілді, бірақ жауап жоқ
        console.error('[MLService] Жауап жоқ. Запрос:', error.request);
        return {
          success: false,
          error: `ML API-ға қосылу мүмкін емес: ${error.message}`,
          code: error.code
        };
      } else {
        // Басқа қате
        console.error('[MLService] Қате:', error.message);
        console.error('[MLService] Stack:', error.stack);
        return {
          success: false,
          error: error.message
        };
      }
    }
  }

  /**
   * Обратная оптимизация: y1, y2 → x1-x6
   * @param {Object} targets - {y1, y2}
   * @param {Object} options - {weights, method}
   * @returns {Promise<Object>} optimal parameters
   */
  async optimize(targets, options = {}) {
    try {
      const payload = {
        y1: targets.y1,
        y2: targets.y2,
        ...options
      };

      const response = await axios.post(
        `${this.baseURL}/optimize`,
        payload,
        { timeout: this.timeout * 2 } // Оптимизация көбірек уақыт алады
      );

      if (response.data.success) {
        return {
          success: true,
          ...response.data
        };
      } else {
        throw new Error(response.data.error || 'Оптимизация қатесі');
      }
    } catch (error) {
      console.error('ML оптимизация қатесі:', error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * Feature importance алу
   * @returns {Promise<Array>} importance list
   */
  async getFeatureImportance() {
    try {
      const response = await axios.get(
        `${this.baseURL}/feature-importance`,
        { timeout: 10000 }
      );

      if (response.data.success) {
        return {
          success: true,
          importance: response.data.importance
        };
      } else {
        throw new Error(response.data.error || 'Feature importance қатесі');
      }
    } catch (error) {
      console.error('Feature importance қатесі:', error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * Модель метрикаларын алу
   * @returns {Promise<Object>} metrics
   */
  async getMetrics() {
    try {
      const response = await axios.get(
        `${this.baseURL}/metrics`,
        { timeout: 10000 }
      );

      if (response.data.success) {
        return {
          success: true,
          metrics: response.data.metrics
        };
      } else {
        throw new Error(response.data.error || 'Метрикалар қатесі');
      }
    } catch (error) {
      console.error('Метрикалар қатесі:', error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * Модельдер туралы толық ақпарат алу
   * @returns {Promise<Object>} model info
   */
  async getModelInfo() {
    try {
      const response = await axios.get(
        `${this.baseURL}/model-info`,
        { timeout: 10000 }
      );

      if (response.data.success) {
        return {
          success: true,
          modelInfo: response.data.model_info,
          modelDirectory: response.data.model_directory
        };
      } else {
        throw new Error(response.data.error || 'Модель ақпараттары қатесі');
      }
    } catch (error) {
      console.error('Модель ақпараттары қатесі:', error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }
}

module.exports = new MLService();

