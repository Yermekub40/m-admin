"""
Fuzzy Logic модельдерін тікелей тестілеу (API-сыз)
"""
import sys
import os

# ml директориясын path-қа қосу
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fuzzy_model import FuzzyModel
from hybrid_model import HybridModel

def test_fuzzy_model():
    """Fuzzy Logic модельін тестілеу"""
    print("=" * 60)
    print("1. FUZZY LOGIC МОДЕЛЬ ТЕСТІ")
    print("=" * 60)
    
    try:
        fuzzy = FuzzyModel()
        print("✅ Fuzzy модель құрылды")
        print(f"✅ Ережелер саны: {len(fuzzy.rules)}")
        
        test_input = {
            'x1': 240,
            'x2': 0.9,
            'x3': 210,
            'x4': 518,
            'x5': 2.2,
            'x6': 1750
        }
        
        print(f"\nТест кіріс мәндері:")
        for key, value in test_input.items():
            print(f"  {key} = {value}")
        
        result = fuzzy.predict(**test_input)
        
        if result['success']:
            print(f"\n✅ Болжау нәтижелері:")
            print(f"  y1 = {result['y1']:.2f}%")
            print(f"  y2 = {result['y2']:.4f}")
            return True
        else:
            print(f"\n❌ Қате: {result.get('error', 'Белгісіз қате')}")
            return False
            
    except Exception as e:
        print(f"\n❌ Қате: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_hybrid_model():
    """Гибридті модельді тестілеу"""
    print("\n" + "=" * 60)
    print("2. ГИБРИДТІ МОДЕЛЬ ТЕСТІ")
    print("=" * 60)
    
    try:
        # ML модельді жүктеуге тырысу
        forward_model = None
        try:
            from forward_model import ForwardModel
            forward_model = ForwardModel()
            forward_model.load(model_dir='models')
            print("✅ ML модель жүктелді")
        except Exception as e:
            print(f"⚠️  ML модель жоқ: {e}")
            print("   Тек Fuzzy Logic қолданылады")
        
        hybrid = HybridModel(forward_model=forward_model, fuzzy_weight=0.3, ml_weight=0.7)
        print("✅ Гибридті модель құрылды")
        
        test_input = {
            'x1': 240,
            'x2': 0.9,
            'x3': 210,
            'x4': 518,
            'x5': 2.2,
            'x6': 1750
        }
        
        print(f"\nТест кіріс мәндері:")
        for key, value in test_input.items():
            print(f"  {key} = {value}")
        
        # Тек Fuzzy
        print("\n--- Тек Fuzzy Logic ---")
        result = hybrid.predict(**test_input, use_fuzzy_only=True)
        if result['success']:
            print(f"  y1 = {result['y1']:.2f}%")
            print(f"  y2 = {result['y2']:.4f}")
        
        # Гибридті
        print("\n--- Гибридті (Fuzzy + ML) ---")
        result = hybrid.predict(**test_input)
        if result['success']:
            if result.get('fuzzy_prediction'):
                print(f"  Fuzzy: y1={result['fuzzy_prediction']['y1']:.2f}%, y2={result['fuzzy_prediction']['y2']:.4f}")
            if result.get('ml_prediction'):
                print(f"  ML:    y1={result['ml_prediction']['y1']:.2f}%, y2={result['ml_prediction']['y2']:.4f}")
            print(f"  Гибридті: y1={result['y1']:.2f}%, y2={result['y2']:.4f}")
            if result.get('warning'):
                print(f"  ⚠️  Ескерту: {result['warning']}")
            return True
        else:
            print(f"  ❌ Қате: {result.get('error', 'Белгісіз қате')}")
            return False
            
    except Exception as e:
        print(f"\n❌ Қате: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_api_imports():
    """API импорттарын тестілеу"""
    print("\n" + "=" * 60)
    print("3. API ИМПОРТТАР ТЕСТІ")
    print("=" * 60)
    
    try:
        # API-да қолданылатын модульдерді тексеру
        from fuzzy_model import FuzzyModel
        from hybrid_model import HybridModel
        print("✅ fuzzy_model импорт сәтті")
        print("✅ hybrid_model импорт сәтті")
        
        # API файлын тексеру (синтаксис)
        import ast
        with open('api.py', 'r', encoding='utf-8') as f:
            code = f.read()
        ast.parse(code)
        print("✅ api.py синтаксис дұрыс")
        
        return True
        
    except SyntaxError as e:
        print(f"❌ Синтаксис қатесі: {e}")
        return False
    except ImportError as e:
        print(f"❌ Импорт қатесі: {e}")
        return False
    except Exception as e:
        print(f"❌ Қате: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("FUZZY LOGIC ТЕСТІЛЕУ")
    print("=" * 60)
    
    results = []
    
    # Тест 1: Fuzzy Model
    results.append(("Fuzzy Model", test_fuzzy_model()))
    
    # Тест 2: Hybrid Model
    results.append(("Hybrid Model", test_hybrid_model()))
    
    # Тест 3: API Imports
    results.append(("API Imports", test_api_imports()))
    
    # Қорытынды
    print("\n" + "=" * 60)
    print("ТЕСТІЛЕУ НӘТИЖЕЛЕРІ")
    print("=" * 60)
    
    for test_name, success in results:
        status = "✅ СӘТТІ" if success else "❌ СӘТСІЗ"
        print(f"{test_name}: {status}")
    
    all_passed = all(result[1] for result in results)
    
    print("\n" + "=" * 60)
    if all_passed:
        print("✅ БАРЛЫҚ ТЕСТТЕР СӘТТІ!")
    else:
        print("⚠️  КЕЙБІР ТЕСТТЕР СӘТСІЗ!")
    print("=" * 60)

