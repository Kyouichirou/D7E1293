import argparse
from douban_pack.spider_module import Spider


def main():
    parser = argparse.ArgumentParser(description="douban spider")
    parser.add_argument('-i', '--id', default="613560")
    parser.add_argument('-w', '--wait', default=900)
    args = parser.parse_args()
    try:
        g_id = args.id
        i_time = int(args.wait)
        print(f'spider configs: group_id is {g_id}; interval time is {i_time}')
        with Spider(g_id) as spider:
            if spider.initial_flag:
                spider.start(i_time)
    except ValueError as error:
        print('input data is invalid')
        print(error)


if __name__ == '__main__':
    main()
