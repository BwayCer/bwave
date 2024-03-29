/*! Bwave @license: CC0-1.0 */

/**
 * 本微波 Bwave
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

    // 監聽退出訊號
    process.on('SIGINT', function() {
        process.stdout.write('\n');
        process.exit();
    });

    run();
}

/**
 * 是否有亂流的選項旗標：
 * 檢查選項旗標中是否包含 `-t` 或 `--turbulence` 的選項，
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
    runTimer({
        bwaveCode,
        bwaveCodeLength,
        bwaveSymbol,
        bwaveSymbolLength,
        bwaveGraph: '', // 當前波浪圖形
    }, bwavePeriod);
}

/**
 * 執行計時器： 讓計時器形成迴圈重複調用。
 * <br>
 * TODO 是否還有其他類似計時器的功能呢？
 * ex: setTimeout, setInterval, 空迴圈 sleep。
 *
 * @func runTimer
 * @param {object} makeWaveInfo - 造浪資訊。
 * @param {Numbers} bwavePeriod - 波浪週期。
 * @param {Numbers} [loopCount] - 迴圈次數。
 */
function runTimer(makeWaveInfo, bwavePeriod, loopCount = 0) {
    setTimeout(
        runTimer, bwavePeriod,
        makeWaveInfo, bwavePeriod, loopCount + 1
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
    // 解構取值
    let {
        bwaveCode,
        bwaveCodeLength,
        bwaveSymbol,
        bwaveSymbolLength,
        bwaveGraph,
        cmdLineColumns,
    } = info;
    // 取得波浪長度
    let waveLength = _getWaveLength(cmdLineColumns);
    // 取得波浪圖形
    let waveGraph = _getWaveGraph(
        loopCount,
        bwaveCode,
        bwaveCodeLength,
        bwaveSymbol,
        bwaveSymbolLength,
        bwaveGraph,
        waveLength
    );

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
 * 若 命令行寬度 >= 64 則 波浪長度 == 58；
 * 否則 波浪長度為 命令行寬度 - 6。
 *
 * @func _getWaveLength
 * @param {Numbers} cmdLineColumns - 命令行的寬度。
 * @return {Numbers}
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
 * @param {String} bwaveCode - 數字化波形。
 * 以 `0|1` 表示： 1 代表有波形， 0 則沒有。
 * @param {Numbers} bwaveCodeLength - 數字化波形的長度。
 * @param {String} bwaveSymbol - 波浪的圖形文字。
 * @param {Numbers} bwaveSymbolLength - 波浪的圖形文字的長度。
 * @param {String} bwaveGraph - 當前波浪圖形。
 * @param {Numbers} waveLength - 波浪長度。
 * @return {String}
 */
function _getWaveGraph(
    loopCount,
    bwaveCode,
    bwaveCodeLength,
    bwaveSymbol,
    bwaveSymbolLength,
    bwaveGraph,
    waveLength
) {
    let waveGraph = '';

    // 確認此次是否產生波形
    let bwaveCodeIdx = Math.floor((loopCount / bwaveSymbolLength) % bwaveCodeLength);
    if (bwaveCode[bwaveCodeIdx] === '0') {
        // 設置平行波形樣式
        waveGraph = bwaveSymbol[0] + bwaveGraph;
    } else {
        // 確認此次波形的樣式位置
        let symbolIdx = bwaveSymbolLength - 1 - (loopCount % bwaveSymbolLength);
        waveGraph = bwaveSymbol[symbolIdx] + bwaveGraph;
    }

    // 檢查長度是否符合，超過長度必須修減。
    if (waveGraph.length > waveLength)  {
        waveGraph = waveGraph.substr(0, waveLength);
    }

    return waveGraph;
}


// 運行主程式
main();

