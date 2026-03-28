"""
Кері бағыттағы модель: y1, y2 → x1-x6 (болжау)
Бірнеше ML алгоритмдерін қолданады
"""
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_percentage_error
import joblib
import os


def safe_mape(y_true, y_pred, epsilon=1e-8):
    y_true = np.array(y_true, dtype=float)
    y_pred = np.array(y_pred, dtype=float)
    if y_true.shape != y_pred.shape:
        raise ValueError('y_true and y_pred must have same shape for MAPE')
    mask = np.abs(y_true) > epsilon
    if not np.any(mask):
        return np.nan
    return np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100


class ReverseModel:
    """
    Кері бағыттағы модель: шығыс параметрлерінен (y1, y2) 
    кіріс параметрлерін (x1-x6) болжау
    """
    
    def __init__(self):
        self.models = {
            'x1': None,  # Шикізат шығыны үшін модель
            'x2': None,  # Шикізат тығыздығы үшін модель
            'x3': None,  # Шикізат температурасы үшін модель
            'x4': None,  # Реактор температурасы үшін модель
            'x5': None,  # Реактор қысымы үшін модель
            'x6': None   # Катализатор шығыны үшін модель
        }
        self.scalers = {
            'Y': StandardScaler(),  # Кіріс деректері үшін (y1, y2)
            'x1': StandardScaler(),  # x1 үшін
            'x2': StandardScaler(),  # x2 үшін
            'x3': StandardScaler(),  # x3 үшін
            'x4': StandardScaler(),  # x4 үшін
            'x5': StandardScaler(),  # x5 үшін
            'x6': StandardScaler()   # x6 үшін
        }
        self.feature_names = ['y1', 'y2']
        self.output_names = ['x1', 'x2', 'x3', 'x4', 'x5', 'x6']
        self.metrics = {}
    
    def prepare_data(self, df):
        """
        Деректерді дайындау
        """
        Y = df[self.feature_names].values  # y1, y2 - кіріс
        X = df[self.output_names].values    # x1-x6 - шығыс
        
        return Y, X
    
    def train(self, df, model_type='random_forest', test_size=0.2):
        """
        Модельді оқыту
        
        Args:
            df: DataFrame with x1-x6, y1, y2
            model_type: 'random_forest', 'gradient_boosting', 'linear', 'ridge'
            test_size: тест жиынының үлесі
        """
        Y, X = self.prepare_data(df)
        
        # Деректерді бөлу
        Y_train, Y_test, X_train, X_test = train_test_split(
            Y, X, test_size=test_size, random_state=42
        )
        
        # Нормалау
        Y_train_scaled = self.scalers['Y'].fit_transform(Y_train)
        Y_test_scaled = self.scalers['Y'].transform(Y_test)
        
        # Әрбір x параметрі үшін модель оқыту
        for i, param_name in enumerate(self.output_names):
            x_train = X_train[:, i].reshape(-1, 1)
            x_test = X_test[:, i].reshape(-1, 1)
            
            # Нормалау
            x_train_scaled = self.scalers[param_name].fit_transform(x_train).ravel()
            x_test_scaled = self.scalers[param_name].transform(x_test).ravel()
            
            # Модельдерді құру
            model_classes = {
                'random_forest': RandomForestRegressor(n_estimators=100, random_state=42),
                'gradient_boosting': GradientBoostingRegressor(n_estimators=100, random_state=42),
                'linear': LinearRegression(),
                'ridge': Ridge(alpha=1.0)
            }
            
            base_model = model_classes.get(model_type, model_classes['random_forest'])
            
            # Модельді оқыту
            self.models[param_name] = base_model.__class__(**base_model.get_params())
            self.models[param_name].fit(Y_train_scaled, x_train_scaled)
        
        # Метрикаларды есептеу
        metrics_dict = {}
        for i, param_name in enumerate(self.output_names):
            x_test_actual = X_test[:, i].ravel()
            x_test_scaled = self.scalers[param_name].transform(x_test_actual.reshape(-1, 1)).ravel()
            
            x_pred_scaled = self.models[param_name].predict(Y_test_scaled)
            x_pred = self.scalers[param_name].inverse_transform(x_pred_scaled.reshape(-1, 1)).ravel()
            
            metrics_dict[param_name] = {
                'R2': r2_score(x_test_actual, x_pred),
                'RMSE': np.sqrt(mean_squared_error(x_test_actual, x_pred)),
                'MAPE': safe_mape(x_test_actual, x_pred)
            }
        
        self.metrics = metrics_dict
        
        print(f"\n=== КЕРІ БАҒЫТТАҒЫ {model_type.upper()} МОДЕЛЬ МЕТРИКАЛАРЫ ===")
        for param_name in self.output_names:
            print(f"\n{param_name.upper()}:")
            print(f"  R² = {self.metrics[param_name]['R2']:.4f}")
            print(f"  RMSE = {self.metrics[param_name]['RMSE']:.4f}")
            print(f"  MAPE = {self.metrics[param_name]['MAPE']:.2f}%")
        
        return self.metrics
    
    def evaluate(self, df, test_size=0.2):
        """
        Метриканы қайта есептеу (егер модель жүктелген болса)
        """
        if any(self.models[param] is None for param in self.output_names):
            raise ValueError('Кері модельдер жүктелмеген')

        Y, X = self.prepare_data(df)
        Y_train, Y_test, X_train, X_test = train_test_split(
            Y, X, test_size=test_size, random_state=42
        )

        Y_test_scaled = self.scalers['Y'].transform(Y_test)

        metrics_dict = {}
        for i, param_name in enumerate(self.output_names):
            x_test_actual = X_test[:, i].ravel()
            x_pred_scaled = self.models[param_name].predict(Y_test_scaled)
            x_pred = self.scalers[param_name].inverse_transform(x_pred_scaled.reshape(-1, 1)).ravel()

            metrics_dict[param_name] = {
                'R2': r2_score(x_test_actual, x_pred),
                'RMSE': np.sqrt(mean_squared_error(x_test_actual, x_pred)),
                'MAPE': safe_mape(x_test_actual, x_pred)
            }

        self.metrics = metrics_dict
        return self.metrics


    def predict(self, Y):
        """
        Болжау жасау
        
        Args:
            Y: numpy array shape (n_samples, 2) немесе dict with y1, y2
        
        Returns:
            dict with x1-x6 predictions
        """
        if isinstance(Y, dict):
            Y = np.array([[Y['y1'], Y['y2']]])
        elif isinstance(Y, (list, tuple)):
            Y = np.array(Y).reshape(1, -1)
        
        Y_scaled = self.scalers['Y'].transform(Y)
        
        predictions = {}
        for param_name in self.output_names:
            x_pred_scaled = self.models[param_name].predict(Y_scaled) # type: ignore
            #x_pred = self.scalers[param_name].inverse_transform(x_pred_scaled.reshape(-1, 1))[0, 0]
            x_pred = self.scalers[param_name].inverse_transform(x_pred_scaled.reshape(-1, 1))[0, 0]

            # Ограничение диапазона
            if param_name == 'x6':
                x_pred = max(2, min(17, x_pred))
            predictions[param_name] = float(x_pred)
        
        return predictions
    
    def save(self, model_dir='models'):
        """Модельдерді сақтау"""
        os.makedirs(model_dir, exist_ok=True)
        
        for param_name in self.output_names:
            joblib.dump(self.models[param_name], f'{model_dir}/reverse_model_{param_name}.pkl')
        
        joblib.dump(self.scalers, f'{model_dir}/reverse_scalers.pkl')
        
        print(f"Кері бағыттағы модельдер {model_dir}/ сақталды")
    
    def load(self, model_dir='models'):
        """Модельдерді жүктеу"""
        for param_name in self.output_names:
            self.models[param_name] = joblib.load(f'{model_dir}/reverse_model_{param_name}.pkl')
        
        self.scalers = joblib.load(f'{model_dir}/reverse_scalers.pkl')
        
        print(f"Кері бағыттағы модельдер {model_dir}/ жүктелді")


if __name__ == '__main__':
    from data_loader import DataLoader
    
    # Деректерді жүктеу
    loader = DataLoader()
    df = loader.load_data(source='csv')
    
    # Модельді оқыту
    model = ReverseModel()
    model.train(df, model_type='random_forest')
    
    # Тест болжау
    test_input = {'y1': 50.0, 'y2': 0.75}
    prediction = model.predict(test_input)
    print(f"\nТест болжау: {test_input}")
    print(f"Нәтиже: x1={prediction['x1']:.2f}, x2={prediction['x2']:.4f}, x3={prediction['x3']:.2f}, "
          f"x4={prediction['x4']:.2f}, x5={prediction['x5']:.2f}, x6={prediction['x6']:.2f}")

