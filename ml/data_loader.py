"""
Деректерді жүктеу модулі
PostgreSQL базасынан немесе CSV файлынан деректерді алады
"""
import pandas as pd
import numpy as np
import os
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

load_dotenv()


class DataLoader:
    """Деректерді жүктеу классы"""
    
    def __init__(self):
        self.db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': os.getenv('DB_PORT', '5432'),
            'database': os.getenv('DB_NAME', 'm_admin_dev'),
            'user': os.getenv('DB_USER', 'postgres'),
            'password': os.getenv('DB_PASSWORD', '')
        }
    
    def load_from_database(self):
        """
        PostgreSQL базасынан деректерді жүктеу
        Returns: DataFrame with columns x1-x6, y1, y2
        """
        try:
            conn = psycopg2.connect(**self.db_config)
            query = """
                SELECT x1, x2, x3, x4, x5, x6, y1, y2
                FROM process_data
                ORDER BY created_at DESC
            """
            df = pd.read_sql_query(query, conn)
            conn.close()
            
            print(f"Базадан {len(df)} жазба жүктелді")
            return df
            
        except Exception as e:
            print(f"Базадан жүктеу қатесі: {e}")
            return None
    
    def load_from_csv(self, csv_path='../tz/ТЗ_для разработки системы управления - Статистические данные.csv'):
        """
        CSV файлынан деректерді жүктеу
        CSV-да тек y1 бар, y2-ді есептеу керек немесе базадан алу керек
        """
        try:
            # CSV-ды оқу (үтір орнына нүкте)
            df = pd.read_csv(csv_path, encoding='utf-8', skiprows=1)
            
            # Баған атауларын тазалау
            df.columns = df.columns.str.strip()
            
            # Сандық мәндерді түрлендіру (үтір → нүкте)
            numeric_cols = ['x1', 'x2', 'x3', 'x4', 'x5', 'x6', 'y1']
            for col in numeric_cols:
                if col in df.columns:
                    df[col] = df[col].astype(str).str.replace(',', '.').astype(float)
            
            # y2 жоқ болса, базадан алуға тырысу немесе есептеу
            if 'y2' not in df.columns:
                print("Ескерту: CSV-да y2 жоқ. Базадан алуға тырысамыз...")
                db_df = self.load_from_database()
                if db_df is not None and len(db_df) > 0:
                    # y2-ді орташа мәнмен толтыру (уақытша)
                    # Нақты жобада y2 деректерін базадан алу керек
                    df['y2'] = db_df['y2'].mean() if 'y2' in db_df.columns else 0.7
                else:
                    # y2 үшін уақытша орташа мән (0.7 - норма)
                    df['y2'] = 0.7
            
            # Тек қажетті бағандарды қалдыру
            required_cols = ['x1', 'x2', 'x3', 'x4', 'x5', 'x6', 'y1', 'y2']
            df = df[[col for col in required_cols if col in df.columns]]
            
            print(f"CSV-дан {len(df)} жазба жүктелді")
            return df
            
        except Exception as e:
            print(f"CSV жүктеу қатесі: {e}")
            return None
    
    def load_data(self, source='database'):
        """
        Деректерді жүктеу (негізгі функция)
        
        Args:
            source: 'database' немесе 'csv'
        
        Returns:
            DataFrame with x1-x6, y1, y2
        """
        if source == 'database':
            df = self.load_from_database()
            if df is None or len(df) == 0:
                print("Базада деректер жоқ, CSV-дан жүктейміз...")
                df = self.load_from_csv()
        else:
            df = self.load_from_csv()
            if df is None or len(df) == 0:
                print("CSV-да деректер жоқ, базадан жүктейміз...")
                df = self.load_from_database()
        
        if df is None or len(df) == 0:
            raise ValueError("Деректер жүктелмеді!")
        
        # Бос мәндерді тексеру
        if df.isnull().any().any():
            print("Ескерту: Бос мәндер бар, оларды толтырамыз...")
            df = df.fillna(df.mean())
        
        return df


if __name__ == '__main__':
    loader = DataLoader()
    df = loader.load_data(source='csv')
    print("\nДеректер статистикасы:")
    print(df.describe())
    print("\nАлғашқы 5 жол:")
    print(df.head())

