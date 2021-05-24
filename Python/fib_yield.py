@name fib

def fib_yield(n):
    a, b = 0, 1
    yield a
    for _ in range(n):
        a, b = b, a + b
        yield a
