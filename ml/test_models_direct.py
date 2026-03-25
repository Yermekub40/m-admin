#!/usr/bin/env python3
"""
Direct model test (без HTTP)
Модельдерді тікелей импорт және тестеу
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

print("\n" + "="*60)
print("  МОДЕЛЬДЕРДІ ТІКЕЛЕЙ ТЕСТЕУ")
print("="*60)

# 1. Forward Model
print("\n✓ 1. FORWARD MODEL (Прямая, x1-x6 → y1, y2)")
try:
    from forward_model import ForwardModel
    from data_loader import DataLoader
    
    loader = DataLoader()
    df = loader.load_data(source='csv')
    
    forward = ForwardModel()
    forward.load('models')
    
    # Predict
    result = forward.predict({'x1': 240, 'x2': 0.9, 'x3': 210, 'x4': 518, 'x5': 2.2, 'x6': 1750})
    print(f"   ✅ Forward работает: y1={result['y1']:.2f}, y2={result['y2']:.4f}")
    
    # Metrics
    if forward.metrics:
        print(f"   ✅ Metrics есть: {list(forward.metrics.keys())}")
    else:
        print(f"   ⚠️  Metrics пусты, пересчитываем...")
        metrics = forward.evaluate(df)
        print(f"   ✅ Metrics пересчитаны: y1_R2={metrics['y1']['R2']:.4f}, y2_R2={metrics['y2']['R2']:.4f}")
    
except Exception as e:
    print(f"   ❌ Ошибка: {e}")
    import traceback
    traceback.print_exc()

# 2. Reverse Model
print("\n✓ 2. REVERSE MODEL (Кері, y1, y2 → x1-x6)")
try:
    from reverse_model import ReverseModel
    
    reverse = ReverseModel()
    reverse.load('models')
    
    # Predict
    result = reverse.predict({'y1': 50.0, 'y2': 0.75})
    print(f"   ✅ Reverse работает:")
    for key in ['x1', 'x2', 'x3', 'x4', 'x5', 'x6']:
        print(f"      {key}={result[key]:.2f}")
    
    # Metrics
    if reverse.metrics:
        print(f"   ✅ Metrics есть: {len(reverse.metrics)} параметров")
    else:
        print(f"   ⚠️  Metrics пусты, пересчитываем...")
        metrics = reverse.evaluate(df)
        print(f"   ✅ Metrics пересчитаны: {len(metrics)} параметров")
    
except Exception as e:
    print(f"   ❌ Ошибка: {e}")
    import traceback
    traceback.print_exc()

# 3. Fuzzy Logic Model
print("\n✓ 3. FUZZY LOGIC MODEL")
try:
    from fuzzy_model import FuzzyModel
    
    fuzzy = FuzzyModel()
    result = fuzzy.predict(x1=240, x2=0.9, x3=210, x4=518, x5=2.2, x6=1750)
    if result.get('success'):
        print(f"   ✅ Fuzzy работает: y1={result['y1']:.2f}, y2={result['y2']:.4f}")
    else:
        print(f"   ❌ Fuzzy ошибка: {result.get('error', 'unknown')}")
    
except Exception as e:
    print(f"   ❌ Ошибка: {e}")
    import traceback
    traceback.print_exc()

# 4. Hybrid Model
print("\n✓ 4. HYBRID MODEL (Fuzzy + ML)")
try:
    from hybrid_model import HybridModel
    
    hybrid = HybridModel(forward_model=forward, fuzzy_weight=0.3, ml_weight=0.7)
    result = hybrid.predict(x1=240, x2=0.9, x3=210, x4=518, x5=2.2, x6=1750)
    if result.get('success'):
        print(f"   ✅ Hybrid работает: y1={result['y1']:.2f}, y2={result['y2']:.4f}")
    else:
        print(f"   ❌ Hybrid ошибка: {result.get('error', 'unknown')}")
    
except Exception as e:
    print(f"   ❌ Ошибка: {e}")
    import traceback
    traceback.print_exc()

# 5. Feature Importance
print("\n✓ 5. FEATURE IMPORTANCE ANALYSIS")
try:
    importance = forward.get_feature_importance()
    if importance is not None:
        print(f"   ✅ Feature importance работает:")
        for idx, row in importance.head(3).iterrows():
            param = row['parameter']
            imp_avg = row['avg_importance']
            print(f"      {param}: {imp_avg:.4f}")
    else:
        print(f"   ⚠️  Feature importance недоступен (не Random Forest)")
        
except Exception as e:
    print(f"   ❌ Ошибка: {e}")

print("\n" + "="*60)
print("  ТЕСТИРОВАНИЕ ЗАВЕРШЕНО")
print("="*60 + "\n")
