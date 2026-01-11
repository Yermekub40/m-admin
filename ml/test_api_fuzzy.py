"""
Fuzzy Logic API endpoint-терін тестілеу
"""
import requests
import json
import time

# API базовый URL
BASE_URL = "http://localhost:5000"

def test_health():
    """Health endpoint тесті"""
    print("=" * 60)
    print("1. Health Endpoint тесті")
    print("=" * 60)
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        return response.status_code == 200
    except requests.exceptions.ConnectionError:
        print("❌ API сервер істемейді. Алдымен API-ны іске қосыңыз!")
        print("   Команда: cd ml && python api.py")
        return False
    except Exception as e:
        print(f"❌ Қате: {e}")
        return False

def test_fuzzy_predict():
    """Fuzzy Logic predict endpoint тесті"""
    print("\n" + "=" * 60)
    print("2. Fuzzy Logic Predict Endpoint тесті")
    print("=" * 60)
    
    test_data = {
        "x1": 240,   # Шикізат шығыны
        "x2": 0.9,   # Шикізат тығыздығы
        "x3": 210,   # Шикізат температурасы
        "x4": 518,   # Реактор температурасы
        "x5": 2.2,   # Реактор қысымы
        "x6": 1750   # Катализатор шығыны
    }
    
    print(f"Request data: {json.dumps(test_data, indent=2, ensure_ascii=False)}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/fuzzy/predict",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"\nStatus Code: {response.status_code}")
        result = response.json()
        print(f"Response: {json.dumps(result, indent=2, ensure_ascii=False)}")
        
        if result.get('success'):
            print("\n✅ Тест сәтті!")
            print(f"   y1 = {result['prediction']['y1']:.2f}%")
            print(f"   y2 = {result['prediction']['y2']:.4f}")
            return True
        else:
            print(f"\n❌ Тест сәтсіз: {result.get('error', 'Белгісіз қате')}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ API сервер істемейді. Алдымен API-ны іске қосыңыз!")
        return False
    except Exception as e:
        print(f"❌ Қате: {e}")
        return False

def test_hybrid_predict():
    """Гибридті predict endpoint тесті"""
    print("\n" + "=" * 60)
    print("3. Гибридті Predict Endpoint тесті")
    print("=" * 60)
    
    test_data = {
        "x1": 240,
        "x2": 0.9,
        "x3": 210,
        "x4": 518,
        "x5": 2.2,
        "x6": 1750,
        "fuzzy_weight": 0.3,
        "ml_weight": 0.7
    }
    
    print(f"Request data: {json.dumps(test_data, indent=2, ensure_ascii=False)}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/hybrid/predict",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"\nStatus Code: {response.status_code}")
        result = response.json()
        print(f"Response: {json.dumps(result, indent=2, ensure_ascii=False)}")
        
        if result.get('success'):
            print("\n✅ Тест сәтті!")
            if 'fuzzy_prediction' in result:
                print(f"   Fuzzy: y1={result['fuzzy_prediction']['y1']:.2f}%, y2={result['fuzzy_prediction']['y2']:.4f}")
            if 'ml_prediction' in result:
                print(f"   ML:    y1={result['ml_prediction']['y1']:.2f}%, y2={result['ml_prediction']['y2']:.4f}")
            print(f"   Гибридті: y1={result['prediction']['y1']:.2f}%, y2={result['prediction']['y2']:.4f}")
            return True
        else:
            print(f"\n❌ Тест сәтсіз: {result.get('error', 'Белгісіз қате')}")
            if 'warning' in result:
                print(f"   Ескерту: {result['warning']}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ API сервер істемейді. Алдымен API-ны іске қосыңыз!")
        return False
    except Exception as e:
        print(f"❌ Қате: {e}")
        return False

def test_fuzzy_only():
    """Тек Fuzzy Logic қолдану тесті"""
    print("\n" + "=" * 60)
    print("4. Тек Fuzzy Logic қолдану тесті")
    print("=" * 60)
    
    test_data = {
        "x1": 240,
        "x2": 0.9,
        "x3": 210,
        "x4": 518,
        "x5": 2.2,
        "x6": 1750,
        "use_fuzzy_only": True
    }
    
    print(f"Request data: {json.dumps(test_data, indent=2, ensure_ascii=False)}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/hybrid/predict",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"\nStatus Code: {response.status_code}")
        result = response.json()
        print(f"Response: {json.dumps(result, indent=2, ensure_ascii=False)}")
        
        if result.get('success'):
            print("\n✅ Тест сәтті!")
            print(f"   y1 = {result['prediction']['y1']:.2f}%")
            print(f"   y2 = {result['prediction']['y2']:.4f}")
            return True
        else:
            print(f"\n❌ Тест сәтсіз: {result.get('error', 'Белгісіз қате')}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ API сервер істемейді. Алдымен API-ны іске қосыңыз!")
        return False
    except Exception as e:
        print(f"❌ Қате: {e}")
        return False

if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("FUZZY LOGIC API ТЕСТІЛЕУ")
    print("=" * 60)
    print("\nЕСКЕРТУ: API сервер іске қосылғанын тексеріңіз!")
    print("Команда: cd ml && python api.py")
    print("\n5 секунд күту...")
    time.sleep(5)
    
    results = []
    
    # Тест 1: Health
    results.append(("Health", test_health()))
    
    # Тест 2: Fuzzy Predict
    if results[0][1]:  # Егер health сәтті болса
        results.append(("Fuzzy Predict", test_fuzzy_predict()))
    
    # Тест 3: Hybrid Predict
    if results[0][1]:
        results.append(("Hybrid Predict", test_hybrid_predict()))
    
    # Тест 4: Fuzzy Only
    if results[0][1]:
        results.append(("Fuzzy Only", test_fuzzy_only()))
    
    # Қорытынды
    print("\n" + "=" * 60)
    print("ТЕСТІЛЕУ НӘТИЖЕЛЕРІ")
    print("=" * 60)
    
    for test_name, success in results:
        status = "✅ СӘТТІ" if success else "❌ СӘТСІЗ"
        print(f"{test_name}: {status}")
    
    all_passed = all(result[1] for result in results)
    
    if all_passed:
        print("\n" + "=" * 60)
        print("✅ БАРЛЫҚ ТЕСТТЕР СӘТТІ!")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("⚠️  КЕЙБІР ТЕСТТЕР СӘТСІЗ!")
        print("=" * 60)

