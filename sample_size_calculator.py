#!/usr/bin/env python3
"""
Sample Size Calculator for A/B Testing
Calculates required sample sizes for conversion rate and ARPU tests
"""

import numpy as np
from scipy.stats import norm, t
import json
from pathlib import Path
import argparse

class SampleSizeCalculator:
    def __init__(self, confidence_level: float = 0.95, power: float = 0.80):
        """
        Initialize the sample size calculator
        
        Args:
            confidence_level (float): Confidence level (e.g., 0.95 for 95%)
            power (float): Statistical power (e.g., 0.80 for 80%)
        """
        self.confidence_level = confidence_level
        self.power = power
        self.alpha = 1 - confidence_level
        self.beta = 1 - power
        
        # Critical values
        self.z_alpha = norm.ppf(1 - self.alpha / 2)  # Two-tailed test
        self.z_beta = norm.ppf(1 - self.beta)
        self.z_alpha_plus_beta = self.z_alpha + self.z_beta
    
    def calculate_conversion_rate_sample_size(self, 
                                            control_rate: float,
                                            lift_percentage: float,
                                            allocation_ratio: float = 0.5) -> dict:
        """
        Calculate sample size needed for conversion rate A/B test
        
        Args:
            control_rate (float): Baseline conversion rate (e.g., 0.02 for 2%)
            lift_percentage (float): Expected lift as percentage (e.g., 0.20 for 20%)
            allocation_ratio (float): Ratio of users in treatment group (default 0.5 for 50/50)
            
        Returns:
            dict: Sample size results
        """
        if not (0 < control_rate < 1):
            raise ValueError("Control rate must be between 0 and 1")
        
        if lift_percentage <= 0:
            raise ValueError("Lift percentage must be positive")
        
        if not (0 < allocation_ratio < 1):
            raise ValueError("Allocation ratio must be between 0 and 1")
        
        # Calculate treatment rate
        treatment_rate = control_rate * (1 + lift_percentage)
        
        # Pooled standard error
        pooled_rate = (control_rate + treatment_rate) / 2
        pooled_variance = pooled_rate * (1 - pooled_rate)
        
        # Sample size formula for two-proportion z-test
        numerator = (self.z_alpha_plus_beta ** 2) * pooled_variance * (1 + 1/allocation_ratio)
        denominator = (treatment_rate - control_rate) ** 2
        
        total_sample_size = int(np.ceil(numerator / denominator))
        
        # Calculate group sizes
        control_size = int(total_sample_size * (1 - allocation_ratio))
        treatment_size = total_sample_size - control_size
        
        # Calculate expected conversions
        expected_control_conversions = int(control_size * control_rate)
        expected_treatment_conversions = int(treatment_size * treatment_rate)
        
        return {
            'test_type': 'conversion_rate',
            'control_rate': control_rate,
            'treatment_rate': treatment_rate,
            'lift_percentage': lift_percentage,
            'confidence_level': self.confidence_level,
            'power': self.power,
            'allocation_ratio': allocation_ratio,
            'total_sample_size': total_sample_size,
            'control_size': control_size,
            'treatment_size': treatment_size,
            'expected_control_conversions': expected_control_conversions,
            'expected_treatment_conversions': expected_treatment_conversions,
            'minimum_detectable_effect': treatment_rate - control_rate
        }
    
    def calculate_arpu_sample_size(self,
                                 control_arpu: float,
                                 lift_percentage: float,
                                 price: float,
                                 allocation_ratio: float = 0.5) -> dict:
        """
        Calculate sample size needed for ARPU A/B test
        
        Args:
            control_arpu (float): Baseline ARPU (e.g., 0.20 for $0.20)
            lift_percentage (float): Expected lift as percentage (e.g., 0.20 for 20%)
            price (float): Price per conversion
            allocation_ratio (float): Ratio of users in treatment group
            
        Returns:
            dict: Sample size results
        """
        if control_arpu <= 0:
            raise ValueError("Control ARPU must be positive")
        
        if lift_percentage <= 0:
            raise ValueError("Lift percentage must be positive")
        
        if price <= 0:
            raise ValueError("Price must be positive")
        
        if not (0 < allocation_ratio < 1):
            raise ValueError("Allocation ratio must be between 0 and 1")
        
        # Calculate treatment ARPU
        treatment_arpu = control_arpu * (1 + lift_percentage)
        
        # Calculate conversion rates
        control_conversion_rate = control_arpu / price
        treatment_conversion_rate = treatment_arpu / price
        
        # Use conversion rate sample size calculation
        conversion_results = self.calculate_conversion_rate_sample_size(
            control_conversion_rate, lift_percentage, allocation_ratio
        )
        
        # Update results for ARPU context
        conversion_results['test_type'] = 'arpu'
        conversion_results['control_arpu'] = control_arpu
        conversion_results['treatment_arpu'] = treatment_arpu
        conversion_results['price'] = price
        conversion_results['control_conversion_rate'] = control_conversion_rate
        conversion_results['treatment_conversion_rate'] = treatment_conversion_rate
        
        return conversion_results
    
    def calculate_power_analysis(self, 
                               test_type: str,
                               control_value: float,
                               lift_percentage: float,
                               sample_size: int,
                               allocation_ratio: float = 0.5,
                               price: float = None) -> dict:
        """
        Calculate statistical power for given sample size
        
        Args:
            test_type (str): 'conversion_rate' or 'arpu'
            control_value (float): Control conversion rate or ARPU
            lift_percentage (float): Expected lift
            sample_size (int): Total sample size
            allocation_ratio (float): Allocation ratio
            price (float): Price (required for ARPU tests)
            
        Returns:
            dict: Power analysis results
        """
        if test_type == 'conversion_rate':
            control_rate = control_value
            treatment_rate = control_rate * (1 + lift_percentage)
            
            # Pooled standard error
            pooled_rate = (control_rate + treatment_rate) / 2
            pooled_variance = pooled_rate * (1 - pooled_rate)
            
            # Calculate effect size
            effect_size = treatment_rate - control_rate
            
            # Calculate standard error
            n1 = int(sample_size * (1 - allocation_ratio))
            n2 = sample_size - n1
            se = np.sqrt(pooled_variance * (1/n1 + 1/n2))
            
            # Calculate z-score for power
            z_power = (effect_size / se) - self.z_alpha
            
            # Calculate power
            power = norm.cdf(z_power)
            
            return {
                'test_type': 'conversion_rate',
                'control_rate': control_rate,
                'treatment_rate': treatment_rate,
                'lift_percentage': lift_percentage,
                'sample_size': sample_size,
                'power': power,
                'effect_size': effect_size,
                'standard_error': se
            }
            
        elif test_type == 'arpu':
            if price is None:
                raise ValueError("Price is required for ARPU power analysis")
            
            control_arpu = control_value
            treatment_arpu = control_arpu * (1 + lift_percentage)
            
            # Convert to conversion rates
            control_rate = control_arpu / price
            treatment_rate = treatment_arpu / price
            
            # Use conversion rate power analysis
            conversion_results = self.calculate_power_analysis(
                'conversion_rate', control_rate, lift_percentage, 
                sample_size, allocation_ratio
            )
            
            # Update for ARPU context
            conversion_results['test_type'] = 'arpu'
            conversion_results['control_arpu'] = control_arpu
            conversion_results['treatment_arpu'] = treatment_arpu
            conversion_results['price'] = price
            
            return conversion_results
    
    def create_sample_size_table(self, 
                                test_type: str,
                                control_value: float,
                                lifts: list,
                                allocation_ratio: float = 0.5,
                                price: float = None) -> dict:
        """
        Create a table of sample sizes for different lift percentages
        
        Args:
            test_type (str): 'conversion_rate' or 'arpu'
            control_value (float): Control value
            lifts (list): List of lift percentages to test
            allocation_ratio (float): Allocation ratio
            price (float): Price (for ARPU tests)
            
        Returns:
            dict: Table of results
        """
        results = []
        
        for lift in lifts:
            if test_type == 'conversion_rate':
                result = self.calculate_conversion_rate_sample_size(
                    control_value, lift, allocation_ratio
                )
            else:  # arpu
                result = self.calculate_arpu_sample_size(
                    control_value, lift, price, allocation_ratio
                )
            
            results.append(result)
        
        return {
            'test_type': test_type,
            'control_value': control_value,
            'lifts': lifts,
            'confidence_level': self.confidence_level,
            'power': self.power,
            'allocation_ratio': allocation_ratio,
            'price': price,
            'results': results
        }
    
    def save_results(self, results: dict, output_file: str):
        """Save results to JSON file"""
        with open(output_file, 'w') as f:
            json.dump(results, f, indent=2, default=str)
        print(f"Results saved to: {output_file}")
    
    def print_results(self, results: dict):
        """Print results in a formatted way"""
        if 'results' in results:  # Table results
            self._print_table_results(results)
        elif 'test_type' in results and results['test_type'] == 'conversion_rate':
            self._print_conversion_rate_results(results)
        elif 'test_type' in results and results['test_type'] == 'arpu':
            self._print_arpu_results(results)
        else:
            self._print_power_results(results)
    
    def _print_conversion_rate_results(self, results: dict):
        """Print conversion rate sample size results"""
        print(f"\nConversion Rate Sample Size Calculator")
        print(f"=" * 50)
        print(f"Control Rate: {results['control_rate']:.3f} ({results['control_rate']*100:.1f}%)")
        print(f"Treatment Rate: {results['treatment_rate']:.3f} ({results['treatment_rate']*100:.1f}%)")
        print(f"Lift: {results['lift_percentage']*100:.1f}%")
        print(f"Confidence Level: {results['confidence_level']*100:.0f}%")
        print(f"Power: {results['power']*100:.0f}%")
        print(f"Allocation Ratio: {results['allocation_ratio']:.1f}")
        print(f"\nRequired Sample Sizes:")
        print(f"  Total: {results['total_sample_size']:,}")
        print(f"  Control: {results['control_size']:,}")
        print(f"  Treatment: {results['treatment_size']:,}")
        print(f"\nExpected Conversions:")
        print(f"  Control: {results['expected_control_conversions']}")
        print(f"  Treatment: {results['expected_treatment_conversions']}")
        print(f"\nMinimum Detectable Effect: {results['minimum_detectable_effect']:.4f}")
    
    def _print_arpu_results(self, results: dict):
        """Print ARPU sample size results"""
        print(f"\nARPU Sample Size Calculator")
        print(f"=" * 50)
        print(f"Control ARPU: ${results['control_arpu']:.2f}")
        print(f"Treatment ARPU: ${results['treatment_arpu']:.2f}")
        print(f"Price: ${results['price']:.2f}")
        print(f"Lift: {results['lift_percentage']*100:.1f}%")
        print(f"Confidence Level: {results['confidence_level']*100:.0f}%")
        print(f"Power: {results['power']*100:.0f}%")
        print(f"Allocation Ratio: {results['allocation_ratio']:.1f}")
        print(f"\nConversion Rates:")
        print(f"  Control: {results['control_conversion_rate']:.3f} ({results['control_conversion_rate']*100:.1f}%)")
        print(f"  Treatment: {results['treatment_conversion_rate']:.3f} ({results['treatment_conversion_rate']*100:.1f}%)")
        print(f"\nRequired Sample Sizes:")
        print(f"  Total: {results['total_sample_size']:,}")
        print(f"  Control: {results['control_size']:,}")
        print(f"  Treatment: {results['treatment_size']:,}")
        print(f"\nExpected Conversions:")
        print(f"  Control: {results['expected_control_conversions']}")
        print(f"  Treatment: {results['expected_treatment_conversions']}")
        print(f"\nMinimum Detectable Effect: ${results['minimum_detectable_effect']:.3f}")
    
    def _print_table_results(self, results: dict):
        """Print table results"""
        test_type = results['test_type']
        print(f"\n{test_type.upper()} Sample Size Table")
        print(f"=" * 60)
        
        if test_type == 'conversion_rate':
            print(f"Control Rate: {results['control_value']:.3f} ({results['control_value']*100:.1f}%)")
            print(f"Confidence Level: {results['confidence_level']*100:.0f}% | Power: {results['power']*100:.0f}%")
            print(f"\n{'Lift %':<10} {'Treatment Rate':<15} {'Total Sample':<15} {'Control':<12} {'Treatment':<12}")
            print("-" * 70)
            
            for result in results['results']:
                lift_pct = result['lift_percentage'] * 100
                treatment_rate = result['treatment_rate']
                total = result['total_sample_size']
                control = result['control_size']
                treatment = result['treatment_size']
                
                print(f"{lift_pct:>6.1f}%{'':<3} {treatment_rate:<15.3f} {total:<15,} {control:<12,} {treatment:<12,}")
        
        else:  # arpu
            print(f"Control ARPU: ${results['control_value']:.2f} | Price: ${results['price']:.2f}")
            print(f"Confidence Level: {results['confidence_level']*100:.0f}% | Power: {results['power']*100:.0f}%")
            print(f"\n{'Lift %':<10} {'Treatment ARPU':<15} {'Total Sample':<15} {'Control':<12} {'Treatment':<12}")
            print("-" * 70)
            
            for result in results['results']:
                lift_pct = result['lift_percentage'] * 100
                treatment_arpu = result['treatment_arpu']
                total = result['total_sample_size']
                control = result['control_size']
                treatment = result['treatment_size']
                
                print(f"{lift_pct:>6.1f}%{'':<3} ${treatment_arpu:<14.2f} {total:<15,} {control:<12,} {treatment:<12,}")
    
    def _print_power_results(self, results: dict):
        """Print power analysis results"""
        test_type = results['test_type']
        print(f"\n{test_type.upper()} Power Analysis")
        print(f"=" * 40)
        
        if test_type == 'conversion_rate':
            print(f"Control Rate: {results['control_rate']:.3f}")
            print(f"Treatment Rate: {results['treatment_rate']:.3f}")
        else:
            print(f"Control ARPU: ${results['control_arpu']:.2f}")
            print(f"Treatment ARPU: ${results['treatment_arpu']:.2f}")
            print(f"Price: ${results['price']:.2f}")
        
        print(f"Lift: {results['lift_percentage']*100:.1f}%")
        print(f"Sample Size: {results['sample_size']:,}")
        print(f"Power: {results['power']*100:.1f}%")
        print(f"Effect Size: {results['effect_size']:.4f}")
        print(f"Standard Error: {results['standard_error']:.4f}")


def main():
    """Main function with CLI interface"""
    parser = argparse.ArgumentParser(
        description="Sample Size Calculator for A/B Testing",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Conversion rate sample size
  python sample_size_calculator.py --type conversion_rate --control 0.02 --lift 0.20
  
  # ARPU sample size
  python sample_size_calculator.py --type arpu --control 0.20 --lift 0.20 --price 9.99
  
  # Create sample size table
  python sample_size_calculator.py --type conversion_rate --control 0.02 --table --lifts 0.10 0.20 0.30
  
  # Power analysis
  python sample_size_calculator.py --type conversion_rate --control 0.02 --lift 0.20 --power-analysis --sample-size 10000
        """
    )
    
    parser.add_argument('--type', choices=['conversion_rate', 'arpu'], required=True,
                       help='Type of test')
    parser.add_argument('--control', type=float, required=True,
                       help='Control conversion rate or ARPU')
    parser.add_argument('--lift', type=float,
                       help='Expected lift as decimal (e.g., 0.20 for 20%)')
    parser.add_argument('--price', type=float,
                       help='Price per conversion (required for ARPU tests)')
    parser.add_argument('--confidence', type=float, default=0.95,
                       help='Confidence level (default: 0.95)')
    parser.add_argument('--power', type=float, default=0.80,
                       help='Statistical power (default: 0.80)')
    parser.add_argument('--allocation', type=float, default=0.5,
                       help='Allocation ratio for treatment group (default: 0.5)')
    parser.add_argument('--table', action='store_true',
                       help='Create sample size table for multiple lifts')
    parser.add_argument('--lifts', nargs='+', type=float,
                       help='List of lifts for table (e.g., 0.10 0.20 0.30)')
    parser.add_argument('--power-analysis', action='store_true',
                       help='Perform power analysis instead of sample size calculation')
    parser.add_argument('--sample-size', type=int,
                       help='Sample size for power analysis')
    parser.add_argument('--save', type=str,
                       help='Save results to JSON file')
    
    args = parser.parse_args()
    
    # Validate arguments
    if args.type == 'arpu' and args.price is None:
        parser.error("--price is required for ARPU tests")
    
    if args.table and not args.lifts:
        parser.error("--lifts is required when using --table")
    
    if args.power_analysis and not args.sample_size:
        parser.error("--sample-size is required for power analysis")
    
    # Initialize calculator
    calculator = SampleSizeCalculator(
        confidence_level=args.confidence,
        power=args.power
    )
    
    # Perform calculation
    if args.power_analysis:
        results = calculator.calculate_power_analysis(
            args.type, args.control, args.lift, args.sample_size,
            args.allocation, args.price
        )
    elif args.table:
        results = calculator.create_sample_size_table(
            args.type, args.control, args.lifts, args.allocation, args.price
        )
    else:
        if args.type == 'conversion_rate':
            results = calculator.calculate_conversion_rate_sample_size(
                args.control, args.lift, args.allocation
            )
        else:  # arpu
            results = calculator.calculate_arpu_sample_size(
                args.control, args.lift, args.price, args.allocation
            )
    
    # Print results
    calculator.print_results(results)
    
    # Save results if requested
    if args.save:
        calculator.save_results(results, args.save)


if __name__ == "__main__":
    main() 