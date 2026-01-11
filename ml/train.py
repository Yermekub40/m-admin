"""
Модельдерді оқыту скрипті
Барлық модельдерді оқытып, сақтайды
"""
import argparse
from data_loader import DataLoader
from forward_model import ForwardModel
from reverse_model import ReverseModel
import os


def train_models(model_type='random_forest', data_source='csv', model_dir='models'):
    """
    Барлық модельдерді оқыту
    
    Args:
        model_type: 'random_forest', 'gradient_boosting', 'linear', 'ridge'
        data_source: 'database' немесе 'csv'
        model_dir: модельдерді сақтау директориясы
    """
    print("=" * 60)
    print("МОДЕЛЬДЕРДІ ОҚЫТУ")
    print("=" * 60)
    
    # Деректерді жүктеу
    print("\n1. Деректерді жүктеу...")
    loader = DataLoader()
    df = loader.load_data(source=data_source)
    print(f"   Жүктелген жазбалар: {len(df)}")
    
    # Прямая модельді оқыту
    print(f"\n2. Прямая модельді оқыту ({model_type})...")
    forward = ForwardModel()
    forward_metrics = forward.train(df, model_type=model_type)
    
    # Модельдерді сақтау
    print(f"\n3. Модельдерді сақтау ({model_dir}/)...")
    os.makedirs(model_dir, exist_ok=True)
    forward.save(model_dir=model_dir)
    
    # Кері бағыттағы модельді оқыту
    print(f"\n4. Кері бағыттағы модельді оқыту ({model_type})...")
    reverse = ReverseModel()
    reverse_metrics = reverse.train(df, model_type=model_type)
    
    # Кері модельді сақтау
    print(f"\n5. Кері модельді сақтау ({model_dir}/)...")
    reverse.save(model_dir=model_dir)
    
    # Feature importance
    print("\n6. Feature importance талдауы...")
    importance = forward.get_feature_importance()
    if importance is not None:
        print("\nПараметрлердің маңыздылығы:")
        print(importance.to_string(index=False))
    
    print("\n" + "=" * 60)
    print("ОҚЫТУ АЯҚТАЛДЫ!")
    print("=" * 60)
    
    return forward, reverse, forward_metrics, reverse_metrics


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='ML модельдерді оқыту')
    parser.add_argument('--model', type=str, default='random_forest',
                       choices=['random_forest', 'gradient_boosting', 'linear', 'ridge', 'all'],
                       help='Модель түрі (немесе "all" - барлық модельдерді оқыту)')
    parser.add_argument('--source', type=str, default='csv',
                       choices=['csv', 'database'],
                       help='Деректер көзі')
    parser.add_argument('--model-dir', type=str, default='models',
                       help='Модельдерді сақтау директориясы')
    
    args = parser.parse_args()
    
    # Егер "all" таңдалса, барлық модельдерді рет-ретімен оқыту
    if args.model == 'all':
        model_types = ['random_forest', 'gradient_boosting', 'linear', 'ridge']
        print("\n" + "=" * 60)
        print("БАРЛЫҚ МОДЕЛЬДЕРДІ ОҚЫТУ")
        print("=" * 60)
        print(f"Оқытылатын модельдер: {', '.join(model_types)}")
        print("=" * 60 + "\n")
        
        for i, model_type in enumerate(model_types, 1):
            print(f"\n{'=' * 60}")
            print(f"МОДЕЛЬ {i}/{len(model_types)}: {model_type.upper()}")
            print(f"{'=' * 60}\n")
            
            try:
                train_models(
                    model_type=model_type,
                    data_source=args.source,
                    model_dir=args.model_dir
                )
                print(f"\n✅ {model_type} модель сәтті оқытылды!\n")
            except Exception as e:
                print(f"\n❌ {model_type} модель оқыту қатесі: {e}\n")
                import traceback
                traceback.print_exc()
                continue
        
        print("\n" + "=" * 60)
        print("БАРЛЫҚ МОДЕЛЬДЕР ОҚЫТУ АЯҚТАЛДЫ!")
        print("=" * 60)
    else:
        # Бір модельді оқыту
        train_models(
            model_type=args.model,
            data_source=args.source,
            model_dir=args.model_dir
        )

