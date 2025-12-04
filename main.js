const API_WEATHER_URL = "https://zhu-cwaweather.zeabur.app/api/weather";

/** 開啟 loading */
function openLoading () {
  document.getElementById('loading').style.display = 'flex';
  document.getElementById('mainContent').style.display = 'none';
}

/** 關閉 loading */
function closeLoading () {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('mainContent').style.display = 'block';
}


/**
 * 取得天氣圖示
 * @param {string} weather 天氣狀態
 * @returns {string} 天氣圖示
 */
function getWeatherIcon (weather) {
  if (!weather) return "🌤️";
  if (weather.includes("晴")) return "☀️";
  if (weather.includes("多雲")) return "⛅";
  if (weather.includes("陰")) return "☁️";
  if (weather.includes("雨")) return "🌧️";
  if (weather.includes("雷")) return "⛈️";
  return "🌤️";
}

/**
 * 取得穿搭及雨具建議
 * @param {number} rainProb 降雨機率
 * @param {number} maxTemp 最高溫度
 * @returns {{rainIcon: string, rainText: string, clothIcon: string, clothText: string}} 建議內容
 */
function getAdvice (rainProb, maxTemp) {
  let rainIcon = "🌂";
  let rainText = "不用帶傘";
  if (parseInt(rainProb) > 30) {
    rainIcon = "☂️";
    rainText = "記得帶傘！";
  }

  let clothIcon = "👕";
  let clothText = "舒適穿搭";
  if (parseInt(maxTemp) >= 28) {
    clothIcon = "🎽";
    clothText = "短袖出發";
  } else if (parseInt(maxTemp) <= 20) {
    clothIcon = "🧥";
    clothText = "加件外套";
  }

  return { rainIcon, rainText, clothIcon, clothText };
}

/**
 * 取得時間區段名稱
 * @param {string} startTime 時段
 * @returns {string} 時段名稱
 */
function getTimePeriod (startTime) {
  const hour = new Date(startTime).getHours();
  if (hour >= 5 && hour < 11) return "早晨";
  if (hour >= 11 && hour < 14) return "中午";
  if (hour >= 14 && hour < 18) return "下午";
  if (hour >= 18 && hour < 23) return "晚上";
  return "深夜";
}

// 渲染今日日期
function renderDate () {
  const now = new Date();
  const month = now.getMonth() + 1;
  const date = now.getDate();
  const dayIndex = now.getDay();
  const days = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];

  document.getElementById('updateTime').innerHTML = 
    `
      <span style="white-space: nowrap;">${month}月${date}日</span> 
      <span style="white-space: nowrap;">${days[dayIndex]}</span>
    `;
}


// 渲染天氣資料相關元素
const elmtHeroPeriod = document.querySelector(".hero-period");
const elmtHeroIcon = document.querySelector(".hero-icon");
const elmtHeroTemp = document.querySelector(".hero-temp");
const elmtHeroDesc = document.querySelector(".hero-desc");
const elmtIconRain = document.querySelector("#iconRain");
const elmtTextRain = document.querySelector("#textRain");
const elmtRainPercent = document.querySelector("#rainPercent");
const elmtIconCloth = document.querySelector("#iconCloth");
const elmtTextCloth = document.querySelector("#textCloth");
const elmtMaxTemp = document.querySelector("#maxTemp");

/**
 * 渲染天氣資料
 * @param {*} data 
 */
function renderWeather (data) {
  const forecasts = data.forecasts;
  const current = forecasts[0];
  const others = forecasts.slice(1);

  // 1. 渲染 Hero Card (主畫面)
  const advice = getAdvice(current.rain, current.maxTemp);
  const period = getTimePeriod(current.startTime);
  const avgTemp = Math.round((parseInt(current.maxTemp) + parseInt(current.minTemp)) / 2);

  elmtHeroPeriod.textContent = period;
  elmtHeroIcon.textContent = getWeatherIcon(current.weather);
  elmtHeroTemp.textContent = `${avgTemp}°`;
  elmtHeroDesc.textContent = current.weather;
  elmtIconRain.textContent = advice.rainIcon;
  elmtTextRain.textContent = advice.rainText;
  elmtRainPercent.textContent = `降雨率 ${current.rain}`;
  elmtIconCloth.textContent = advice.clothIcon;
  elmtTextCloth.textContent = advice.clothText;
  elmtMaxTemp.textContent = `最高溫 ${current.maxTemp}°`;

  // 2. 渲染稍後預報 (包含明天判斷)
  const scrollContainer = document.getElementById('futureForecasts');
  scrollContainer.innerHTML = '';

  // 抓今天的日期數字 (例如 24)
  const todayDate = new Date().getDate();

  others.forEach(f => {
    let p = getTimePeriod(f.startTime);

    // 判斷該預報的日期是否跟今天不同，不同就是明天
    const fDate = new Date(f.startTime);
    if (fDate.getDate() !== todayDate) {
      p = "明天" + p;
    }

    scrollContainer.innerHTML +=
      `
        <div class="mini-card">
            <div class="mini-time">${p}</div>
            <div class="mini-icon">${getWeatherIcon(f.weather)}</div>
            <div class="mini-temp">${f.minTemp}° - ${f.maxTemp}°</div>
            <div style="font-size:0.8rem; color:#888; margin-top:5px;">💧${f.rain}</div>
        </div>
      `;
  });
}


/**
 * 取得天氣資料
 * @param {string} location 地區名稱
 */
async function fetchWeather (location) {
  openLoading();

  try {
    // 1. 定義「最低等待時間」：1500 毫秒 (1.5秒)
    const delayPromise = new Promise(resolve => setTimeout(resolve, 1500));

    // 2. 定義「抓取資料」的工作
    const fetchPromise = fetch(`${API_WEATHER_URL}/${location}`).then(res => res.json());

    // 3. Promise.all 會等待「兩個都完成」才會往下走
    // result 陣列裡，第一個是 delay 的結果(沒用到)，第二個是 api 的 json 資料
    const [_, json] = await Promise.all([delayPromise, fetchPromise]);

    if (json.success) {
      renderWeather(json.data);
    }
    else {
      throw new Error("API Error");
    }
  }
  catch (e) {
    console.error(e);
    alert("天氣資料讀取失敗，狸克把網路線咬斷了！");
  }

  closeLoading();
}

/** 取得各地區天氣資料 */
const fetchWeatherKaohsiung = () => { fetchWeather("kaohsiung"); }
const fetchWeatherTaipei = () => { fetchWeather("taipei"); }
const fetchWeatherNewTaipei = () => { fetchWeather("new-taipei"); }
const fetchWeatherTaichung = () => { fetchWeather("taichung"); }


// 地區按鈕元素集合
const elmtLocationButtons = document.querySelectorAll(".location-pill");

/**
 * 切換地區按鈕的激活狀態
 * @param {HTMLElement} activeElement 
 */
function switchLocationButtons (activeElement) {
  elmtLocationButtons.forEach((item) => {
    item.classList.remove("active");
  })
  activeElement.classList.add("active");
}

elmtLocationButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    switchLocationButtons(event.target);
  });
});

/** 各地區按鈕取得自己的天氣 */
document.querySelector("#locationKaohsiung").addEventListener("click", fetchWeatherKaohsiung);
document.querySelector("#locationTaipei").addEventListener("click", fetchWeatherTaipei);
document.querySelector("#locationNewTaipei").addEventListener("click", fetchWeatherNewTaipei);
document.querySelector("#locationTaichung").addEventListener("click", fetchWeatherTaichung);


/**
 * 初始化
 */
document.addEventListener("DOMContentLoaded", () => {
  fetchWeatherKaohsiung();
  renderDate();
});