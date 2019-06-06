/*! Bwave @license: CC0-1.0 */

/**
 * 本微波 Bwave
 *
 * @file
 * @author [張本微]{@link https://bwaycer.github.io/about}
 * @license CC0-1.0
 */

"use strict";


// 引用模組
const readline = require('readline');


// 初始設定值
let bwaveCode            = '010110111011'; // 數字化波形： 1 代表有波形， 0 則沒有。
let bwaveCodeLength      = bwaveCode.length;
let bwaveSymbol          = '⠤⣄⣀⣠⠤⠖⠒⠋⠉⠙⠒⠲'; // 波浪的圖形文字
let bwaveSymbolLength    = bwaveSymbol.length;
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
    let argv = Array.prototype.slice.call(process.argv, 1);

    let ynHasTurbulenceOption = _isHasTurbulenceOption(argv);
    if (ynHasTurbulenceOption) becameTurbulent();

    run();
}

/**
 * 是否有亂流的選項旗幟：
 * 檢查選項旗幟中是否包含 `-t` 或 `--turbulence` 的選項，
 * 如果有救回傳 `true`， 否則回傳 `false`。
 *
 * @func _isHasTurbulenceOption
 * @param {Array} argv - 命令參數。
 * @return {Boolean}
 */
function _isHasTurbulenceOption(argv) {
    let idx, len;
    let toBreak = false;
    let opt_turbulence = false;

    for (idx = 1, len = argv.length; idx < len ; idx++) {
        switch (argv[idx]) {
            case '-t':
            case '--turbulence':
                opt_turbulence = true;
                break;
            default:
                toBreak = true;
        }
        if (toBreak) break;
    }

    return opt_turbulence;
}

/**
 * 形成亂流：
 * 使波紋圖形無規則起伏。
 * （單次起伏仍為一個週期波）
 * <br>
 * 用亂數隨機的方式，
 * 建立長度為 `turbulenceIntensity` 的 `bwaveCode` 數字化波形。
 *
 * @func becameTurbulent
 */
function becameTurbulent() {
    let idx, len;
    let newCode = "";

    for (idx = 0, len = turbulenceIntensity; idx < len ; idx++) {
        newCode += Math.floor(Math.random() * 10) % 2;
    }

    bwaveCode = newCode;
    bwaveCodeLength = bwaveCode.length;
}

/**
 * 運行。
 *
 * @func run
 */
function run() {
    runTimer(0, bwavePeriod, {
        bwaveCode,
        bwaveCodeLength,
        bwaveSymbol,
        bwaveSymbolLength,
        bwaveGraph: '', // 當前波浪圖形
    });
}

/**
 * 執行計時器： 讓計時器形成迴圈重複調用。
 *
 * @func runTimer
 * @param {Numbers} loopCount - 迴圈次數。
 * @param {Numbers} bwavePeriod - 波浪週期。
 * @param {object} makeWaveInfo - 造浪資訊。
 */
function runTimer(loopCount, bwavePeriod, makeWaveInfo) {
    setTimeout(
        runTimer, bwavePeriod,
        loopCount + 1, bwavePeriod, makeWaveInfo
    );
    // 讀取命令行的寬度
    makeWaveInfo.cmdLineColumns = process.stdout.columns;
    makeWave(loopCount, makeWaveInfo);
}

/**
 * 造浪： 建立並輸出波浪圖形。
 *
 * @func makeWave
 * @param {Numbers} loopCount - 迴圈次數。
 * @param {object} info - 造浪資訊。
 */
function makeWave(loopCount, info) {
    let waveGraph = _getWaveGraph(loopCount, info);

    // 更新於造浪資訊上的當前波浪圖形
    info.bwaveGraph = waveGraph;

    // 清除整行文字
    // https://nodejs.org/api/readline.html#readline_readline_clearline_stream_dir
    readline.clearLine(process.stdout, 0);
    // 將波浪圖形顯示在畫面上
    process.stdout.write('\r' + waveGraph);
}

/**
 * 取得波浪長度：
 * 若 命令行寬度 >= 64 則 波浪長度為 58；
 * 否則 波浪長度為 命令行寬度 - 6。
 *
 * @func _getWaveLength
 * @param {String} cmdLineColumns - 命令行的寬度。
 */
function _getWaveLength(cmdLineColumns) {
    let waveLength;
    if (cmdLineColumns >= 64) {
        waveLength = 58;
    } else {
        waveLength = cmdLineColumns - 6;
    }

    return waveLength;
}

/**
 * 取得波浪圖形： 組合出波浪圖形。
 *
 * @func _getWaveGraph
 * @param {Numbers} loopCount - 迴圈次數。
 * @param {object} info - 造浪資訊。
 */
function _getWaveGraph(
    loopCount,
    {
        bwaveCode,
        bwaveCodeLength,
        bwaveSymbol,
        bwaveSymbolLength,
        bwaveGraph,
        cmdLineColumns,
    }
) {
    // 確認此次是否產生波形
    let bwaveCodeIdx = Math.floor((loopCount / bwaveSymbolLength) % bwaveCodeLength);
    if (bwaveCode[bwaveCodeIdx] === '0') {
        bwaveGraph = bwaveSymbol[0] + bwaveGraph;
    } else {
        // 確認此次波形的樣式位置
        let symbolIdx = bwaveSymbolLength - 1 - (loopCount % bwaveSymbolLength);
        bwaveGraph = bwaveSymbol[symbolIdx] + bwaveGraph;
    }

    // 檢查長度是否符合，超過長度必須修減。
    let waveLength = _getWaveLength(cmdLineColumns);
    if (bwaveGraph.length > waveLength)  {
        bwaveGraph = bwaveGraph.substr(0, waveLength);
    }

    return bwaveGraph;
}


// 監聽退出訊號
process.on('SIGINT', function() {
    process.stdout.write('\n');
    process.exit();
});


// 運行主程式
main();

