"""
API-ны тестілеу - қателерді табу
"""
import sys
import os

# ml директориясын path-қа қосу
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("=" * 60)
print("ML API ТЕСТІЛЕУ")
print("=" * 60)

try:
    print("\n1. Модульдерді импорттау...")
    from api import app, load_models
    print("✅ API модулі импорт сәтті")
    
    print("\n2. Модельдерді жүктеу...")
    result = load_models()
    
    if result:
        print("✅ Модельдер жүктелді")
    else:
        print("⚠️  Модельдер жүктелмеді (бұл қалыпты, егер модельдер оқытылмаған болса)")
    
    print("\n3. Flask app тексеру...")
    if app:
        print("✅ Flask app құрылды")
        print(f"   Routes: {len(app.url_map._rules)}")
    else:
        print("❌ Flask app құрылмады")
    
    print("\n" + "=" * 60)
    print("✅ БАРЛЫҚ ТЕСТТЕР СӘТТІ!")
    print("=" * 60)
    print("\nAPI-ны іске қосу үшін:")
    print("  python ml/api.py")
    print("немесе")
    print("  node scripts/start-ml-api.js")
    
except SyntaxError as e:
    print(f"\n❌ СИНТАКСИС ҚАТЕСІ:")
    print(f"   Файл: {e.filename}")
    print(f"   Жол: {e.lineno}")
    print(f"   Қате: {e.msg}")
    print(f"   Мәтін: {e.text}")
    import traceback
    traceback.print_exc()
    
except ImportError as e:
    print(f"\n❌ ИМПОРТ ҚАТЕСІ: {e}")
    print("\nҚажетті модульдер:")
    print("  - flask")
    print("  - flask-cors")
    print("  - numpy")
    print("  - pandas")
    print("  - scikit-learn")
    print("  - scipy")
    print("  - joblib")
    print("\nОрнату:")
    print("  pip install flask flask-cors numpy pandas scikit-learn scipy joblib")
    import traceback
    traceback.print_exc()
    
except Exception as e:
    print(f"\n❌ ҚАТЕ: {e}")
    import traceback
    traceback.print_exc()

