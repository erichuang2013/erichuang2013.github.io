var canvas = document.querySelector('canvas');
var statusText = document.querySelector('#statusText');

statusText.addEventListener('click', function() {
  statusText.textContent = 'Breathe...';
  heartRates = [];
  heartRateSensor.connect()
  .then(() => heartRateSensor.startNotificationsHeartRateMeasurement().then(handleHeartRateMeasurement))
  .catch(error => {
    statusText.textContent = error;
  });
});

function handleHeartRateMeasurement(heartRateMeasurement) {
  heartRateMeasurement.addEventListener('characteristicvaluechanged', event => {
    var heartRateMeasurement = heartRateSensor.parseHeartRate(event.target.value);
    statusText.innerHTML = heartRateMeasurement.heartRate + ' &#x2764;';
    
    // 修改 1: 紀錄心率時同時記下當前時間戳記 (毫秒)
    heartRates.push({
      value: heartRateMeasurement.heartRate,
      timestamp: Date.now()
    });
    
    drawWaves();
  });
}

// 儲存結構改為 [{ value: Number, timestamp: Number }, ...]
var heartRates = [];
var mode = 'bar';

canvas.addEventListener('click', event => {
  mode = mode === 'bar' ? 'line' : 'bar';
  drawWaves();
});

function drawWaves() {
  requestAnimationFrame(() => {
    var now = Date.now();
    
    // 需求 1: 只保留最近 120 秒 (120,000 毫秒) 的資料
    heartRates = heartRates.filter(item => now - item.timestamp <= 180000);

    canvas.width = parseInt(getComputedStyle(canvas).width.slice(0, -2)) * devicePixelRatio;
    canvas.height = parseInt(getComputedStyle(canvas).height.slice(0, -2)) * devicePixelRatio;

    var context = canvas.getContext('2d');
    // 為了不讓右側的輔助線文字被切掉，預留 50px 的右邊距
    var rightMargin = 50; 
    var usableWidth = canvas.width - rightMargin;

    var margin = 2;
    var maxBars = Math.max(0, Math.round(usableWidth / 11));
    var offset = Math.max(0, heartRates.length - maxBars);
    
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    if (heartRates.length === 0) return;

    // --- 需求 2: 計算統計數值 ---
    var allValues = heartRates.map(d => d.value);
    var globalMax = Math.max(...allValues);

    // 篩選最近 90 秒 (90,000 毫秒) 的資料
    var recent90sData = heartRates.filter(item => now - item.timestamp <= 90000).map(d => d.value);
    var recentMax = recent90sData.length > 0 ? Math.max(...recent90sData) : globalMax;
    var recentMin = recent90sData.length > 0 ? Math.min(...recent90sData) : globalMax;

    // --- 繪製心率圖表 ---
    context.strokeStyle = '#00796B';
    var displayCount = Math.min(heartRates.length, maxBars);

      for (var i = 0; i < displayCount; i++) {
        var currentRate = heartRates[i + offset].value;
        var barHeight = Math.max(0, Math.round((currentRate - 80) * canvas.height / 90));
        context.beginPath();
        context.rect(11 * i + margin, canvas.height - barHeight, margin, Math.max(0, barHeight - margin));
        context.stroke();
      }

    // --- 輔助函式：繪製水平線與標籤 ---
    function drawHorizontalLine(value, color, label) {
      var calculatedHeight = Math.round((value - 80) * canvas.height / 90);
      var y = canvas.height - Math.max(0, Math.min(canvas.height, calculatedHeight));
      
      // 畫虛線
      context.save();
      context.strokeStyle = color;
      context.lineWidth = 2;
      context.setLineDash([6, 4]);
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(usableWidth, y);
      context.stroke();
      context.restore();

      // 畫標籤文字
      context.fillStyle = color;
      context.font = (10 * devicePixelRatio) + 'px sans-serif';
      context.textBaseline = 'middle';
      context.fillText(label + ': ' + value, usableWidth + 5, y);
    }

    // 繪製三條動態水平線
    drawHorizontalLine(globalMax, '#FF4444', 'MAX');         // 全域最大值（紅）
    drawHorizontalLine(recentMax, '#FFBB33', '90s MAX');     // 近90秒最大值（黃）
    drawHorizontalLine(recentMin, '#33B5E5', '90s MIN');     // 近90秒最小值（藍）

    // --- 繪製左上角狀態文字 ---
    var currentHr = heartRates[heartRates.length - 1].value;
    var textX = 10 * devicePixelRatio;
    var textY = 10 * devicePixelRatio;
    context.font = 'bold ' + (36 * devicePixelRatio) + 'px sans-serif';
    context.textBaseline = 'top';

    function drawColoredText(text, color) {
      context.fillStyle = color;
      context.fillText(text, textX, textY);
      textX += context.measureText(text).width;
    }

    drawColoredText('HR: ' + currentHr, '#00796B');
    drawColoredText('  /  ', '#888888');
    drawColoredText('90MAX: ' + recentMax, '#FFBB33');
    drawColoredText('  /  ', '#888888');
    drawColoredText('90MIN: ' + recentMin, '#33B5E5');
    drawColoredText('  /  ', '#888888');
    drawColoredText('MAX: ' + globalMax, '#FF4444');
  });
}

window.onresize = drawWaves;

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    drawWaves();
  }
});