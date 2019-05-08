"use strict";
/* 心跳 */


const readline = require('readline');

let throbRateCode        = '010110111011';
let throbRateCodeLength  = throbRateCode.length;
let throbSymbol          = '⠤⣄⣀⣠⠤⠖⠒⠋⠉⠙⠒⠲';
let throbSymbolLength    = throbSymbol.length;
let monitorRefreshPeriod = 16;
let monitorGraph         = '';
let arrhythmiaExtent     = 99;

// function monitorClear() {
//     console.clear();
// }

function throb(loop) {
    setTimeout(throb, monitorRefreshPeriod, loop + 1);

    let rateIdx = Math.floor((loop / throbSymbolLength) % throbRateCodeLength);

    if (throbRateCode[rateIdx] === '0') {
        monitorGraph = throbSymbol[0] + monitorGraph;
    } else {
        let symbolIdx = throbSymbolLength - 1 - (loop % throbSymbolLength);
        monitorGraph = throbSymbol[symbolIdx] + monitorGraph;
    }

    let cutLength;
    let columns = process.stdout.columns;

    if (columns >= 64) {
        cutLength = 58;
    } else {
        cutLength = columns - 6;
    }
	if (monitorGraph.length > cutLength)  {
        monitorGraph = monitorGraph.substr(0, cutLength);
	}

    readline.clearLine(process.stdout, 0);
    logPrint('\r' + monitorGraph);
}

function throb_arrhythmia() {
    let idx, len;
    let newThrobRateCode = "";

    for (idx = 0, len = arrhythmiaExtent; idx < len ; idx++) {
        newThrobRateCode += Math.floor(Math.random() * 10) % 2;
    }

    throbRateCode = newThrobRateCode;
    throbRateCodeLength = throbRateCode.length;
}

function main() {
    let idx, len;
    let toBreak = false;
    // 命令行傳遞的參數 argument vector
    let argv = Array.prototype.slice.call(process.argv, 1);
    let opt_arrhythmia = false;

    for (idx = 1, len = argv.length; idx < len ; idx++) {
        switch (argv[idx]) {
            case '-a':
            case '--arrhythmia':
                opt_arrhythmia = true;
                break;
            default:
                toBreak = true;
        }
        if (toBreak) break;
    }

    if (opt_arrhythmia) throb_arrhythmia();

    throb(0);
}


function logPrint(txt) {
    process.stdout.write(txt);
}


main();

