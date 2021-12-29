import math


def pearson(vector1, vector2):
    # pow(x, y, z)
    # math.pow() implicitly converts its arguments to float
    # 注意精度, 速度的问题, 在使用不同的方式实现幂函数
    """
    https://stackoverflow.com/questions/10282674/difference-between-the-built-in-pow-and-math-pow-for-floats-in-python
    You can overload pow and ** by defining __pow__ and __rpow__ methods for your class.
    However, you can't overload math.pow (without hacks like math.pow = pow).
     You can make a class usable with math.pow by defining a __float__ conversion,
      but then you'll lose the uncertainty attached to your numbers.
    :param vector1:
    :param vector2:
    :return: float
    """
    n = len(vector1)
    sum1 = sum(vector1)
    sum2 = sum(vector2)
    sum1_pow = sum([v ** 2 for v in vector1])
    sum2_pow = sum([v ** 2 for v in vector2])
    p_sum = sum([vector1[i] * vector2[i] for i in range(n)])
    num = p_sum - (sum1 * sum2 / n)
    den = math.sqrt((sum1_pow - sum1 ** 2 / n) * (sum2_pow - sum2 ** 2 / n))
    return 0.0 if den == 0 else num / den
