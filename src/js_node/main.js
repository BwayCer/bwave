/* 本微波 */

"use strict";


const readline = require('readline');

let bwaveShakeCode       = '010110111011';
let bwaveShakeCodeLength = bwaveShakeCode.length;
let bwaveSymbol          = '⠤⣄⣀⣠⠤⠖⠒⠋⠉⠙⠒⠲';
let bwaveSymbolLength    = bwaveSymbol.length;
let bwavePeriod          = 16;
let bwaveGraph           = '';
let turbulenceIntensity  = 99;

function bwave(loop) {
    setTimeout(bwave, bwavePeriod, loop + 1);

    let rateIdx = Math.floor((loop / bwaveSymbolLength) % bwaveShakeCodeLength);

    if (bwaveShakeCode[rateIdx] === '0') {
        bwaveGraph = bwaveSymbol[0] + bwaveGraph;
    } else {
        let symbolIdx = bwaveSymbolLength - 1 - (loop % bwaveSymbolLength);
        bwaveGraph = bwaveSymbol[symbolIdx] + bwaveGraph;
    }

    let cutLength;
    let columns = process.stdout.columns;

    if (columns >= 64) {
        cutLength = 58;
    } else {
        cutLength = columns - 6;
    }
    if (bwaveGraph.length > cutLength)  {
        bwaveGraph = bwaveGraph.substr(0, cutLength);
    }

    readline.clearLine(process.stdout, 0);
    logPrint('\r' + bwaveGraph);
}

function bwave_turbulence() {
    let idx, len;
    let newCode = "";

    for (idx = 0, len = turbulenceIntensity; idx < len ; idx++) {
        newCode += Math.floor(Math.random() * 10) % 2;
    }

    bwaveShakeCode = newCode;
    bwaveShakeCodeLength = bwaveShakeCode.length;
}

function main() {
    let idx, len;
    let toBreak = false;
    // 命令行傳遞的參數 argument vector
    let argv = Array.prototype.slice.call(process.argv, 1);
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

    if (opt_turbulence) bwave_turbulence();

    bwave(0);
}


function logPrint(txt) {
    process.stdout.write(txt);
}


process.on('SIGINT', function() {
    process.stdout.write('\n');
    process.exit();
});

main();

