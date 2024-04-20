#!/usr/bin/env python

# 本微波 Bwave
#
# 當命令成功執行時，會顯示類似如下的波紋：
#     ⠤⣄⣀⣠⠤⠖⠒⠋⠉⠙⠒⠲⠤⣄⣀⣠⠤⠖⠒⠋⠉⠙⠒⠲⠤⣄⣀⣠⠤⠖⠒⠋⠉⠙⠒⠲


# 引入程式包
import asyncio
import math
import os
import random
import signal
import sys
import typing


# 使用 `tuple()` 禁止修改 sys.argv 的序列。
_sysArgv = tuple(sys.argv)

# 初始設定值
bwaveCode = '010110111011'  # 數字化波形： 1 代表有波形，0 則沒有。
bwaveSymbol = '⠤⣄⣀⣠⠤⠖⠒⠋⠉⠙⠒⠲'  # 波浪的圖形文字
bwavePeriod = 16  # 波浪週期
turbulenceIntensity = 99  # 紊流強度


# 主程式。
async def main() -> None:
    ynHasTurbulenceOption = _isHasTurbulenceOption(_sysArgv)

    bwaveCode_ = becameTurbulent(turbulenceIntensity) \
        if ynHasTurbulenceOption else bwaveCode
    bwaveCodeLength = len(bwaveCode_)
    bwaveSymbolLength = len(bwaveSymbol)
    makeWaveInfo = {
        'bwaveCode': bwaveCode_,
        'bwaveCodeLength': bwaveCodeLength,
        'bwaveSymbol': bwaveSymbol,
        'bwaveSymbolLength': bwaveSymbolLength,
    }
    bwaveGraph = ''

    def runTimer(
            makeWaveInfo: dict,
            loopCount: int = 0) -> None:
        # 當要對封閉作用域的物件賦值時要先指示該名稱來源於封閉作用域
        nonlocal bwaveGraph

        # 取得畫面寬度
        viewSizeColumns = os.get_terminal_size().columns
        # 計算波浪長度
        waveLength = 58 if viewSizeColumns >= 64 else viewSizeColumns - 6

        # 取得本次波浪圖形
        bwaveGraph = makeWave(makeWaveInfo, bwaveGraph, loopCount, waveLength)

        # 清除整行文字並將波浪圖形顯示在畫面上
        # 以覆蓋方式清除文字
        # `flush=True` 不經緩衝區直接輸出，
        print(f'\r{bwaveGraph}', end='', flush=True)

    # 監聽 SIGINT 退出訊號，在退出前做換行和退出代碼的處理。
    # bool(print()) == False
    signal.signal(signal.SIGINT, lambda sig, frame: print() or exit(0))

    # 以 for loop + asyncio.sleep() 組成計時器
    bwavePeriod_ = bwavePeriod / 1000
    cycleOutputCount = bwaveCodeLength * bwaveSymbolLength
    loopCount = 0
    while True:
        runTimer(makeWaveInfo, loopCount)
        # 避免觸摸到最大值而拋錯
        loopCount = (loopCount + 1) % cycleOutputCount
        await delay(bwavePeriod_)


# 檢查是否有 `-t` 或 `--turbulence` 亂流的選項旗標，
# 如果有就回傳 `True`， 否則回傳 `False`。
def _isHasTurbulenceOption(argv: tuple) -> bool:
    ynHasTurbulenceOption = False
    for val in argv:
        # python 沒有 switch 功能
        if val == '-t' or val == '--turbulence':
            ynHasTurbulenceOption = True
            break
    return ynHasTurbulenceOption


# 使波紋圖形無規則起伏。(單次振幅仍為一個週期波)
#
# 用亂數隨機的方式，建立長度為 [turbulenceIntensity]
# 的數字化波形 [bwaveCode] 並回傳。
def becameTurbulent(turbulenceIntensity: int) -> str:
    newCode = ''
    for idx in range(0, turbulenceIntensity):
        # `random.randint(0, 1)` 比 `round(random.random() * 10) % 2` 慢1倍。
        newCode += str(random.randint(0, 1))
    return newCode


# 建立並輸出波浪圖形。
#
# [info] 應包含 `bwaveCode, bwaveCodeLength, bwaveSymbol, bwaveSymbolLength`
# 四樣不變的資訊。
# 以 [loopCount] 計算本次波形，參考上次顯示的波浪圖形 [bwaveGraph]
# 來形成動畫，並以 [waveLength] 調整長度大小。
def makeWave(
        info: dict,
        bwaveGraph: str,
        loopCount: int,
        waveLength: int) -> str:
    bwaveCode, bwaveCodeLength, bwaveSymbol, bwaveSymbolLength = info.values()

    # 確認此次是否產生波形
    bwaveCodeIdx \
        = math.floor((loopCount / bwaveSymbolLength) % bwaveCodeLength)
    if bwaveCode[bwaveCodeIdx] == '0':
        # 設置平行波形樣式
        symbolIdx = 0
    else:
        # 確認此次波形的樣式位置
        symbolIdx = bwaveSymbolLength - 1 - (loopCount % bwaveSymbolLength)
    waveGraph = bwaveSymbol[symbolIdx] + bwaveGraph

    # 檢查長度是否符合，超過長度必須修減。
    if len(waveGraph) > waveLength:
        waveGraph = waveGraph[0:waveLength]

    return waveGraph


# 異步方式的延遲 [timeSec] 秒數。
# 使用 [rangeLevel] 可得到不穩定的延遲秒數，`1: ±50%, 2: ±25%, 3: ±17%, ...` 依此類推。
def delay(
        timeSec: typing.Union[int, float],
        rangeLevel: int = 0) -> typing.Coroutine:
    rangeNum = random.random() / rangeLevel + 0.5 if rangeLevel > 0 else 1
    return asyncio.sleep(timeSec * rangeNum)


if __name__ == '__main__':
    # 運行主程式
    asyncio.run(main())
    os._exit(0)
