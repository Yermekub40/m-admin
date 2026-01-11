"""
Айқын емес логика (Fuzzy Logic) модельі
Тиістілік функциялары және ережелер базасы
ТЗ бойынша: Айқын емес модельдерге арналған.csv
"""
import numpy as np
import skfuzzy as fuzz
from skfuzzy import control as ctrl
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
        # Кіріс айнымалылары (x1-x6)
        self.x1 = None  # Шикізат шығыны
        self.x2 = None  # Шикізат тығыздығы
        self.x3 = None  # Шикізат температурасы
        self.x4 = None  # Реактор температурасы
        self.x5 = None  # Реактор қысымы
        self.x6 = None  # Катализатор шығыны
        
        # Шығыс айнымалылары (y1, y2)
        self.y1 = None  # Бензин көлемі
        self.y2 = None  # Бензин тығыздығы
        
        # Fuzzy Inference System
        self.fis = None
        
        # Тиістілік функцияларын құру
        self._create_membership_functions()
        
        # Ережелер базасын құру
        self._create_rules()
        
        # FIS жүйесін құру
        self._create_fis()
    
    def _create_membership_functions(self):
        """
        Тиістілік функцияларын құру
        ТЗ диапазондары бойынша
        """
        # x1: Шикізат шығыны (0-400)
        self.x1 = ctrl.Antecedent(np.arange(0, 401, 1), 'x1')
        self.x1['L'] = fuzz.trimf(self.x1.universe, [0, 50, 100])      # НЕТ: 0-100
        self.x1['BA'] = fuzz.trimf(self.x1.universe, [120, 140, 160])  # НТ: 120-160
        self.x1['A'] = fuzz.trimf(self.x1.universe, [180, 210, 240])   # Н: 180-240
        self.x1['AA'] = fuzz.trimf(self.x1.universe, [260, 290, 320])   # НЖ: 260-320
        self.x1['H'] = fuzz.trimf(self.x1.universe, [320, 360, 400])    # НЕЖ: 320-400
        
        # x2: Шикізат тығыздығы (0.4-1.6)
        self.x2 = ctrl.Antecedent(np.arange(0.4, 1.61, 0.01), 'x2')
        self.x2['L'] = fuzz.trimf(self.x2.universe, [0.4, 0.45, 0.5])      # НЕТ: 0.4-0.5
        self.x2['BA'] = fuzz.trimf(self.x2.universe, [0.6, 0.65, 0.7])       # НТ: 0.6-0.7
        self.x2['A'] = fuzz.trimf(self.x2.universe, [0.8, 0.85, 0.9])        # Н: 0.8-0.9
        self.x2['AA'] = fuzz.trimf(self.x2.universe, [1.0, 1.1, 1.2])       # НЖ: 1-1.2
        self.x2['H'] = fuzz.trimf(self.x2.universe, [1.3, 1.45, 1.6])       # НЕЖ: 1.3-1.6
        
        # x3: Шикізат температурасы (0-255)
        self.x3 = ctrl.Antecedent(np.arange(0, 256, 1), 'x3')
        self.x3['L'] = fuzz.trimf(self.x3.universe, [0, 90, 180])           # НЕТ: 0-180
        self.x3['BA'] = fuzz.trimf(self.x3.universe, [190, 197.5, 205])    # НТ: 190-205
        self.x3['A'] = fuzz.trimf(self.x3.universe, [210, 212.5, 215])     # Н: 210-215
        self.x3['AA'] = fuzz.trimf(self.x3.universe, [220, 227.5, 235])     # НЖ: 220-235
        self.x3['H'] = fuzz.trimf(self.x3.universe, [240, 247.5, 255])     # НЕЖ: 240-255
        
        # x4: Реактор температурасы (0-600)
        self.x4 = ctrl.Antecedent(np.arange(0, 601, 1), 'x4')
        self.x4['L'] = fuzz.trimf(self.x4.universe, [0, 220, 440])          # НЕТ: 0-440
        self.x4['BA'] = fuzz.trimf(self.x4.universe, [450, 462.5, 475])    # НТ: 450-475
        self.x4['A'] = fuzz.trimf(self.x4.universe, [480, 511, 542])       # Н: 480-542
        self.x4['AA'] = fuzz.trimf(self.x4.universe, [550, 560, 570])      # НЖ: 550-570
        self.x4['H'] = fuzz.trimf(self.x4.universe, [570, 585, 600])      # НЕЖ: 570-600
        
        # x5: Реактор қысымы (0.5-3.5)
        self.x5 = ctrl.Antecedent(np.arange(0.5, 3.51, 0.01), 'x5')
        self.x5['L'] = fuzz.trimf(self.x5.universe, [0.5, 0.7, 0.9])        # НЕТ: 0.5-0.9
        self.x5['BA'] = fuzz.trimf(self.x5.universe, [1.0, 1.2, 1.4])      # НТ: 1-1.4
        self.x5['A'] = fuzz.trimf(self.x5.universe, [1.53, 2.065, 2.6])   # Н: 1.53-2.6
        self.x5['AA'] = fuzz.trimf(self.x5.universe, [2.7, 2.8, 2.9])     # НЖ: 2.7-2.9
        self.x5['H'] = fuzz.trimf(self.x5.universe, [3.0, 3.25, 3.5])      # НЕЖ: 3-3.5
        
        # x6: Катализатор шығыны (1480-1990)
        self.x6 = ctrl.Antecedent(np.arange(1480, 1991, 1), 'x6')
        self.x6['L'] = fuzz.trimf(self.x6.universe, [1480, 1530, 1580])    # НЕТ: 1480-1580
        self.x6['BA'] = fuzz.trimf(self.x6.universe, [1580, 1625, 1670])   # НТ: 1580-1670
        self.x6['A'] = fuzz.trimf(self.x6.universe, [1680, 1735, 1790])    # Н: 1680-1790
        self.x6['AA'] = fuzz.trimf(self.x6.universe, [1800, 1850, 1900])    # НЖ: 1800-1900
        self.x6['H'] = fuzz.trimf(self.x6.universe, [1910, 1950, 1990])     # НЕЖ: 1910-1990
        
        # y1: Бензин көлемі (0-70)
        self.y1 = ctrl.Consequent(np.arange(0, 71, 1), 'y1')
        self.y1['L'] = fuzz.trimf(self.y1.universe, [0, 17.5, 35])          # НЕТ: 0-35
        self.y1['BA'] = fuzz.trimf(self.y1.universe, [38, 42.5, 47])       # НТ: 38-47
        self.y1['A'] = fuzz.trimf(self.y1.universe, [48, 49, 50])            # Н: 48-50
        self.y1['AA'] = fuzz.trimf(self.y1.universe, [50, 52.5, 55])        # НЖ: 50-55
        self.y1['H'] = fuzz.trimf(self.y1.universe, [56, 63, 70])           # НЕЖ: 56-70
        
        # y2: Бензин тығыздығы (0.43-0.95)
        self.y2 = ctrl.Consequent(np.arange(0.43, 0.951, 0.001), 'y2')
        self.y2['L'] = fuzz.trimf(self.y2.universe, [0.43, 0.4775, 0.525])  # НЕТ: 0.43-0.525
        self.y2['BA'] = fuzz.trimf(self.y2.universe, [0.53, 0.58, 0.630])   # НТ: 0.53-0.630
        self.y2['A'] = fuzz.trimf(self.y2.universe, [0.635, 0.685, 0.735]) # Н: 0.635-0.735
        self.y2['AA'] = fuzz.trimf(self.y2.universe, [0.74, 0.79, 0.84])    # НЖ: 0.74-0.84
        self.y2['H'] = fuzz.trimf(self.y2.universe, [0.85, 0.9, 0.95])      # НЕЖ: 0.85-0.95
    
    def _create_rules(self):
        """
        Ережелер базасын құру
        ТЗ-да көрсетілген 20 ереже бойынша
        """
        self.rules = [
            # Ереже 1
            ctrl.Rule(self.x1['L'] & self.x2['L'], [self.y1['L'], self.y2['L']]),
            # Ереже 2
            ctrl.Rule(self.x1['L'] & self.x2['A'], [self.y1['L'], self.y2['A']]),
            # Ереже 3
            ctrl.Rule(self.x1['A'] & self.x2['A'], [self.y1['A'], self.y2['A']]),
            # Ереже 4
            ctrl.Rule(self.x1['BA'] & self.x2['A'], [self.y1['BA'], self.y2['A']]),
            # Ереже 5
            ctrl.Rule(self.x1['A'] & self.x2['AA'], [self.y1['A'], self.y2['AA']]),
            # Ереже 6
            ctrl.Rule(self.x1['H'] & self.x2['H'], [self.y1['H'], self.y2['H']]),
            # Ереже 7
            ctrl.Rule(self.x1['H'] & self.x2['L'], [self.y1['AA'], self.y2['BA']]),
            # Ереже 8
            ctrl.Rule(self.x4['H'] & self.x6['L'], [self.y1['H'], self.y2['L']]),
            # Ереже 9
            ctrl.Rule(self.x4['L'] & self.x6['H'], [self.y1['L'], self.y2['H']]),
            # Ереже 10
            ctrl.Rule(self.x4['BA'] & self.x6['A'], [self.y1['BA'], self.y2['A']]),
            # Ереже 11
            ctrl.Rule(self.x4['A'] & self.x6['BA'], [self.y1['A'], self.y2['BA']]),
            # Ереже 12
            ctrl.Rule(self.x4['AA'] & self.x6['AA'], [self.y1['AA'], self.y2['AA']]),
            # Ереже 13
            ctrl.Rule(self.x2['L'] & self.x5['L'], [self.y1['L'], self.y2['L']]),
            # Ереже 14
            ctrl.Rule(self.x2['BA'] & self.x5['A'], [self.y1['L'], self.y2['BA']]),
            # Ереже 15
            ctrl.Rule(self.x2['AA'] & self.x5['BA'], [self.y1['AA'], self.y2['AA']]),
            # Ереже 16
            ctrl.Rule(self.x3['L'] & self.x5['L'], [self.y1['H'], self.y2['H']]),
            # Ереже 17
            ctrl.Rule(self.x3['BA'] & self.x5['L'], [self.y1['AA'], self.y2['H']]),
            # Ереже 18
            ctrl.Rule(self.x3['AA'] & self.x5['BA'], [self.y1['BA'], self.y2['BA']]),
            # Ереже 19
            ctrl.Rule(self.x3['A'] & self.x5['BA'], [self.y1['AA'], self.y2['AA']]),
            # Ереже 20
            ctrl.Rule(self.x3['H'] & self.x5['L'], [self.y1['H'], self.y2['L']]),
        ]
    
    def _create_fis(self):
        """
        Fuzzy Inference System (FIS) құру
        """
        self.fis = ctrl.ControlSystem(self.rules)
        self.control_simulation = ctrl.ControlSystemSimulation(self.fis)
    
    def predict(self, x1, x2, x3, x4, x5, x6):
        """
        Болжау жасау
        
        Args:
            x1-x6: кіріс параметрлері
        
        Returns:
            dict with y1, y2 predictions
        """
        # Кіріс мәндерін орнату
        self.control_simulation.input['x1'] = float(x1)
        self.control_simulation.input['x2'] = float(x2)
        self.control_simulation.input['x3'] = float(x3)
        self.control_simulation.input['x4'] = float(x4)
        self.control_simulation.input['x5'] = float(x5)
        self.control_simulation.input['x6'] = float(x6)
        
        # Есептеу
        try:
            self.control_simulation.compute()
            
            y1_pred = float(self.control_simulation.output['y1'])
            y2_pred = float(self.control_simulation.output['y2'])
            
            # Шектеулер (диапазонда ұстау)
            y1_pred = max(0, min(70, y1_pred))
            y2_pred = max(0.43, min(0.95, y2_pred))
            
            return {
                'y1': y1_pred,
                'y2': y2_pred,
                'success': True
            }
        except Exception as e:
            return {
                'y1': None,
                'y2': None,
                'success': False,
                'error': str(e)
            }


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

