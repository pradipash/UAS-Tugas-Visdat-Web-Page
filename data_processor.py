"""
Vehicle Sales Data Processor
This script processes the car_prices.csv data and generates JSON files for the web visualization.
"""

import pandas as pd
import numpy as np
import json
from datetime import datetime

def load_and_clean_data(filepath):
    """Load and clean the car prices dataset."""
    print("Loading data...")
    df = pd.read_csv(filepath)
    
    print(f"Original dataset size: {df.shape[0]:,} rows, {df.shape[1]} columns")
    
    # Define columns
    numerical_columns = ['year', 'condition', 'odometer', 'mmr', 'sellingprice']
    categorical_columns = ['make', 'model', 'trim', 'body', 'transmission', 'vin', 'state', 'color', 'interior', 'seller', 'saledate']
    
    # Make a copy for cleaning
    df_cleaned = df.copy()
    
    # Fill missing numerical values with group mean
    for col in numerical_columns:
        if col in df_cleaned.columns:
            df_cleaned[col] = df_cleaned.groupby('make')[col].transform(lambda x: x.fillna(x.mean()))
    
    # Fill missing categorical values with group mode
    for col in categorical_columns:
        if col in df_cleaned.columns and col != 'vin':
            df_cleaned[col] = df_cleaned.groupby('make')[col].transform(
                lambda x: x.fillna(x.mode()[0] if not x.mode().empty else 'Unknown')
            )
    
    # Clean transmission column
    if 'transmission' in df_cleaned.columns:
        df_cleaned['transmission'] = df_cleaned['transmission'].str.lower().replace({'sedan': 'manual'})
    
    # Drop remaining NaN rows
    df_cleaned = df_cleaned.dropna()
    
    # Remove outliers using IQR method for selling price
    Q1 = df_cleaned['sellingprice'].quantile(0.25)
    Q3 = df_cleaned['sellingprice'].quantile(0.75)
    IQR = Q3 - Q1
    lower_bound = Q1 - 1.5 * IQR
    upper_bound = Q3 + 1.5 * IQR
    df_cleaned = df_cleaned[(df_cleaned['sellingprice'] >= lower_bound) & (df_cleaned['sellingprice'] <= upper_bound)]
    
    # Also remove outliers for condition
    Q1_cond = df_cleaned['condition'].quantile(0.25)
    Q3_cond = df_cleaned['condition'].quantile(0.75)
    IQR_cond = Q3_cond - Q1_cond
    lower_cond = Q1_cond - 1.5 * IQR_cond
    upper_cond = Q3_cond + 1.5 * IQR_cond
    df_cleaned = df_cleaned[(df_cleaned['condition'] >= lower_cond) & (df_cleaned['condition'] <= upper_cond)]
    
    print(f"Cleaned dataset size: {df_cleaned.shape[0]:,} rows, {df_cleaned.shape[1]} columns")
    
    return df_cleaned

def generate_study_case_data(df):
    """Generate data for all 10+ study cases."""
    data = {}
    current_year = 2025
    
    # ===== CASE 1: Vehicle Age vs Selling Price =====
    print("Processing Case 1: Vehicle Age vs Selling Price...")
    df['year_int'] = df['year'].astype(int)
    age_price = df.groupby('year_int').agg({
        'sellingprice': ['mean', 'median', 'count']
    }).reset_index()
    age_price.columns = ['year', 'mean_price', 'median_price', 'count']
    age_price['vehicle_age'] = current_year - age_price['year']
    data['age_vs_price'] = {
        'years': age_price['year'].tolist(),
        'mean_prices': [round(x, 2) for x in age_price['mean_price'].tolist()],
        'median_prices': [round(x, 2) for x in age_price['median_price'].tolist()],
        'counts': age_price['count'].tolist(),
        'ages': age_price['vehicle_age'].tolist()
    }
    
    # ===== CASE 2: Body Type Comparison =====
    print("Processing Case 2: Body Type Comparison...")
    def categorize_body(body):
        body = str(body).lower()
        if 'suv' in body or 'crossover' in body:
            return 'SUV'
        elif 'sedan' in body:
            return 'Sedan'
        elif 'truck' in body or 'pickup' in body:
            return 'Truck'
        elif 'coupe' in body:
            return 'Coupe'
        elif 'wagon' in body:
            return 'Wagon'
        elif 'van' in body or 'minivan' in body:
            return 'Van'
        elif 'hatchback' in body:
            return 'Hatchback'
        elif 'convertible' in body:
            return 'Convertible'
        else:
            return 'Other'
    
    df['body_category'] = df['body'].apply(categorize_body)
    body_stats = df.groupby('body_category').agg({
        'sellingprice': ['mean', 'median', 'count']
    }).reset_index()
    body_stats.columns = ['body_type', 'mean_price', 'median_price', 'count']
    body_stats = body_stats.sort_values('mean_price', ascending=False)
    body_stats = body_stats[body_stats['body_type'] != 'Other']
    data['body_type'] = {
        'types': body_stats['body_type'].tolist(),
        'mean_prices': [round(x, 2) for x in body_stats['mean_price'].tolist()],
        'median_prices': [round(x, 2) for x in body_stats['median_price'].tolist()],
        'counts': body_stats['count'].tolist()
    }
    
    # ===== CASE 3: Popular Exterior Colors =====
    print("Processing Case 3: Popular Exterior Colors...")
    color_counts = df['color'].value_counts()
    color_counts = color_counts[color_counts.index != '—'].head(10)
    total_vehicles = len(df)
    data['colors'] = {
        'colors': color_counts.index.tolist(),
        'counts': color_counts.values.tolist(),
        'percentages': [round(x/total_vehicles*100, 2) for x in color_counts.values.tolist()],
        'total': total_vehicles
    }
    
    # ===== CASE 4: Top Makes by Sales Volume =====
    print("Processing Case 4: Top Makes by Sales Volume...")
    make_stats = df.groupby('make').agg({
        'sellingprice': ['mean', 'count']
    }).reset_index()
    make_stats.columns = ['make', 'avg_price', 'count']
    top_makes = make_stats.nlargest(15, 'count')
    data['top_makes'] = {
        'makes': top_makes['make'].tolist(),
        'counts': top_makes['count'].tolist(),
        'avg_prices': [round(x, 2) for x in top_makes['avg_price'].tolist()]
    }
    
    # ===== CASE 5: Condition vs Selling Price =====
    print("Processing Case 5: Condition vs Selling Price...")
    df['condition_rounded'] = df['condition'].round(1)
    condition_price = df.groupby('condition_rounded').agg({
        'sellingprice': ['mean', 'count']
    }).reset_index()
    condition_price.columns = ['condition', 'avg_price', 'count']
    # Filter to keep only conditions with significant data
    condition_price = condition_price[condition_price['count'] >= 100]
    data['condition_price'] = {
        'conditions': condition_price['condition'].tolist(),
        'avg_prices': [round(x, 2) for x in condition_price['avg_price'].tolist()],
        'counts': condition_price['count'].tolist()
    }
    
    # ===== CASE 6: Transmission Type Analysis =====
    print("Processing Case 6: Transmission Type Analysis...")
    trans_stats = df.groupby('transmission').agg({
        'sellingprice': ['mean', 'median', 'count']
    }).reset_index()
    trans_stats.columns = ['transmission', 'mean_price', 'median_price', 'count']
    trans_stats = trans_stats.sort_values('count', ascending=False)
    data['transmission'] = {
        'types': trans_stats['transmission'].tolist(),
        'mean_prices': [round(x, 2) for x in trans_stats['mean_price'].tolist()],
        'median_prices': [round(x, 2) for x in trans_stats['median_price'].tolist()],
        'counts': trans_stats['count'].tolist()
    }
    
    # ===== CASE 7: Price Distribution (Histogram) =====
    print("Processing Case 7: Price Distribution...")
    price_bins = pd.cut(df['sellingprice'], bins=20)
    price_dist = df.groupby(price_bins, observed=True).size()
    bin_labels = [f"${int(interval.left):,}-${int(interval.right):,}" for interval in price_dist.index]
    bin_centers = [(interval.left + interval.right) / 2 for interval in price_dist.index]
    data['price_distribution'] = {
        'labels': bin_labels,
        'counts': price_dist.values.tolist(),
        'bin_centers': [round(x, 2) for x in bin_centers]
    }
    
    # ===== CASE 8: Top Models by Average Price =====
    print("Processing Case 8: Top Models by Average Price...")
    model_stats = df.groupby(['make', 'model']).agg({
        'sellingprice': ['mean', 'count']
    }).reset_index()
    model_stats.columns = ['make', 'model', 'avg_price', 'count']
    # Filter models with at least 500 sales
    model_stats = model_stats[model_stats['count'] >= 500]
    top_models_price = model_stats.nlargest(15, 'avg_price')
    data['top_models_price'] = {
        'models': [f"{row['make']} {row['model']}" for _, row in top_models_price.iterrows()],
        'avg_prices': [round(x, 2) for x in top_models_price['avg_price'].tolist()],
        'counts': top_models_price['count'].tolist()
    }
    
    # ===== CASE 9: State-wise Sales Analysis =====
    print("Processing Case 9: State-wise Sales Analysis...")
    state_stats = df.groupby('state').agg({
        'sellingprice': ['mean', 'count']
    }).reset_index()
    state_stats.columns = ['state', 'avg_price', 'count']
    top_states = state_stats.nlargest(20, 'count')
    data['state_sales'] = {
        'states': top_states['state'].tolist(),
        'counts': top_states['count'].tolist(),
        'avg_prices': [round(x, 2) for x in top_states['avg_price'].tolist()]
    }
    
    # ===== CASE 10: Odometer vs Price Analysis =====
    print("Processing Case 10: Odometer vs Price Analysis...")
    # Create odometer bins
    df['odometer_bin'] = pd.cut(df['odometer'], 
                                 bins=[0, 25000, 50000, 75000, 100000, 150000, 200000, float('inf')],
                                 labels=['0-25K', '25K-50K', '50K-75K', '75K-100K', '100K-150K', '150K-200K', '200K+'])
    odometer_price = df.groupby('odometer_bin', observed=True).agg({
        'sellingprice': ['mean', 'count']
    }).reset_index()
    odometer_price.columns = ['odometer_range', 'avg_price', 'count']
    data['odometer_price'] = {
        'ranges': odometer_price['odometer_range'].astype(str).tolist(),
        'avg_prices': [round(x, 2) for x in odometer_price['avg_price'].tolist()],
        'counts': odometer_price['count'].tolist()
    }
    
    # ===== CASE 11: Interior Color Analysis =====
    print("Processing Case 11: Interior Color Analysis...")
    interior_counts = df['interior'].value_counts()
    interior_counts = interior_counts[interior_counts.index != '—'].head(10)
    data['interior_colors'] = {
        'colors': interior_counts.index.tolist(),
        'counts': interior_counts.values.tolist(),
        'percentages': [round(x/total_vehicles*100, 2) for x in interior_counts.values.tolist()]
    }
    
    # ===== CASE 12: Make vs Average Condition =====
    print("Processing Case 12: Make vs Average Condition...")
    make_condition = df.groupby('make').agg({
        'condition': 'mean',
        'sellingprice': 'mean'
    }).reset_index()
    make_condition.columns = ['make', 'avg_condition', 'avg_price']
    # Filter top 20 makes by count
    top_make_names = df['make'].value_counts().head(20).index.tolist()
    make_condition = make_condition[make_condition['make'].isin(top_make_names)]
    make_condition = make_condition.sort_values('avg_condition', ascending=False)
    data['make_condition'] = {
        'makes': make_condition['make'].tolist(),
        'avg_conditions': [round(x, 2) for x in make_condition['avg_condition'].tolist()],
        'avg_prices': [round(x, 2) for x in make_condition['avg_price'].tolist()]
    }
    
    # ===== SUMMARY STATISTICS =====
    print("Generating Summary Statistics...")
    data['summary'] = {
        'total_vehicles': int(len(df)),
        'total_makes': int(df['make'].nunique()),
        'total_models': int(df['model'].nunique()),
        'avg_price': round(df['sellingprice'].mean(), 2),
        'median_price': round(df['sellingprice'].median(), 2),
        'min_price': round(df['sellingprice'].min(), 2),
        'max_price': round(df['sellingprice'].max(), 2),
        'avg_condition': round(df['condition'].mean(), 2),
        'avg_odometer': round(df['odometer'].mean(), 2),
        'year_range': f"{int(df['year'].min())} - {int(df['year'].max())}",
        'total_states': int(df['state'].nunique())
    }
    
    return data

def main():
    """Main function to process data and save JSON."""
    # Load and clean data
    df = load_and_clean_data('../car_prices.csv')
    
    # Generate study case data
    data = generate_study_case_data(df)
    
    # Save to JSON
    output_path = 'data/vehicle_data.json'
    import os
    os.makedirs('data', exist_ok=True)
    
    with open(output_path, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"\nData saved to {output_path}")
    print("Processing complete!")

if __name__ == "__main__":
    main()
