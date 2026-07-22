// notes/data/site.js
// 网站要显示的"内容"，全都集中在这里。
// 想改标题、改文案、加作品？只动这个文件，组件代码一个字都不用碰。

export const home = {
  heroTitle: "关于我",
  heroSubtitle: "项目，创意，灵感，心得，我的作品",
  // 原来只有一个 featuredWork；改成数组后，首页可以并排多张作品卡
  works: [
    {
      id: "text-lab",
      kicker: "作品",
      title: "文字实验室",
      copy: "拼音和情绪，挖掘中文里的细节",
      linkLabel: "打开作品",
      href: "/text-lab",
    },
    {
      id: "factor-game",
      kicker: "作品",
      title: "因式分解掉落版",
      copy: "点击正确等式得分，10 分通关的数学小游戏",
      linkLabel: "开始游戏",
      href: "/factor-game",
    },
  ],
  identity: {
    motto: "已识乾坤大，尤怜草木青",
    learning: "零到全栈",
  },
};

export const textLab = {
  heroTitle: "文字实验室",
  heroSubtitle: "拼音和情绪，挖掘中文里的细节",
};

// 游戏页顶部大标题（给 FactorGameView / PageHeading 用）
export const factorGame = {
  heroTitle: "因式分解掉落版",
  heroSubtitle: "在掉落的等式里，找出正确的因式分解",
};