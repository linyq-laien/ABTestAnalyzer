import numpy as np
import scipy.stats as scipy_stats
import pandas as pd
from itertools import combinations
import json
import argparse
import sys
from pathlib import Path

def calculate_group_stats(users, conversions, alpha=0.05):
    """
    Calculate statistical metrics for a single group
    :param users: Total number of users
    :param conversions: List of conversion user revenues, e.g., [39.99, 49.99, 39.99]
    :param alpha: Significance level for confidence intervals
    :return: Dictionary containing statistical metrics
    """
    # Calculate basic metrics
    conversions = np.array(conversions)
    n_conversions = len(conversions)
    total_revenue = np.sum(conversions) if n_conversions > 0 else 0
    
    # ARPU calculation
    arpu = total_revenue / users if users > 0 else 0
    
    # Calculate average revenue per conversion user
    cvr = n_conversions / users if users > 0 else 0
    avg_conversion_value = total_revenue / n_conversions if n_conversions > 0 else 0
    
    # Calculate revenue variance (considering different prices for conversion users)
    if n_conversions > 0:
        # Create complete revenue array (including 0 revenue for non-converted users)
        all_revenues = np.zeros(users)
        all_revenues[:n_conversions] = conversions
        
        # Calculate sample variance (unbiased estimate)
        revenue_variance = np.var(all_revenues, ddof=1)
    else:
        revenue_variance = 0
    
    # Calculate standard error
    se = np.sqrt(revenue_variance / users) if users > 0 else 0
    
    # Calculate confidence intervals
    z_critical = scipy_stats.norm.ppf(1 - alpha/2)
    arpu_ci_lower = arpu - z_critical * se
    arpu_ci_upper = arpu + z_critical * se
    
    return {
        'users': users,
        'conversions': n_conversions,
        'total_revenue': total_revenue,
        'arpu': arpu,
        'arpu_ci_lower': arpu_ci_lower,
        'arpu_ci_upper': arpu_ci_upper,
        'cvr': cvr,
        'avg_conversion_value': avg_conversion_value,
        'revenue_variance': revenue_variance,
        'se': se
    }

def calculate_conversion_rate_stats(users, conversions, alpha=0.05):
    """
    Calculate conversion rate statistics for a single group
    :param users: Total number of users
    :param conversions: Number of conversions (integer)
    :param alpha: Significance level for confidence intervals
    :return: Dictionary containing conversion rate statistics
    """
    if not isinstance(conversions, int) or conversions < 0:
        raise ValueError("Conversions must be a non-negative integer")
    
    # Calculate conversion rate
    conversion_rate = conversions / users if users > 0 else 0
    
    # Calculate standard error using binomial approximation
    if users > 0 and conversion_rate > 0 and conversion_rate < 1:
        se = np.sqrt(conversion_rate * (1 - conversion_rate) / users)
    else:
        se = 0
    
    # Calculate confidence intervals using normal approximation
    z_critical = scipy_stats.norm.ppf(1 - alpha/2)
    rate_ci_lower = conversion_rate - z_critical * se
    rate_ci_upper = conversion_rate + z_critical * se
    
    # Ensure confidence intervals are within [0, 1] for conversion rates
    rate_ci_lower = max(0, rate_ci_lower)
    rate_ci_upper = min(1, rate_ci_upper)
    
    return {
        'users': users,
        'conversions': conversions,
        'conversion_rate': conversion_rate,
        'rate_ci_lower': rate_ci_lower,
        'rate_ci_upper': rate_ci_upper,
        'se': se
    }

def compare_groups_arpu(groups, alpha=0.05, group_names=None):
    """
    Compare multiple experimental groups and perform ARPU statistical tests
    :param groups: List of group data, each element is a tuple of (users, conversion_revenue_list)
    :param alpha: Significance level
    :param group_names: List of group names (optional)
    :return: DataFrame with comparison results
    """
    # Calculate statistics for each group
    group_data = []
    for i, (users, conv_list) in enumerate(groups):
        stats_dict = calculate_group_stats(users, conv_list, alpha)
        stats_dict['group'] = group_names[i] if group_names else f'Group {i}'
        group_data.append(stats_dict)
    
    # Create results DataFrame
    results_df = pd.DataFrame(group_data)
    
    # Perform pairwise comparisons
    comparisons = []
    n_groups = len(results_df)
    n_comparisons = n_groups * (n_groups - 1) // 2
    
    # Bonferroni correction for multiple comparisons
    bonferroni_alpha = alpha / n_comparisons if n_comparisons > 0 else alpha
    
    for (i, j) in combinations(results_df.index, 2):
        group_i = results_df.loc[i]
        group_j = results_df.loc[j]
        
        # Calculate ARPU difference
        arpu_diff = group_i['arpu'] - group_j['arpu']
        
        # Calculate difference standard error
        se_diff = np.sqrt(group_i['se']**2 + group_j['se']**2)
        
        # Calculate z-statistic and p-value
        z_score = arpu_diff / se_diff if se_diff > 0 else 0
        p_value = 2 * (1 - scipy_stats.norm.cdf(abs(z_score)))
        
        # Calculate confidence interval for the difference
        z_critical = scipy_stats.norm.ppf(1 - alpha/2)
        diff_ci_lower = arpu_diff - z_critical * se_diff
        diff_ci_upper = arpu_diff + z_critical * se_diff
        
        # Determine significance
        significant = p_value < bonferroni_alpha
        
        comparisons.append({
            'Group A': group_i['group'],
            'Group B': group_j['group'],
            'ARPUA': group_i['arpu'],
            'ARPUB': group_j['arpu'],
            'ARPU Difference': arpu_diff,
            'Diff CI Lower': diff_ci_lower,
            'Diff CI Upper': diff_ci_upper,
            'SE Difference': se_diff,
            'Z-score': z_score,
            'P-value': p_value,
            'Significant': significant
        })
    
    return results_df, pd.DataFrame(comparisons)

def compare_groups_conversion_rate(groups, alpha=0.05, group_names=None):
    """
    Compare multiple experimental groups and perform conversion rate statistical tests
    :param groups: List of group data, each element is a tuple of (users, conversions_count)
    :param alpha: Significance level
    :param group_names: List of group names (optional)
    :return: DataFrame with comparison results
    """
    # Calculate statistics for each group
    group_data = []
    for i, (users, conversions) in enumerate(groups):
        stats_dict = calculate_conversion_rate_stats(users, conversions, alpha)
        stats_dict['group'] = group_names[i] if group_names else f'Group {i}'
        group_data.append(stats_dict)
    
    # Create results DataFrame
    results_df = pd.DataFrame(group_data)
    
    # Perform pairwise comparisons
    comparisons = []
    n_groups = len(results_df)
    n_comparisons = n_groups * (n_groups - 1) // 2
    
    # Bonferroni correction for multiple comparisons
    bonferroni_alpha = alpha / n_comparisons if n_comparisons > 0 else alpha
    
    for (i, j) in combinations(results_df.index, 2):
        group_i = results_df.loc[i]
        group_j = results_df.loc[j]
        
        # Calculate conversion rate difference
        rate_diff = group_i['conversion_rate'] - group_j['conversion_rate']
        
        # Calculate difference standard error
        se_diff = np.sqrt(group_i['se']**2 + group_j['se']**2)
        
        # Calculate z-statistic and p-value
        z_score = rate_diff / se_diff if se_diff > 0 else 0
        p_value = 2 * (1 - scipy_stats.norm.cdf(abs(z_score)))
        
        # Calculate confidence interval for the difference
        z_critical = scipy_stats.norm.ppf(1 - alpha/2)
        diff_ci_lower = rate_diff - z_critical * se_diff
        diff_ci_upper = rate_diff + z_critical * se_diff
        
        # Determine significance
        significant = p_value < bonferroni_alpha
        
        comparisons.append({
            'Group A': group_i['group'],
            'Group B': group_j['group'],
            'Rate A': group_i['conversion_rate'],
            'Rate B': group_j['conversion_rate'],
            'Rate Difference': rate_diff,
            'Diff CI Lower': diff_ci_lower,
            'Diff CI Upper': diff_ci_upper,
            'SE Difference': se_diff,
            'Z-score': z_score,
            'P-value': p_value,
            'Significant': significant
        })
    
    return results_df, pd.DataFrame(comparisons)

def compare_groups(groups, alpha=0.05, analysis_type='arpu', group_names=None):
    """
    Compare multiple experimental groups and perform statistical tests
    :param groups: List of group data
    :param alpha: Significance level
    :param analysis_type: 'arpu' or 'conversion_rate'
    :return: DataFrame with comparison results
    """
    if analysis_type == 'arpu':
        return compare_groups_arpu(groups, alpha, group_names)
    elif analysis_type == 'conversion_rate':
        return compare_groups_conversion_rate(groups, alpha, group_names)
    else:
        raise ValueError("analysis_type must be 'arpu' or 'conversion_rate'")

def load_data_from_json(json_file_path):
    """
    Load experimental data from JSON file
    Supports ARPU analysis with:
    1. Price counts format: [{"price": 39.99, "count": 50}, ...]
    2. Aggregated format: {"total_revenue": 1999.50, "conversion_count": 50}
    
    Supports conversion rate analysis with:
    3. Simple format: {"conversions": 50}
    :param json_file_path: Path to JSON file
    :return: List of groups data and analysis type
    """
    try:
        with open(json_file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)
        
        # Validate JSON structure
        if not isinstance(data, dict):
            raise ValueError("JSON data must be a dictionary")
        
        if 'groups' not in data:
            raise ValueError("JSON must contain 'groups' field")
        
        if not isinstance(data['groups'], list):
            raise ValueError("'groups' must be a list")
        
        # Determine analysis type
        analysis_type = data.get('analysis_type', 'arpu')
        if analysis_type not in ['arpu', 'conversion_rate']:
            raise ValueError("analysis_type must be 'arpu' or 'conversion_rate'")
        
        groups = []
        group_names = []
        for i, group_data in enumerate(data['groups']):
            if not isinstance(group_data, dict):
                raise ValueError(f"Group {i} must be a dictionary")
            
            if 'users' not in group_data:
                raise ValueError(f"Group {i} must contain 'users' field")
            
            # Extract group name (optional, defaults to "Group {i}")
            group_name = group_data.get('name', f'Group {i}')
            group_names.append(group_name)
            
            users = group_data['users']
            if not isinstance(users, int) or users <= 0:
                raise ValueError(f"Group {i} users must be a positive integer")
            
            if analysis_type == 'arpu':
                conversions = []
                
                # Format 1: Aggregated format
                if 'total_revenue' in group_data and 'conversion_count' in group_data:
                    total_revenue = group_data['total_revenue']
                    conversion_count = group_data['conversion_count']
                    
                    if not isinstance(total_revenue, (int, float)) or total_revenue < 0:
                        raise ValueError(f"Group {i} total_revenue must be a non-negative number")
                    if not isinstance(conversion_count, int) or conversion_count < 0:
                        raise ValueError(f"Group {i} conversion_count must be a non-negative integer")
                    
                    if conversion_count > 0:
                        avg_price = total_revenue / conversion_count
                        conversions = [avg_price] * conversion_count
                    else:
                        conversions = []
                
                # Format 2: Price counts format
                elif 'price_counts' in group_data:
                    price_counts = group_data['price_counts']
                    if not isinstance(price_counts, list):
                        raise ValueError(f"Group {i} price_counts must be a list")
                    
                    for j, price_count in enumerate(price_counts):
                        if not isinstance(price_count, dict):
                            raise ValueError(f"Group {i} price_count {j} must be a dictionary")
                        
                        if 'price' not in price_count or 'count' not in price_count:
                            raise ValueError(f"Group {i} price_count {j} must contain 'price' and 'count' fields")
                        
                        price = price_count['price']
                        count = price_count['count']
                        
                        if not isinstance(price, (int, float)) or price < 0:
                            raise ValueError(f"Group {i} price_count {j} price must be a non-negative number")
                        if not isinstance(count, int) or count < 0:
                            raise ValueError(f"Group {i} price_count {j} count must be a non-negative integer")
                        
                        conversions.extend([price] * count)
                
                else:
                    raise ValueError(f"Group {i} must contain either 'price_counts' or both 'total_revenue' and 'conversion_count'")
                
                groups.append((users, conversions))
            
            else:  # conversion_rate analysis
                if 'conversions' not in group_data:
                    raise ValueError(f"Group {i} must contain 'conversions' field for conversion rate analysis")
                
                conversions = group_data['conversions']
                if not isinstance(conversions, int) or conversions < 0:
                    raise ValueError(f"Group {i} conversions must be a non-negative integer")
                
                if conversions > users:
                    raise ValueError(f"Group {i} conversions cannot exceed users")
                
                groups.append((users, conversions))
        
        return groups, data.get('alpha', 0.05), analysis_type, group_names
        
    except FileNotFoundError:
        raise FileNotFoundError(f"JSON file not found: {json_file_path}")
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON format: {e}")
    except Exception as e:
        raise ValueError(f"Error loading JSON file: {e}")

def create_json_template(output_file=None, analysis_type='arpu'):
    """
    Create a JSON template for experimental data
    :param output_file: Optional output file path
    :param analysis_type: 'arpu' or 'conversion_rate'
    :return: JSON template string
    """
    if analysis_type == 'arpu':
        template = {
            "analysis_type": "arpu",
            "alpha": 0.05,
            "groups": [
                {
                    "name": "Control Group",
                    "users": 815,
                    "price_counts": [
                        {"price": 39.99, "count": 50},
                        {"price": 49.99, "count": 20},
                        {"price": 29.99, "count": 3}
                    ]
                },
                {
                    "name": "Treatment Group 1",
                    "users": 1563,
                    "price_counts": [
                        {"price": 39.99, "count": 80},
                        {"price": 49.99, "count": 40},
                        {"price": 19.99, "count": 6}
                    ]
                },
                {
                    "name": "Treatment Group 2",
                    "users": 1200,
                    "total_revenue": 2999.55,
                    "conversion_count": 45
                }
            ]
        }
    else:  # conversion_rate
        template = {
            "analysis_type": "conversion_rate",
            "alpha": 0.05,
            "groups": [
                {
                    "name": "Control Group",
                    "users": 1000,
                    "conversions": 73
                },
                {
                    "name": "Treatment Group 1",
                    "users": 1000,
                    "conversions": 126
                },
                {
                    "name": "Treatment Group 2",
                    "users": 1000,
                    "conversions": 95
                }
            ]
        }
    
    template_str = json.dumps(template, indent=2, ensure_ascii=False)
    
    if output_file:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(template_str)
        print(f"Template saved to: {output_file}")
    else:
        print(f"JSON Template for {analysis_type} analysis:")
        print(template_str)
    
    return template_str

def input_group_data():
    """Interactive input for experimental group data (ARPU analysis)"""
    groups = []
    print("Enter experimental group data (enter 'q' to quit)")
    
    group_idx = 0
    while True:
        print(f"\n=== Group {group_idx} ===")
        try:
            users_input = input("Total users: ").strip()
            if users_input.lower() == 'q':
                break
            users = int(users_input)
            
            conversions = []
            print("Enter conversion user revenues (one price per line, empty line to finish):")
            while True:
                price_input = input("> ").strip()
                if not price_input:
                    break
                try:
                    price = float(price_input)
                    conversions.append(price)
                except ValueError:
                    print(f"Invalid price: {price_input}. Please enter a number or leave empty to finish")
            
            groups.append((users, conversions))
            group_idx += 1
        except ValueError:
            print("Invalid input, please enter a valid integer")
    
    return groups

def input_conversion_rate_data():
    """Interactive input for experimental group data (conversion rate analysis)"""
    groups = []
    print("Enter experimental group data (enter 'q' to quit)")
    
    group_idx = 0
    while True:
        print(f"\n=== Group {group_idx} ===")
        try:
            users_input = input("Total users: ").strip()
            if users_input.lower() == 'q':
                break
            users = int(users_input)
            
            conversions_input = input("Number of conversions: ").strip()
            if conversions_input.lower() == 'q':
                break
            conversions = int(conversions_input)
            
            if conversions > users:
                print("Error: Conversions cannot exceed total users")
                continue
            
            groups.append((users, conversions))
            group_idx += 1
        except ValueError:
            print("Invalid input, please enter valid integers")
    
    return groups

def save_results_to_json(group_results, comparison_results, output_file, analysis_type='arpu', alpha=0.05):
    """
    Save analysis results to JSON file
    :param group_results: Group statistics DataFrame
    :param comparison_results: Comparison results DataFrame
    :param output_file: Output file path
    :param analysis_type: 'arpu' or 'conversion_rate'
    :param alpha: Significance level used for confidence intervals
    """
    if analysis_type == 'arpu':
        best_metric = 'arpu'
        best_value = float(group_results['arpu'].max())
        metric_name = 'best_arpu'
    else:
        best_metric = 'conversion_rate'
        best_value = float(group_results['conversion_rate'].max())
        metric_name = 'best_conversion_rate'
    
    results = {
        'analysis_type': analysis_type,
        'confidence_level': f'{(1-alpha)*100:.0f}%',
        'group_statistics': group_results.to_dict('records'),
        'comparisons': comparison_results.to_dict('records'),
        'summary': {
            'total_groups': len(group_results),
            'best_group': group_results.loc[group_results[best_metric].idxmax()]['group'],
            metric_name: best_value,
            'significant_comparisons': int(comparison_results['Significant'].sum())
        }
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, default=str)
    
    print(f"Results saved to: {output_file}")

def main():
    """Main program"""
    parser = argparse.ArgumentParser(
        description="A/B Testing Analyzer for ARPU and Conversion Rate Comparison using Z-test",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Interactive mode
  python ab_testing_analyzer.py
  
  # Use JSON file
  python ab_testing_analyzer.py --json data.json
  
  # Save results to file
  python ab_testing_analyzer.py --json data.json --output results.json
  
  # Create JSON template
  python ab_testing_analyzer.py --create-template template.json
  
  # Create conversion rate template
  python ab_testing_analyzer.py --create-template template.json --analysis-type conversion_rate
        """
    )
    
    parser.add_argument('--json', type=str, help='Path to JSON input file')
    parser.add_argument('--output', type=str, help='Path to save results JSON file')
    parser.add_argument('--create-template', type=str, help='Create JSON template file')
    parser.add_argument('--analysis-type', choices=['arpu', 'conversion_rate'], default='arpu', 
                       help='Analysis type for template creation (default: arpu)')
    parser.add_argument('--alpha', type=float, default=0.05, help='Significance level (default: 0.05)')
    
    args = parser.parse_args()
    
    # Create template if requested
    if args.create_template:
        create_json_template(args.create_template, args.analysis_type)
        return
    
    print("="*80)
    print("A/B Testing Analyzer for Paywall Experiments")
    print("="*80)
    
    # Load data
    if args.json:
        try:
            groups, alpha, analysis_type, group_names = load_data_from_json(args.json)
            print(f"Loaded data from: {args.json}")
            print(f"Analysis type: {analysis_type}")
            print(f"Significance level: {alpha}")
        except Exception as e:
            print(f"Error loading JSON file: {e}")
            return
    else:
        # Interactive mode
        analysis_type = input("Select analysis type:\n1. ARPU Analysis\n2. Conversion Rate Analysis\n> ").strip()
        if analysis_type == "2":
            analysis_type = "conversion_rate"
        else:
            analysis_type = "arpu"
        
        input_method = input("Select input method:\n1. Use sample data\n2. Manual input\n> ").strip()
        
        if input_method == "1":
            # Sample data
            print("\nUsing sample data...")
            if analysis_type == "arpu":
                groupA = (815, [39.99]*50 + [49.99]*20 + [29.99]*3)  # 73 conversions, revenue ~2550
                groupB = (1563, [39.99]*80 + [49.99]*40 + [19.99]*6)  # 126 conversions, revenue ~4364
                groupC = (1200, [49.99]*30 + [79.99]*15)  # 45 conversions, revenue ~3000
            else:  # conversion_rate
                groupA = (1000, 73)  # 7.3% conversion rate
                groupB = (1000, 126)  # 12.6% conversion rate
                groupC = (1000, 95)   # 9.5% conversion rate
            groups = [groupA, groupB, groupC]
            group_names = ["Control Group", "Treatment Group 1", "Treatment Group 2"]
        elif input_method == "2":
            if analysis_type == "arpu":
                groups = input_group_data()
                group_names = [f"Group {i}" for i in range(len(groups))]
            else:
                groups = input_conversion_rate_data()
                group_names = [f"Group {i}" for i in range(len(groups))]
            if not groups:
                print("No data entered, program exiting")
                return
        else:
            print("Invalid choice, using sample data")
            if analysis_type == "arpu":
                groupA = (815, [39.99]*50 + [49.99]*20 + [29.99]*3)
                groupB = (1563, [39.99]*80 + [49.99]*40 + [19.99]*6)
                group_names = ["Control Group", "Treatment Group 1"]
            else:
                groupA = (1000, 73)
                groupB = (1000, 126)
                group_names = ["Control Group", "Treatment Group 1"]
            groups = [groupA, groupB]
        
        alpha = args.alpha
    
    # Perform analysis
    group_results, comparison_results = compare_groups(groups, alpha, analysis_type, group_names)
    
    # Print results
    print("\n" + "="*80)
    if analysis_type == "arpu":
        print("Experimental Group Details (ARPU Analysis):")
        print(group_results[['group', 'users', 'conversions', 'total_revenue', 
                             'arpu', 'arpu_ci_lower', 'arpu_ci_upper', 'cvr', 'avg_conversion_value', 'se']])
    else:
        print("Experimental Group Details (Conversion Rate Analysis):")
        print(group_results[['group', 'users', 'conversions', 'conversion_rate', 'rate_ci_lower', 'rate_ci_upper', 'se']])
    
    print("\n" + "="*80)
    print("Group Comparison Results:")
    pd.set_option('display.float_format', '{:.4f}'.format)
    pd.set_option('display.max_columns', None)
    pd.set_option('display.width', None)
    print(comparison_results)
    
    print("\n" + "="*80)
    print("Experiment Conclusions:")
    
    # Find best group
    confidence_level = f"{(1-alpha)*100:.0f}%"
    if analysis_type == "arpu":
        best_metric = 'arpu'
        best_group = group_results.loc[group_results['arpu'].idxmax()]
        print(f"Group with highest ARPU: {best_group['group']} (ARPU = {best_group['arpu']:.4f})")
        print(f"  ARPU {confidence_level} CI: [{best_group['arpu_ci_lower']:.4f}, {best_group['arpu_ci_upper']:.4f}]")
        diff_column = 'ARPU Difference'
    else:
        best_metric = 'conversion_rate'
        best_group = group_results.loc[group_results['conversion_rate'].idxmax()]
        print(f"Group with highest conversion rate: {best_group['group']} (Rate = {best_group['conversion_rate']:.4f})")
        print(f"  Rate {confidence_level} CI: [{best_group['rate_ci_lower']:.4f}, {best_group['rate_ci_upper']:.4f}]")
        diff_column = 'Rate Difference'
    
    # Check if there's a significant winner
    significant_comparisons = comparison_results[comparison_results['Significant']]
    if significant_comparisons.empty:
        print("Conclusion: No statistically significant winner (all group differences are not significant)")
    else:
        winners = set()
        for _, row in significant_comparisons.iterrows():
            if row[diff_column] > 0:
                winners.add(row['Group A'])
            else:
                winners.add(row['Group B'])
        
        if len(winners) == 1:
            winner = next(iter(winners))
            print(f"Conclusion: Statistically significant winner is {winner}")
            
            # Get winner group data
            winner_data = group_results[group_results['group'] == winner].iloc[0]
            if analysis_type == "arpu":
                print(f"Winner details: {winner} - Users={winner_data['users']}, Conversions={winner_data['conversions']}, ARPU={winner_data['arpu']:.4f}")
                print(f"  ARPU {confidence_level} CI: [{winner_data['arpu_ci_lower']:.4f}, {winner_data['arpu_ci_upper']:.4f}]")
            else:
                print(f"Winner details: {winner} - Users={winner_data['users']}, Conversions={winner_data['conversions']}, Rate={winner_data['conversion_rate']:.4f}")
                print(f"  Rate {confidence_level} CI: [{winner_data['rate_ci_lower']:.4f}, {winner_data['rate_ci_upper']:.4f}]")
        else:
            print("Conclusion: Multiple statistically significant winning groups exist")
            print("Significant winning groups:", ", ".join(winners))
    
    # Save results if requested
    if args.output:
        save_results_to_json(group_results, comparison_results, args.output, analysis_type, alpha)
    
    print("="*80)

if __name__ == "__main__":
    main()