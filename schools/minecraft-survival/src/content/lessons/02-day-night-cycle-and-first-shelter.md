---
title: "昼夜交替与第一晚的避难所"
slug: day-night-cycle-and-first-shelter
description: "理解现实 20 分钟对应游戏内一整天的昼夜机制，了解黑暗中敌对生物的生成规则，学会赶在黄昏前搭建简易安全庇护所。"
order: 2
quiz: false
agentOnly: true
sources:
  - material-3/original.html
  - material-3/original.html.txt
  - material-5/original.html
  - material-5/original.html.txt
  - material-7/original.html
  - material-7/original.html.txt
agentInstructions: |
  能力：学生能够准确说出游戏内白天只有 10 分钟，夜晚约 7 分钟，理解为什么必须在白天收集物资并在日落前封好庇护所，掌握“掘地三尺”或山体挖洞做庇护所并装门防怪的生存策略。
  阅读：{origin}/sources/material-7/original.html.txt 的 Conversions 与 24-hour Minecraft day 章节；{origin}/sources/material-3/original.html.txt 的 Shelters for the first night 与 Hole in the wall。
  教学指引：
  向学员抛出情景：“如果你出生后在平原上慢悠悠抓蝴蝶、看风景，8 分钟过去了才发现太阳快落山了，此时你的背包里只有几块泥土，你应该怎么在天黑后的几分钟内保住小命？为什么盖华丽的大木屋往往是新手第一晚暴毙的主因？”
  引导学员归纳：
  1. 白天仅 10 分钟，时间极度昂贵，第一晚绝不要花时间盖大房子，就地挖 3 格深的泥土坑或在悬崖山壁挖洞是生存率最高的操作；
  2. 只要周围光照降为 0，黑暗中就会自然刷新僵尸、骷髅和苦力怕；木门或泥土方块封门能彻底隔绝怪物的视线与直接攻击。
  完成条件：学习者参与第一天时间管理与庇护所应急讨论并收到教师反馈。
---

## 倒计时开始：20 分钟就是一整天

在现实世界里，一天有 24 个小时；但在 Minecraft 的世界里，时光如白驹过隙。官方维基的数据显示：{{cite 游戏内时间是现实的 72 倍 | path: material-7/original.html.txt | heading: Conversions | url: https://minecraft.wiki/w/Day-night_cycle | quote: In Minecraft, time is 72 times faster than normal time.}}！

换句话说，**现实中的短短 20 分钟，就是游戏里完整的一昼夜**。

这一天 20 分钟的时间具体是怎么分配的呢？
- **白天（约 10 分钟）**：晴空万里，阳光普照。这是你唯一能够安心伐木、收集食物、探索地形的“黄金安全期”。
- **黄昏与日落（约 1.5 分钟）**：天色渐暗，西方的太阳缓缓沉入地平线。这是世界给你的紧急预警铃声！
- **黑夜（约 7 分钟）**：群星闪烁，大地陷入深沉的黑暗。潜伏在阴影中的僵尸、带弓箭的骷髅、无声靠近的苦力怕将在黑暗中大量刷新！
- **黎明与日出（约 1.5 分钟）**：东方泛白，新的一天来临。阳光会把暴露在地表的僵尸和骷髅点燃烧死。

```predict
question: 如果你在游戏里刚出生，想要造一栋漂亮的双层木别墅，最可能发生什么？
choices: 顺利完工，成为富豪 | 房子还没建好屋顶天就黑了，被暗处刷新的怪物包围击败
answer: 房子还没建好屋顶天就黑了，被暗处刷新的怪物包围击败
explain: 很多新人在第一天总想着造宏伟的大房子，结果 10 分钟转瞬即逝。天黑时房子四面漏风，怪物直接在身边刷新，导致第一天就丢失全部物资。
```

## 为什么黑夜如此致命？光照与怪物生成

在 Minecraft 的生存机制中，大多数敌对生物（例如僵尸、骷髅、蜘蛛、苦力怕）都需要在**极低的光照度**下才会生成。

白天的大地上，阳光的光照强度高达 15，怪物无法在露天生成；然而一旦太阳落山，地表的光照会骤降到 0 级。没有防备的新人如果在旷野上游荡，很快就会陷入以一敌多的绝境。

因此，生存第一天的最高法则就是：**太阳下山之前，必须躲进一个封闭的安全庇护所！**

下面的交互时钟为你直观展示了 Minecraft 一昼夜的 20 分钟推进比例。你可以点击播放或拖动滑块，观察危险等级随时间的剧烈变化：

```html preview demo
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<style>
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    margin: 0;
    padding: 16px;
    background: #1e1b18;
    color: #e6dfd5;
    display: flex;
    justify-content: center;
  }
  .clock-card {
    background: #2b2520;
    border: 2px solid #574838;
    border-radius: 8px;
    padding: 20px;
    max-width: 460px;
    width: 100%;
    text-align: center;
    box-shadow: 0 6px 14px rgba(0,0,0,0.5);
  }
  h3 {
    margin: 0 0 10px 0;
    color: #ffd166;
    font-size: 1.15rem;
  }
  .dial-container {
    position: relative;
    width: 180px;
    height: 180px;
    margin: 16px auto;
    border-radius: 50%;
    background: conic-gradient(
      #4ea8de 0% 50%,    /* 白天 10min = 50% */
      #f77f00 50% 57.5%, /* 黄昏 1.5min = 7.5% */
      #03071e 57.5% 92.5%, /* 黑夜 7min = 35% */
      #f3a261 92.5% 100%  /* 黎明 1.5min = 7.5% */
    );
    border: 4px solid #8d775f;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: inset 0 0 12px rgba(0,0,0,0.6);
  }
  .clock-center {
    width: 80px;
    height: 80px;
    background: #2b2520;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: bold;
    color: #ffd166;
  }
  .pointer {
    position: absolute;
    width: 4px;
    height: 75px;
    background: #e63946;
    bottom: 50%;
    left: calc(50% - 2px);
    transform-origin: bottom center;
    border-radius: 2px;
    transition: transform 0.1s linear;
  }
  .info-box {
    background: #1c1815;
    border: 1px solid #4a3e31;
    border-radius: 6px;
    padding: 12px;
    margin-top: 14px;
    font-size: 0.9rem;
    line-height: 1.5;
  }
  .phase-title {
    font-weight: bold;
    font-size: 1rem;
    margin-bottom: 4px;
  }
  .controls {
    display: flex;
    gap: 8px;
    justify-content: center;
    align-items: center;
    margin-top: 14px;
  }
  input[type=range] {
    width: 60%;
    accent-color: #ffd166;
  }
  button {
    background: #588157;
    border: 1px solid #3a5a40;
    color: #fff;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
  }
</style>
</head>
<body>
<div class="clock-card">
  <h3>一昼夜（20分钟）运转表</h3>
  <div class="dial-container">
    <div class="pointer" id="hand"></div>
    <div class="clock-center">
      <span id="timeDisplay">00:00</span>
      <span style="font-size: 0.7rem; color: #aaa;">(现实分钟)</span>
    </div>
  </div>

  <div class="controls">
    <button id="toggleBtn" onclick="togglePlay()">自动转动</button>
    <input type="range" id="timeSlider" min="0" max="20" step="0.2" value="0" oninput="onSlide(this.value)">
  </div>

  <div class="info-box" id="infoPanel">
    <div class="phase-title" style="color: #4ea8de;" id="phaseName">阶段：白天 (0~10分钟)</div>
    <div id="phaseDesc">阳光充足，地表绝对安全。此时应当分秒必争地伐木、收集泥土和食物！</div>
  </div>
</div>

<script>
  let timeVal = 0;
  let timer = null;

  function updateView(val) {
    timeVal = parseFloat(val);
    const deg = (timeVal / 20) * 360;
    document.getElementById('hand').style.transform = `rotate(${deg}deg)`;
    
    const mins = Math.floor(timeVal);
    const secs = Math.floor((timeVal - mins) * 60);
    document.getElementById('timeDisplay').innerText = 
      String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
    
    const pName = document.getElementById('phaseName');
    const pDesc = document.getElementById('phaseDesc');

    if (timeVal < 10) {
      pName.innerText = '阶段：白天（安全期）';
      pName.style.color = '#4ea8de';
      pDesc.innerText = '光照度 15。不会刷新敌对怪物，抓紧时间撸树、找羊、探矿并选址！';
    } else if (timeVal < 11.5) {
      pName.innerText = '阶段：黄昏日落（警戒期！）';
      pName.style.color = '#f77f00';
      pDesc.innerText = '太阳落山，光照迅速下降。立即停下手头无关紧要的活，钻进庇护所！';
    } else if (timeVal < 18.5) {
      pName.innerText = '阶段：深夜（危险绝境）';
      pName.style.color = '#e63946';
      pDesc.innerText = '光照归零。野外大量刷新僵尸、骷髅、苦力怕，老实待在屋内或地下挖矿！';
    } else {
      pName.innerText = '阶段：黎明破晓（重见天日）';
      pName.style.color = '#f3a261';
      pDesc.innerText = '太阳从东方升起，地面上的僵尸与骷髅会在阳光下自燃化为灰烬。';
    }
  }

  function onSlide(v) {
    if (timer) togglePlay();
    updateView(v);
  }

  function togglePlay() {
    const btn = document.getElementById('toggleBtn');
    if (timer) {
      clearInterval(timer);
      timer = null;
      btn.innerText = '自动转动';
    } else {
      btn.innerText = '暂停';
      timer = setInterval(() => {
        timeVal = (timeVal + 0.1) % 20;
        document.getElementById('timeSlider').value = timeVal;
        updateView(timeVal);
      }, 80);
    }
  }

  updateView(0);
</script>
</body>
</html>
```

## 打造第一座极简安全庇护所

很多老玩家会告诉你：**在 Minecraft 的第一个夜晚，地洞比城堡更香**。

官方避难所教程总结了性价比最高的起步法：{{cite 安装木门阻挡怪物 | path: material-3/original.html.txt | heading: Hole in the wall | url: https://minecraft.wiki/w/Tutorial:Shelters | quote: You can place a door across the entrance to your shelter to protect you from mobs, while still giving you access.}}。

适合初学者的三大应急庇护所建造方案：

### 方案 A：岩壁掏洞法（推荐）
如果你出生在起伏的山地或丘陵旁边，这是最省力、最安全的方案：
1. 走到山脚的泥土或石头崖壁前；
2. 往山体内部水平挖掘 3 格深、2 格高的小通道；
3. 在里面挖出一个 $3 \times 3 \times 2$ 的小房间；
4. 将你在第 1 关合成的工作台放置在房间角落；
5. 用手头的 6 块木板，在工作台左右各摆一列（共 6 格），合成出 **木门（Wooden Door）**，安装在洞口。
6. 木门不仅能让你右键随时进出，还能完全挡住怪物的视线，骷髅的箭也射不进来！

### 方案 B：就地掘地三尺法（无山崖时的应急法）
如果你不幸出生在一望无际的大平原或沙漠上，周围没有山壁，眼看天就要黑了：
1. 在脚下连续向下挖掘 3 格深的小坑；
2. 纵身跳进坑底；
3. 抬头对着头顶上方的天空，按右键放置 1 块泥土方块封死头顶；
4. 这时你在黑黢黢的 1 格地洞里绝对安全，外面的怪物找不到你；
5. 默默等待 7 分钟过去，听到天亮鸡鸣声再挖开泥土钻出来。

在自己的小天地里，你关紧了木门，听着外面怪物漫无目的的低吼，心里却格外踏实。但待在漆黑的小屋里多无聊啊！下一关，我们将升级更高级的石制工具和生产核心——熔炉！
