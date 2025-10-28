"""
Practical Assignment 4: Quick Sort Analysis
==========================================

This file contains a comprehensive analysis of the Quick Sort algorithm including:
- Theory and pseudocode
- Complexity analysis
- Visualization examples
- Comparative performance experiments
"""

import random
import time
import matplotlib.pyplot as plt
import numpy as np
from typing import List, Tuple
import copy

# =============================================================================
# TASK 1: THEORY
# =============================================================================

"""
QUICK SORT ALGORITHM DEFINITION:
===============================

Quick Sort is a highly efficient, comparison-based sorting algorithm that uses 
the divide-and-conquer paradigm. It works by selecting a 'pivot' element from 
the array and partitioning the other elements into two sub-arrays, according to 
whether they are less than or greater than the pivot.

MAIN STEPS:
===========

1. CHOOSING THE PIVOT ELEMENT:
   - The pivot can be chosen in various ways:
     * First element
     * Last element  
     * Middle element
     * Random element
     * Median of three elements

2. PARTITIONING THE ARRAY:
   - Rearrange the array so that all elements smaller than the pivot come before it
   - All elements greater than the pivot come after it
   - The pivot is now in its correct position

3. RECURSIVE SORTING:
   - Recursively apply the same process to the sub-array of elements smaller than the pivot
   - Recursively apply the same process to the sub-array of elements greater than the pivot

PSEUDOCODE:
===========

QUICKSORT(A, low, high):
    if low < high:
        pivot_index = PARTITION(A, low, high)
        QUICKSORT(A, low, pivot_index - 1)
        QUICKSORT(A, pivot_index + 1, high)

PARTITION(A, low, high):
    pivot = A[high]  // Choose last element as pivot
    i = low - 1      // Index of smaller element
    
    for j = low to high - 1:
        if A[j] <= pivot:
            i = i + 1
            swap A[i] and A[j]
    
    swap A[i + 1] and A[high]
    return i + 1
"""

# =============================================================================
# TASK 2: COMPLEXITY ANALYSIS
# =============================================================================

"""
TIME COMPLEXITY ANALYSIS:
========================

BEST CASE: O(n log n)
- Occurs when the pivot always divides the array into two equal halves
- Each level of recursion processes n elements, and there are log n levels
- Example: When pivot is always the median

AVERAGE CASE: O(n log n)
- Occurs with random data and good pivot selection
- On average, the pivot divides the array reasonably well
- The constant factors are typically smaller than Merge Sort

WORST CASE: O(n²)
- Occurs when the pivot is always the smallest or largest element
- Results in highly unbalanced partitions (n-1 and 0 elements)
- Example: Already sorted array with first/last element as pivot

SPACE COMPLEXITY: O(log n) average, O(n) worst case
- Due to recursion stack depth

COMPARISON WITH OTHER SORTING ALGORITHMS:
=========================================

Quick Sort vs Merge Sort:
- Quick Sort: O(n log n) average, O(n²) worst, O(log n) space
- Merge Sort: O(n log n) guaranteed, O(n) space
- Quick Sort is typically faster in practice due to better cache performance

Quick Sort vs Heap Sort:
- Quick Sort: O(n log n) average, O(n²) worst, O(log n) space
- Heap Sort: O(n log n) guaranteed, O(1) space
- Quick Sort is usually faster due to better constant factors

PIVOT SELECTION IMPACT:
======================

1. First/Last Element: O(n²) worst case for sorted/reverse sorted arrays
2. Random Element: O(n log n) average case, reduces worst case probability
3. Median of Three: O(n log n) average, better worst case than first/last
4. Median of Medians: O(n log n) guaranteed, but with higher constant factors
"""

# =============================================================================
# IMPLEMENTATION
# =============================================================================

class QuickSortAnalyzer:
    def __init__(self):
        self.comparisons = 0
        self.swaps = 0
    
    def reset_counters(self):
        """Reset comparison and swap counters"""
        self.comparisons = 0
        self.swaps = 0
    
    def quicksort(self, arr: List[int], low: int, high: int, pivot_strategy: str = 'last') -> None:
        """
        Quick Sort implementation with different pivot strategies
        
        Args:
            arr: Array to sort
            low: Starting index
            high: Ending index
            pivot_strategy: 'first', 'last', 'middle', 'random', 'median3'
        """
        if low < high:
            pivot_index = self._partition(arr, low, high, pivot_strategy)
            self.quicksort(arr, low, pivot_index - 1, pivot_strategy)
            self.quicksort(arr, pivot_index + 1, high, pivot_strategy)
    
    def _partition(self, arr: List[int], low: int, high: int, pivot_strategy: str) -> int:
        """Partition the array around a pivot element"""
        # Choose pivot based on strategy
        if pivot_strategy == 'first':
            pivot_index = low
        elif pivot_strategy == 'last':
            pivot_index = high
        elif pivot_strategy == 'middle':
            pivot_index = (low + high) // 2
        elif pivot_strategy == 'random':
            pivot_index = random.randint(low, high)
        elif pivot_strategy == 'median3':
            pivot_index = self._median_of_three(arr, low, high)
        
        # Move pivot to end
        if pivot_index != high:
            arr[pivot_index], arr[high] = arr[high], arr[pivot_index]
            self.swaps += 1
        
        pivot = arr[high]
        i = low - 1
        
        for j in range(low, high):
            self.comparisons += 1
            if arr[j] <= pivot:
                i += 1
                if i != j:
                    arr[i], arr[j] = arr[j], arr[i]
                    self.swaps += 1
        
        # Place pivot in correct position
        arr[i + 1], arr[high] = arr[high], arr[i + 1]
        self.swaps += 1
        
        return i + 1
    
    def _median_of_three(self, arr: List[int], low: int, high: int) -> int:
        """Find median of first, middle, and last elements"""
        mid = (low + high) // 2
        a, b, c = arr[low], arr[mid], arr[high]
        
        if (a <= b <= c) or (c <= b <= a):
            return mid
        elif (b <= a <= c) or (c <= a <= b):
            return low
        else:
            return high

# =============================================================================
# TASK 3: VISUALIZATION
# =============================================================================

def create_recursion_tree_example():
    """
    Create a visual representation of the recursion tree for Quick Sort
    """
    print("RECURSION TREE EXAMPLE")
    print("=====================")
    print("Array: [3, 1, 4, 1, 5, 9, 2, 6]")
    print()
    print("Recursion Tree:")
    print("Level 0: [3,1,4,1,5,9,2,6] (pivot=6)")
    print("├─ Level 1: [3,1,4,1,5,2] (pivot=2)")
    print("│  ├─ Level 2: [1,1] (pivot=1)")
    print("│  │  ├─ Level 3: [] (left)")
    print("│  │  └─ Level 3: [1] (right)")
    print("│  └─ Level 2: [3,4,5] (pivot=5)")
    print("│     ├─ Level 3: [3,4] (pivot=4)")
    print("│     │  ├─ Level 4: [3] (left)")
    print("│     │  └─ Level 4: [] (right)")
    print("│     └─ Level 3: [] (right)")
    print("└─ Level 1: [9] (pivot=9)")
    print("   └─ Level 2: [] (left)")
    print()

def demonstrate_partitioning():
    """
    Demonstrate the partitioning process step by step
    """
    print("PARTITIONING PROCESS DEMONSTRATION")
    print("==================================")
    print("Array: [3, 1, 4, 1, 5, 9, 2, 6]")
    print("Pivot: 6 (last element)")
    print()
    
    arr = [3, 1, 4, 1, 5, 9, 2, 6]
    pivot = 6
    print("Step 1: Initialize")
    print(f"Array: {arr}")
    print(f"Pivot: {pivot}")
    print("i = -1, j = 0")
    print()
    
    # Simulate partitioning
    i = -1
    for j in range(len(arr) - 1):
        print(f"Step {j + 2}: j = {j}, arr[j] = {arr[j]}")
        if arr[j] <= pivot:
            i += 1
            if i != j:
                arr[i], arr[j] = arr[j], arr[i]
                print(f"Swap arr[{i}] and arr[{j}]: {arr}")
            else:
                print(f"No swap needed")
        else:
            print(f"arr[{j}] > pivot, no action")
        print(f"i = {i}, j = {j}")
        print()
    
    # Final swap
    arr[i + 1], arr[-1] = arr[-1], arr[i + 1]
    print(f"Final step: Swap pivot to position {i + 1}")
    print(f"Result: {arr}")
    print(f"Pivot position: {i + 1}")
    print()

# =============================================================================
# TASK 4: COMPARATIVE EXPERIMENT
# =============================================================================

def merge_sort(arr: List[int]) -> List[int]:
    """Merge Sort implementation for comparison"""
    if len(arr) <= 1:
        return arr
    
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    
    return merge(left, right)

def merge(left: List[int], right: List[int]) -> List[int]:
    """Merge two sorted arrays"""
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

def heap_sort(arr: List[int]) -> List[int]:
    """Heap Sort implementation for comparison"""
    def heapify(arr, n, i):
        largest = i
        left = 2 * i + 1
        right = 2 * i + 2
        
        if left < n and arr[left] > arr[largest]:
            largest = left
        
        if right < n and arr[right] > arr[largest]:
            largest = right
        
        if largest != i:
            arr[i], arr[largest] = arr[largest], arr[i]
            heapify(arr, n, largest)
    
    n = len(arr)
    
    # Build max heap
    for i in range(n // 2 - 1, -1, -1):
        heapify(arr, n, i)
    
    # Extract elements
    for i in range(n - 1, 0, -1):
        arr[0], arr[i] = arr[i], arr[0]
        heapify(arr, i, 0)
    
    return arr

def measure_sorting_performance():
    """
    Measure and compare performance of Quick Sort, Merge Sort, and Heap Sort
    """
    print("COMPARATIVE PERFORMANCE EXPERIMENT")
    print("==================================")
    
    # Test different array sizes
    sizes = [1000, 5000, 10000]
    results = {
        'Quick Sort': [],
        'Merge Sort': [],
        'Heap Sort': []
    }
    
    # Test different data patterns
    data_patterns = {
        'Random': lambda n: [random.randint(1, 1000) for _ in range(n)],
        'Sorted': lambda n: list(range(1, n + 1)),
        'Reverse Sorted': lambda n: list(range(n, 0, -1)),
        'Nearly Sorted': lambda n: list(range(1, n + 1)) + [random.randint(1, 1000) for _ in range(n // 10)]
    }
    
    analyzer = QuickSortAnalyzer()
    
    for pattern_name, pattern_func in data_patterns.items():
        print(f"\n{pattern_name} Data:")
        print("-" * 20)
        
        for size in sizes:
            print(f"\nArray size: {size}")
            
            # Generate test data
            test_data = pattern_func(size)
            
            # Quick Sort
            analyzer.reset_counters()
            quick_data = copy.deepcopy(test_data)
            start_time = time.time()
            analyzer.quicksort(quick_data, 0, len(quick_data) - 1, 'random')
            quick_time = time.time() - start_time
            results['Quick Sort'].append(quick_time)
            
            # Merge Sort
            merge_data = copy.deepcopy(test_data)
            start_time = time.time()
            merge_sort(merge_data)
            merge_time = time.time() - start_time
            results['Merge Sort'].append(merge_time)
            
            # Heap Sort
            heap_data = copy.deepcopy(test_data)
            start_time = time.time()
            heap_sort(heap_data)
            heap_time = time.time() - start_time
            results['Heap Sort'].append(heap_time)
            
            print(f"Quick Sort: {quick_time:.6f}s")
            print(f"Merge Sort: {merge_time:.6f}s")
            print(f"Heap Sort:  {heap_time:.6f}s")
    
    # Create performance comparison table
    print("\n" + "="*60)
    print("PERFORMANCE COMPARISON TABLE")
    print("="*60)
    
    for pattern_name in data_patterns.keys():
        print(f"\n{pattern_name} Data:")
        print(f"{'Size':<8} {'Quick Sort':<12} {'Merge Sort':<12} {'Heap Sort':<12}")
        print("-" * 50)
        
        for i, size in enumerate(sizes):
            quick_time = results['Quick Sort'][i]
            merge_time = results['Merge Sort'][i]
            heap_time = results['Heap Sort'][i]
            
            print(f"{size:<8} {quick_time:<12.6f} {merge_time:<12.6f} {heap_time:<12.6f}")
    
    # Create visualization
    create_performance_graph(sizes, results, data_patterns)

def create_performance_graph(sizes: List[int], results: dict, data_patterns: dict):
    """Create performance comparison graphs"""
    fig, axes = plt.subplots(2, 2, figsize=(15, 12))
    fig.suptitle('Sorting Algorithm Performance Comparison', fontsize=16)
    
    pattern_names = list(data_patterns.keys())
    
    for idx, pattern_name in enumerate(pattern_names):
        row = idx // 2
        col = idx % 2
        
        ax = axes[row, col]
        
        # Extract data for this pattern
        pattern_results = {
            'Quick Sort': results['Quick Sort'][idx*len(sizes):(idx+1)*len(sizes)],
            'Merge Sort': results['Merge Sort'][idx*len(sizes):(idx+1)*len(sizes)],
            'Heap Sort': results['Heap Sort'][idx*len(sizes):(idx+1)*len(sizes)]
        }
        
        # Plot lines
        ax.plot(sizes, pattern_results['Quick Sort'], 'b-o', label='Quick Sort', linewidth=2)
        ax.plot(sizes, pattern_results['Merge Sort'], 'r-s', label='Merge Sort', linewidth=2)
        ax.plot(sizes, pattern_results['Heap Sort'], 'g-^', label='Heap Sort', linewidth=2)
        
        ax.set_xlabel('Array Size')
        ax.set_ylabel('Execution Time (seconds)')
        ax.set_title(f'{pattern_name} Data')
        ax.legend()
        ax.grid(True, alpha=0.3)
        ax.set_xscale('log')
        ax.set_yscale('log')
    
    plt.tight_layout()
    plt.savefig('sorting_performance_comparison.png', dpi=300, bbox_inches='tight')
    plt.show()

def analyze_pivot_strategies():
    """Analyze different pivot selection strategies"""
    print("\nPIVOT STRATEGY ANALYSIS")
    print("======================")
    
    strategies = ['first', 'last', 'middle', 'random', 'median3']
    test_cases = {
        'Random': [random.randint(1, 100) for _ in range(1000)],
        'Sorted': list(range(1, 1001)),
        'Reverse Sorted': list(range(1000, 0, -1))
    }
    
    analyzer = QuickSortAnalyzer()
    
    for case_name, test_data in test_cases.items():
        print(f"\n{case_name} Data (1000 elements):")
        print("-" * 40)
        print(f"{'Strategy':<12} {'Time (s)':<12} {'Comparisons':<12} {'Swaps':<12}")
        print("-" * 50)
        
        for strategy in strategies:
            data = copy.deepcopy(test_data)
            analyzer.reset_counters()
            
            start_time = time.time()
            analyzer.quicksort(data, 0, len(data) - 1, strategy)
            end_time = time.time() - start_time
            
            print(f"{strategy:<12} {end_time:<12.6f} {analyzer.comparisons:<12} {analyzer.swaps:<12}")

# =============================================================================
# MAIN EXECUTION
# =============================================================================

def main():
    """Main function to run all tasks"""
    print("QUICK SORT ALGORITHM ANALYSIS")
    print("=" * 50)
    
    # Task 1: Theory (already documented above)
    print("Task 1: Theory - See documentation above")
    print()
    
    # Task 2: Complexity Analysis (already documented above)
    print("Task 2: Complexity Analysis - See documentation above")
    print()
    
    # Task 3: Visualization
    print("Task 3: Visualization")
    print("-" * 20)
    create_recursion_tree_example()
    demonstrate_partitioning()
    
    # Task 4: Comparative Experiment
    print("Task 4: Comparative Experiment")
    print("-" * 30)
    measure_sorting_performance()
    
    # Additional analysis
    analyze_pivot_strategies()
    
    print("\nCONCLUSIONS:")
    print("===========")
    print("1. Quick Sort is generally faster than Merge Sort and Heap Sort for random data")
    print("2. Quick Sort's performance degrades significantly with sorted/reverse sorted data")
    print("3. Random pivot selection provides the best average performance")
    print("4. Merge Sort provides consistent O(n log n) performance regardless of input")
    print("5. Heap Sort provides O(n log n) performance with O(1) space complexity")

if __name__ == "__main__":
    main()
