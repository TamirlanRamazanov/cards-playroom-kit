import random
import time
import matplotlib.pyplot as plt
import copy

def quicksort(arr, low, high):
    if low < high:
        pivot_index = partition(arr, low, high)
        quicksort(arr, low, pivot_index - 1)
        quicksort(arr, pivot_index + 1, high)

def partition(arr, low, high):
    pivot = arr[high]
    i = low - 1
    
    for j in range(low, high):
        if arr[j] <= pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1

def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    
    return merge(left, right)

def merge(left, right):
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

def heap_sort(arr):
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
    
    for i in range(n // 2 - 1, -1, -1):
        heapify(arr, n, i)
    
    for i in range(n - 1, 0, -1):
        arr[0], arr[i] = arr[i], arr[0]
        heapify(arr, i, 0)
    
    return arr

def measure_performance():
    sizes = [1000, 5000, 10000]
    results = {
        'Quick Sort': [],
        'Merge Sort': [],
        'Heap Sort': []
    }
    
    data_patterns = {
        'Random': lambda n: [random.randint(1, 1000) for _ in range(n)],
        'Sorted': lambda n: list(range(1, n + 1)),
        'Reverse Sorted': lambda n: list(range(n, 0, -1)),
        'Nearly Sorted': lambda n: list(range(1, n + 1)) + [random.randint(1, 1000) for _ in range(n // 10)]
    }
    
    for pattern_name, pattern_func in data_patterns.items():
        print(f"\n{pattern_name} Data:")
        print("-" * 20)
        
        for size in sizes:
            print(f"\nArray size: {size}")
            
            test_data = pattern_func(size)
            
            quick_data = copy.deepcopy(test_data)
            start_time = time.time()
            quicksort(quick_data, 0, len(quick_data) - 1)
            quick_time = time.time() - start_time
            results['Quick Sort'].append(quick_time)
            
            merge_data = copy.deepcopy(test_data)
            start_time = time.time()
            merge_sort(merge_data)
            merge_time = time.time() - start_time
            results['Merge Sort'].append(merge_time)
            
            heap_data = copy.deepcopy(test_data)
            start_time = time.time()
            heap_sort(heap_data)
            heap_time = time.time() - start_time
            results['Heap Sort'].append(heap_time)
            
            print(f"Quick Sort: {quick_time:.6f}s")
            print(f"Merge Sort: {merge_time:.6f}s")
            print(f"Heap Sort:  {heap_time:.6f}s")
    
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
    
    create_graph(sizes, results, data_patterns)

def create_graph(sizes, results, data_patterns):
    fig, axes = plt.subplots(2, 2, figsize=(15, 12))
    fig.suptitle('Sorting Algorithm Performance Comparison', fontsize=16)
    
    pattern_names = list(data_patterns.keys())
    
    for idx, pattern_name in enumerate(pattern_names):
        row = idx // 2
        col = idx % 2
        
        ax = axes[row, col]
        
        pattern_results = {
            'Quick Sort': results['Quick Sort'][idx*len(sizes):(idx+1)*len(sizes)],
            'Merge Sort': results['Merge Sort'][idx*len(sizes):(idx+1)*len(sizes)],
            'Heap Sort': results['Heap Sort'][idx*len(sizes):(idx+1)*len(sizes)]
        }
        
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

if __name__ == "__main__":
    print("COMPARATIVE PERFORMANCE EXPERIMENT")
    print("==================================")
    measure_performance()
    
    print("\nCONCLUSIONS:")
    print("===========")
    print("1. Quick Sort is generally faster than Merge Sort and Heap Sort for random data")
    print("2. Quick Sort's performance degrades significantly with sorted/reverse sorted data")
    print("3. Merge Sort provides consistent O(n log n) performance regardless of input")
    print("4. Heap Sort provides O(n log n) performance with O(1) space complexity")
