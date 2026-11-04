---
title: "生命值、饥饿度与熔炉烹饪"
slug: hunger-health-and-smelting
description: "搞清 20 点生命值与 20 点饥饿度运作机制，掌握饱食度、疾跑消耗与自动回血条件，学会用熔炉与各种燃料烹饪熟肉与烧制木炭。"
order: 4
quiz: false
agentOnly: true
sources:
  - material-4/original.html
  - material-4/original.html.txt
  - material-9/original.html
  - material-9/original.html.txt
  - material-12/original.html
  - material-12/original.html.txt
agentInstructions: |
  能力：学生能清晰解释生命值（20 点/10 颗心）与饥饿值（20 点/10 个肉排）的互动机制，掌握饥饿值 >= 18（9 个肉排以上）自动消耗饱和度回血、<= 6 点（3 个肉排以下）丧失疾跑能力、归零时持续掉血扣至残废甚至死亡的规律；掌握熔炉上下槽摆放（上方原料、下方燃料）以及煤炭、木炭、原木的燃料差异。
  阅读：{origin}/sources/material-4/original.html.txt 的 Hunger、Sprinting、Starvation；{origin}/sources/material-9/original.html.txt 的 Furnace、Food、Fuel；{origin}/sources/material-12/original.html.txt 的 Regaining health。
  教学指引：
  为学员设立具体问题：“当你身受重伤只剩 2 颗心，身上有生羊肉，但是周围黑漆漆的一块煤矿都没有挖到。你怎么在自己的安全小屋里把血量回满？”
  引导学员分析出完整生存逻辑：
  1. 砍伐原木，在熔炉上方放原木（或木板），下方放木板当引火燃料，烧制出**木炭（Charcoal）**；木炭在燃烧效率上与天然煤炭完全一模一样，每块能烧炼 8 个物品！
  2. 再用烧好的木炭放在下方作为高热燃料，上方放生肉，花 10 秒烤熟成熟羊肉；
  3. 吃下熟食将饥饿值补满（10 个鸡腿全满），隐形的饱和度充盈，身体就会自动消耗能量源源不断恢复红心。
  完成条件：学习者分析饥饿生命机制与无煤冶炼技巧并收到教师反馈。
---

## 屏幕下方的两大守护神：红心与肉排

当你观察游戏界面最下方的快捷栏上方时，会看到两排重要图标：
- **左侧：10 颗红心（生命值 Health）**。每颗心代表 2 点生命，总共有 **20 点生命值**。受到跌落摔伤、溺水窒息、怪物殴打或火焰灼烧时，红心会减少并剧烈抖动；一旦 10 颗心全部扣完，角色就会阵亡！
- **右侧：10 个烤鸡腿（饥饿度 Hunger）**。每个鸡腿代表 2 点饥饿值，总计也是 **20 点饥饿度**。

很多人以为“生命值不够了就吃血瓶”，但 Minecraft 的生理系统设计得极其精妙真实：{{cite 饥饿度决定回血、疾跑与饥饿状态 | path: material-4/original.html.txt | heading: Hunger | url: https://minecraft.wiki/w/Hunger | quote: Hunger is a value that determines healing, whether or not the player can sprint, and whether or not the player is starving.}}！

## 饥饿度与生命恢复的三大临界阈值

你的身体能不能自愈，完全取决于你的胃：

1. **饱腹自愈区（18~20 点，即 9 个鸡腿以上）**：
   只要你的饥饿度保持在 18 点以上，并且拥有隐藏的“饱和度（Saturation）”，身体就会每隔几秒自动消耗微量饥饿度，**源源不断地恢复受损的红心**！
2. **行动受限区（$\le 6$ 点，即 3 个鸡腿及以下）**：
   当你奔波过度导致鸡腿掉到 3 个或更少时，你会发现自己**无法双击 W 疾跑了**，只能像散步一样慢吞吞走动。如果此时遇到苦力怕追击，你将很难拉开距离！
3. **极度饥饿濒死区（0 点，鸡腿全空）**：
   饥饿度彻底归零时，你的屏幕会开始闪烁并持续剧痛扣血。在普通（Normal）难度下，饥饿会把你一路扣到只剩残存的半颗心（1 点生命），哪怕从一米高的台阶踩空都会当场去世！

```predict
question: 如果你在探险时不小心摔掉了 6 颗心（只剩 4 颗心），此时饥饿度也是满的，想要回血需要怎么做？
choices: 必须寻找医疗箱或绷带 | 什么都不用做，保持静止或安全走动，饱食度会自动将红心回满
answer: 什么都不用做，保持静止或安全走动，饱食度会自动将红心回满
explain: Minecraft 没有绷带或医疗包。只要饥饿度高于 18 点，身体就会自动触发自然再生（Natural Regeneration），将饥饿能量转化为生命值！
```

## 熔炉运转法则：原料、燃料与时间

既然填饱肚子是活下去的唯一前提，那食物该怎么准备？

虽然你可以直接吃地里拔出来的胡萝卜或者路边打掉的生肉，但**吃熟肉的营养价值是生肉的两到三倍**！吃生鸡肉甚至有 30% 的概率食物中毒，反而让你恶心脱水掉饥饿。

把生肉变成香喷喷熟食的魔法仪器，就是上一关用 8 块圆石造出的**熔炉（Furnace）**。

右键打开熔炉，界面非常清晰直观：
- **上方槽（原料槽）**：放要加热的东西，比如生牛肉、生羊肉、生猪肉，或者挖出来的粗铁矿。
- **下方槽（燃料槽）**：放易燃物。熔炉中央有一簇火苗图标，显示当前燃烧剩余时长。
- **中间火焰与右侧箭头**：维基熔炉机制严格记载：{{cite 熔炉烧炼一件物品需 10 秒 | path: material-9/original.html.txt | heading: Furnace | url: https://minecraft.wiki/w/Smelting | quote: The furnace takes 10 seconds (200 in-game ticks) to smelt an item.}}。

### 新手神技：没有煤矿？自己烧木炭！
很多新手在第一晚最头疼的问题就是：“我没找到黑色的煤炭矿石，怎么点亮火把和烧肉啊？”

记住这个绝妙的替代方案——**木炭（Charcoal）**：
1. 原木不仅可以做木板，还能放进熔炉！
2. 把 **原木** 放在熔炉上方原料槽；
3. 把随手合成的木板或木棍放在下方做引火物；
4. 烧制出来的黑色方块就是木炭！
5. **木炭的性能、燃烧时间和配方效果，与天然煤炭 100% 完全一样**！1 块木炭同样可以烧炼 8 个物品，或者配合木棒合成 4 支照亮世界的火把！

下面的动态模拟器直观展示了饥饿度、饱和度与生命恢复的实时关系。点击按钮执行不同行动，体验食物对生存的决定性影响：

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
    background: #1c1a17;
    color: #ebdcd0;
    display: flex;
    justify-content: center;
  }
  .stat-card {
    background: #2a2520;
    border: 2px solid #524434;
    border-radius: 8px;
    padding: 18px;
    max-width: 480px;
    width: 100%;
    box-shadow: 0 6px 14px rgba(0,0,0,0.5);
  }
  h3 {
    margin: 0 0 14px 0;
    color: #ffd166;
    text-align: center;
    font-size: 1.15rem;
  }
  .bars-container {
    background: #181512;
    border: 2px solid #42362a;
    border-radius: 6px;
    padding: 12px;
    margin-bottom: 16px;
  }
  .bar-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    font-size: 0.9rem;
  }
  .meter {
    flex: 1;
    height: 16px;
    background: #332d27;
    border-radius: 8px;
    margin: 0 10px;
    overflow: hidden;
    border: 1px solid #5a4b3b;
    position: relative;
  }
  .meter-fill {
    height: 100%;
    transition: width 0.3s ease;
  }
  .fill-hp { background: #e63946; }
  .fill-hunger { background: #b08968; }
  .btn-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    margin-top: 12px;
  }
  button {
    background: #4a5759;
    border: 1px solid #6b705c;
    color: #fff;
    padding: 8px;
    border-radius: 4px;
    font-weight: bold;
    cursor: pointer;
    font-size: 0.85rem;
  }
  button:hover { background: #354f52; }
  .btn-eat { background: #588157; border-color: #3a5a40; }
  .btn-eat:hover { background: #3a5a40; }
  .btn-hurt { background: #d90429; border-color: #9b2226; }
  .btn-hurt:hover { background: #9b2226; }
  .log-box {
    margin-top: 14px;
    padding: 10px;
    background: #1b1714;
    border-left: 4px solid #ffd166;
    font-size: 0.85rem;
    line-height: 1.5;
    min-height: 38px;
    color: #ddd;
  }
</style>
</head>
<body>
<div class="stat-card">
  <h3>生命值与饥饿度联动面板</h3>

  <div class="bars-container">
    <div class="bar-row">
      <span>生命 (HP):</span>
      <div class="meter"><div class="meter-fill fill-hp" id="hpFill" style="width: 100%;"></div></div>
      <span id="hpText" style="color:#e63946; font-weight:bold;">20 / 20</span>
    </div>
    <div class="bar-row">
      <span>饥饿度:</span>
      <div class="meter"><div class="meter-fill fill-hunger" id="hungerFill" style="width: 100%;"></div></div>
      <span id="hungerText" style="color:#b08968; font-weight:bold;">20 / 20</span>
    </div>
  </div>

  <div class="btn-grid">
    <button onclick="doSprint()">急行疾跑 100米</button>
    <button class="btn-hurt" onclick="takeDamage()">摔落跌伤 (-6 HP)</button>
    <button class="btn-eat" onclick="eatSteak()">进食烤牛排 (+8 饥饿)</button>
    <button onclick="naturalRest()">安全原地休整 5秒</button>
  </div>

  <div class="log-box" id="logMsg">
    状态正常：饱腹充盈，身体处于最健康的巅峰状态。
  </div>
</div>

<script>
  let hp = 20;
  let hunger = 20;

  function update() {
    hp = Math.max(0, Math.min(20, hp));
    hunger = Math.max(0, Math.min(20, hunger));

    document.getElementById('hpFill').style.width = (hp / 20 * 100) + '%';
    document.getElementById('hpText').innerText = hp + ' / 20';
    document.getElementById('hungerFill').style.width = (hunger / 20 * 100) + '%';
    document.getElementById('hungerText').innerText = hunger + ' / 20';
  }

  function doSprint() {
    if (hunger <= 6) {
      document.getElementById('logMsg').innerText = '【警报】饥饿度低于等于6点（仅剩3个肉排），角色体力耗尽，无法疾跑！请尽快进食！';
      return;
    }
    hunger -= 4;
    document.getElementById('logMsg').innerText = '疾跑加速消耗了体力，饥饿度减少 4 点。';
    update();
  }

  function takeDamage() {
    hp -= 6;
    document.getElementById('logMsg').innerText = '遭受意外摔落伤害，扣除 6 点生命值（3 颗心）！';
    update();
  }

  function eatSteak() {
    if (hunger >= 20) {
      document.getElementById('logMsg').innerText = '饥饿值已经是满的，无法再进食（除金苹果等特殊食物外）。';
      return;
    }
    hunger = Math.min(20, hunger + 8);
    document.getElementById('logMsg').innerText = '大快朵颐吃下熟牛排！饥饿值大幅回复，并补充了丰厚的隐藏饱和度！';
    update();
  }

  function naturalRest() {
    if (hunger >= 18 && hp < 20) {
      hp = Math.min(20, hp + 4);
      hunger = Math.max(0, hunger - 2);
      document.getElementById('logMsg').innerText = '【自愈生效】饱食度高于18点，消耗2点饥饿能量，生命值自动恢复 4 点！';
    } else if (hp === 20) {
      document.getElementById('logMsg').innerText = '生命值已经全满，无需回血。';
    } else {
      document.getElementById('logMsg').innerText = '【无法回血】饥饿度不足 18 点（不足9个鸡腿），身体能量不足，停止自然回血！请先吃饭！';
    }
    update();
  }
</script>
</body>
</html>
```

吃饱喝足、满血复活，避难所里也有了温暖的熔炉与火把。但是漫长的 7 分钟黑夜总不能一直干瞪眼吧？而且如果不小心在外面阵亡了，怎么保证自己能复活在安全屋，而不是重置到万里之外？下一关，床与箱子将给你最安心的保障！
