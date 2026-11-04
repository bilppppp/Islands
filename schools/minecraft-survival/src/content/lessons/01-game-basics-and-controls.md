---
title: "游戏世界、基本控制与第一块木头"
slug: game-basics-and-controls
description: "初入沙盒世界，掌握 WASD 键鼠移动、视角转向与背包操作，学会徒手伐木并在随身 2x2 网格中合成工作台。"
order: 1
quiz: false
agentOnly: true
sources:
  - material-1/original.html
  - material-1/original.html.txt
  - material-2/original.html
  - material-2/original.html.txt
  - material-5/original.html
  - material-5/original.html.txt
agentInstructions: |
  能力：学生能够熟练说出 WASD 移动、鼠标视角、左键长按破坏方块与右键交互放置的操作场景，理解在背包 2x2 网格中将原木转化木板并合成 3x3 工作台的不可替代流程。
  阅读：{origin}/sources/material-5/original.html.txt 的 Learning controls 与 Wood & basic crafting 章节；{origin}/sources/material-2/original.html.txt 的 Crafting system。
  教学指引：
  遵循共享教学原则，向学员提出初始思考：“刚出生在这个由方块构成的无限世界里，你赤手空拳，如果想要做出一张 3x3 的工作台，你的第一步动作是什么？为什么不能直接在背包里做出镐子？”
  观察学员回答，引导学员理顺两个核心常识：
  1. 必须先长按左键徒手砍伐原木（不能只点一下，需要持续按住直到方块碎裂）；
  2. 背包里只有 2x2 的随身合成栏，无法摆出 3x3 的镐子或剑等高级配方，因此工作台是通往一切高级工具的母机。
  完成条件：学习者参与伐木与随身合成讨论并收到教师关于核心操作的反馈。
---

## 欢迎来到方块世界

想象一下，你被传送到一个由无数一米见方的立方体（方块）组成的广袤星球。这里有高耸的雪山、茂密的丛林、奔流的河流与幽深的洞穴。最神奇的是：**这个世界里的一切都可以被破坏、收集，然后重新搭建**！

作为一个零基础玩家，你刚刚点击“创建新世界”降生在这片大地上。此时你两手空空，四周静悄悄的。要在这个世界里好好活下去，第一件事就是让你的双手听从你的指挥。

## 认识你的双眼与手脚：基础键鼠操作

在 Minecraft 中，最标准的游玩方式是通过键盘与鼠标联动：{{cite 键鼠基本控制 | path: material-5/original.html.txt | heading: Learning controls | url: https://minecraft.wiki/w/Tutorial:Beginner%27s_guide | quote: This tutorial mostly assumes that you are playing using a keyboard and mouse, but other methods of controls may be mentioned in other parts.}}。初学者只要记住下面这几个最重要的按键，就能畅行无阻：

- **移动身体**：左手放在键盘常用的 `W`、`A`、`S`、`D` 键上。
  - `W`：向前走（快速双击 `W` 或按住 `Ctrl + W` 可以疾跑奔跑）。
  - `S`：向后退。
  - `A` / `D`：向左、向右平移。
  - `空格键（Space）`：跳跃。在水里按住空格键可以向上浮出水面呼吸。
  - `左 Shift 键`：**潜行（蹲伏）**。这个按键非常神奇：当你按住 Shift 走路时，无论你怎么往前挪，角色的脚掌都会牢牢抓在方块边缘，**绝对不会掉下悬崖或岩浆**！
- **转动视角**：右手握住鼠标轻轻移动，屏幕里的视线就会随之上下左右转动。
- **破坏方块与攻击（鼠标左键）**：
  - **重要提醒**：破坏方块**不是快速连点鼠标**，而是必须**按住左键不放**！你会看到方块表面逐渐出现裂纹，几秒钟后“啪”的一声方块碎成一个小小的浮空掉落物，走过去就能捡进背包。
- **放置方块与交互（鼠标右键）**：
  - 手里拿着方块时，对着地面或墙面点击右键，可以把方块摆放在世界上。
  - 对着工作台、箱子、门或床点击右键，可以打开它们或触发互动。
- **打开随身背包（E 键）**：按键盘上的 `E` 键，随时呼出你的随身物品栏和 2x2 合成栏。

```predict
question: 如果你想砍倒一棵树，走上前去狂按鼠标左键几十次，树木会不会掉落？
choices: 会，只要按得足够快就能砍断 | 不会，必须长按鼠标左键不松手，直到方块碎裂
answer: 不会，必须长按鼠标左键不松手，直到方块碎裂
explain: 在 Minecraft 中破坏任何方块（无论是泥土、木头还是石头）都需要持续提供破坏进度。快速连点左键只会不断重置破坏动作，方块永远不会被打破。
```

## 要想富，先撸树：你的第一块原木

在 Minecraft 玩家社区里有一句传唱了十多年的真理：“**要想富，先撸树**”。

为什么树木这么重要？因为木材是一切工具、武器、火把和建筑材料的起点。哪怕你以后全身穿着闪闪发光的下界合金盔甲，最初也是从一截小木头开始的。

行动指南：
1. 出生后先环顾四周，寻找最近的一棵树木；
2. 走近树干，将准星对准最低的一截原木；
3. **按住鼠标左键不松开**，角色会挥动拳头敲击树木；
4. 大约 2~3 秒后，这块橡木原木（Oak Log）碎裂变成漂浮的小方块，走上前触碰它，它就进入了你的物品快捷栏（屏幕最下方的一排 9 个格子里）。
5. 顺手把这棵树底部的 3~4 块原木都敲下来收好。

## 随身背包与 2x2 合成机制

在游戏中，{{cite 摆放物品以符合配方 | path: material-2/original.html.txt | heading: Crafting system | url: https://minecraft.wiki/w/Crafting | quote: Players craft by arranging items in the crafting grid to match a given recipe.}}。

现在按下键盘上的 `E` 键，你会打开角色界面。界面中央是你的 27 格背包，而右上角有一个由 4 个小格子排成的小正方形，这就是**随身 2x2 合成栏**。

两步核心合成法：
1. **原木制木板**：将刚才捡到的 1 块橡木原木，拖进 2x2 合成栏的任意一个格子里。右侧输出框立刻会生成 **4 块橡木木板（Oak Planks）**！点击右侧取出来放回背包。
2. **木板制工作台**：把木板分别摆满 2x2 合成栏的全部 4 个格子（左上、右上、左下、右下各放 1 块木板）。看！右侧生成了一个带有工具图案的方块——**工作台（Crafting Table）**！

下面的互动演示模拟了随身 2x2 合成过程。点击按钮尝试亲手将原木变成木板，并打造你的第一张工作台：

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
    background: #2a221b;
    color: #f3ece0;
    display: flex;
    justify-content: center;
  }
  .crafting-card {
    background: #3b3024;
    border: 3px solid #6b583e;
    border-radius: 8px;
    padding: 20px;
    max-width: 480px;
    width: 100%;
    box-shadow: 0 8px 16px rgba(0,0,0,0.4);
  }
  h3 {
    margin: 0 0 12px 0;
    color: #e6be6f;
    font-size: 1.15rem;
    text-align: center;
  }
  .desc {
    font-size: 0.9rem;
    color: #c8b9a6;
    margin-bottom: 16px;
    line-height: 1.5;
    text-align: center;
  }
  .workbench-layout {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin: 16px 0;
  }
  .grid-2x2 {
    display: grid;
    grid-template-columns: repeat(2, 54px);
    grid-template-rows: repeat(2, 54px);
    gap: 4px;
    background: #1c1610;
    padding: 6px;
    border: 2px solid #5a4732;
    border-radius: 6px;
  }
  .slot {
    background: #8b8b8b;
    border: 2px inset #373737;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: bold;
    color: #111;
    cursor: pointer;
    user-select: none;
    text-align: center;
    padding: 2px;
  }
  .slot.filled {
    background: #b08958;
    color: #fff;
    border-color: #7f5539;
  }
  .arrow {
    font-size: 1.8rem;
    color: #e6be6f;
  }
  .output-slot {
    width: 64px;
    height: 64px;
    background: #4a4a4a;
    border: 3px inset #222;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    font-weight: bold;
    color: #ffd166;
    text-align: center;
    border-radius: 4px;
  }
  .buttons {
    display: flex;
    gap: 8px;
    justify-content: center;
    margin-top: 16px;
  }
  button {
    background: #588157;
    border: 2px solid #3a5a40;
    color: #fff;
    padding: 8px 14px;
    border-radius: 4px;
    font-weight: bold;
    cursor: pointer;
    font-size: 0.85rem;
    transition: background 0.2s;
  }
  button:hover {
    background: #3a5a40;
  }
  .btn-reset {
    background: #6c757d;
    border-color: #495057;
  }
  .btn-reset:hover {
    background: #495057;
  }
  .status-text {
    margin-top: 12px;
    font-size: 0.85rem;
    text-align: center;
    color: #a3b18a;
    min-height: 20px;
  }
</style>
</head>
<body>
<div class="crafting-card">
  <h3>随身 2x2 合成模拟</h3>
  <div class="desc">点击下方操作按钮，体验从 1 截原木到工作台的质变过程：</div>
  
  <div class="workbench-layout">
    <div class="grid-2x2">
      <div class="slot" id="s0">空</div>
      <div class="slot" id="s1">空</div>
      <div class="slot" id="s2">空</div>
      <div class="slot" id="s3">空</div>
    </div>
    <div class="arrow">➔</div>
    <div class="output-slot" id="outSlot">？</div>
  </div>

  <div class="buttons">
    <button onclick="setLog()">放入 1 块原木</button>
    <button onclick="setPlanks()">摆满 4 块木板</button>
    <button class="btn-reset" onclick="resetGrid()">清空格子</button>
  </div>

  <div class="status-text" id="statusMsg">当前状态：背包合成栏空置</div>
</div>

<script>
  function setLog() {
    document.getElementById('s0').innerText = '原木x1';
    document.getElementById('s0').className = 'slot filled';
    document.getElementById('s1').innerText = '空';
    document.getElementById('s1').className = 'slot';
    document.getElementById('s2').innerText = '空';
    document.getElementById('s2').className = 'slot';
    document.getElementById('s3').innerText = '空';
    document.getElementById('s3').className = 'slot';
    document.getElementById('outSlot').innerText = '木板x4';
    document.getElementById('statusMsg').innerText = '配方匹配：1 块原木转化为了 4 块橡木木板！';
  }
  function setPlanks() {
    document.getElementById('s0').innerText = '木板';
    document.getElementById('s0').className = 'slot filled';
    document.getElementById('s1').innerText = '木板';
    document.getElementById('s1').className = 'slot filled';
    document.getElementById('s2').innerText = '木板';
    document.getElementById('s2').className = 'slot filled';
    document.getElementById('s3').innerText = '木板';
    document.getElementById('s3').className = 'slot filled';
    document.getElementById('outSlot').innerText = '工作台x1';
    document.getElementById('statusMsg').innerText = '配方匹配：4 块木板成功合成了 3x3 工作台母机！';
  }
  function resetGrid() {
    for (let i = 0; i < 4; i++) {
      const el = document.getElementById('s' + i);
      el.innerText = '空';
      el.className = 'slot';
    }
    document.getElementById('outSlot').innerText = '？';
    document.getElementById('statusMsg').innerText = '已重置随身合成栏。';
  }
</script>
</body>
</html>
```

## 为什么工作台是“一切的母机”？

把合成出来的工作台拿到手中，找到一处平坦地面点击**鼠标右键**，它就会实体化坐落在地面上。

再次把准星对准放置好的工作台，点击**鼠标右键**打开它——哇！呈现在你眼前的，是一个宽敞的 **3x3 网格（共 9 个格子）**！

随身 2x2 的格子太小了，只能做木板、火把或工作台；而真正强力的镐子、剑、斧、铁铲、熔炉和防具，都需要在 3x3 的九宫格里摆出特定的形状。

恭喜你！你已经掌握了移动、破坏与最初级的合成。但请抬头看一眼天空——天上的太阳正在缓缓移动，黑夜正在倒计时。我们必须在太阳落山前做好准备！
