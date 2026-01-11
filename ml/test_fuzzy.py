"""
Fuzzy Logic модельін тестілеу
"""
import sys
sys.path.insert(0, '.')

from fuzzy_model import FuzzyModel

print("=" * 60)
print("FUZZY LOGIC МОДЕЛЬ ТЕСТІ")
print("=" * 60)

try:
    print("\n1. Fuzzy модель құрылуда...")
    fuzzy = FuzzyModel()
    print("✅ Fuzzy модель құрылды")
    print(f"✅ Ережелер саны: {len(fuzzy.rules)}")
    
    print("\n2. Тест болжау жасалуда...")
    test_input = {
        'x1': 240,   # Шикізат шығыны
        'x2': 0.9,   # Шикізат тығыздығы
        'x3': 210,   # Шикізат температурасы
        'x4': 518,   # Реактор температурасы
        'x5': 2.2,   # Реактор қысымы
        'x6': 1750   # Катализатор шығыны
    }
    
    print(f"\nТест кіріс мәндері:")
    for key, value in test_input.items():
        print(f"  {key} = {value}")
    
    result = fuzzy.predict(**test_input)
    
    if result['success']:
        print(f"\n✅ Болжау нәтижелері:")
        print(f"  y1 (Бензин көлемі) = {result['y1']:.2f}%")
        print(f"  y2 (Бензин тығыздығы) = {result['y2']:.4f}")
        print("\n" + "=" * 60)
        print("✅ ТЕСТІЛЕУ СӘТТІ!")
        print("=" * 60)
    else:
        print(f"\n❌ Қате: {result.get('error', 'Белгісіз қате')}")
        print("\n" + "=" * 60)
        print("❌ ТЕСТІЛЕУ СӘТСІЗ!")
        print("=" * 60)
        
except Exception as e:
    print(f"\n❌ Қате пайда болды: {e}")
    import traceback
    traceback.print_exc()

