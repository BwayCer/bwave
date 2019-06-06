#!/bin/bash
# 本微波


##shStyle ###


bwaveShakeCode="010110111011"
bwaveShakeCodeLength=${#bwaveShakeCode}
bwaveSymbol=("⠤" "⣄" "⣀" "⣠" "⠤" "⠖" "⠒" "⠋" "⠉" "⠙" "⠒" "⠲")
bwaveSymbolLength=${#bwaveSymbol[@]}
bwavePeriod=0.016
bwaveGraph=""
turbulenceIntensity=99

fnBwave() {
    local loop=$bwave_loop

    local symbolIdx
    local cutLength
    # shell 計算會自動無條件捨去
    local rateIdx=$(((loop / bwaveSymbolLength) % bwaveShakeCodeLength))

    [ $_ynCanUseStty -eq 0 ] || terminalSize

    if [ "${bwaveShakeCode:rateIdx:1}" == "0" ]; then
        bwaveGraph="${bwaveSymbol[0]}$bwaveGraph"
    else
        symbolIdx=$((bwaveSymbolLength - 1 - (loop % bwaveSymbolLength)))
        bwaveGraph="${bwaveSymbol[symbolIdx]}$bwaveGraph"
    fi

    if [ $_COLUMNS -ge 64 ]; then
        cutLength=58
    else
        ((cutLength= _COLUMNS - 6))
    fi
    if [ ${#bwaveGraph} -gt $cutLength ]; then
        bwaveGraph="${bwaveGraph:0:cutLength}"
    fi

    printf "\r\e[K%s" "$bwaveGraph"

    ((bwave_loop++))
}
bwave_loop=0
bwave_turbulence() {
    local idx len
    local newCode=""

    for ((idx=0, len=turbulenceIntensity; idx < len ; idx++))
    do
        newCode+="$((RANDOM % 2))"
    done

    bwaveShakeCode=$newCode
    bwaveShakeCodeLength=${#bwaveShakeCode}
}

fnMain() {
    local opt_turbulence=0

    while [ -n "y" ]
    do
        case "$1" in
            -t | --turbulence )
                opt_turbulence=1
                shift
                ;;
            * ) break ;;
        esac
    done

    [ $opt_turbulence -eq 0 ] || bwave_turbulence

    while [ -n "y" ]
    do
        fnBwave
        sleep "$bwavePeriod"
    done
}


##shStyle ###


_ynCanUseStty=1
_LINES=0
_COLUMNS=0

terminalSize() {
    local size=`stty size 2> /dev/null`
    _LINES=`  cut -d " " -f 1 <<< "$size"`
    _COLUMNS=`cut -d " " -f 2 <<< "$size"`
    # or
    # _LINES=`tput lines`
    # _COLUMNS=`tput cols`
}

if [ ! -t 0 ] || [[ ! "`stty size 2> /dev/null`" =~ [0-9]+\ [0-9]+ ]]; then
    _ynCanUseStty=0
    _LINES=0
    _COLUMNS=32
fi


trap 'echo; exit' 2


##shStyle ###


fnMain "$@"

