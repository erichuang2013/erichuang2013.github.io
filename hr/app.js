var canvas = document.querySelector('canvas');
var statusText = document.querySelector('#statusText');

let wakeLock = null;

async function requestWakeLock() {
  if ('wakeLock' in navigator) {
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      console.log('Screen Wake Lock is active');
    } catch (err) {
      console.error(`${err.name}, ${err.message}`);
    }
  }
}

statusText.addEventListener('click', function() {
  statusText.textContent = 'Breathe...';
  heartRates = [];
  zoneTimes = { Z5: 0, Z4: 0, Z3: 0, Z2: 0, Z1: 0 };
  lastHrTimestamp = null;
  heartRateSensor.connect()
  .then(async () => {
    await requestWakeLock();
    return heartRateSensor.startNotificationsHeartRateMeasurement();
  })
  .then(handleHeartRateMeasurement)
  .catch(error => {
    statusText.textContent = error;
  });
});

function handleHeartRateMeasurement(heartRateMeasurement) {
  heartRateMeasurement.addEventListener('characteristicvaluechanged', event => {
    var heartRateMeasurement = heartRateSensor.parseHeartRate(event.target.value);
    var hr = heartRateMeasurement.heartRate;
    console.debug('[HR Data] Received HR:', hr, 'at', Date.now());

    var hrColor = '#05a988'; // Base (< 91)
    if (hr > 164) hrColor = '#f83b15';      // Z5
    else if (hr > 146) hrColor = '#F27E0A'; // Z4
    else if (hr > 128) hrColor = '#f2d202'; // Z3
    else if (hr > 109) hrColor = '#29f013'; // Z2
    else if (hr > 90) hrColor = '#6be501';  // Z1

    statusText.innerHTML = '<span style="font-size: 2em; color: ' + hrColor + ';">' + hr + ' &#x2764;</span>';
    
    var now = Date.now();
    if (lastHrTimestamp !== null) {
      var diff = now - lastHrTimestamp;
      if (hr > 164) zoneTimes.Z5 += diff;
      else if (hr > 146) zoneTimes.Z4 += diff;
      else if (hr > 128) zoneTimes.Z3 += diff;
      else if (hr > 109) zoneTimes.Z2 += diff;
      else  zoneTimes.Z1 += diff;
    }
    lastHrTimestamp = now;

    // 修改 1: 紀錄心率時同時記下當前時間戳記 (毫秒)
    heartRates.push({
      value: heartRateMeasurement.heartRate,
      timestamp: now
    });
    
    drawWaves();
  });
}

// 儲存結構改為 [{ value: Number, timestamp: Number }, ...]
var heartRates = [];
var zoneTimes = { Z5: 0, Z4: 0, Z3: 0, Z2: 0, Z1: 0 };
var lastHrTimestamp = null;
var mode = 'bar';

canvas.addEventListener('click', event => {
  mode = mode === 'bar' ? 'line' : 'bar';
  drawWaves();
});

function drawWaves() {
  requestAnimationFrame(() => {
    var now = Date.now();
    console.debug('[Draw] drawWaves started. Points before filter:', heartRates.length);
    
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

    console.debug('[Draw] Rendering graph with', heartRates.length, 'points');

    // --- 需求 2: 計算統計數值 ---
    var allValues = heartRates.map(d => d.value);
    var globalMax = Math.max(...allValues);

    // 篩選最近 90 秒 (90,000 毫秒) 的資料
    var recent90sData = heartRates.filter(item => now - item.timestamp <= 90000).map(d => d.value);
    var recentMax = recent90sData.length > 0 ? Math.max(...recent90sData) : globalMax;
    var recentMin = recent90sData.length > 0 ? Math.min(...recent90sData) : globalMax;

    // --- 計算心率斜率 (3 秒間隔) ---
    var slopes = [];
    for (var i = 0; i < heartRates.length; i++) {
      var currentPoint = heartRates[i];
      var targetTime = currentPoint.timestamp - 3000; // 3 seconds ago
      var prevPoint = currentPoint;
      for (var j = i - 1; j >= 0; j--) {
        if (heartRates[j].timestamp <= targetTime) {
          prevPoint = heartRates[j];
          break;
        }
      }
      var slope = 0;
      var dt = (currentPoint.timestamp - prevPoint.timestamp) / 1000;
      if (dt > 0) {
        slope = (currentPoint.value - prevPoint.value) / dt;
      }
      slopes.push(slope);
    }

    // --- 繪製心率圖表 ---
    var zones = [
      { min: 80, max: 90, color: '#00a382' },   // Base (< 91)
      { min: 90, max: 109, color: '#63cd06' },  // 91 - 109
      { min: 109, max: 128, color: '#29f013' }, // 110 - 128
      { min: 128, max: 146, color: '#f2d202' }, // 129 - 146
      { min: 146, max: 164, color: '#F27E0A' }, // 147 - 164
      { min: 164, max: 250, color: '#f83b15' }  // 165+
    ];

    var displayCount = Math.min(heartRates.length, maxBars);
    var barWidth = Math.max(0, 11 - margin * 2);

    for (var i = 0; i < displayCount; i++) {
      var currentRate = heartRates[i + offset].value;
      var x = 11 * i + margin;

      for (var z = 0; z < zones.length; z++) {
        var zone = zones[z];
        if (currentRate > zone.min) {
          var segmentTop = Math.min(currentRate, zone.max);
          var topY = canvas.height - Math.max(0, Math.round((segmentTop - 90) * canvas.height / 110));
          var bottomY = canvas.height - Math.max(0, Math.round((zone.min - 90) * canvas.height / 110));
          var segmentHeight = Math.max(0, bottomY - topY);

          if (segmentHeight > 0) {
            context.fillStyle = zone.color;
            context.fillRect(x, topY, barWidth, segmentHeight);
          }
        }
      }
    }

    // --- 繪製斜率線 (Slope Line) ---
    var slopeZeroY = canvas.height * 0.85; // 放於下方 85% 高度處
    var slopeScale = (canvas.height * 0.1) / 5; // 假設 ±5 為一個主要刻度範圍

    // 繪製斜率基準線 (0 線)
    context.save();
    context.strokeStyle = 'rgba(159, 0, 19, 0.32)';
    context.lineWidth = 2 * devicePixelRatio;
    context.setLineDash([4, 4]);
    context.beginPath();
    context.moveTo(0, slopeZeroY);
    context.lineTo(usableWidth, slopeZeroY);
    context.stroke();
    context.restore();

    // 繪製斜率資料線
    context.save();
    context.strokeStyle = '#fa5629'; // 青色斜率線
    context.lineWidth = 3 * devicePixelRatio;
    context.beginPath();
    for (var i = 0; i < displayCount; i++) {
      var dataIndex = i + offset;
      var slope = slopes[dataIndex];
      var x = 11 * i + margin + (barWidth / 2);
      var y = slopeZeroY - (slope * slopeScale);
      if (i === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.stroke();
    context.restore();

    // --- 輔助函式：繪製水平線與標籤 ---
    function drawHorizontalLine(value, color, label, lineWidth = 2) {
      var calculatedHeight = Math.round((value - 90) * canvas.height / 110);
      var y = canvas.height - Math.max(0, Math.min(canvas.height, calculatedHeight));
      
      // 畫虛線
      context.save();
      context.strokeStyle = color;
      context.lineWidth = lineWidth;
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
    drawHorizontalLine(globalMax, '#f91111', 'MAX', 9);      // 全域最大值（紅）
    drawHorizontalLine(recentMax, '#FFBB33', '90s MAX', 6);     // 近90秒最大值（黃）
    drawHorizontalLine(recentMin, '#CCCCCC', '90s MIN', 6);  // 近90秒最小值（淺灰）

    // --- 繪製左上角狀態文字 ---
    var currentHr = heartRates[heartRates.length - 1].value;
    var currentSlope = slopes[slopes.length - 1].toFixed(1);
    var textX = 10 * devicePixelRatio;
    var textY = 10 * devicePixelRatio;
    context.font = 'bold ' + (36 * devicePixelRatio) + 'px sans-serif';
    context.textBaseline = 'top';

    function drawColoredText(text, color) {
      context.fillStyle = color;
      context.fillText(text, textX, textY);
      textX += context.measureText(text).width;
    }

    var currentHrColor = '#05a988'; // Base (< 91)
    if (currentHr > 164) currentHrColor = '#f91111';      // Z5
    else if (currentHr > 146) currentHrColor = '#e84b02'; // Z4
    else if (currentHr > 128) currentHrColor = '#e9ec16'; // Z3
    else if (currentHr > 109) currentHrColor = '#5ef74d'; // Z2
    else if (currentHr > 90) currentHrColor = '#3dba24';  // Z1

    drawColoredText('HR: ' + currentHr, currentHrColor);
    drawColoredText('  /  ', '#888888');
    var slopeColor = currentSlope > 0 ? '#ff5555' : (currentSlope < 0 ? '#55ff55' : '#00FFFF');
    drawColoredText('SL: ' + currentSlope, slopeColor);
    drawColoredText('  /  ', '#888888');
    drawColoredText('90MAX: ' + recentMax, '#FFBB33');
    drawColoredText('  /  ', '#888888');
    drawColoredText('90MIN: ' + recentMin, '#CCCCCC');
    drawColoredText('  /  ', '#888888');
    drawColoredText('MAX: ' + globalMax, '#ec6e55');

    // --- 繪製第二行：各區間停留時間 ---
    textX = 10 * devicePixelRatio;
    textY += 45 * devicePixelRatio;
    context.font = 'bold ' + (20 * devicePixelRatio) + 'px sans-serif';

    function formatTime(ms) {
      var totalSeconds = Math.floor(ms / 1000);
      var minutes = Math.floor(totalSeconds / 60);
      var seconds = totalSeconds % 60;
      return minutes.toString().padStart(1, '0') + "'" + seconds.toString().padStart(2, '0');
    }

    drawColoredText("Z5: " + formatTime(zoneTimes.Z5), '#ea2b05');
    drawColoredText(' / ', '#888888');
    drawColoredText("Z4: " + formatTime(zoneTimes.Z4), '#fb7d00');
    drawColoredText(' / ', '#888888');
    drawColoredText("Z3: " + formatTime(zoneTimes.Z3), '#e8bc38');
    drawColoredText(' / ', '#888888');
    drawColoredText("Z2: " + formatTime(zoneTimes.Z2), '#55f013');
    drawColoredText(' / ', '#888888');
    drawColoredText("Z1: " + formatTime(zoneTimes.Z1), '#6be501');
  });
}

window.onresize = drawWaves;

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    drawWaves();
    if (wakeLock !== null && wakeLock.released) {
      requestWakeLock();
    }
  }
});