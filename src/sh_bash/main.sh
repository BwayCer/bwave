#!/bin/bash
# 本微波

# 當命令成功執行時，會顯示類似如下的波紋：
# ⠤⣄⣀⣠⠤⠖⠒⠋⠉⠙⠒⠲⠤⣄⣀⣠⠤⠖⠒⠋⠉⠙⠒⠲⠤⣄⣀⣠⠤⠖⠒⠋⠉⠙⠒⠲


##shStyle 共享變數


# 初始設定值
bwaveCode="010110111011" # 數字化波形： 1 代表有波形， 0 則沒有。
bwaveCodeLength=${#bwaveCode}
bwaveSymbol=("⠤" "⣄" "⣀" "⣠" "⠤" "⠖" "⠒" "⠋" "⠉" "⠙" "⠒" "⠲") # 波浪的圖形文字
bwaveSymbolLength=${#bwaveSymbol[@]}
bwavePeriod=0.016 # 波浪週期（由於 shell 沒有小數運算，故此處的單位式毫秒）
turbulenceIntensity=99 # 紊流強度

# TODO 想想，為何會把變數放於最外層所有程式皆可讀取的地方？
cmdLineColumns=0
bwaveGraph=""


##shStyle ###


fnMain() {
    # 初始化 fnSttySize 函式
    fnSttySize_init 1 32

    fnIsHasTurbulenceOption "$@"
    local ynHasTurbulenceOption=$rtnIsHasTurbulenceOption
    [ $ynHasTurbulenceOption -eq 0 ] || fnBecameTurbulent

    # 監聽退出訊號
    trap 'echo; exit' 2

    fnRun
}


##shStyle 函式庫


# `stty size` 命令工具： 取得命令行行列數。
#
# TODO 還有什麼命令能取得命令行的行列數嗎？
#   1. `$LINES`, `$COLUMNS` 的變數中
#   2. `tput lines`, `tput cols`
rtnSttySize_lines=0
rtnSttySize_columns=0
fnSttySize() {
    if [ $fnSttySize_ynCanUseStty -eq 0 ]; then
        rtnSttySize_lines=$fnSttySize_defaultLines
        rtnSttySize_columns=$fnSttySize_defaultColumns
        return
    fi

    local lines=0
    local columns=0

    local size=`stty size 2> /dev/null`
    lines=`  cut -d " " -f 1 <<< "$size"`
    columns=`cut -d " " -f 2 <<< "$size"`

    rtnSttySize_lines=$lines
    rtnSttySize_columns=$columns
}
fnSttySize_ynCanUseStty=1
fnSttySize_defaultLines=0
fnSttySize_defaultColumns=0
# 初始化設定值，檢查是否能使用 `stty` 命令，與設定預設行列數
fnSttySize_init() {
    local defaultLines=$1
    local defaultColumns=$2

    # 檢查是否能使用 `stty` 命令
    if [ ! -t 0 ] || [[ ! "`stty size 2> /dev/null`" =~ [0-9]+\ [0-9]+ ]]; then
        fnSttySize_ynCanUseStty=0
        fnSttySize_defaultLines=$defaultLines
        fnSttySize_defaultColumns=$defaultColumns
    else
        fnSttySize_ynCanUseStty=1
    fi
}


# 是否有亂流的選項旗標：
# 檢查選項旗標中是否包含 `-t` 或 `--turbulence` 的選項，
# 如果有救回傳 `true`， 否則回傳 `false`。
rtnIsHasTurbulenceOption=0
fnIsHasTurbulenceOption() {
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

    rtnIsHasTurbulenceOption=$opt_turbulence
}


# 形成亂流：
# 使波紋圖形無規則起伏（單次起伏仍為一個週期波）。
# 用亂數隨機的方式，
# 建立長度為 `turbulenceIntensity` 的 `bwaveCode` 數字化波形。
fnBecameTurbulent() {
    local idx len
    local newCode=""

    for ((idx=0, len=turbulenceIntensity; idx < len ; idx++))
    do
        newCode+="$((RANDOM % 2))"
    done

    bwaveCode=$newCode
    bwaveCodeLength=${#bwaveCode}
}


# 運行。
fnRun() {
    fnRunTimer
}


# 執行計時器： 讓計時器形成迴圈重複調用。
#
# TODO shell 沒有類似 Object{} 的語法嗎？
# TODO 是否還有其他類似計時器的功能呢？
fnRunTimer() {
    local loopCount=$1

    while [ -n "y" ]
    do
        # 讀取命令行的寬度
        fnSttySize
        cmdLineColumns=$rtnSttySize_columns
        fnMakeWave "$loopCount"
        ((loopCount++))
        # 讓程序睡眠停止運行
        sleep "$bwavePeriod"
    done
}


# 造浪： 建立並輸出波浪圖形。
fnMakeWave() {
    local loopCount=$1

    # 取得波浪長度
    fnGetWaveLength "$cmdLineColumns"
    local waveLength=$rtnGetWaveLength

    # 取得波浪圖形
    fnGetWaveGraph "$loopCount" "" "" "" "" "$bwaveGraph" "$waveLength"
    local waveGraph=$rtnGetWaveGraph

    # 更新於造浪資訊上的當前波浪圖形
    bwaveGraph=$waveGraph

    # 清除整行文字並將波浪圖形顯示在畫面上
    printf "\r\e[K%s" "$waveGraph"
}


# 取得波浪長度：
# 若 命令行寬度 >= 64 則 波浪長度 == 58；
# 否則 波浪長度為 命令行寬度 - 6。
rtnGetWaveLength=0
fnGetWaveLength() {
    local cmdLineColumns=$1

    local waveLength=0
    if [ $cmdLineColumns -ge 64 ]; then
        waveLength=58
    else
        ((waveLength= cmdLineColumns - 6))
    fi

    rtnGetWaveLength=$waveLength
}


# 取得波浪圖形： 組合出波浪圖形。
rtnGetWaveGraph=""
fnGetWaveGraph() {
    local loopCount=$1
    local bwaveGraph=$6
    local waveLength=$7

    local waveGraph=""

    # 確認此次是否產生波形
    local symbolIdx
    # shell 計算會自動無條件捨去
    local bwaveCodeIdx=$(((loopCount / bwaveSymbolLength) % bwaveCodeLength))
    if [ "${bwaveCode:bwaveCodeIdx:1}" == "0" ]; then
        # 設置平行波形樣式
        waveGraph="${bwaveSymbol[0]}$bwaveGraph"
    else
        # 確認此次波形的樣式位置
        symbolIdx=$((bwaveSymbolLength - 1 - (loopCount % bwaveSymbolLength)))
        waveGraph="${bwaveSymbol[symbolIdx]}$bwaveGraph"
    fi

    # 檢查長度是否符合，超過長度必須修減。
    if [ ${#waveGraph} -gt $waveLength ]; then
        waveGraph="${waveGraph:0:waveLength}"
    fi

    rtnGetWaveGraph=$waveGraph
}


##shStyle ###


# 運行主程式
fnMain "$@"

