/*! Bwave @license: CC0-1.0 */

/**
 * 本微波
 * <br>
 * <br>
 * 當命令成功執行時，會顯示類似如下的波紋：
 * <br>
 * ⠤⣄⣀⣠⠤⠖⠒⠋⠉⠙⠒⠲⠤⣄⣀⣠⠤⠖⠒⠋⠉⠙⠒⠲⠤⣄⣀⣠⠤⠖⠒⠋⠉⠙⠒⠲
 *
 * @file
 * @author [張本微]{@link https://bwaycer.github.io/about}
 * @license CC0-1.0
 */

"use strict";


// 引入模組
const readline = require('readline');


// 初始設定值
let bwaveCode   = '010110111011'; // 數字化波形： 1 代表有波形， 0 則沒有。
let bwaveSymbol = '⠤⣄⣀⣠⠤⠖⠒⠋⠉⠙⠒⠲'; // 波浪的圖形文字
let bwavePeriod          = 16; // 波浪週期
let turbulenceIntensity  = 99; // 紊流強度


// main 是 jsdoc 的關鍵字?!
/**
 * 主程式。
 *
 * @func fnMain
 */
function main() {
  // process.argv 為命令行執行的命令數組陣列 (argument vector)
  let argv = Array.from(process.argv);
  let ynHasTurbulenceOption = _isHasTurbulenceOption(argv);

  let bwaveCode_ = ynHasTurbulenceOption ? becameTurbulent() : bwaveCode;
  let bwaveCodeLength = bwaveCode_.length;
  let bwaveSymbolLength = bwaveSymbol.length;
  let makeWaveInfo = {
    bwaveCode: bwaveCode_,
    bwaveCodeLength,
    bwaveSymbol,
    bwaveSymbolLength,
  };
  let bwaveGraph = '';

  let cycleOutputCount = bwaveCodeLength * bwaveSymbolLength;
  function runTimer(makeWaveInfo, bwavePeriod, loopCount = 0) {
    // 取得畫面寬度
    let viewSizeColumns = process.stdout.columns;
    // 計算波浪長度
    let waveLength = viewSizeColumns >= 64 ? 58 : viewSizeColumns - 6;

    // 取得本次波浪圖形
    bwaveGraph = makeWave(makeWaveInfo, bwaveGraph, loopCount, waveLength);

    // 清除整行文字並將波浪圖形顯示在畫面上
    //   https://nodejs.org/api/readline.html#readline_readline_clearline_stream_dir
    readline.clearLine(process.stdout, 0);
    // 如果要使用 '\r\033[K' 需要關閉嚴格模式。
    process.stdout.write('\r' + bwaveGraph);

    // (node v21.2.0)
    // 1. 實測 setInterval 並不會有被延遲時間段的多個計時器擠在同時執行問題。
    // 2. 實測即使沒用 `clearTimeout` 的遞歸計時器函式在退出後是可以釋放記憶體空間。
    //      使用 `process.memoryUsage()` 方法讀取記憶體。
    //      運行次數 | Resident Set Size | Heap Total | Heap Used
    //           999 |          47353856 |    5193728 |  4780168
    //        163999 |          54353920 |   12533760 | 11553176
    //        164999 |          48832512 |    6766592 |  4522312
    //        173999 |          47071232 |    5193728 |  3986264
    //
    //      (global: n = 0)
    //      if (n % 1000 !== 0)
    //        for (let len = 6; len--;) process.stdout.write('\x1b[1A\x1b[2K');
    //      const used = process.memoryUsage();
    //      console.log(`n: ${n++}`);
    //      console.log(
    //        'Memory usage:\n'
    //        + `  Resident Set Size: ${used.rss} bytes\n`
    //        + `  Heap Total:        ${used.heapTotal} bytes\n`
    //        + `  Heap Used:         ${used.heapUsed} bytes\n`
    //        + `  External:          ${used.external} bytes`
    //      );

    // 避免觸摸到最大值而拋錯
    let loopCount_ = (loopCount + 1) % cycleOutputCount;
    setTimeout(runTimer, bwavePeriod, makeWaveInfo, bwavePeriod, loopCount_);
  }

  // 監聽退出訊號
  process.on('SIGINT', function() {
    process.stdout.write('\n');
    process.exit();
  });

  runTimer(makeWaveInfo, bwavePeriod);
}

/**
 * 檢查是否有 `-t` 或 `--turbulence` 亂流的選項旗標，
 * 如果有就回傳 `true`， 否則回傳 `false`。
 *
 * @func _isHasTurbulenceOption
 * @param {Array} argv - 命令參數。
 * @return {Boolean}
 */
function _isHasTurbulenceOption(argv) {
  let ynHasTurbulenceOption = false;
  for (let idx = 2, len = argv.length; idx < len ; idx++) {
    switch (argv[idx]) {
      case '-t':
      case '--turbulence':
        ynHasTurbulenceOption = true;
        break;
    }
    if (ynHasTurbulenceOption) break;
  }
  return ynHasTurbulenceOption;
}

/**
 * 使波紋圖形無規則起伏。(單次振幅仍為一個週期波)
 * <br>
 * <br>
 * 用亂數隨機的方式，建立長度為 [turbulenceIntensity]
 * 的數字化波形 [bwaveCode] 並回傳。
 *
 * @func becameTurbulent
 * @return {String}
 */
function becameTurbulent() {
  let newCode = '';
  for (let idx = 0, len = turbulenceIntensity; idx < len ; idx++) {
    newCode += Math.floor(Math.random() * 10) % 2;
  }
  return newCode;
}

/**
 * 建立並輸出波浪圖形。
 * <br>
 * <br>
 * [info] 應包含 `bwaveCode, bwaveCodeLength, bwaveSymbol, bwaveSymbolLength`
 * 四樣不變的資訊。
 * 以 [loopCount] 計算本次波形，參考上次顯示的波浪圖形 [bwaveGraph]
 * 來形成動畫，並以 [waveLength] 調整長度大小。
 *
 * @func makeWave
 * @param {object} info - 固定資訊。
 * @param {String} bwaveGraph - 上次顯示的波浪圖形。
 * @param {Numbers} loopCount - 迴圈次數。
 * @param {Numbers} waveLength - 波浪圖形長度。
 * @return {String}
 */
function makeWave(info, bwaveGraph, loopCount, waveLength) {
  let {
    bwaveCode,
    bwaveCodeLength,
    bwaveSymbol,
    bwaveSymbolLength,
  } = info;

  // 確認此次是否產生波形
  let bwaveCodeIdx
    = Math.floor((loopCount / bwaveSymbolLength) % bwaveCodeLength);
  let symbolIdx;
  if (bwaveCode[bwaveCodeIdx] === '0') {
    // 設置平行波形樣式
    symbolIdx = 0;
  } else {
    // 確認此次波形的樣式位置
    symbolIdx = bwaveSymbolLength - 1 - (loopCount % bwaveSymbolLength);
  }
  let waveGraph = bwaveSymbol[symbolIdx] + bwaveGraph;

  // 檢查長度是否符合，超過長度必須修減。
  if (waveGraph.length > waveLength) {
    waveGraph = waveGraph.substring(0, waveLength);
  }

  return waveGraph;
}


// 運行主程式
main();

