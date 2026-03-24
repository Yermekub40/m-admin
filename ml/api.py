"""
Flask API сервис
Node.js-тен шақыру үшін ML модельдерге қолжетімділік
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from forward_model import ForwardModel
from inverse_model import InverseModel
from reverse_model import ReverseModel
from fuzzy_model import FuzzyModel
from hybrid_model import HybridModel
import traceback

# FeatureImportanceAnalyzer optional (matplotlib қажет)
try:
    from feature_importance import FeatureImportanceAnalyzer
    HAS_FEATURE_IMPORTANCE = True
except ImportError:
    HAS_FEATURE_IMPORTANCE = False
    FeatureImportanceAnalyzer = None

app = Flask(__name__)
CORS(app)  # Node.js-тен шақыру үшін

# Глобалды модельдер
forward_model = None
inverse_model = None
reverse_model = None
feature_analyzer = None
fuzzy_model = None
hybrid_model = None


def load_models():
    """Модельдерді жүктеу"""
    global forward_model, inverse_model, reverse_model, feature_analyzer, fuzzy_model, hybrid_model
    
    print("\n=== МОДЕЛЬДЕРДІ ЖҮКТЕУ ===")
    
    # Алдымен Fuzzy Logic модельдерді құру (модельдер жоқ болса да)
    try:
        print("\nFuzzy Logic модельдер құрылуда...")
        fuzzy_model = FuzzyModel()
        print("✅ Fuzzy Logic модель құрылды")
        
        hybrid_model = HybridModel(forward_model=None, fuzzy_weight=1.0, ml_weight=0.0)
        print("✅ Гибридті модель (Fuzzy only) құрылды")
    except Exception as fuzzy_error:
        print(f"❌ Fuzzy Logic құру қатесі: {fuzzy_error}")
        traceback.print_exc()
    
    try:
        model_dir = os.getenv('MODEL_DIR', 'models')
        print(f"\nМодель директориясы: {model_dir}")
        print(f"Директория бар ма: {os.path.exists(model_dir)}")
        
        if os.path.exists(model_dir):
            files = os.listdir(model_dir)
            print(f"Директориядағы файлдар: {files}")
        
        # Forward модельді жүктеу (егер бар болса)
        forward_model = None
        try:
            forward_model = ForwardModel()
            print("\nForward модель жүктелуде...")
            forward_model.load(model_dir=model_dir)
            print("✅ Forward модель сәтті жүктелді")
            
            inverse_model = InverseModel(forward_model)
            print("✅ Inverse модель сәтті құрылды")
            
            # Гибридті модельді жаңарту (ML модель бар болса)
            if hybrid_model:
                hybrid_model.forward_model = forward_model
                hybrid_model.set_weights(0.3, 0.7)
                print("✅ Гибридті модель жаңартылды (Fuzzy + ML)")
        except FileNotFoundError as e:
            print(f"⚠️  Forward модель файлдары жоқ: {e}")
            print("   Алдымен train.py-ды орындап, модельдерді оқытыңыз!")
            forward_model = None
            inverse_model = None
        except Exception as e:
            print(f"⚠️  Forward модель жүктеу қатесі: {e}")
            forward_model = None
            inverse_model = None
        
        # Кері бағыттағы модельді жүктеу (егер бар болса)
        reverse_model = None
        try:
            print("\nКері бағыттағы модель жүктелуде...")
            reverse_model = ReverseModel()
            
            # Файлдарды тексеру
            required_files = [
                f'{model_dir}/reverse_model_x1.pkl',
                f'{model_dir}/reverse_model_x2.pkl',
                f'{model_dir}/reverse_model_x3.pkl',
                f'{model_dir}/reverse_model_x4.pkl',
                f'{model_dir}/reverse_model_x5.pkl',
                f'{model_dir}/reverse_model_x6.pkl',
                f'{model_dir}/reverse_scalers.pkl'
            ]
            
            missing_files = [f for f in required_files if not os.path.exists(f)]
            if missing_files:
                print(f"❌ Кері модель файлдары жоқ:")
                for f in missing_files:
                    print(f"   - {f}")
                raise FileNotFoundError(f"Кері модель файлдары табылмады: {missing_files}")
            
            reverse_model.load(model_dir=model_dir)
            print("✅ Кері бағыттағы модель сәтті жүктелді")
        except FileNotFoundError as e:
            print(f"⚠️  Ескерту: Кері бағыттағы модель файлдары жоқ: {e}")
            print("   Алдымен train.py-ды орындап, кері модельді оқытыңыз!")
            reverse_model = None
        except Exception as e:
            print(f"❌ Кері бағыттағы модель жүктеу қатесі: {e}")
            print(f"   Traceback: {traceback.format_exc()}")
            reverse_model = None
        
        if forward_model and HAS_FEATURE_IMPORTANCE and FeatureImportanceAnalyzer:
            feature_analyzer = FeatureImportanceAnalyzer(forward_model)
            print("✅ Feature analyzer сәтті құрылды")
        else:
            feature_analyzer = None
            if not forward_model:
                print("⚠️  Feature analyzer қолжетімсіз (ML модель жоқ)")
            else:
                print("⚠️  Feature analyzer қолжетімсіз (matplotlib жоқ)")
        
        print("\n=== МОДЕЛЬДЕР ЖҮКТЕЛДІ ===")
        print(f"Forward модель: {'✅' if forward_model else '❌'}")
        print(f"Inverse модель: {'✅' if inverse_model else '❌'}")
        print(f"Reverse модель: {'✅' if reverse_model else '❌'}")
        print(f"Fuzzy Logic модель: {'✅' if fuzzy_model else '❌'}")
        print(f"Гибридті модель: {'✅' if hybrid_model else '❌'}")
        print("=" * 40 + "\n")
        
        return True
    except Exception as e:
        print(f"\n⚠️  МОДЕЛЬДЕРДІ ЖҮКТЕУ ҚАТЕСІ: {e}")
        print("ЕСКЕРТУ: ML модельдер жоқ, бірақ Fuzzy Logic жұмыс істейді!")
        print("Модельдерді оқыту үшін: python ml/train.py")
        print("=" * 40 + "\n")
        
        # Fuzzy Logic бар болса, True қайтару
        return fuzzy_model is not None


@app.route('/health', methods=['GET'])
def health():
    """Сервис дұрыс жұмыс істеп тұрғанын тексеру"""
    return jsonify({
        'status': 'ok',
        'models_loaded': forward_model is not None,
        'reverse_model_loaded': reverse_model is not None,
        'fuzzy_model_loaded': fuzzy_model is not None,
        'hybrid_model_loaded': hybrid_model is not None
    })


@app.route('/predict', methods=['POST'])
def predict():
    """
    Прямая модель: x1-x6 → y1, y2
    
    Request body:
    {
        "x1": 240,
        "x2": 0.9,
        "x3": 210,
        "x4": 518,
        "x5": 2.2,
        "x6": 1750
    }
    
    Response:
    {
        "success": true,
        "y1": 48.5,
        "y2": 0.72
    }
    """
    if forward_model is None:
        return jsonify({
            'success': False,
            'error': 'Модельдер жүктелмеген'
        }), 500
    
    try:
        data = request.get_json()
        
        # Валидация
        required_params = ['x1', 'x2', 'x3', 'x4', 'x5', 'x6']
        missing = [p for p in required_params if p not in data]
        if missing:
            return jsonify({
                'success': False,
                'error': f'Жетіспейтін параметрлер: {", ".join(missing)}'
            }), 400
        
        # Болжау
        prediction = forward_model.predict(data)
        
        return jsonify({
            'success': True,
            **prediction
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500


@app.route('/reverse-predict', methods=['POST'])
def reverse_predict():
    """
    Кері бағыттағы модель: y1, y2 → x1-x6
    
    Request body:
    {
        "y1": 50.0,
        "y2": 0.75
    }
    
    Response:
    {
        "success": true,
        "x1": 240.5,
        "x2": 0.91,
        "x3": 210.2,
        "x4": 518.3,
        "x5": 2.21,
        "x6": 1750.5
    }
    """
    import time
    start_time = time.time()
    
    print('\n=== КЕРІ БАҒЫТТАҒЫ БОЛЖАУ ЗАПРОСЫ (Python API) ===')
    print(f'Request method: {request.method}')
    print(f'Request URL: {request.url}')
    print(f'Request headers: {dict(request.headers)}')
    
    if reverse_model is None:
        error_msg = 'Кері бағыттағы модель жүктелмеген. Алдымен train.py-ды орындаңыз!'
        print(f'❌ {error_msg}')
        print('==========================================\n')
        return jsonify({
            'success': False,
            'error': error_msg,
            'model_loaded': False
        }), 500
    
    print('✅ Кері бағыттағы модель жүктелген')
    
    try:
        data = request.get_json()
        print(f'Request body: {data}')
        print(f'Request body type: {type(data)}')
        
        if data is None:
            error_msg = 'Request body бос немесе JSON емес'
            print(f'❌ {error_msg}')
            print('==========================================\n')
            return jsonify({
                'success': False,
                'error': error_msg
            }), 400
        
        # Валидация
        if 'y1' not in data or 'y2' not in data:
            error_msg = f'y1 және y2 параметрлері қажет. Алынған: {list(data.keys())}'
            print(f'❌ {error_msg}')
            print('==========================================\n')
            return jsonify({
                'success': False,
                'error': error_msg,
                'received_keys': list(data.keys())
            }), 400
        
        y1 = data['y1']
        y2 = data['y2']
        print(f'Параметрлер: y1={y1} (type: {type(y1)}), y2={y2} (type: {type(y2)})')
        
        # Санға түрлендіру
        try:
            y1 = float(y1)
            y2 = float(y2)
            print(f'Парсингтелген: y1={y1}, y2={y2}')
        except (ValueError, TypeError) as e:
            error_msg = f'Параметрлерді санға түрлендіру қатесі: {str(e)}'
            print(f'❌ {error_msg}')
            print('==========================================\n')
            return jsonify({
                'success': False,
                'error': error_msg,
                'y1': y1,
                'y2': y2
            }), 400
        
        # Болжау
        print('Модель болжау жасауда...')
        prediction = reverse_model.predict({'y1': y1, 'y2': y2})
        print(f'Болжау нәтижесі: {prediction}')
        
        duration = (time.time() - start_time) * 1000
        print(f'✅ Сәтті! Уақыт: {duration:.2f}ms')
        print('==========================================\n')
        
        return jsonify({
            'success': True,
            **prediction
        })
        
    except Exception as e:
        duration = (time.time() - start_time) * 1000
        error_traceback = traceback.format_exc()
        print(f'❌ EXCEPTION: {str(e)}')
        print(f'Traceback:\n{error_traceback}')
        print(f'Уақыт: {duration:.2f}ms')
        print('==========================================\n')
        
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': error_traceback,
            'exception_type': type(e).__name__
        }), 500


@app.route('/optimize', methods=['POST'])
def optimize():
    """
    Обратная модель: y1, y2 → x1-x6
    
    Request body:
    {
        "y1": 50.0,
        "y2": 0.75,
        "weights": [1.0, 1.0],  // optional
        "method": "differential_evolution"  // optional
    }
    
    Response:
    {
        "success": true,
        "optimal_parameters": {
            "x1": 245.2,
            "x2": 0.91,
            ...
        },
        "predicted_y1": 50.1,
        "predicted_y2": 0.751,
        "error_y1": 0.1,
        "error_y2": 0.001
    }
    """
    if inverse_model is None:
        return jsonify({
            'success': False,
            'error': 'Модельдер жүктелмеген'
        }), 500
    
    try:
        data = request.get_json()
        
        # Валидация
        if 'y1' not in data or 'y2' not in data:
            return jsonify({
                'success': False,
                'error': 'y1 және y2 параметрлері қажет'
            }), 400
        
        target_y1 = float(data['y1'])
        target_y2 = float(data['y2'])
        weights = data.get('weights', None)
        method = data.get('method', 'differential_evolution')
        
        # Оптимизация
        result = inverse_model.find_optimal_parameters(
            target_y1, target_y2,
            method=method,
            weights=weights
        )
        
        return jsonify({
            'success': True,
            **result
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500


@app.route('/feature-importance', methods=['GET'])
def get_feature_importance():
    """
    Параметрлердің маңыздылығын алу
    
    Response:
    {
        "success": true,
        "importance": [
            {
                "parameter": "x4",
                "importance_y1": 0.35,
                "importance_y2": 0.28,
                "avg_importance": 0.315
            },
            ...
        ]
    }
    """
    if feature_analyzer is None:
        return jsonify({
            'success': False,
            'error': 'Модельдер жүктелмеген'
        }), 500
    
    try:
        importance_df = feature_analyzer.get_model_importance()
        
        if importance_df is None:
            return jsonify({
                'success': False,
                'error': 'Feature importance тек Random Forest/Gradient Boosting үшін қолжетімді'
            }), 400
        
        importance_list = importance_df.to_dict('records')
        
        return jsonify({
            'success': True,
            'importance': importance_list
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500


@app.route('/metrics', methods=['GET'])
def get_metrics():
    """
    Модель метрикаларын алу (R², RMSE, MAPE)
    """
    if forward_model is None:
        return jsonify({
            'success': False,
            'error': 'Модельдер жүктелмеген'
        }), 500

    try:
        metrics = forward_model.metrics

        if not metrics:
            # Егер metrics бос болса, деректерден қайта есептеу
            from data_loader import DataLoader
            loader = DataLoader()
            try:
                df = loader.load_data(source=os.getenv('ML_DATA_SOURCE', 'csv'))
            except Exception as e:
                return jsonify({
                    'success': False,
                    'error': f'Деректерді жүктеу қатесі: {str(e)}'
                }), 500

            try:
                metrics = forward_model.evaluate(df)
            except Exception as e:
                return jsonify({
                    'success': False,
                    'error': f'Метриканы қайта есептеу қатесі: {str(e)}'
                }), 500

        return jsonify({
            'success': True,
            'metrics': metrics
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/model-info', methods=['GET'])
def get_model_info():
    """
    Модельдер туралы толық ақпарат (метрикалар, тип, параметрлер, файл ақпараттары)
    """
    import os
    from datetime import datetime
    
    try:
        model_dir = os.getenv('MODEL_DIR', 'models')
        model_info = {
            'forward_model': None,
            'reverse_model': None,
            'files_info': {}
        }
        
        # Forward модель ақпараттары
        if forward_model is not None:
            forward_info = {
                'loaded': True,
                'metrics': forward_model.metrics if hasattr(forward_model, 'metrics') else {},
                'models': {}
            }
            
            # Әрбір модель үшін (y1, y2)
            for param in ['y1', 'y2']:
                if forward_model.models.get(param) is not None:
                    model = forward_model.models[param]
                    model_class = model.__class__.__name__
                    
                    forward_info['models'][param] = {
                        'type': model_class,
                        'algorithm': _get_algorithm_name(model_class),
                        'parameters': _safe_get_params(model),
                        'n_features': getattr(model, 'n_features_in_', None),
                        'n_outputs': getattr(model, 'n_outputs_', None)
                    }
            
            # Файл ақпараттары
            forward_files = {
                'forward_model_y1.pkl': _get_file_info(f'{model_dir}/forward_model_y1.pkl'),
                'forward_model_y2.pkl': _get_file_info(f'{model_dir}/forward_model_y2.pkl'),
                'forward_scalers.pkl': _get_file_info(f'{model_dir}/forward_scalers.pkl')
            }
            forward_info['files'] = forward_files
            
            model_info['forward_model'] = forward_info
        else:
            model_info['forward_model'] = {'loaded': False}
        
        # Reverse модель ақпараттары
        if reverse_model is not None:
            reverse_info = {
                'loaded': True,
                'metrics': reverse_model.metrics if hasattr(reverse_model, 'metrics') else {},
                'models': {}
            }
            
            # Әрбір модель үшін (x1-x6)
            for param in ['x1', 'x2', 'x3', 'x4', 'x5', 'x6']:
                if reverse_model.models.get(param) is not None:
                    model = reverse_model.models[param]
                    model_class = model.__class__.__name__
                    
                    reverse_info['models'][param] = {
                        'type': model_class,
                        'algorithm': _get_algorithm_name(model_class),
                        'parameters': _safe_get_params(model),
                        'n_features': getattr(model, 'n_features_in_', None),
                        'n_outputs': getattr(model, 'n_outputs_', None)
                    }
            
            # Файл ақпараттары
            reverse_files = {}
            for param in ['x1', 'x2', 'x3', 'x4', 'x5', 'x6']:
                reverse_files[f'reverse_model_{param}.pkl'] = _get_file_info(f'{model_dir}/reverse_model_{param}.pkl')
            reverse_files['reverse_scalers.pkl'] = _get_file_info(f'{model_dir}/reverse_scalers.pkl')
            reverse_info['files'] = reverse_files
            
            model_info['reverse_model'] = reverse_info
        else:
            model_info['reverse_model'] = {'loaded': False}
        
        return jsonify({
            'success': True,
            'model_info': model_info,
            'model_directory': model_dir
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500


def _get_algorithm_name(model_class_name):
    """Модель класы атауынан алгоритм атауын алу"""
    algorithm_map = {
        'RandomForestRegressor': 'Random Forest',
        'GradientBoostingRegressor': 'Gradient Boosting',
        'LinearRegression': 'Linear Regression',
        'Ridge': 'Ridge Regression'
    }
    return algorithm_map.get(model_class_name, model_class_name)


def _safe_get_params(model):
    """Модель параметрлерін қауіпсіз түрде алу (JSON-ға сәйкес)"""
    try:
        params = model.get_params()
        # JSON-ға сәйкес емес типтерді түрлендіру
        cleaned_params = {}
        for key, value in params.items():
            if isinstance(value, (int, float, str, bool, type(None))):
                cleaned_params[key] = value
            elif isinstance(value, (list, tuple)):
                cleaned_params[key] = [v for v in value if isinstance(v, (int, float, str, bool))]
            else:
                cleaned_params[key] = str(value)
        return cleaned_params
    except Exception as e:
        return {'error': str(e)}


def _get_file_info(filepath):
    """Файл ақпараттарын алу"""
    try:
        if os.path.exists(filepath):
            stat = os.stat(filepath)
            return {
                'exists': True,
                'size_bytes': stat.st_size,
                'size_mb': round(stat.st_size / (1024 * 1024), 2),
                'modified': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                'created': datetime.fromtimestamp(stat.st_ctime).isoformat()
            }
        else:
            return {'exists': False}
    except Exception as e:
        return {'exists': False, 'error': str(e)}


@app.route('/fuzzy/predict', methods=['POST'])
def fuzzy_predict():
    """
    Fuzzy Logic болжау: x1-x6 → y1, y2
    
    Request body:
    {
        "x1": 240,
        "x2": 0.9,
        "x3": 210,
        "x4": 518,
        "x5": 2.2,
        "x6": 1750
    }
    
    Response:
    {
        "success": true,
        "prediction": {
            "y1": 44.90,
            "y2": 0.6865
        }
    }
    """
    if fuzzy_model is None:
        return jsonify({
            'success': False,
            'error': 'Fuzzy Logic модель жүктелмеген'
        }), 500
    
    try:
        data = request.get_json()
        
        # Валидация
        required_params = ['x1', 'x2', 'x3', 'x4', 'x5', 'x6']
        missing = [p for p in required_params if p not in data]
        if missing:
            return jsonify({
                'success': False,
                'error': f'Жетіспейтін параметрлер: {", ".join(missing)}'
            }), 400
        
        # Болжау
        result = fuzzy_model.predict(
            x1=data['x1'],
            x2=data['x2'],
            x3=data['x3'],
            x4=data['x4'],
            x5=data['x5'],
            x6=data['x6']
        )
        
        if result['success']:
            return jsonify({
                'success': True,
                'prediction': {
                    'y1': result['y1'],
                    'y2': result['y2']
                }
            })
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Белгісіз қате')
            }), 500
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500


@app.route('/hybrid/predict', methods=['POST'])
def hybrid_predict():
    """
    Гибридті болжау: Fuzzy Logic + ML модельдер
    x1-x6 → y1, y2
    
    Request body:
    {
        "x1": 240,
        "x2": 0.9,
        "x3": 210,
        "x4": 518,
        "x5": 2.2,
        "x6": 1750,
        "fuzzy_weight": 0.3,  // optional
        "ml_weight": 0.7,      // optional
        "use_fuzzy_only": false,  // optional
        "use_ml_only": false       // optional
    }
    
    Response:
    {
        "success": true,
        "prediction": {
            "y1": 46.2,
            "y2": 0.71
        },
        "fuzzy_prediction": {
            "y1": 44.90,
            "y2": 0.6865
        },
        "ml_prediction": {
            "y1": 48.5,
            "y2": 0.72
        }
    }
    """
    if hybrid_model is None:
        return jsonify({
            'success': False,
            'error': 'Гибридті модель жүктелмеген'
        }), 500
    
    try:
        data = request.get_json()
        
        # Валидация
        required_params = ['x1', 'x2', 'x3', 'x4', 'x5', 'x6']
        missing = [p for p in required_params if p not in data]
        if missing:
            return jsonify({
                'success': False,
                'error': f'Жетіспейтін параметрлер: {", ".join(missing)}'
            }), 400
        
        # Салмақтарды орнату (егер берілсе)
        fuzzy_weight = data.get('fuzzy_weight')
        ml_weight = data.get('ml_weight')
        if fuzzy_weight is not None and ml_weight is not None:
            hybrid_model.set_weights(fuzzy_weight, ml_weight)
        
        # Болжау
        result = hybrid_model.predict(
            x1=data['x1'],
            x2=data['x2'],
            x3=data['x3'],
            x4=data['x4'],
            x5=data['x5'],
            x6=data['x6'],
            use_fuzzy_only=data.get('use_fuzzy_only', False),
            use_ml_only=data.get('use_ml_only', False)
        )
        
        if result['success']:
            response = {
                'success': True,
                'prediction': {
                    'y1': result['y1'],
                    'y2': result['y2']
                }
            }
            
            # Қосымша ақпарат
            if result.get('fuzzy_prediction'):
                response['fuzzy_prediction'] = result['fuzzy_prediction']
            if result.get('ml_prediction'):
                response['ml_prediction'] = result['ml_prediction']
            if result.get('hybrid_prediction'):
                response['hybrid_prediction'] = result['hybrid_prediction']
            if result.get('warning'):
                response['warning'] = result['warning']
            
            return jsonify(response)
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Белгісіз қате')
            }), 500
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500


if __name__ == '__main__':
    # Модельдерді жүктеу
    if not load_models():
        print("ЕСКЕРТУ: Модельдер жүктелмеді. Алдымен train.py-ды орындаңыз!")
    
    # Серверді іске қосу
    port = int(os.getenv('ML_API_PORT', 5000))
    host = os.getenv('ML_API_HOST', '0.0.0.0')
    
    print(f"\nML API сервис іске қосылуда...")
    print(f"URL: http://{host}:{port}")
    print(f"\nҚолжетімді endpoint-тер:")
    print(f"  GET  /health")
    print(f"  POST /predict              (ML модель)")
    print(f"  POST /reverse-predict      (ML модель)")
    print(f"  POST /optimize             (ML модель)")
    print(f"  GET  /feature-importance   (ML модель)")
    print(f"  GET  /metrics              (ML модель)")
    print(f"  POST /fuzzy/predict        (Fuzzy Logic)")
    print(f"  POST /hybrid/predict       (Fuzzy + ML)")
    
    app.run(host=host, port=port, debug=True)

