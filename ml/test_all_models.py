#!/usr/bin/env python3
"""
Все модели тестүю скрипт
Flask API endpoints қа сұрау жібареді және нәтижелерді тексереді
"""
import requests
import json
import time

# API базасы
BASE_URL = 'http://localhost:5000'

# Тест деректері
TEST_FORWARD = {
    'x1': 240,
    'x2': 0.9,
    'x3': 210,
    'x4': 518,
    'x5': 2.2,
    'x6': 1750
}

TEST_REVERSE = {
    'y1': 50.0,
    'y2': 0.75
}

def print_header(text):
    print(f"\n{'='*60}")
    print(f"  {text}")
    print(f"{'='*60}")

def print_result(endpoint, status, response):
    status_icon = "✅" if status else "❌"
    print(f"{status_icon} {endpoint}")
    if status:
        try:
            if isinstance(response, dict):
                print(f"   {json.dumps(response, indent=2)}")
            else:
                print(f"   {response}")
        except:
            print(f"   {response}")
    else:
        print(f"   ❌ Қателік: {response}")

def test_health():
    """Сервер жұмысында ма?"""
    print_header("1. HEALTH CHECK")
    try:
        resp = requests.get(f'{BASE_URL}/health', timeout=5)
        print_result('/health', resp.status_code == 200, resp.json())
        return resp.status_code == 200
    except Exception as e:
        print_result('/health', False, str(e))
        return False

def test_forward_model():
    """Прямая модель (x1-x6 → y1, y2)"""
    print_header("2. FORWARD MODEL (x1-x6 → y1, y2 болжау)")
    try:
        resp = requests.post(
            f'{BASE_URL}/predict',
            json=TEST_FORWARD,
            timeout=5
        )
        success = resp.status_code == 200 and resp.json().get('success')
        data = resp.json().get('data', {})
        
        print(f"Input: {TEST_FORWARD}")
        print_result('/predict', success, data)
        
        if success and 'prediction' in data:
            pred = data['prediction']
            print(f"  y1 = {pred.get('y1')} (Бензин көлемі)")
            print(f"  y2 = {pred.get('y2')} (Бензин тығыздығы)")
        
        return success
    except Exception as e:
        print_result('/predict', False, str(e))
        return False

def test_reverse_model():
    """Кері модель (y1, y2 → x1-x6 оптимизация)"""
    print_header("3. REVERSE MODEL (y1, y2 → x1-x6 оптимизация)")
    try:
        resp = requests.post(
            f'{BASE_URL}/optimize',
            json=TEST_REVERSE,
            timeout=5
        )
        success = resp.status_code == 200 and resp.json().get('success')
        data = resp.json().get('data', {})
        
        print(f"Input: {TEST_REVERSE}")
        print_result('/optimize', success, data)
        
        if success and 'optimization' in data:
            opt = data['optimization']
            print(f"  Оптимизованы параметрлер:")
            for key, val in sorted(opt.items()):
                if isinstance(val, (int, float)):
                    print(f"    {key} = {val:.2f}")
        
        return success
    except Exception as e:
        print_result('/optimize', False, str(e))
        return False

def test_metrics():
    """Модель метрикалары (R², RMSE, MAPE)"""
    print_header("4. MODEL METRICS (R², RMSE, MAPE)")
    try:
        resp = requests.get(f'{BASE_URL}/metrics', timeout=5)
        success = resp.status_code == 200 and resp.json().get('success')
        data = resp.json().get('metrics', {})
        
        print_result('/metrics', success, {})
        
        if success:
            for param in ['y1', 'y2']:
                if param in data:
                    metrics = data[param]
                    print(f"\n  {param.upper()}:")
                    print(f"    R² = {metrics.get('R2', 'N/A'):.4f}")
                    print(f"    RMSE = {metrics.get('RMSE', 'N/A'):.4f}")
                    print(f"    MAPE = {metrics.get('MAPE', 'N/A'):.2f}%")
        
        return success
    except Exception as e:
        print_result('/metrics', False, str(e))
        return False

def test_feature_importance():
    """Параметрлердің маңыздылығы"""
    print_header("5. FEATURE IMPORTANCE (Параметрлердің маңыздылығы)")
    try:
        resp = requests.get(f'{BASE_URL}/feature-importance', timeout=5)
        success = resp.status_code == 200 and resp.json().get('success')
        data = resp.json().get('importance', [])
        
        print_result('/feature-importance', success, {})
        
        if success and data:
            print("\n  Маңыздылық рейтингі:")
            for item in data[:5]:  # Бірінші 5
                param = item.get('parameter')
                imp_y1 = item.get('importance_y1', 0)
                imp_y2 = item.get('importance_y2', 0)
                avg_imp = item.get('avg_importance', 0)
                print(f"    {param}: y1={imp_y1:.4f}, y2={imp_y2:.4f}, avg={avg_imp:.4f}")
        
        return success
    except Exception as e:
        print_result('/feature-importance', False, str(e))
        return False

def test_model_info():
    """Модельдер туралы толық ақпарат"""
    print_header("6. MODEL INFO (Модельдер туралы ақпарат)")
    try:
        resp = requests.get(f'{BASE_URL}/model-info', timeout=5)
        success = resp.status_code == 200
        data = resp.json()
        
        print_result('/model-info', success, {})
        
        if success:
            if 'forward_model' in data:
                fm = data.get('forward_model', {})
                if isinstance(fm, dict):
                    print(f"\n  Forward Model:")
                    print(f"    Loaded: {fm.get('loaded', False)}")
                    if 'models' in fm:
                        for param, pinfo in fm['models'].items():
                            algo = pinfo.get('algorithm', 'unknown')
                            print(f"    {param}: {algo}")
            
            if 'reverse_model' in data:
                rm = data.get('reverse_model', {})
                if isinstance(rm, dict):
                    print(f"\n  Reverse Model:")
                    print(f"    Loaded: {rm.get('loaded', False)}")
                    if 'models' in rm:
                        count = len(rm['models'])
                        print(f"    Models count: {count}")
        
        return success
    except Exception as e:
        print_result('/model-info', False, str(e))
        return False

def test_fuzzy_model():
    """Fuzzy Logic модель"""
    print_header("7. FUZZY LOGIC MODEL (Fuzzy Logic болжау)")
    try:
        resp = requests.post(
            f'{BASE_URL}/fuzzy/predict',
            json=TEST_FORWARD,
            timeout=5
        )
        success = resp.status_code == 200 and resp.json().get('success')
        data = resp.json().get('data', {})
        
        print(f"Input: {TEST_FORWARD}")
        print_result('/fuzzy/predict', success, data)
        
        if success and 'prediction' in data:
            pred = data['prediction']
            print(f"  y1 = {pred.get('y1')} (Fuzzy Logic болжау)")
            print(f"  y2 = {pred.get('y2')}")
        
        return success
    except Exception as e:
        print_result('/fuzzy/predict', False, str(e))
        return False

def test_hybrid_model():
    """Гибридті модель (Fuzzy + ML)"""
    print_header("8. HYBRID MODEL (Fuzzy + ML гибридті модель)")
    try:
        resp = requests.post(
            f'{BASE_URL}/hybrid/predict',
            json=TEST_FORWARD,
            timeout=5
        )
        success = resp.status_code == 200 and resp.json().get('success')
        data = resp.json().get('data', {})
        
        print(f"Input: {TEST_FORWARD}")
        print_result('/hybrid/predict', success, data)
        
        if success and 'prediction' in data:
            pred = data['prediction']
            print(f"  y1 = {pred.get('y1')} (Hybrid болжау)")
            print(f"  y2 = {pred.get('y2')}")
        
        return success
    except Exception as e:
        print_result('/hybrid/predict', False, str(e))
        return False

def main():
    print("\n" + "="*60)
    print("  М-ADMIN ML API - БАРЛЫҚ МОДЕЛЬДЕРДІ ТЕСТЕУ")
    print("="*60)
    print(f"\nAPI URL: {BASE_URL}")
    print(f"Тест уақыты: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Сервер жұмысында ма?
    if not test_health():
        print("\n❌ ОНДАЙ СЕРВЕР ЖҰМЫС ІСТЕМЕГЕН!")
        print(f"Іске қосыңыз: cd ml && python api.py")
        return
    
    results = []
    results.append(("Forward Model (/predict)", test_forward_model()))
    results.append(("Reverse Model (/optimize)", test_reverse_model()))
    results.append(("Metrics (/metrics)", test_metrics()))
    results.append(("Feature Importance (/feature-importance)", test_feature_importance()))
    results.append(("Model Info (/model-info)", test_model_info()))
    results.append(("Fuzzy Logic (/fuzzy/predict)", test_fuzzy_model()))
    results.append(("Hybrid Model (/hybrid/predict)", test_hybrid_model()))
    
    # ҚОРЫТЫНДЫ
    print_header("ҚОРЫТЫНДЫ")
    passed = sum(1 for _, r in results if r)
    total = len(results)
    
    for name, result in results:
        icon = "✅" if result else "❌"
        print(f"{icon} {name}")
    
    print(f"\nНәтиже: {passed}/{total} тестінің өтті")
    
    if passed == total:
        print("🎉 БАРЛЫҚ МОДЕЛЬДЕР ЖҰМЫС ІСТЕП ТҰРАДЫ!")
    elif passed == 0:
        print("❌ ЕШБІР МОДЕЛЬ ЖҰМЫС ІСТЕМЕГЕН!")
    else:
        print(f"⚠️  {total - passed} модель сәтсіз болды")

if __name__ == '__main__':
    main()
