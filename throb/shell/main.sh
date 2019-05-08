#!/bin/bash
# 心跳


##shStyle ###


throbRateCode="010110111011"
throbRateCodeLength=${#throbRateCode}
throbSymbol=("⠤" "⣄" "⣀" "⣠" "⠤" "⠖" "⠒" "⠋" "⠉" "⠙" "⠒" "⠲")
throbSymbolLength=${#throbSymbol[@]}
monitorRefreshPeriod=0.016
monitorGraph=""
arrhythmiaExtent=99

# fnMonitorClear() {
#     clear
#     # or
#     # printf "\e[H\e[2J"
#     # or
#     # local idx
#     # terminalSize
#     # printf "\e[${_LINES}B"
#     # for ((idx=0; idx < $_LINES ; idx++)); do printf "\e[A\e[K"; done
#     # printf "\e[00m"
# }

fnThrob() {
    local loop=$throb_loop

    local symbolIdx
    local cutLength
    # shell 計算會自動無條件捨去
    local rateIdx=$(((loop / throbSymbolLength) % throbRateCodeLength))

    terminalSize

    if [ "${throbRateCode:rateIdx:1}" == "0" ]; then
        monitorGraph="${throbSymbol[0]}$monitorGraph"
    else
        symbolIdx=$((throbSymbolLength - 1 - (loop % throbSymbolLength)))
        monitorGraph="${throbSymbol[symbolIdx]}$monitorGraph"
    fi

    if [ $_COLUMNS -ge 64 ]; then
        cutLength=58
    else
        ((cutLength= COLUMNS - 6))
    fi
	if [ ${#monitorGraph} -gt $cutLength ]; then
        monitorGraph="${monitorGraph:0:cutLength}"
    fi

    printf "\r\e[K%s" "$monitorGraph"

    ((throb_loop++))
}
throb_loop=0
throb_arrhythmia() {
    local idx len
    local newThrobRateCode=""

    for ((idx=0, len=arrhythmiaExtent; idx < len ; idx++))
    do
        newThrobRateCode+="$(( RANDOM % 2))"
    done

    throbRateCode=$newThrobRateCode
    throbRateCodeLength=${#throbRateCode}
}

fnMain() {
    local opt_arrhythmia=0

    while [ -n "y" ]
    do
        case "$1" in
            -a | --arrhythmia )
                opt_arrhythmia=1
                shift
                ;;
            * ) break ;;
        esac
    done

    [ $opt_arrhythmia -eq 0 ] || throb_arrhythmia

    while [ -n "y" ]
    do
        fnThrob
        sleep "$monitorRefreshPeriod"
    done
}


##shStyle ###


_LINES=0
_COLUMNS=0

terminalSize() {
    local size=`stty size`
    _LINES=`  cut -d " " -f 1 <<< "$size"`
    _COLUMNS=`cut -d " " -f 2 <<< "$size"`
    # or
    # _LINES=`tput lines`
    # _COLUMNS=`tput cols`
}


##shStyle ###


fnMain "$@"

