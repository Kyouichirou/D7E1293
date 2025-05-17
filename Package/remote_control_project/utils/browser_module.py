import asyncio
from playwright.async_api import async_playwright


async def click_leading_none_element():
    async with async_playwright() as p:
        # 启动浏览器
        browser = await p.chromium.launch_persistent_context(
            user_data_dir=r'C:\Users\Lian\AppData\Local\Google\Chrome\User Data',
            executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            args=[r'--disable-extensions-except=C:\Users\Lian\AppData\Local\Google\Chrome\User Data\Default\Extensions\dhdgffkkebhmkfjojejmpbldmpobfkfo\5.3.3_0'],
            headless=False)
        # 创建新页面
        page = await browser.new_page()
        # 导航到指定网页并等待加载完成
        await page.goto('https://www.bilibili.com/', wait_until='networkidle')
        # 定位 class 为 leading-none 的元素
        # elements = page.locator('.leading-none')
        await asyncio.sleep(10)
        await page.reload(wait_until='networkidle')
        await asyncio.sleep(10)
        # 检查是否有匹配的元素
        # if (i := await elements.count()) > 0:
        #     # 点击第一个匹配的元素
        #     print('i', i)
        #     await elements.nth(2).click()
        #     print('click')
        #     # 等待 5 秒以便观察效果
        #     await asyncio.sleep(5)
        # else:
        #     print("未找到 class 为 leading-none 的元素。")
        # # 关闭浏览器
        await browser.close()


if __name__ == "__main__":
    asyncio.run(click_leading_none_element())
