import math
def counter(s):
    counts = []
    seen = []
    for ch in s:
        if ch not in seen:           # chỉ xử lý mỗi ký tự 1 lần
            counts.append(s.count(ch))
            seen.append(ch)
    return counts


def calculator(f):
    calculus=[]
    for items in f:
        cal=math.factorial(len(items))
        cal1=counter(items)
        for i in cal1:
            factorial_i=math.factorial(i)
            cal=cal/factorial_i
        calculus.append(cal)
    return calculus


def solution(n):
    list_of_counts = calculator(n)
    if not list_of_counts:
        return None
    max_count = max(list_of_counts)
    max_index = list_of_counts.index(max_count)
    return n[max_index], max_count


permutation=list(input().split())
print(permutation)
word, value=solution(permutation)
print(f"Chuỗi {word} có nhiều hoán vị nhất là {int(value)} hoán vị")