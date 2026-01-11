"""
Айқын емес логика (Fuzzy Logic) модельі - Python 3.13 үшін
Өзіміздің қарапайым жүзеге асыру
Тиістілік функциялары және ережелер базасы
ТЗ бойынша: Айқын емес модельдерге арналған.csv
"""
import numpy as np
import warnings
warnings.filterwarnings('ignore')


class FuzzyModel:
    """
    Айқын емес логика модельі
    ТЗ-да көрсетілген диапазондар мен ережелер бойынша
    """
    
    def __init__(self):
        """
        Тиістілік функцияларын және ережелер базасын құру
        """
        # Тиістілік функцияларын құру
        self._create_membership_ranges()
        
        # Ережелер базасын құру
        self._create_rules()
    
    def _create_membership_ranges(self):
        """
        Тиістілік функцияларының диапазондарын анықтау
        ТЗ диапазондары бойынша
        """
        # x1: Шикізат шығыны (0-400)
        self.x1_ranges = {
            'L': (0, 50, 100),      # НЕТ: 0-100
            'BA': (120, 140, 160),  # НТ: 120-160
            'A': (180, 210, 240),   # Н: 180-240
            'AA': (260, 290, 320),  # НЖ: 260-320
            'H': (320, 360, 400)    # НЕЖ: 320-400
        }
        
        # x2: Шикізат тығыздығы (0.4-1.6)
        self.x2_ranges = {
            'L': (0.4, 0.45, 0.5),
            'BA': (0.6, 0.65, 0.7),
            'A': (0.8, 0.85, 0.9),
            'AA': (1.0, 1.1, 1.2),
            'H': (1.3, 1.45, 1.6)
        }
        
        # x3: Шикізат температурасы (0-255)
        self.x3_ranges = {
            'L': (0, 90, 180),
            'BA': (190, 197.5, 205),
            'A': (210, 212.5, 215),
            'AA': (220, 227.5, 235),
            'H': (240, 247.5, 255)
        }
        
        # x4: Реактор температурасы (0-600)
        self.x4_ranges = {
            'L': (0, 220, 440),
            'BA': (450, 462.5, 475),
            'A': (480, 511, 542),
            'AA': (550, 560, 570),
            'H': (570, 585, 600)
        }
        
        # x5: Реактор қысымы (0.5-3.5)
        self.x5_ranges = {
            'L': (0.5, 0.7, 0.9),
            'BA': (1.0, 1.2, 1.4),
            'A': (1.53, 2.065, 2.6),
            'AA': (2.7, 2.8, 2.9),
            'H': (3.0, 3.25, 3.5)
        }
        
        # x6: Катализатор шығыны (1480-1990)
        self.x6_ranges = {
            'L': (1480, 1530, 1580),
            'BA': (1580, 1625, 1670),
            'A': (1680, 1735, 1790),
            'AA': (1800, 1850, 1900),
            'H': (1910, 1950, 1990)
        }
        
        # y1: Бензин көлемі (0-70)
        self.y1_ranges = {
            'L': (0, 17.5, 35),
            'BA': (38, 42.5, 47),
            'A': (48, 49, 50),
            'AA': (50, 52.5, 55),
            'H': (56, 63, 70)
        }
        
        # y2: Бензин тығыздығы (0.43-0.95)
        self.y2_ranges = {
            'L': (0.43, 0.4775, 0.525),
            'BA': (0.53, 0.58, 0.630),
            'A': (0.635, 0.685, 0.735),
            'AA': (0.74, 0.79, 0.84),
            'H': (0.85, 0.9, 0.95)
        }
    
    def _triangular_membership(self, value, a, b, c):
        """
        Үшбұрыштық тиістілік функциясы
        a - бастапқы нүкте
        b - орта нүкте (максимум)
        c - соңғы нүкте
        """
        if value < a or value > c:
            return 0.0
        elif a <= value < b:
            return (value - a) / (b - a) if (b - a) > 0 else 0.0
        elif b <= value <= c:
            return (c - value) / (c - b) if (c - b) > 0 else 0.0
        else:
            return 1.0 if value == b else 0.0
    
    def _get_membership(self, value, ranges):
        """
        Мәннің тиістілік дәрежесін алу
        """
        memberships = {}
        for term, (a, b, c) in ranges.items():
            memberships[term] = self._triangular_membership(value, a, b, c)
        return memberships
    
    def _create_rules(self):
        """
        Ережелер базасын құру
        ТЗ-да көрсетілген 20 ереже бойынша
        """
        self.rules = [
            # Ереже 1: If (x1 is L) and (x2 is L) then (y1 is L)(y2 is L)
            {'inputs': [('x1', 'L'), ('x2', 'L')], 'outputs': [('y1', 'L'), ('y2', 'L')]},
            # Ереже 2: If (x1 is L) and (x2 is A) then (y1 is L)(y2 is A)
            {'inputs': [('x1', 'L'), ('x2', 'A')], 'outputs': [('y1', 'L'), ('y2', 'A')]},
            # Ереже 3: If (x1 is A) and (x2 is A) then (y1 is A)(y2 is A)
            {'inputs': [('x1', 'A'), ('x2', 'A')], 'outputs': [('y1', 'A'), ('y2', 'A')]},
            # Ереже 4: If (x1 is BA) and (x2 is A) then (y1 is BA)(y2 is A)
            {'inputs': [('x1', 'BA'), ('x2', 'A')], 'outputs': [('y1', 'BA'), ('y2', 'A')]},
            # Ереже 5: If (x1 is A) and (x2 is AA) then (y1 is A)(y2 is AA)
            {'inputs': [('x1', 'A'), ('x2', 'AA')], 'outputs': [('y1', 'A'), ('y2', 'AA')]},
            # Ереже 6: If (x1 is H) and (x2 is H) then (y1 is H)(y2 is H)
            {'inputs': [('x1', 'H'), ('x2', 'H')], 'outputs': [('y1', 'H'), ('y2', 'H')]},
            # Ереже 7: If (x1 is H) and (x2 is L) then (y1 is AA)(y2 is BA)
            {'inputs': [('x1', 'H'), ('x2', 'L')], 'outputs': [('y1', 'AA'), ('y2', 'BA')]},
            # Ереже 8: If (x4 is H) and (x6 is L) then (y1 is H)(y2 is L)
            {'inputs': [('x4', 'H'), ('x6', 'L')], 'outputs': [('y1', 'H'), ('y2', 'L')]},
            # Ереже 9: If (x4 is L) and (x6 is H) then (y1 is L)(y2 is H)
            {'inputs': [('x4', 'L'), ('x6', 'H')], 'outputs': [('y1', 'L'), ('y2', 'H')]},
            # Ереже 10: If (x4 is BA) and (x6 is A) then (y1 is BA)(y2 is A)
            {'inputs': [('x4', 'BA'), ('x6', 'A')], 'outputs': [('y1', 'BA'), ('y2', 'A')]},
            # Ереже 11: If (x4 is A) and (x6 is BA) then (y1 is A)(y2 is BA)
            {'inputs': [('x4', 'A'), ('x6', 'BA')], 'outputs': [('y1', 'A'), ('y2', 'BA')]},
            # Ереже 12: If (x4 is AA) and (x6 is AA) then (y1 is AA)(y2 is AA)
            {'inputs': [('x4', 'AA'), ('x6', 'AA')], 'outputs': [('y1', 'AA'), ('y2', 'AA')]},
            # Ереже 13: If (x2 is L) and (x5 is L) then (y1 is L)(y2 is L)
            {'inputs': [('x2', 'L'), ('x5', 'L')], 'outputs': [('y1', 'L'), ('y2', 'L')]},
            # Ереже 14: If (x2 is BA) and (x5 is A) then (y1 is L)(y2 is BA)
            {'inputs': [('x2', 'BA'), ('x5', 'A')], 'outputs': [('y1', 'L'), ('y2', 'BA')]},
            # Ереже 15: If (x2 is AA) and (x5 is BA) then (y1 is AA)(y2 is AA)
            {'inputs': [('x2', 'AA'), ('x5', 'BA')], 'outputs': [('y1', 'AA'), ('y2', 'AA')]},
            # Ереже 16: If (x3 is L) and (x5 is L) then (y1 is H)(y2 is H)
            {'inputs': [('x3', 'L'), ('x5', 'L')], 'outputs': [('y1', 'H'), ('y2', 'H')]},
            # Ереже 17: If (x3 is BA) and (x5 is L) then (y1 is AA)(y2 is H)
            {'inputs': [('x3', 'BA'), ('x5', 'L')], 'outputs': [('y1', 'AA'), ('y2', 'H')]},
            # Ереже 18: If (x3 is AA) and (x5 is BA) then (y1 is BA)(y2 is BA)
            {'inputs': [('x3', 'AA'), ('x5', 'BA')], 'outputs': [('y1', 'BA'), ('y2', 'BA')]},
            # Ереже 19: If (x3 is A) and (x5 is BA) then (y1 is AA)(y2 is AA)
            {'inputs': [('x3', 'A'), ('x5', 'BA')], 'outputs': [('y1', 'AA'), ('y2', 'AA')]},
            # Ереже 20: If (x3 is H) and (x5 is L) then (y1 is H)(y2 is L)
            {'inputs': [('x3', 'H'), ('x5', 'L')], 'outputs': [('y1', 'H'), ('y2', 'L')]},
        ]
    
    def predict(self, x1, x2, x3, x4, x5, x6):
        """
        Болжау жасау
        
        Args:
            x1-x6: кіріс параметрлері
        
        Returns:
            dict with y1, y2 predictions
        """
        try:
            # Кіріс мәндерінің тиістілік дәрежелерін алу
            x1_mem = self._get_membership(x1, self.x1_ranges)
            x2_mem = self._get_membership(x2, self.x2_ranges)
            x3_mem = self._get_membership(x3, self.x3_ranges)
            x4_mem = self._get_membership(x4, self.x4_ranges)
            x5_mem = self._get_membership(x5, self.x5_ranges)
            x6_mem = self._get_membership(x6, self.x6_ranges)
            
            # Ережелерді бағалау
            y1_outputs = {}  # {term: [strength1, strength2, ...]}
            y2_outputs = {}
            
            for rule in self.rules:
                # Ереже шарттарын бағалау (AND операциясы - минимум)
                min_strength = 1.0
                for var_name, term in rule['inputs']:
                    if var_name == 'x1':
                        strength = x1_mem.get(term, 0.0)
                    elif var_name == 'x2':
                        strength = x2_mem.get(term, 0.0)
                    elif var_name == 'x3':
                        strength = x3_mem.get(term, 0.0)
                    elif var_name == 'x4':
                        strength = x4_mem.get(term, 0.0)
                    elif var_name == 'x5':
                        strength = x5_mem.get(term, 0.0)
                    elif var_name == 'x6':
                        strength = x6_mem.get(term, 0.0)
                    else:
                        strength = 0.0
                    
                    min_strength = min(min_strength, strength)
                
                # Ереже нәтижелерін жинау (OR операциясы - максимум)
                for var_name, term in rule['outputs']:
                    if var_name == 'y1':
                        if term not in y1_outputs:
                            y1_outputs[term] = []
                        y1_outputs[term].append(min_strength)
                    elif var_name == 'y2':
                        if term not in y2_outputs:
                            y2_outputs[term] = []
                        y2_outputs[term].append(min_strength)
            
            # Defuzzification - Weighted Average (Centroid)
            y1_pred = self._defuzzify(y1_outputs, self.y1_ranges)
            y2_pred = self._defuzzify(y2_outputs, self.y2_ranges)
            
            # Шектеулер (диапазонда ұстау)
            y1_pred = max(0, min(70, y1_pred))
            y2_pred = max(0.43, min(0.95, y2_pred))
            
            return {
                'y1': float(y1_pred),
                'y2': float(y2_pred),
                'success': True
            }
        except Exception as e:
            return {
                'y1': None,
                'y2': None,
                'success': False,
                'error': str(e)
            }
    
    def _defuzzify(self, outputs, ranges):
        """
        Defuzzification - Weighted Average әдісі
        """
        numerator = 0.0
        denominator = 0.0
        
        for term, strengths in outputs.items():
            # Максималды күш (OR операциясы)
            max_strength = max(strengths) if strengths else 0.0
            
            if max_strength > 0:
                # Орта нүкте (b) - тиістілік функциясының максимумы
                _, b, _ = ranges[term]
                
                numerator += max_strength * b
                denominator += max_strength
        
        if denominator > 0:
            return numerator / denominator
        else:
            # Егер ешқандай ереже орындалмаса, орташа мән қайтару
            return sum(b for _, b, _ in ranges.values()) / len(ranges)


if __name__ == '__main__':
    # Тест
    print("=" * 60)
    print("FUZZY LOGIC МОДЕЛЬ ТЕСТІ")
    print("=" * 60)
    
    # Модельді құру
    fuzzy = FuzzyModel()
    print("\n✅ Тиістілік функциялары құрылды")
    print(f"✅ Ережелер базасы: {len(fuzzy.rules)} ереже")
    
    # Тест болжау
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
    else:
        print(f"\n❌ Қате: {result.get('error', 'Белгісіз қате')}")

