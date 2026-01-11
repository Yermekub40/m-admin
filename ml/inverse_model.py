"""
Обратная модель: y1, y2 → x1-x6 (оптимизация)
y1, y2 берілгенде, қандай x1-x6 параметрлері қажет екенін табады
"""
import numpy as np
from scipy.optimize import minimize, differential_evolution
from forward_model import ForwardModel
import warnings
warnings.filterwarnings('ignore')


class InverseModel:
    """
    Обратная модель: мақсатты y1, y2 үшін 
    оптималды x1-x6 параметрлерін табу
    """
    
    def __init__(self, forward_model: ForwardModel):
        """
        Args:
            forward_model: Оқытылған ForwardModel объектісі
        """
        self.forward_model = forward_model
        
        # Параметрлердің диапазондары (ТЗ-дан)
        self.bounds = {
            'x1': (0, 400),      # Шикізат шығыны (т/тәулік)
            'x2': (0.4, 1.6),    # Шикізат тығыздығы (т/м³)
            'x3': (0, 255),      # Шикізат температурасы (°C)
            'x4': (0, 600),      # Реактор температурасы (°C)
            'x5': (0.5, 3.5),   # Реактор қысымы (кгс/см²)
            'x6': (1480, 1990)  # Катализатор шығыны (т/тәулік)
        }
        
        # Бастапқы мәндер (норма)
        self.initial_values = {
            'x1': 240,
            'x2': 0.9,
            'x3': 210,
            'x4': 518,
            'x5': 2.2,
            'x6': 1750
        }
    
    def objective_function(self, x, target_y1, target_y2, weights=None):
        """
        Мақсат функциясы: болжалған y1, y2 мен мақсатты y1, y2 арасындағы айырмашылық
        
        Args:
            x: x1-x6 параметрлері (array)
            target_y1: мақсатты y1
            target_y2: мақсатты y2
            weights: y1 және y2 үшін салмақтар [w1, w2]
        """
        if weights is None:
            weights = [1.0, 1.0]
        
        # x-ті 2D массивке айналдыру (егер 1D болса)
        if isinstance(x, np.ndarray) and x.ndim == 1:
            x = x.reshape(1, -1)
        elif isinstance(x, (list, tuple)):
            x = np.array(x).reshape(1, -1)
        
        # Болжау жасау
        prediction = self.forward_model.predict(x)
        
        # Айырмашылықты есептеу
        error_y1 = (prediction['y1'] - target_y1) ** 2
        error_y2 = (prediction['y2'] - target_y2) ** 2
        
        # Жалпы қате
        total_error = weights[0] * error_y1 + weights[1] * error_y2
        
        return total_error
    
    def find_optimal_parameters(self, target_y1, target_y2, method='differential_evolution', 
                               initial_guess=None, weights=None, max_iter=1000):
        """
        Оптималды x1-x6 параметрлерін табу
        
        Args:
            target_y1: мақсатты бензин көлемі (%)
            target_y2: мақсатты бензин тығыздығы
            method: 'differential_evolution' немесе 'minimize'
            initial_guess: бастапқы болжам (dict немесе array)
            weights: y1, y2 үшін салмақтар
            max_iter: максималды итерациялар саны
        
        Returns:
            dict with optimal x1-x6 and prediction results
        """
        # Бастапқы мәндер
        if initial_guess is None:
            x0 = [self.initial_values[f'x{i+1}'] for i in range(6)]
        elif isinstance(initial_guess, dict):
            x0 = [initial_guess[f'x{i+1}'] for i in range(6)]
        else:
            x0 = list(initial_guess)
        
        # Шектеулер
        bounds_list = [
            self.bounds['x1'],
            self.bounds['x2'],
            self.bounds['x3'],
            self.bounds['x4'],
            self.bounds['x5'],
            self.bounds['x6']
        ]
        
        # Мақсат функциясы
        objective = lambda x: self.objective_function(x, target_y1, target_y2, weights)
        
        if method == 'differential_evolution':
            # Генетикалық алгоритм (жақсы нәтиже береді)
            result = differential_evolution(
                objective,
                bounds_list,
                maxiter=max_iter,
                seed=42,
                polish=True
            )
        else:
            # Градиенттік әдіс
            result = minimize(
                objective,
                x0,
                method='L-BFGS-B',
                bounds=bounds_list,
                options={'maxiter': max_iter}
            )
        
        optimal_x = {
            'x1': float(result.x[0]),
            'x2': float(result.x[1]),
            'x3': float(result.x[2]),
            'x4': float(result.x[3]),
            'x5': float(result.x[4]),
            'x6': float(result.x[5])
        }
        
        # Болжау нәтижелері (result.x 1D массив, reshape қажет)
        x_for_prediction = result.x.reshape(1, -1) if isinstance(result.x, np.ndarray) else np.array(result.x).reshape(1, -1)
        prediction = self.forward_model.predict(x_for_prediction)
        
        # Қателер
        error_y1 = abs(prediction['y1'] - target_y1)
        error_y2 = abs(prediction['y2'] - target_y2)
        
        return {
            'optimal_parameters': optimal_x,
            'predicted_y1': prediction['y1'],
            'predicted_y2': prediction['y2'],
            'target_y1': target_y1,
            'target_y2': target_y2,
            'error_y1': error_y1,
            'error_y2': error_y2,
            'total_error': float(result.fun),
            'success': result.success if hasattr(result, 'success') else True,
            'message': result.message if hasattr(result, 'message') else 'Optimization completed'
        }
    
    def find_multiple_solutions(self, target_y1, target_y2, n_solutions=5):
        """
        Бірнеше нұсқаны табу (әртүрлі бастапқы мәндерден)
        
        Returns:
            list of solutions
        """
        solutions = []
        
        for i in range(n_solutions):
            # Кездейсоқ бастапқы мәндер
            initial = {}
            for param, (low, high) in self.bounds.items():
                initial[param] = np.random.uniform(low, high)
            
            try:
                result = self.find_optimal_parameters(
                    target_y1, target_y2,
                    method='differential_evolution',
                    initial_guess=initial
                )
                solutions.append(result)
            except Exception as e:
                print(f"Шешім {i+1} табылмады: {e}")
        
        # Ең жақсы нәтижелерді сұрыптау
        solutions.sort(key=lambda x: x['total_error'])
        
        return solutions


if __name__ == '__main__':
    from data_loader import DataLoader
    from forward_model import ForwardModel
    
    # Деректер мен модельді дайындау
    loader = DataLoader()
    df = loader.load_data(source='csv')
    
    forward = ForwardModel()
    forward.train(df, model_type='random_forest')
    
    # Обратная модель
    inverse = InverseModel(forward)
    
    # Мысал: y1=50%, y2=0.75 болуы үшін қандай x1-x6 керек?
    target_y1 = 50.0
    target_y2 = 0.75
    
    print(f"\n=== Обратная модель тесті ===")
    print(f"Мақсат: y1={target_y1}%, y2={target_y2}")
    
    result = inverse.find_optimal_parameters(target_y1, target_y2)
    
    print(f"\nОптималды параметрлер:")
    for param, value in result['optimal_parameters'].items():
        print(f"  {param} = {value:.2f}")
    
    print(f"\nБолжау нәтижелері:")
    print(f"  y1 = {result['predicted_y1']:.2f}% (мақсат: {result['target_y1']:.2f}%, қате: {result['error_y1']:.2f}%)")
    print(f"  y2 = {result['predicted_y2']:.4f} (мақсат: {result['target_y2']:.4f}, қате: {result['error_y2']:.4f})")

