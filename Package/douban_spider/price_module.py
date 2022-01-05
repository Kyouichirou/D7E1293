__all__ = ['Currency']


class Currency:
    def __init__(self):
        self.__currencies = (
            ('台', 'tw', 'nt'),
            ('港', 'hk', 'h.k'),
            ('ca', '加'),
            ('日', '円', 'jp', '込', '税'),
            ('sg', '新'),
            ('欧', 'eu', '€'),
            ('gb', '英', '£'),
            ('澳', 'au'),
            ('nok',),
            ('us', '$', '美', 'u.s'),
            ('韩', '원', 'kr', '₩'),
            ('th', '泰', 'bt', 'tc'),
            ('my', '马', 'rm', 'mal'),
            ('₽', '卢布', '俄', 'rb'),
        )
        self.__exchange_rates = (
            0.23,
            0.82,
            5,
            0.05,
            4.6,
            7.2,
            8.5,
            4.5,
            0.7,
            6.4,
            0.005,
            0.2,
            1.5,
            0.08,
        )

    def change_curency(self, price_c, price):
        text = price_c.lower()
        for c, e in zip(self.__currencies, self.__exchange_rates):
            if any(a in text for a in c):
                return round(price * e, 2)
        return price
