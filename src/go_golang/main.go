/*! Bwave @license: CC0-1.0 */

/*
	Bwave @license: CC0-1.0

	main 的註解文件只會有包的註解資訊，
	且 godoc 註解文件不顯示內部物件。

	當 `go run` 命令成功執行時，會顯示類似如下的波紋：
		⠤⣄⣀⣠⠤⠖⠒⠋⠉⠙⠒⠲⠤⣄⣀⣠⠤⠖⠒⠋⠉⠙⠒⠲⠤⣄⣀⣠⠤⠖⠒⠋⠉⠙⠒⠲

	Dependent Modules

	/bin/stty
*/
package main

// 引入程式包
import (
	"flag"
	"fmt"
	"math/rand"
	"os"
	"os/exec"
	"os/signal"
	"regexp"
	"strconv"
	"strings"
	"syscall"
	"time"
)

// 本文件的初始化。
func init() {
	// 以 UTC Unix 時間做為亂數的編碼的依據
	// https://blog.csdn.net/aslackers/article/details/78548738
	// `Time.Unix()` 是以秒為單位；
	// `Time.UnixNano()` 是以納秒為單位；
	rand.Seed(time.Now().UnixNano())
	// 初始化 sttySize 命令工具
	insSttySize.Init(1, 32)
}

// 本程式包的主程式。
func main() {
	if isHasTurbulenceOption() {
		becameTurbulent()
	}

	// TODO err
	// BUG(who)
	// 仍有機會在 <Ctrl+C> 退出時出現以下訊息
	// 推測是 <Ctrl+C> 按下時已讓終端機結束，使得 `stty size` 取值錯誤
	//   panic: signal: interrupt
	//   goroutine 1 [running]:
	//   main.SttySize.GetSize(0xf42401, 0x0, 0x0, 0x2a, 0xc3)
	//       /main.go:132 +0x285
	//   main.runTimer(0x5d11b8, 0xc, 0xc, 0xc, 0x5d2640, 0xc, 0xc, 0xc, 0x0, 0x0, ...)
	//       /main.go:224 +0x4f
	//   main.Run(...)
	//       /main.go:205
	//   main.main()
	//       /main.go:87 +0x207
	//   exit status 2
	osSignalChan := make(chan os.Signal, 1)
	signal.Notify(osSignalChan, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		<-osSignalChan
		fmt.Println()
		// Golang 只要使用 <Ctrl+C> 都會以代碼 1 退出
		os.Exit(0)
	}()

	Run()
}

// `stty size` 命令工具
type SttySize struct {
	ynCanUseStty   bool
	defaultLines   int
	defaultColumns int
}

// 初始化設定值，檢查是否能使用 `stty` 命令，與設定預設行列數
func (self *SttySize) Init(defaultLines, defaultColumns int) {
	// 檢查是否能使用 `stty` 命令
	ynCanUseStty := true
	cmd := exec.Command("stty", "size")
	cmd.Stdin = os.Stdin
	output, err := cmd.Output()
	if err != nil {
		ynCanUseStty = false
	}
	outputStr := strings.Trim(string(output), " \n")
	ynMatch, _ := regexp.MatchString("^[0-9]+ [0-9]+$", outputStr)
	if !ynMatch {
		ynCanUseStty = false
	}

	self.ynCanUseStty = ynCanUseStty
	if !ynCanUseStty {
		defaultLines = defaultLines
		defaultColumns = defaultColumns
	}
}

// 取得命令行行列數
func (self SttySize) GetSize() (lines, columns int) {
	if !self.ynCanUseStty {
		lines = self.defaultLines
		columns = self.defaultColumns
		return
	}

	cmd := exec.Command("stty", "size")
	cmd.Stdin = os.Stdin
	output, err := cmd.Output()
	if err != nil {
		panic(err)
	}
	cutList := strings.Split(strings.Trim(string(output), " \n"), " ")
	lines, err = strconv.Atoi(cutList[0])
	if err != nil {
		panic(err)
	}
	columns, err = strconv.Atoi(cutList[1])
	if err != nil {
		panic(err)
	}
	return
}

// 實例化 SttySize
var insSttySize = SttySize{}

// 造浪資訊
type makeWaveInfo struct {
	bwaveCode           []byte
	bwaveCodeLength     int
	bwaveSymbol         []rune
	bwaveSymbolLength   int
	bwavePeriod         int
	turbulenceIntensity int
	bwaveGraph          []rune
	cmdLineColumns      int
}

// 初始設定值
var (
	// 數字化波形： 1 代表有波形， 0 則沒有。
	bwaveCode       = []byte{0, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1}
	bwaveCodeLength = len(bwaveCode)
	// 波浪的圖形文字
	bwaveSymbol       = []rune("⠤⣄⣀⣠⠤⠖⠒⠋⠉⠙⠒⠲")
	bwaveSymbolLength = len(bwaveSymbol)
	// 波浪週期
	bwavePeriod = 16
	// 紊流強度
	turbulenceIntensity = 99
)

// 是否有亂流的選項旗標：
// 檢查選項旗標中是否包含 `-t` 或 `--turbulence` 的選項，
// 如果有救回傳 `true`， 否則回傳 `false`。
func isHasTurbulenceOption() bool {
	// 使用 flag 程式包處理選項旗標
	var turbulence bool
	flag.BoolVar(&turbulence, "t", false, "to make turbulence.")
	flag.BoolVar(&turbulence, "turbulence", false, "same as -a. to make turbulence.")
	flag.Parse()
	return turbulence
}

// 形成亂流：
// 使波紋圖形無規則起伏（單次起伏仍為一個週期波）。
// 用亂數隨機的方式，
// 建立長度為 `turbulenceIntensity` 的 `bwaveCode` 數字化波形。
func becameTurbulent() {
	newCode := make([]byte, 99)

	for idx, leng := 0, turbulenceIntensity; idx < leng; idx++ {
		// `rand.Intn(2)` 返回 0 <= n < 2 的整數 n
		newCode[idx] = byte(rand.Intn(2))
	}

	bwaveCode = newCode
	bwaveCodeLength = len(bwaveCode)
}

// 運行。
func Run() {
	runTimer(makeWaveInfo{
		bwaveCode:         bwaveCode,
		bwaveCodeLength:   bwaveCodeLength,
		bwaveSymbol:       bwaveSymbol,
		bwaveSymbolLength: bwaveSymbolLength,
		bwaveGraph:        make([]rune, 0, 300),
	}, bwavePeriod)
}

// 執行計時器： 讓計時器形成迴圈重複調用。
//
// TODO 是否還有其他類似計時器的功能呢？
// ex: for loop, for range, select case。
// https://gobyexample.com/timeouts
func runTimer(insMakeWaveInfo makeWaveInfo, bwavePeriod int) {
	var loopCount int = 0

	for {
		// 讀取命令行的寬度
		_, insMakeWaveInfo.cmdLineColumns = insSttySize.GetSize()
		makeWave(loopCount, &insMakeWaveInfo)
		loopCount++
		// 讓程序睡眠停止運行
		time.Sleep(time.Duration(bwavePeriod) * time.Millisecond)
	}
}

// 造浪： 建立並輸出波浪圖形。
func makeWave(loopCount int, info *makeWaveInfo) {
	// 取得波浪長度
	waveLength := getWaveLength(info.cmdLineColumns)
	// 取得波浪圖形
	waveGraph := getWaveGraph(loopCount, info.bwaveCode, info.bwaveCodeLength, info.bwaveSymbol, info.bwaveSymbolLength, info.bwaveGraph, waveLength)

	// 更新於造浪資訊上的當前波浪圖形
	info.bwaveGraph = waveGraph

	// 清除整行文字並將波浪圖形顯示在畫面上
	fmt.Printf("\r\033[K%s", string(waveGraph))
}

// 取得波浪長度：
// 若 命令行寬度 >= 64 則 波浪長度 == 58；
// 否則 波浪長度為 命令行寬度 - 6。
func getWaveLength(cmdLineColumns int) int {
	var waveLength int
	if cmdLineColumns >= 64 {
		waveLength = 58
	} else {
		waveLength = cmdLineColumns - 6
	}

	return waveLength
}

// 取得波浪圖形： 組合出波浪圖形。
func getWaveGraph(loopCount int, bwaveCode []byte, bwaveCodeLength int, bwaveSymbol []rune, bwaveSymbolLength int, bwaveGraph []rune, waveLength int) (waveGraph []rune) {
	// 確認此次是否產生波形
	bwaveCodeIdx := (loopCount / bwaveSymbolLength) % bwaveCodeLength
	if bwaveCode[bwaveCodeIdx] == 0 {
		// 設置平行波形樣式
		waveGraph = append([]rune{bwaveSymbol[0]}, bwaveGraph...)
	} else {
		// 確認此次波形的樣式位置
		symbolIdx := bwaveSymbolLength - 1 - (loopCount % bwaveSymbolLength)
		waveGraph = append([]rune{bwaveSymbol[symbolIdx]}, bwaveGraph...)
	}

	// 檢查長度是否符合，超過長度必須修減。
	if len(waveGraph) > waveLength {
		waveGraph = waveGraph[0:waveLength]
	}

	return
}

// 運行主程式
// golang 執行時進入點就是 `main()`，也就是 `main()` 會被自動執行。
