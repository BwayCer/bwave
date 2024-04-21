#!/usr/bin/env bash

# 本微波
#
# 當命令成功執行時，會顯示類似如下的波紋：
# ⠤⣄⣀⣠⠤⠖⠒⠋⠉⠙⠒⠲⠤⣄⣀⣠⠤⠖⠒⠋⠉⠙⠒⠲⠤⣄⣀⣠⠤⠖⠒⠋⠉⠙⠒⠲


##shArea ###


# 遇到錯誤就不再執行
set -e


##shStyle 共享變數


# 初始設定值
bwaveCode="010110111011" # 數字化波形： 1 代表有波形， 0 則沒有。
bwaveSymbol="⠤⣄⣀⣠⠤⠖⠒⠋⠉⠙⠒⠲" # 波浪的圖形文字
# 由於 shell 沒有小數運算，故此處的單位是秒
bwavePeriod=0.016 # 波浪週期
turbulenceIntensity=99 # 紊流強度

# 啟用鍵值對類型
declare -gA _makeWaveInfo


##shArea 介面函式


# 主程式
fnMain() {
  # 初始化 _fnSttySize 函式
  _fnSttySize_init

  _fnIsHasTurbulenceOption "$@"
  local ynHasTurbulenceOption=$_rtnIsHasTurbulenceOption

  local bwaveCode_="$bwaveCode"
  [ $ynHasTurbulenceOption -eq 0 ] || {
    fnBecameTurbulent
    bwaveCode_="$rtnBecameTurbulent"
  }

  local bwaveCodeLength=${#bwaveCode}
  local bwaveSymbolLength=${#bwaveSymbol}
  _makeWaveInfo["bwaveCode"]="$bwaveCode_"
  _makeWaveInfo["bwaveCodeLength"]=$bwaveCodeLength
  _makeWaveInfo["bwaveSymbol"]="$bwaveSymbol"
  _makeWaveInfo["bwaveSymbolLength"]=$bwaveSymbolLength
  local bwaveGraph=""

  # 序列、鍵值對無法經參數傳遞，為示範鍵值因而無法使參數固定。
  # shell 並不適用於開發大專案的語言，多數也只能靠約定來維持變數環境。
  runTimer() {
    local loopCount=$1

    # 取得畫面寬度
    _fnSttySize 1 32
    local viewSizeColumns=$_rtnSttySize_columns

    # 計算波浪長度
    local waveLength=58
    [ $viewSizeColumns -ge 64 ] || waveLength=$((viewSizeColumns - 6))

    # 取得本次波浪圖形
    fnMakeWave "$bwaveGraph" $loopCount $waveLength
    bwaveGraph="$rtnMakeWave"

    # 清除整行文字並將波浪圖形顯示在畫面上
    printf "\r\e[K%s" "$bwaveGraph"
  }

  # 監聽退出訊號
  trap 'echo; exit' 2

  # 以 for loop + sleep 組成計時器
  local cycleOutputCount=$((bwaveCodeLength * bwaveSymbolLength))
  local loopCount=0
  while [ -n "y" ]
  do
    runTimer $loopCount
    # 避免觸摸到最大值而拋錯
    loopCount=$(((loopCount + 1) % cycleOutputCount))
    # 讓程序睡眠停止運行
    sleep "$bwavePeriod"
  done
}


##shStyle 函式庫


# 透過 `stty size` 命令取得命令行行列數。
#
# 還有什麼命令能取得命令行的行列數嗎？
#   1. `$LINES`, `$COLUMNS` 的變數中
#   2. `tput lines`, `tput cols`
_rtnSttySize_lines=0
_rtnSttySize_columns=0
_fnSttySize() {
  local defaultLines=$1
  local defaultColumns=$2

  _rtnSttySize_lines=0
  _rtnSttySize_columns=0

  if [ $_fnSttySize_ynCanUseStty -eq 0 ]; then
    [ $defaultLines -gt 0 ] && _rtnSttySize_lines=$defaultLines || :
    [ $defaultColumns -gt 0 ] && _rtnSttySize_columns=$defaultColumns || :
    return
  fi

  local size=`stty size 2> /dev/null`
  local lines=`  cut -d " " -f 1 <<< "$size"`
  local columns=`cut -d " " -f 2 <<< "$size"`

  _rtnSttySize_lines=$lines
  _rtnSttySize_columns=$columns
}
_fnSttySize_ynCanUseStty=1
# 初始化，檢查是否能使用 `stty` 命令。
_fnSttySize_init() {
  # 檢查是否能使用 `stty` 命令
  if [ ! -t 0 ] || [[ ! "`stty size 2> /dev/null`" =~ [0-9]+\ [0-9]+ ]]; then
    _fnSttySize_ynCanUseStty=0
  else
    _fnSttySize_ynCanUseStty=1
  fi
}


# 檢查是否有 `-t` 或 `--turbulence` 亂流的選項旗標，
# 如果有就回傳 `true`， 否則回傳 `false`。
_rtnIsHasTurbulenceOption=0
_fnIsHasTurbulenceOption() {
  local val
  local ynHasTurbulenceOption=0

  for val in "$@"
  do
    case "$val" in
      -t | --turbulence )
        ynHasTurbulenceOption=1
        break
        ;;
    esac
  done

  _rtnIsHasTurbulenceOption=$ynHasTurbulenceOption
}


# 使波紋圖形無規則起伏。(單次振幅仍為一個週期波)
#
# 用亂數隨機的方式，建立長度為 [turbulenceIntensity]
# 的數字化波形 [bwaveCode] 並回傳。
rtnBecameTurbulent=""
fnBecameTurbulent() {
  local idx len
  local newCode=""

  for ((idx=0, len=turbulenceIntensity; idx < len ; idx++))
  do
    newCode+="$((RANDOM % 2))"
  done

  rtnBecameTurbulent="$newCode"
}


# 建立並輸出波浪圖形。
#
# [_makeWaveInfo] 應包含 `bwaveCode, bwaveCodeLength, bwaveSymbol, bwaveSymbolLength`
# 四樣不變的資訊。
# 以 [loopCount] 計算本次波形，參考上次顯示的波浪圖形 [bwaveGraph]
# 來形成動畫，並以 [waveLength] 調整長度大小。
rtnMakeWave=""
fnMakeWave() {
  local bwaveGraph=$1
  local loopCount=$2
  local waveLength=$3

  local bwaveCode="${_makeWaveInfo["bwaveCode"]}"
  local bwaveCodeLength=${_makeWaveInfo["bwaveCodeLength"]}
  local bwaveSymbol=${_makeWaveInfo["bwaveSymbol"]}
  local bwaveSymbolLength=${_makeWaveInfo["bwaveSymbolLength"]}

  # 確認此次是否產生波形
  # shell 計算會自動無條件捨去
  local bwaveCodeIdx=$(((loopCount / bwaveSymbolLength) % bwaveCodeLength));
  local symbolIdx
  if [ "${bwaveCode:bwaveCodeIdx:1}" == "0" ]; then
    # 設置平行波形樣式
    symbolIdx=0
  else
    # 確認此次波形的樣式位置
    symbolIdx=$((bwaveSymbolLength - 1 - (loopCount % bwaveSymbolLength)))
  fi
  local waveGraph="${bwaveSymbol:symbolIdx:1}$bwaveGraph"

  # 檢查長度是否符合，超過長度必須修減。
  if [ ${#waveGraph} -gt $waveLength ]; then
    waveGraph="${waveGraph:0:waveLength}"
  fi

  rtnMakeWave=$waveGraph
}


##shStyle ###


# 運行主程式
fnMain "$@"

