---
title: "床的合成、重生点设置与物品箱"
slug: bed-respawn-and-home-safety
description: "寻找羊毛制作床，掌握右键睡觉跳过漫长黑夜并重设重生点的机制，学会合成大容量物品箱保护战利品。"
order: 5
quiz: false
agentOnly: true
sources:
  - material-5/original.html
  - material-5/original.html.txt
  - material-10/original.html
  - material-10/original.html.txt
  - material-11/original.html
  - material-11/original.html.txt
agentInstructions: |
  能力：学生能说明床的双重战略价值（跳过危险黑夜、重设死亡后的复活点），解释 3 块同色羊毛 + 3 块木板的配方；能说明箱子的合成（8 块木板）和相邻并排放置自动融合为 54 格大箱子的特性，建立“出门探险前清空贵重物品入箱”的生存好习惯。
  阅读：{origin}/sources/material-10/original.html.txt 的 Sleeping、Crafting、Placement；{origin}/sources/material-11/original.html.txt 的 Container、Crafting。
  教学指引：
  为学员提出警示思考：“如果你在野外探险时不小心失足掉下深渊阵亡了，重生后却发现自己没有在温馨的小屋里醒来，而是被传送回了数千格外茫茫大海中的世界最初出生点，这是什么原因导致的？我们在放置床时有什么禁忌？”
  引导学员掌握：
  1. 床必须放置在有足够站立空间的位置（至少占用 2 格地面且周围不能全部被方块挤死堵严），如果床被意外破坏拆除，或者床周围没有有效着陆点，系统会判定“重生点缺失或被阻挡（Your home bed was missing or obstructed）”，强制重置回世界出生点；
  2. 探险前必须把采掘到的矿石、多余材料妥善放进箱子里，只带随身必要工具出门，避免一次意外死亡导致全部财产沉入谷底。
  完成条件：学习者掌握床与箱子的核心机制与防丢策略并收到教师反馈。
---

## 熬过长夜的终极神器：床

在之前的关卡里，我们在避难所里老老实实蹲守了 7 分钟等待天亮。虽然很安全，但每次夜幕降临都要原地干等 7 分钟，游戏体验未免有些漫长。

有没有一种办法，能让黑夜瞬间快进到黎明？

答案就是——**床（Bed）**！在 Minecraft 的生存体系中，床是当之无愧的战略核心，它拥有两大不可替代的强力功能：
1. **瞬间跳过黑夜与暴风雨**：只要黑夜降临，右键点击床躺下，屏幕视野会缓缓变暗入睡，仅仅 5 秒钟后，金色的阳光就会重新洒满大地！漫长的 7 分钟黑夜被瞬间略过，野外的怪物甚至来不及大规模生成。
2. **锚定个人重生点（Spawn Point）**：在没有床之前，一旦角色意外阵亡，你只能复活在最初创建世界时的坐标；而只要你在一张床上睡过觉（或者右键点击过它），**你的个人复活坐标就会被永久固定在床边**！

## 怎样做出一张床？

床的配方需要两种材料：
- **3 块同色羊毛（Wool）**：可以在野外平原上寻找咩咩叫的小羊。用铁锭合成剪刀（Shears）右键可以剪下羊毛（羊不会受伤，吃草后还会重新长出羊毛）；在没有剪刀的极度早期，也可以直接击败羊获取羊毛。
- **3 块木板（Planks）**：任意品种的木板皆可。

合成方法：
在 3x3 工作台的九宫格里：
- 中间一横排：摆放 **3 块羊毛**；
- 底下一横排：摆放 **3 块木板**。
- 一张舒适的单人床就诞生了！

右键把床放置在避难所的地板上。床需要占用前后 **2 个方块的地面空间**。维基睡眠规则指出：{{cite 光照小于等于 11 即可右键使用床入睡 | path: material-10/original.html.txt | heading: Sleeping | url: https://minecraft.wiki/w/Bed | quote: A player sleeps by using a bed when the internal sky light is 11 or below.}}。每当黄昏日落、太阳刚刚没入地平线时，就可以直接上床安睡了！

```predict
question: 如果你把床放在安全屋里睡了一觉，后来嫌床碍事把它敲掉放回背包去远方探险，不慎掉落摔死后，你会在哪里复活？
choices: 在原来放床的房间里复活 | 在世界的最初出生点复活，并提示床已丢失
answer: 在世界的最初出生点复活，并提示床已丢失
explain: 重生点的锚定依赖床实体在世界中的持续存在。一旦你把床敲掉或床被炸毁，绑定的重生点就会立刻失效，复活时会强制重置回世界生成时的原始出生点！
```

## 储物与财产保险：物品箱（Chest）

你在外面砍树、挖矿、打猎，背包里的 27 个格子很快就会被各种花花绿绿的方块塞得满满当当。如果身上带着所有家当去探险，一旦遇到意外，辛苦积攒的物资就会散落一地甚至掉进火海。

聪明的探险家在出门前，一定会把贵重战利品存放进——**箱子（Chest）**！

箱子合成极其便宜：在工作台的 3x3 九宫格里，外围一圈摆满 **8 块木板**（中间留空），就能做一个箱子。

箱子两大特性：
1. **单箱容量（27格）**：放置在地上右键打开，提供整整 27 格独立储物格，相当于一个额外的全尺寸随身背包。
2. **大箱子合并（54格超大空间）**：正如维基容器机制所指出的：{{cite 小箱子有 27 格而大箱子容量翻倍达 54 格 | path: material-11/original.html.txt | heading: Container | url: https://minecraft.wiki/w/Chest | quote: A small chest has 27 slots of inventory space, and a large chest has twice that amount, at 54 slots.}}！只要在已有的小箱子旁边再紧挨着放一个新箱子，它们就会自动“咔哒”一声吸附在一起，变成一个霸气的大号双联箱！

下面的交互面板为你演示了床的合成、箱子合并扩展以及探险前的仓储归纳法则：

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
    background: #231f1c;
    color: #ebdcd0;
    display: flex;
    justify-content: center;
  }
  .home-card {
    background: #332b25;
    border: 3px solid #635243;
    border-radius: 8px;
    padding: 18px;
    max-width: 480px;
    width: 100%;
    box-shadow: 0 6px 16px rgba(0,0,0,0.5);
  }
  h3 {
    margin: 0 0 12px 0;
    color: #ffd166;
    text-align: center;
    font-size: 1.15rem;
  }
  .feature-selector {
    display: flex;
    gap: 8px;
    justify-content: center;
    margin-bottom: 14px;
  }
  button {
    background: #588157;
    border: 1px solid #3a5a40;
    color: #fff;
    padding: 7px 14px;
    border-radius: 4px;
    font-weight: bold;
    cursor: pointer;
    font-size: 0.85rem;
  }
  button.active {
    background: #a3704c;
    border-color: #ffd166;
  }
  .display-box {
    background: #1c1815;
    border: 2px solid #4a3e33;
    border-radius: 6px;
    padding: 14px;
    text-align: center;
  }
  .chest-slots-view {
    display: grid;
    grid-template-columns: repeat(9, 1fr);
    gap: 3px;
    margin: 12px auto;
    max-width: 400px;
    background: #0d0b09;
    padding: 6px;
    border: 2px inset #555;
    border-radius: 4px;
  }
  .c-slot {
    aspect-ratio: 1;
    background: #8b8b8b;
    border: 1px solid #333;
    border-radius: 2px;
  }
  .desc-box {
    font-size: 0.85rem;
    line-height: 1.5;
    color: #d5c8be;
    margin-top: 10px;
    text-align: left;
  }
</style>
</head>
<body>
<div class="home-card">
  <h3>居家安全：床与双联大箱子</h3>

  <div class="feature-selector">
    <button class="active" id="btnBed" onclick="showBed()">床（跳过黑夜 & 重生点）</button>
    <button id="btnChest1" onclick="showChest(27)">单箱子（27格）</button>
    <button id="btnChest2" onclick="showChest(54)">双联大箱子（54格）</button>
  </div>

  <div class="display-box" id="contentArea">
    <!-- dynamic content -->
  </div>
</div>

<script>
  function showBed() {
    document.getElementById('btnBed').className = 'active';
    document.getElementById('btnChest1').className = '';
    document.getElementById('btnChest2').className = '';

    document.getElementById('contentArea').innerHTML = `
      <div style="font-size: 2.2rem; margin: 8px 0;">🛏️</div>
      <div style="font-weight: bold; color: #ffd166; font-size: 1rem;">舒适的红色床铺 (Bed)</div>
      <div class="desc-box">
        • <b>配方构成</b>：3 块同色羊毛（横排）+ 3 块木板（底排）。<br>
        • <b>黑夜终结者</b>：黄昏（光照≤11）右键入睡，5 秒后立即迎来崭新黎明！<br>
        • <b>重生守护者</b>：睡过后自动将复活坐标固定在床边。记得床头不要被方块封死，留足下床站立空隙！
      </div>
    `;
  }

  function showChest(count) {
    document.getElementById('btnBed').className = '';
    document.getElementById('btnChest1').className = (count === 27 ? 'active' : '');
    document.getElementById('btnChest2').className = (count === 54 ? 'active' : '');

    let slotsHtml = '<div class="chest-slots-view" style="grid-template-rows: repeat(' + (count / 9) + ', 1fr);">';
    for (let i = 0; i < count; i++) {
      slotsHtml += '<div class="c-slot"></div>';
    }
    slotsHtml += '</div>';

    const title = count === 27 ? '小箱子 (Chest) - 27 格空间' : '双联大箱子 (Large Chest) - 54 格超大空间';
    const note = count === 27 
      ? '由 8 块木板外围环绕合成。足以存放前几天的木材、圆石与备用工具。'
      : '将两个小箱子并排紧贴放置即可自动融合！容量翻倍，探险前把稀有矿物和多余物资全部放进去，出门轻装上阵！';

    document.getElementById('contentArea').innerHTML = `
      <div style="font-weight: bold; color: #ffd166; font-size: 1rem;">📦 ${title}</div>
      ${slotsHtml}
      <div class="desc-box">${note}</div>
    `;
  }

  showBed();
</script>
</body>
</html>
```

有了床睡个好觉，有了箱子储存财产，你的后方基地已经坚不可摧！现在是时候拿起石镐，带上火把，向大地深处的地底世界进发，去探寻真正的工业明珠——铁矿石！
