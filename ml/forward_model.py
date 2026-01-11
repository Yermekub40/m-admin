"""
Прямая модель: x1-x6 → y1, y2 (болжау)
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


class ForwardModel:
    """
    Прямая модель: кіріс параметрлерінен (x1-x6) 
    шығыс параметрлерін (y1, y2) болжау
    """
    
    def __init__(self):
        self.models = {
            'y1': None,  # Бензин көлемі үшін модель
            'y2': None   # Бензин тығыздығы үшін модель
        }
        self.scalers = {
            'X': StandardScaler(),  # Кіріс деректері үшін
            'y1': StandardScaler(),  # y1 үшін
            'y2': StandardScaler()   # y2 үшін
        }
        self.feature_names = ['x1', 'x2', 'x3', 'x4', 'x5', 'x6']
        self.metrics = {}
    
    def prepare_data(self, df):
        """
        Деректерді дайындау
        """
        X = df[self.feature_names].values
        y1 = df['y1'].values.reshape(-1, 1)
        y2 = df['y2'].values.reshape(-1, 1)
        
        return X, y1, y2
    
    def train(self, df, model_type='random_forest', test_size=0.2):
        """
        Модельді оқыту
        
        Args:
            df: DataFrame with x1-x6, y1, y2
            model_type: 'random_forest', 'gradient_boosting', 'linear', 'ridge'
            test_size: тест жиынының үлесі
        """
        X, y1, y2 = self.prepare_data(df)
        
        # Деректерді бөлу
        X_train, X_test, y1_train, y1_test, y2_train, y2_test = train_test_split(
            X, y1, y2, test_size=test_size, random_state=42
        )
        
        # Нормалау
        X_train_scaled = self.scalers['X'].fit_transform(X_train)
        X_test_scaled = self.scalers['X'].transform(X_test)
        
        y1_train_scaled = self.scalers['y1'].fit_transform(y1_train).ravel()
        y1_test_scaled = self.scalers['y1'].transform(y1_test).ravel()
        
        y2_train_scaled = self.scalers['y2'].fit_transform(y2_train).ravel()
        y2_test_scaled = self.scalers['y2'].transform(y2_test).ravel()
        
        # Модельдерді құру
        model_classes = {
            'random_forest': RandomForestRegressor(n_estimators=100, random_state=42),
            'gradient_boosting': GradientBoostingRegressor(n_estimators=100, random_state=42),
            'linear': LinearRegression(),
            'ridge': Ridge(alpha=1.0)
        }
        
        base_model = model_classes.get(model_type, model_classes['random_forest'])
        
        # y1 үшін модель
        self.models['y1'] = base_model.__class__(**base_model.get_params())
        self.models['y1'].fit(X_train_scaled, y1_train_scaled)
        
        # y2 үшін модель
        self.models['y2'] = base_model.__class__(**base_model.get_params())
        self.models['y2'].fit(X_train_scaled, y2_train_scaled)
        
        # Метрикаларды есептеу
        y1_pred_scaled = self.models['y1'].predict(X_test_scaled)
        y2_pred_scaled = self.models['y2'].predict(X_test_scaled)
        
        y1_pred = self.scalers['y1'].inverse_transform(y1_pred_scaled.reshape(-1, 1)).ravel()
        y2_pred = self.scalers['y2'].inverse_transform(y2_pred_scaled.reshape(-1, 1)).ravel()
        
        y1_test_actual = y1_test.ravel()
        y2_test_actual = y2_test.ravel()
        
        # Метрикалар
        self.metrics = {
            'y1': {
                'R2': r2_score(y1_test_actual, y1_pred),
                'RMSE': np.sqrt(mean_squared_error(y1_test_actual, y1_pred)),
                'MAPE': mean_absolute_percentage_error(y1_test_actual, y1_pred) * 100
            },
            'y2': {
                'R2': r2_score(y2_test_actual, y2_pred),
                'RMSE': np.sqrt(mean_squared_error(y2_test_actual, y2_pred)),
                'MAPE': mean_absolute_percentage_error(y2_test_actual, y2_pred) * 100
            }
        }
        
        print(f"\n=== {model_type.upper()} Модель Метрикалары ===")
        print(f"\nY1 (Бензин көлемі):")
        print(f"  R² = {self.metrics['y1']['R2']:.4f}")
        print(f"  RMSE = {self.metrics['y1']['RMSE']:.4f}")
        print(f"  MAPE = {self.metrics['y1']['MAPE']:.2f}%")
        
        print(f"\nY2 (Бензин тығыздығы):")
        print(f"  R² = {self.metrics['y2']['R2']:.4f}")
        print(f"  RMSE = {self.metrics['y2']['RMSE']:.4f}")
        print(f"  MAPE = {self.metrics['y2']['MAPE']:.2f}%")
        
        return self.metrics
    
    def predict(self, X):
        """
        Болжау жасау
        
        Args:
            X: numpy array shape (n_samples, 6) немесе dict with x1-x6
        
        Returns:
            dict with y1, y2 predictions
        """
        if isinstance(X, dict):
            X = np.array([[X['x1'], X['x2'], X['x3'], X['x4'], X['x5'], X['x6']]])
        elif isinstance(X, np.ndarray):
            # Егер 1D массив болса, 2D-ға айналдыру
            if X.ndim == 1:
                X = X.reshape(1, -1)
        elif isinstance(X, (list, tuple)):
            X = np.array(X).reshape(1, -1)
        
        X_scaled = self.scalers['X'].transform(X)
        
        y1_pred_scaled = self.models['y1'].predict(X_scaled)
        y2_pred_scaled = self.models['y2'].predict(X_scaled)
        
        y1_pred = self.scalers['y1'].inverse_transform(y1_pred_scaled.reshape(-1, 1))[0, 0]
        y2_pred = self.scalers['y2'].inverse_transform(y2_pred_scaled.reshape(-1, 1))[0, 0]
        
        return {
            'y1': float(y1_pred),
            'y2': float(y2_pred)
        }
    
    def get_feature_importance(self):
        """
        Параметрлердің маңыздылығын алу (Random Forest үшін)
        """
        if not isinstance(self.models['y1'], RandomForestRegressor):
            return None
        
        importance_y1 = self.models['y1'].feature_importances_
        importance_y2 = self.models['y2'].feature_importances_
        
        importance_df = pd.DataFrame({
            'parameter': self.feature_names,
            'importance_y1': importance_y1,
            'importance_y2': importance_y2,
            'avg_importance': (importance_y1 + importance_y2) / 2
        }).sort_values('avg_importance', ascending=False)
        
        return importance_df
    
    def save(self, model_dir='models'):
        """Модельдерді сақтау"""
        os.makedirs(model_dir, exist_ok=True)
        
        joblib.dump(self.models['y1'], f'{model_dir}/forward_model_y1.pkl')
        joblib.dump(self.models['y2'], f'{model_dir}/forward_model_y2.pkl')
        joblib.dump(self.scalers, f'{model_dir}/forward_scalers.pkl')
        
        print(f"Модельдер {model_dir}/ сақталды")
    
    def load(self, model_dir='models'):
        """Модельдерді жүктеу"""
        self.models['y1'] = joblib.load(f'{model_dir}/forward_model_y1.pkl')
        self.models['y2'] = joblib.load(f'{model_dir}/forward_model_y2.pkl')
        self.scalers = joblib.load(f'{model_dir}/forward_scalers.pkl')
        
        print(f"Модельдер {model_dir}/ жүктелді")


if __name__ == '__main__':
    from data_loader import DataLoader
    
    # Деректерді жүктеу
    loader = DataLoader()
    df = loader.load_data(source='csv')
    
    # Модельді оқыту
    model = ForwardModel()
    model.train(df, model_type='random_forest')
    
    # Тест болжау
    test_input = {'x1': 240, 'x2': 0.9, 'x3': 210, 'x4': 518, 'x5': 2.2, 'x6': 1750}
    prediction = model.predict(test_input)
    print(f"\nТест болжау: {test_input}")
    print(f"Нәтиже: y1={prediction['y1']:.2f}%, y2={prediction['y2']:.4f}")
    
    # Feature importance
    importance = model.get_feature_importance()
    if importance is not None:
        print("\nПараметрлердің маңыздылығы:")
        print(importance)

