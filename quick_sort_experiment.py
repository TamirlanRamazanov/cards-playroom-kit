"""
Practical Assignment 4 - Quick Sort Comparative Experiment
Task 4: Comparative Experiment

This script measures the execution time of Quick Sort, Merge Sort, and Heap Sort
on arrays of different sizes and presents the results in tables and graphs.
"""

import time
import random
import matplotlib.pyplot as plt
import numpy as np
from typing import List, Callable
import statistics

class SortingAlgorithms:
    """Implementation of various sorting algorithms for comparison."""
    
    @staticmethod
    def quick_sort(arr: List[int]) -> List[int]:
        """
        Quick Sort implementation using Lomuto partition scheme.
        Time Complexity: O(n log n) average, O(n²) worst case
        Space Complexity: O(log n) average, O(n) worst case
        """
        if len(arr) <= 1:
            return arr
        
        # Choose pivot (using middle element for better average performance)
        pivot_idx = len(arr) // 2
        pivot = arr[pivot_idx]
        
        # Partition array
        left = [x for x in arr if x < pivot]
        middle = [x for x in arr if x == pivot]
        right = [x for x in arr if x > pivot]
        
        # Recursively sort and combine
        return SortingAlgorithms.quick_sort(left) + middle + SortingAlgorithms.quick_sort(right)
    
    @staticmethod
    def quick_sort_inplace(arr: List[int], low: int = 0, high: int = None) -> None:
        """
        In-place Quick Sort implementation for better space efficiency.
        """
        if high is None:
            high = len(arr) - 1
        
        if low < high:
            # Partition the array
            pivot_idx = SortingAlgorithms._partition(arr, low, high)
            
            # Recursively sort elements before and after partition
            SortingAlgorithms.quick_sort_inplace(arr, low, pivot_idx - 1)
            SortingAlgorithms.quick_sort_inplace(arr, pivot_idx + 1, high)
    
    @staticmethod
    def _partition(arr: List[int], low: int, high: int) -> int:
        """
        Lomuto partition scheme.
        """
        # Choose rightmost element as pivot
        pivot = arr[high]
        
        # Index of smaller element (indicates right position of pivot)
        i = low - 1
        
        for j in range(low, high):
            if arr[j] <= pivot:
                i += 1
                arr[i], arr[j] = arr[j], arr[i]
        
        arr[i + 1], arr[high] = arr[high], arr[i + 1]
        return i + 1
    
    @staticmethod
    def merge_sort(arr: List[int]) -> List[int]:
        """
        Merge Sort implementation.
        Time Complexity: O(n log n) in all cases
        Space Complexity: O(n)
        """
        if len(arr) <= 1:
            return arr
        
        mid = len(arr) // 2
        left = SortingAlgorithms.merge_sort(arr[:mid])
        right = SortingAlgorithms.merge_sort(arr[mid:])
        
        return SortingAlgorithms._merge(left, right)
    
    @staticmethod
    def _merge(left: List[int], right: List[int]) -> List[int]:
        """Helper function for merge sort."""
        result = []
        i = j = 0
        
        while i < len(left) and j < len(right):
            if left[i] <= right[j]:
                result.append(left[i])
                i += 1
            else:
                result.append(right[j])
                j += 1
        
        result.extend(left[i:])
        result.extend(right[j:])
        return result
    
    @staticmethod
    def heap_sort(arr: List[int]) -> List[int]:
        """
        Heap Sort implementation.
        Time Complexity: O(n log n) in all cases
        Space Complexity: O(1) for in-place version
        """
        arr_copy = arr.copy()
        n = len(arr_copy)
        
        # Build max heap
        for i in range(n // 2 - 1, -1, -1):
            SortingAlgorithms._heapify(arr_copy, n, i)
        
        # Extract elements from heap one by one
        for i in range(n - 1, 0, -1):
            arr_copy[0], arr_copy[i] = arr_copy[i], arr_copy[0]
            SortingAlgorithms._heapify(arr_copy, i, 0)
        
        return arr_copy
    
    @staticmethod
    def _heapify(arr: List[int], n: int, i: int) -> None:
        """Helper function for heap sort."""
        largest = i
        left = 2 * i + 1
        right = 2 * i + 2
        
        if left < n and arr[left] > arr[largest]:
            largest = left
        
        if right < n and arr[right] > arr[largest]:
            largest = right
        
        if largest != i:
            arr[i], arr[largest] = arr[largest], arr[i]
            SortingAlgorithms._heapify(arr, n, largest)


class PerformanceTester:
    """Class to test and compare sorting algorithm performance."""
    
    def __init__(self):
        self.algorithms = {
            'Quick Sort': SortingAlgorithms.quick_sort,
            'Merge Sort': SortingAlgorithms.merge_sort,
            'Heap Sort': SortingAlgorithms.heap_sort
        }
        self.array_sizes = [1000, 5000, 10000]
        self.results = {}
    
    def generate_test_array(self, size: int, array_type: str = 'random') -> List[int]:
        """
        Generate test arrays of different types.
        
        Args:
            size: Size of the array
            array_type: Type of array ('random', 'sorted', 'reverse_sorted', 'nearly_sorted')
        """
        if array_type == 'random':
            return [random.randint(1, 1000) for _ in range(size)]
        elif array_type == 'sorted':
            return list(range(1, size + 1))
        elif array_type == 'reverse_sorted':
            return list(range(size, 0, -1))
        elif array_type == 'nearly_sorted':
            arr = list(range(1, size + 1))
            # Randomly swap 10% of elements
            for _ in range(size // 10):
                i, j = random.randint(0, size-1), random.randint(0, size-1)
                arr[i], arr[j] = arr[j], arr[i]
            return arr
        else:
            raise ValueError(f"Unknown array type: {array_type}")
    
    def measure_execution_time(self, algorithm: Callable, arr: List[int], runs: int = 5) -> float:
        """
        Measure average execution time of an algorithm over multiple runs.
        
        Args:
            algorithm: The sorting algorithm function
            arr: Input array
            runs: Number of runs for averaging
        
        Returns:
            Average execution time in seconds
        """
        times = []
        
        for _ in range(runs):
            test_arr = arr.copy()
            start_time = time.perf_counter()
            algorithm(test_arr)
            end_time = time.perf_counter()
            times.append(end_time - start_time)
        
        return statistics.mean(times)
    
    def run_experiment(self, array_type: str = 'random'):
        """
        Run the comparative experiment for all algorithms and array sizes.
        
        Args:
            array_type: Type of test arrays to use
        """
        print(f"\n{'='*60}")
        print(f"PERFORMANCE COMPARISON - {array_type.upper()} ARRAYS")
        print(f"{'='*60}")
        
        results = {}
        
        for size in self.array_sizes:
            print(f"\nTesting with array size: {size}")
            print("-" * 40)
            
            # Generate test array
            test_array = self.generate_test_array(size, array_type)
            
            size_results = {}
            
            for name, algorithm in self.algorithms.items():
                print(f"Running {name}...", end=" ")
                
                try:
                    execution_time = self.measure_execution_time(algorithm, test_array)
                    size_results[name] = execution_time
                    print(f"{execution_time:.6f} seconds")
                except Exception as e:
                    print(f"Error: {e}")
                    size_results[name] = None
            
            results[size] = size_results
        
        self.results[array_type] = results
        return results
    
    def print_results_table(self, array_type: str = 'random'):
        """Print results in a formatted table."""
        if array_type not in self.results:
            print(f"No results found for {array_type}")
            return
        
        results = self.results[array_type]
        
        print(f"\n{'='*80}")
        print(f"RESULTS TABLE - {array_type.upper()} ARRAYS")
        print(f"{'='*80}")
        print(f"{'Array Size':<12} {'Quick Sort':<15} {'Merge Sort':<15} {'Heap Sort':<15}")
        print("-" * 80)
        
        for size in self.array_sizes:
            if size in results:
                quick_time = results[size].get('Quick Sort', 'N/A')
                merge_time = results[size].get('Merge Sort', 'N/A')
                heap_time = results[size].get('Heap Sort', 'N/A')
                
                quick_str = f"{quick_time:.6f}s" if quick_time is not None else "N/A"
                merge_str = f"{merge_time:.6f}s" if merge_time is not None else "N/A"
                heap_str = f"{heap_time:.6f}s" if heap_time is not None else "N/A"
                
                print(f"{size:<12} {quick_str:<15} {merge_str:<15} {heap_str:<15}")
    
    def plot_results(self, array_type: str = 'random'):
        """Create a graph showing execution time vs array size."""
        if array_type not in self.results:
            print(f"No results found for {array_type}")
            return
        
        results = self.results[array_type]
        
        # Prepare data for plotting
        sizes = []
        quick_times = []
        merge_times = []
        heap_times = []
        
        for size in self.array_sizes:
            if size in results:
                sizes.append(size)
                quick_times.append(results[size].get('Quick Sort', 0))
                merge_times.append(results[size].get('Merge Sort', 0))
                heap_times.append(results[size].get('Heap Sort', 0))
        
        # Create the plot
        plt.figure(figsize=(12, 8))
        plt.plot(sizes, quick_times, 'o-', label='Quick Sort', linewidth=2, markersize=8)
        plt.plot(sizes, merge_times, 's-', label='Merge Sort', linewidth=2, markersize=8)
        plt.plot(sizes, heap_times, '^-', label='Heap Sort', linewidth=2, markersize=8)
        
        plt.xlabel('Array Size', fontsize=12)
        plt.ylabel('Execution Time (seconds)', fontsize=12)
        plt.title(f'Sorting Algorithm Performance Comparison\n({array_type.title()} Arrays)', fontsize=14)
        plt.legend(fontsize=11)
        plt.grid(True, alpha=0.3)
        plt.yscale('log')  # Log scale for better visualization
        
        # Add value annotations
        for i, size in enumerate(sizes):
            plt.annotate(f'{quick_times[i]:.4f}s', (size, quick_times[i]), 
                        textcoords="offset points", xytext=(0,10), ha='center', fontsize=9)
            plt.annotate(f'{merge_times[i]:.4f}s', (size, merge_times[i]), 
                        textcoords="offset points", xytext=(0,10), ha='center', fontsize=9)
            plt.annotate(f'{heap_times[i]:.4f}s', (size, heap_times[i]), 
                        textcoords="offset points", xytext=(0,10), ha='center', fontsize=9)
        
        plt.tight_layout()
        plt.savefig(f'sorting_performance_{array_type}.png', dpi=300, bbox_inches='tight')
        plt.show()
    
    def analyze_results(self, array_type: str = 'random'):
        """Analyze and draw conclusions from the results."""
        if array_type not in self.results:
            print(f"No results found for {array_type}")
            return
        
        results = self.results[array_type]
        
        print(f"\n{'='*60}")
        print(f"ANALYSIS - {array_type.upper()} ARRAYS")
        print(f"{'='*60}")
        
        for size in self.array_sizes:
            if size in results:
                print(f"\nArray Size: {size}")
                print("-" * 30)
                
                # Find fastest algorithm
                times = {k: v for k, v in results[size].items() if v is not None}
                if times:
                    fastest = min(times, key=times.get)
                    slowest = max(times, key=times.get)
                    
                    print(f"Fastest: {fastest} ({times[fastest]:.6f}s)")
                    print(f"Slowest: {slowest} ({times[slowest]:.6f}s)")
                    
                    # Calculate speedup
                    speedup = times[slowest] / times[fastest]
                    print(f"Speedup: {speedup:.2f}x")
        
        # Overall conclusions
        print(f"\n{'='*60}")
        print("OVERALL CONCLUSIONS")
        print(f"{'='*60}")
        
        if array_type == 'random':
            print("For random arrays:")
            print("- Quick Sort typically performs well due to good average-case behavior")
            print("- Merge Sort provides consistent O(n log n) performance")
            print("- Heap Sort has consistent performance but may be slower due to cache effects")
        elif array_type == 'sorted':
            print("For already sorted arrays:")
            print("- Quick Sort with naive pivot selection can degrade to O(n²)")
            print("- Merge Sort maintains O(n log n) but with overhead")
            print("- Heap Sort maintains O(n log n) performance")
        elif array_type == 'reverse_sorted':
            print("For reverse sorted arrays:")
            print("- Quick Sort with naive pivot selection performs poorly")
            print("- Merge Sort and Heap Sort maintain good performance")
        elif array_type == 'nearly_sorted':
            print("For nearly sorted arrays:")
            print("- Quick Sort may still perform well depending on pivot choice")
            print("- Merge Sort can be optimized for nearly sorted data")
            print("- Heap Sort maintains consistent performance")


def main():
    """Main function to run the complete experiment."""
    print("Quick Sort Comparative Experiment")
    print("=" * 50)
    
    # Initialize the performance tester
    tester = PerformanceTester()
    
    # Test different array types
    array_types = ['random', 'sorted', 'reverse_sorted', 'nearly_sorted']
    
    for array_type in array_types:
        # Run experiment
        tester.run_experiment(array_type)
        
        # Print results table
        tester.print_results_table(array_type)
        
        # Create performance graph
        tester.plot_results(array_type)
        
        # Analyze results
        tester.analyze_results(array_type)
    
    print(f"\n{'='*60}")
    print("EXPERIMENT COMPLETED")
    print(f"{'='*60}")
    print("Graphs have been saved as PNG files.")
    print("Check the generated images for visual performance comparison.")


if __name__ == "__main__":
    main()


