---
title: "工作台配方与石器时代进阶"
slug: crafting-system-and-stone-age
description: "展开 3x3 工作台界面，熟悉配方书系统，制作第一把木镐并开采原石，快速升级全套石质工具与熔炉。"
order: 3
quiz: false
agentOnly: true
sources:
  - material-2/original.html
  - material-2/original.html.txt
  - material-5/original.html
  - material-5/original.html.txt
agentInstructions: |
  能力：学生掌握 3x3 工作台的配方摆放规律，能说明工具阶梯演进规律（木镐挖圆石 -> 制作石镐、石斧、石剑、熔炉），理解为什么木镐只要开采出 3 块圆石就可以被石镐淘汰。
  阅读：{origin}/sources/material-2/original.html.txt 的 Crafting system 与 Recipe book；{origin}/sources/material-5/original.html.txt 的 First tools & stone。
  教学指引：
  向学员提问：“许多新手在做出第一把木镐之后，会一直拿着它去挖光整座大山，直到木镐坏掉才换新的；从资源效率和时间成本来看，正确的进阶步骤应该是怎样的？8 块圆石在工作台外圈摆一圈能做出什么关键方块？”
  引导学员理解：
  1. 木镐的唯一战略使命就是挖掘 3 块圆石（Cobblestone），挖够 3 块后立刻合成石镐，剩下的木镐丢掉或当柴烧即可。石镐的耐久度是木镐的两倍以上，挖掘速度成倍提升，更重要的是石镐才能采集铁矿！
  2. 8 块圆石围一圈（中间留空）是熔炉（Furnace）的配方，它是烧制金属与烤肉的工业引擎。
  完成条件：学习者解释工具升级路径与熔炉合成并收到教师反馈。
---

## 告别双手，拥抱工具：3x3 工作台详解

在上一关中，你在自己的避难所里安放了工作台。现在让我们右键打开它，正式跨入工具制造的广阔世界。

正如维基合成系统所指出的：{{cite 制造并使用工作台合成更复杂物品 | path: material-2/original.html.txt | heading: Crafting system | url: https://minecraft.wiki/w/Crafting | quote: To craft more complex items, a crafting table must be created, placed, and used.}}。工作台将原本简陋的 2x2 网格扩展为了 $3 \times 3$ 的九宫格，不仅能容纳更多材料，还可以按照物品在现实中的外观摆出极富几何直觉的形状！

如果你记不住成百上千种配方也不用慌。点击合成界面左侧的一本绿色小书图标，就能打开内置的配方书：{{cite 配方书是配方目录与合成指南 | path: material-2/original.html.txt | heading: Recipe book | url: https://minecraft.wiki/w/Crafting | quote: The recipe book is a mechanic that serves as a catalog of recipes and as a crafting guide.}}。只要你的背包里带齐了原材料，点击配方书里的图标，系统就会自动帮你把材料整整齐齐地码在九宫格里。

## 工具进阶的起点：木棒与木镐

在所有工具里，**稿子（Pickaxe）**是游戏里当之无愧的“万木之父”。没有镐子，你连一块石头都凿不下来（徒手敲石头需要敲十几秒，而且方块碎裂后什么都不会掉落）。

制造第一把镐子的固定流程：
1. **合成木棒（Stick）**：在工作台竖直摆放 2 块木板（一上一下），就能得到 4 根细长的木棒。木棒是几乎所有工具的握把柄身。
2. **合成木镐（Wooden Pickaxe）**：
   - 最顶上一横排（3个格子）：各放 1 块木板，构成横向的镐头；
   - 中间一列的剩下两个格子：竖直各放 1 根木棒，作为手柄。
   - 形状就像一个大大的大写英文字母 **T**！

```predict
question: 做出了第一把木镐之后，你最应该用它来做什么？
choices: 挖穿整座山直到木镐报废 | 挖出 3 块石头（圆石），立刻造一把更耐用、更快的石镐
answer: 挖出 3 块石头（圆石），立刻造一把更耐用、更快的石镐
explain: 木镐的挖掘效率极低，耐久仅有 59 点。它的唯一核心使命就是作为“敲门砖”，替你挖出最初的 3 块圆石，随后就可以立刻被石镐替代！
```

## 迅速迈入石器时代：圆石的魔力

拿着刚刚做好的木镐，去避难所附近的灰白色石块（石头）上按住左键开采。

当石头方块碎裂时，它会掉落带有裂纹质感的方块——**圆石（Cobblestone）**。

一旦你获得了圆石，木头工具的时代就可以正式翻篇了！只要把刚才木镐配方顶部的 3 块木板换成 3 块圆石，就能诞生出质感坚硬的 **石镐（Stone Pickaxe）**！

石器时代新手核心装备“四大件”：
- **石镐（Stone Pickaxe）**：配方为顶排 3 圆石 + 中列 2 木棒。耐久高达 131，挖掘速度是木镐的两倍以上，且**只有石镐或更高级别的镐才能开采出铁矿石**！
- **石剑（Stone Sword）**：配方为中列从上到下：1 圆石 + 1 圆石 + 1 木棒。攻击伤害提升到 5 点，挥砍动作干脆利落，是防身的利刃。
- **石斧（Stone Axe）**：配方为右上角 3 块圆石（L形）+ 2 根木棒。砍伐树木的速度比拳头快好几倍，在 Java 版中单次劈砍伤害甚至高达 9 点！
- **熔炉（Furnace）**：配方为九宫格周围一圈摆满 8 块圆石（中间正中心留空）。它是你日后烹饪食物和冶炼金属的核心引擎！

通过下方的 3x3 工作台交互演示器，选择不同配方，观察材料在九宫格中的经典摆放方式：

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
    background: #252321;
    color: #ede0d4;
    display: flex;
    justify-content: center;
  }
  .craft-bench {
    background: #38302b;
    border: 3px solid #6b5d52;
    border-radius: 8px;
    padding: 20px;
    max-width: 480px;
    width: 100%;
    box-shadow: 0 8px 18px rgba(0,0,0,0.5);
  }
  h3 {
    margin: 0 0 12px 0;
    color: #e6be6f;
    text-align: center;
    font-size: 1.15rem;
  }
  .recipe-tabs {
    display: flex;
    gap: 6px;
    justify-content: center;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }
  .tab-btn {
    background: #4a3e35;
    border: 1px solid #776250;
    color: #ede0d4;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 0.85rem;
    cursor: pointer;
    font-weight: bold;
  }
  .tab-btn.active {
    background: #a3704c;
    border-color: #ffd166;
    color: #fff;
  }
  .bench-view {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin: 16px 0;
  }
  .grid-3x3 {
    display: grid;
    grid-template-columns: repeat(3, 48px);
    grid-template-rows: repeat(3, 48px);
    gap: 4px;
    background: #1c1815;
    padding: 6px;
    border: 2px solid #5a493b;
    border-radius: 6px;
  }
  .cell {
    background: #8e8d8a;
    border: 2px inset #3a3936;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: bold;
    color: #111;
    text-align: center;
    padding: 2px;
  }
  .cell.cobble { background: #7f7f7f; color: #fff; }
  .cell.stick { background: #b08958; color: #fff; }
  .cell.plank { background: #d4a373; color: #111; }
  .arrow { font-size: 2rem; color: #ffd166; }
  .result-box {
    width: 64px;
    height: 64px;
    background: #4a4744;
    border: 3px inset #222;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
    font-weight: bold;
    color: #ffd166;
    border-radius: 4px;
    text-align: center;
  }
  .tip-box {
    background: #1f1b18;
    border-left: 4px solid #a3704c;
    padding: 10px;
    font-size: 0.85rem;
    line-height: 1.5;
    color: #ccc;
    margin-top: 12px;
  }
</style>
</head>
<body>
<div class="craft-bench">
  <h3>3x3 经典配方速查体验</h3>
  
  <div class="recipe-tabs">
    <button class="tab-btn active" id="tab-spick" onclick="showRecipe('spick')">石镐 (Stone Pickaxe)</button>
    <button class="tab-btn" id="tab-ssword" onclick="showRecipe('ssword')">石剑 (Stone Sword)</button>
    <button class="tab-btn" id="tab-furnace" onclick="showRecipe('furnace')">熔炉 (Furnace)</button>
    <button class="tab-btn" id="tab-torch" onclick="showRecipe('torch')">火把 (Torches)</button>
  </div>

  <div class="bench-view">
    <div class="grid-3x3" id="grid">
      <!-- 9 cells -->
      <div class="cell" id="c0"></div><div class="cell" id="c1"></div><div class="cell" id="c2"></div>
      <div class="cell" id="c3"></div><div class="cell" id="c4"></div><div class="cell" id="c5"></div>
      <div class="cell" id="c6"></div><div class="cell" id="c7"></div><div class="cell" id="c8"></div>
    </div>
    <div class="arrow">➔</div>
    <div class="result-box" id="res">石镐x1</div>
  </div>

  <div class="tip-box" id="tipText">
    顶排3圆石提供锋利镐尖，中轴2木棒提供支撑柄身。能开采铁矿和煤矿！
  </div>
</div>

<script>
  const recipes = {
    spick: {
      cells: ['圆石', '圆石', '圆石', '', '木棒', '', '', '木棒', ''],
      classes: ['cobble', 'cobble', 'cobble', '', 'stick', '', '', 'stick', ''],
      result: '石镐x1',
      tip: '石镐：顶排 3 块圆石，中间竖直插 2 根木棒。采掘硬质石块与铁矿的必备生产力！'
    },
    ssword: {
      cells: ['', '圆石', '', '', '圆石', '', '', '木棒', ''],
      classes: ['', 'cobble', '', '', 'cobble', '', '', 'stick', ''],
      result: '石剑x1',
      tip: '石剑：中间一列竖直放置 2 块圆石 + 底部 1 根木棒。基础近战防身武器。'
    },
    furnace: {
      cells: ['圆石', '圆石', '圆石', '圆石', '', '圆石', '圆石', '圆石', '圆石'],
      classes: ['cobble', 'cobble', 'cobble', 'cobble', '', 'cobble', 'cobble', 'cobble', 'cobble'],
      result: '熔炉x1',
      tip: '熔炉：外围一圈 8 块圆石围满，中间留空。用于烧制木炭、烤熟生肉和冶炼铁矿！'
    },
    torch: {
      cells: ['', '', '', '', '煤炭', '', '', '木棒', ''],
      classes: ['', '', '', '', 'cobble', '', '', 'stick', ''],
      result: '火把x4',
      tip: '火把：上方 1 块煤炭（或木炭）+ 下方 1 根木棒。一次产出 4 支火把，永久照明！'
    }
  };

  function showRecipe(key) {
    const r = recipes[key];
    const btns = document.querySelectorAll('.tab-btn');
    btns.forEach(b => b.classList.remove('active'));
    const targetBtn = document.getElementById('tab-' + key);
    if (targetBtn) targetBtn.classList.add('active');

    for (let i = 0; i < 9; i++) {
      const el = document.getElementById('c' + i);
      el.innerText = r.cells[i];
      el.className = 'cell ' + (r.classes[i] || '');
    }
    document.getElementById('res').innerText = r.result;
    document.getElementById('tipText').innerText = r.tip;
  }

  showRecipe('spick');
</script>
</body>
</html>
```

拥有了全套石质工具和熔炉，你的生存能力已经有了质的飞跃。但在旷野上奔波劳碌，你是否注意到屏幕下方的排骨图标正在一格格减少？下一关，我们将彻底解开生命值与饥饿度相互依存的神秘法则！
