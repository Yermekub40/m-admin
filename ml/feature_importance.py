"""
Feature Importance анализі
x параметрлердің y1, y2-ге қаншалықты әсер ететінін көрсетеді
"""
import numpy as np
import pandas as pd
from forward_model import ForwardModel
import matplotlib.pyplot as plt
import seaborn as sns


class FeatureImportanceAnalyzer:
    """Параметрлердің маңыздылығын талдау классы"""
    
    def __init__(self, forward_model: ForwardModel):
        self.forward_model = forward_model
        self.feature_names = ['x1', 'x2', 'x3', 'x4', 'x5', 'x6']
        self.feature_labels = {
            'x1': 'Шикізат шығыны',
            'x2': 'Шикізат тығыздығы',
            'x3': 'Шикізат температурасы',
            'x4': 'Реактор температурасы',
            'x5': 'Реактор қысымы',
            'x6': 'Катализатор шығыны'
        }
    
    def get_model_importance(self):
        """
        Модельден маңыздылықты алу (Random Forest feature_importances_)
        """
        importance_df = self.forward_model.get_feature_importance()
        return importance_df
    
    def permutation_importance(self, X_test, y_test, n_repeats=10):
        """
        Permutation importance есептеу
        (параметрлерді араластырып, модель дұрыстығының қаншалықты төмендегенін көреді)
        """
        from sklearn.inspection import permutation_importance
        
        # y1 үшін
        perm_imp_y1 = permutation_importance(
            self.forward_model.models['y1'],
            X_test,
            y_test['y1'],
            n_repeats=n_repeats,
            random_state=42
        )
        
        # y2 үшін
        perm_imp_y2 = permutation_importance(
            self.forward_model.models['y2'],
            X_test,
            y_test['y2'],
            n_repeats=n_repeats,
            random_state=42
        )
        
        importance_df = pd.DataFrame({
            'parameter': self.feature_names,
            'importance_y1': perm_imp_y1.importances_mean,
            'importance_y2': perm_imp_y2.importances_mean,
            'std_y1': perm_imp_y1.importances_std,
            'std_y2': perm_imp_y2.importances_std,
            'avg_importance': (perm_imp_y1.importances_mean + perm_imp_y2.importances_mean) / 2
        }).sort_values('avg_importance', ascending=False)
        
        return importance_df
    
    def correlation_analysis(self, df):
        """
        Корреляция талдауы: x параметрлер мен y1, y2 арасындағы байланыс
        """
        correlation_y1 = df[self.feature_names + ['y1']].corr()['y1'].drop('y1')
        correlation_y2 = df[self.feature_names + ['y2']].corr()['y2'].drop('y2')
        
        corr_df = pd.DataFrame({
            'parameter': self.feature_names,
            'correlation_y1': correlation_y1.values,
            'correlation_y2': correlation_y2.values,
            'abs_corr_y1': np.abs(correlation_y1.values),
            'abs_corr_y2': np.abs(correlation_y2.values),
            'avg_abs_corr': (np.abs(correlation_y1.values) + np.abs(correlation_y2.values)) / 2
        }).sort_values('avg_abs_corr', ascending=False)
        
        return corr_df
    
    def partial_dependence_analysis(self, df, feature, target='y1', n_points=20):
        """
        Partial Dependence: бір параметрді өзгертіп, басқаларын тұрақты ұстағанда
        y1/y2 қалай өзгеретінін көрсетеді
        """
        # Орташа мәндер
        mean_values = df[self.feature_names].mean().values
        
        # Параметр диапазоны
        feature_idx = self.feature_names.index(feature)
        feature_min = df[feature].min()
        feature_max = df[feature].max()
        feature_values = np.linspace(feature_min, feature_max, n_points)
        
        predictions = []
        
        for val in feature_values:
            # Бір параметрді өзгертіп, басқаларын тұрақты ұстау
            test_input = mean_values.copy()
            test_input[feature_idx] = val
            
            pred = self.forward_model.predict(test_input)
            predictions.append(pred[target])
        
        return {
            'feature_values': feature_values,
            'predictions': predictions,
            'feature': feature,
            'target': target
        }
    
    def generate_report(self, df, X_test=None, y_test=None):
        """
        Толық есеп жасау
        """
        print("=" * 60)
        print("FEATURE IMPORTANCE ТАЛДАУЫ")
        print("=" * 60)
        
        # 1. Модель маңыздылығы (егер Random Forest болса)
        print("\n1. Модель маңыздылығы (Random Forest):")
        model_imp = self.get_model_importance()
        if model_imp is not None:
            print(model_imp.to_string(index=False))
        else:
            print("  (Тек Random Forest/Gradient Boosting үшін қолжетімді)")
        
        # 2. Корреляция талдауы
        print("\n2. Корреляция талдауы:")
        corr_df = self.correlation_analysis(df)
        print(corr_df.to_string(index=False))
        
        # 3. Permutation importance (егер тест деректері бар болса)
        if X_test is not None and y_test is not None:
            print("\n3. Permutation Importance:")
            perm_df = self.permutation_importance(X_test, y_test)
            print(perm_df[['parameter', 'importance_y1', 'importance_y2', 'avg_importance']].to_string(index=False))
        
        # 4. Ең маңызды параметрлер
        print("\n4. Ең маңызды параметрлер (орташа):")
        if model_imp is not None:
            top_features = model_imp.head(3)
            for idx, row in top_features.iterrows():
                param = row['parameter']
                label = self.feature_labels.get(param, param)
                print(f"  {idx+1}. {label} ({param}): {row['avg_importance']:.4f}")
        
        return {
            'model_importance': model_imp,
            'correlation': corr_df
        }
    
    def plot_importance(self, importance_df, save_path=None):
        """
        Маңыздылық графигін салу
        """
        plt.figure(figsize=(10, 6))
        
        x_pos = np.arange(len(importance_df))
        width = 0.35
        
        plt.bar(x_pos - width/2, importance_df['importance_y1'], width, 
                label='Y1 (Бензин көлемі)', alpha=0.8)
        plt.bar(x_pos + width/2, importance_df['importance_y2'], width,
                label='Y2 (Бензин тығыздығы)', alpha=0.8)
        
        plt.xlabel('Параметрлер')
        plt.ylabel('Маңыздылық')
        plt.title('Параметрлердің Y1 және Y2-ге әсері')
        plt.xticks(x_pos, [self.feature_labels.get(p, p) for p in importance_df['parameter']], 
                  rotation=45, ha='right')
        plt.legend()
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            print(f"График сақталды: {save_path}")
        else:
            plt.show()


if __name__ == '__main__':
    from data_loader import DataLoader
    from forward_model import ForwardModel
    from sklearn.model_selection import train_test_split
    
    # Деректерді жүктеу
    loader = DataLoader()
    df = loader.load_data(source='csv')
    
    # Модельді оқыту
    forward = ForwardModel()
    X, y1, y2 = forward.prepare_data(df)
    X_train, X_test, y1_train, y1_test, y2_train, y2_test = train_test_split(
        X, y1, y2, test_size=0.2, random_state=42
    )
    
    forward.train(df, model_type='random_forest')
    
    # Feature importance талдауы
    analyzer = FeatureImportanceAnalyzer(forward)
    
    X_test_scaled = forward.scalers['X'].transform(X_test)
    y_test = {'y1': y1_test.ravel(), 'y2': y2_test.ravel()}
    
    report = analyzer.generate_report(df, X_test_scaled, y_test)
    
    # График салу
    if report['model_importance'] is not None:
        analyzer.plot_importance(report['model_importance'], save_path='feature_importance.png')

