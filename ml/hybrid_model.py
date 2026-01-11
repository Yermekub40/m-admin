"""
Гибридті модель: Fuzzy Logic + ML модельдер
ТЗ бойынша: "Оған эксперттік пікір арқылы жасалған Ережелер базасы арқылы 
тиістілік функцияларын құру. Модельдерді біріктіру"
"""
from fuzzy_model import FuzzyModel
import numpy as np

# ML модельдерді optional ету
try:
    from forward_model import ForwardModel
    HAS_ML = True
except ImportError:
    HAS_ML = False
    ForwardModel = None


class HybridModel:
    """
    Гибридті модель: Fuzzy Logic + ML модельдерді біріктіру
    """
    
    def __init__(self, forward_model: ForwardModel = None, fuzzy_weight=0.3, ml_weight=0.7):
        """
        Args:
            forward_model: Оқытылған ForwardModel объектісі
            fuzzy_weight: Fuzzy Logic нәтижесінің салмағы (0-1)
            ml_weight: ML модель нәтижесінің салмағы (0-1)
        """
        self.fuzzy_model = FuzzyModel()
        self.forward_model = forward_model
        self.fuzzy_weight = fuzzy_weight
        self.ml_weight = ml_weight
        
        # Салмақтарды нормалау (қосындысы 1 болуы керек)
        total_weight = fuzzy_weight + ml_weight
        if total_weight > 0:
            self.fuzzy_weight = fuzzy_weight / total_weight
            self.ml_weight = ml_weight / total_weight
        else:
            self.fuzzy_weight = 0.5
            self.ml_weight = 0.5
    
    def predict(self, x1, x2, x3, x4, x5, x6, use_fuzzy_only=False, use_ml_only=False):
        """
        Гибридті болжау жасау
        
        Args:
            x1-x6: кіріс параметрлері
            use_fuzzy_only: тек Fuzzy Logic қолдану
            use_ml_only: тек ML модель қолдану
        
        Returns:
            dict with y1, y2 predictions
        """
        result = {
            'y1': None,
            'y2': None,
            'fuzzy_prediction': None,
            'ml_prediction': None,
            'hybrid_prediction': None,
            'success': False
        }
        
        # Fuzzy Logic болжау
        fuzzy_result = self.fuzzy_model.predict(x1, x2, x3, x4, x5, x6)
        
        if not fuzzy_result['success']:
            return {
                **result,
                'error': f"Fuzzy Logic қатесі: {fuzzy_result.get('error', 'Белгісіз қате')}"
            }
        
        fuzzy_y1 = fuzzy_result['y1']
        fuzzy_y2 = fuzzy_result['y2']
        result['fuzzy_prediction'] = {'y1': fuzzy_y1, 'y2': fuzzy_y2}
        
        # Егер тек Fuzzy қолдану керек болса
        if use_fuzzy_only:
            result['y1'] = fuzzy_y1
            result['y2'] = fuzzy_y2
            result['success'] = True
            return result
        
        # ML модель болжау
        if self.forward_model is None:
            # Егер ML модель жоқ болса, тек Fuzzy қайтару
            result['y1'] = fuzzy_y1
            result['y2'] = fuzzy_y2
            result['success'] = True
            result['warning'] = 'ML модель жоқ, тек Fuzzy Logic қолданылды'
            return result
        
        try:
            ml_result = self.forward_model.predict({
                'x1': x1, 'x2': x2, 'x3': x3,
                'x4': x4, 'x5': x5, 'x6': x6
            })
            ml_y1 = ml_result['y1']
            ml_y2 = ml_result['y2']
            result['ml_prediction'] = {'y1': ml_y1, 'y2': ml_y2}
        except Exception as e:
            # Егер ML модель қате берсе, тек Fuzzy қайтару
            result['y1'] = fuzzy_y1
            result['y2'] = fuzzy_y2
            result['success'] = True
            result['warning'] = f'ML модель қатесі: {str(e)}, тек Fuzzy Logic қолданылды'
            return result
        
        # Егер тек ML қолдану керек болса
        if use_ml_only:
            result['y1'] = ml_y1
            result['y2'] = ml_y2
            result['success'] = True
            return result
        
        # Гибридті болжау: салмақталған орташа
        hybrid_y1 = self.fuzzy_weight * fuzzy_y1 + self.ml_weight * ml_y1
        hybrid_y2 = self.fuzzy_weight * fuzzy_y2 + self.ml_weight * ml_y2
        
        result['y1'] = hybrid_y1
        result['y2'] = hybrid_y2
        result['hybrid_prediction'] = {'y1': hybrid_y1, 'y2': hybrid_y2}
        result['success'] = True
        
        return result
    
    def set_weights(self, fuzzy_weight, ml_weight):
        """
        Салмақтарды орнату
        """
        total_weight = fuzzy_weight + ml_weight
        if total_weight > 0:
            self.fuzzy_weight = fuzzy_weight / total_weight
            self.ml_weight = ml_weight / total_weight
        else:
            self.fuzzy_weight = 0.5
            self.ml_weight = 0.5


if __name__ == '__main__':
    # Тест
    print("=" * 60)
    print("ГИБРИДТІ МОДЕЛЬ ТЕСТІ")
    print("=" * 60)
    
    # Тест кіріс мәндері
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
    
    # Тек Fuzzy Logic
    print("\n" + "-" * 60)
    print("1. Тек Fuzzy Logic:")
    print("-" * 60)
    hybrid = HybridModel()
    result = hybrid.predict(**test_input, use_fuzzy_only=True)
    if result['success']:
        print(f"  y1 = {result['y1']:.2f}%")
        print(f"  y2 = {result['y2']:.4f}")
    
    # ML модельмен біріктіру (егер ML модель бар болса)
    print("\n" + "-" * 60)
    print("2. Гибридті модель (Fuzzy + ML):")
    print("-" * 60)
    try:
        if HAS_ML:
            from data_loader import DataLoader
        
        # ML модельді жүктеу (егер бар болса)
        forward_model = None
        try:
            forward_model = ForwardModel()
            forward_model.load(model_dir='models')
            print("  ✅ ML модель жүктелді")
        except:
            print("  ⚠️  ML модель жоқ, тек Fuzzy Logic қолданылады")
        
        hybrid = HybridModel(forward_model=forward_model, fuzzy_weight=0.3, ml_weight=0.7)
        result = hybrid.predict(**test_input)
        
        if result['success']:
            print(f"\n  Нәтижелер:")
            if result.get('fuzzy_prediction'):
                print(f"    Fuzzy: y1={result['fuzzy_prediction']['y1']:.2f}%, y2={result['fuzzy_prediction']['y2']:.4f}")
            if result.get('ml_prediction'):
                print(f"    ML:    y1={result['ml_prediction']['y1']:.2f}%, y2={result['ml_prediction']['y2']:.4f}")
            if result.get('hybrid_prediction'):
                print(f"    Гибридті: y1={result['hybrid_prediction']['y1']:.2f}%, y2={result['hybrid_prediction']['y2']:.4f}")
            print(f"\n  Финальды нәтиже:")
            print(f"    y1 = {result['y1']:.2f}%")
            print(f"    y2 = {result['y2']:.4f}")
        else:
            print(f"  ❌ Қате: {result.get('error', 'Белгісіз қате')}")
    except Exception as e:
        print(f"  ⚠️  ML модель қолдану мүмкін емес: {e}")
        print("  Тек Fuzzy Logic қолданылады")
    
    print("\n" + "=" * 60)
    print("✅ ТЕСТІЛЕУ АЯҚТАЛДЫ")
    print("=" * 60)

