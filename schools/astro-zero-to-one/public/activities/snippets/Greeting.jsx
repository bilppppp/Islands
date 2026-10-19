// src/components/Greeting.jsx
// Astro 官方教程 Preact/React 交互式问候岛屿组件
import { useState } from 'preact/hooks';

export default function Greeting({ messages }) {
  const randomMessage = () => messages[(Math.floor(Math.random() * messages.length))];
  const [greeting, setGreeting] = useState(messages[0]);

  return (
    <div>
      <h3>{greeting}！ 感谢你的访问！</h3>
      <button onClick={() => setGreeting(randomMessage())}>
        切换新的问候语
      </button>
    </div>
  );
}
