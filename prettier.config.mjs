/**
 * Prettier 配置 —— 作为 Biome 的补充
 *
 * Biome 负责 JS/TS/JSON 等结构化代码（见 biome.json），prettier 负责
 * biome 不覆盖的文本格式（当前主要用于 markdown，详见根 package.json
 * lint-staged 中 `*.{md,mdx}` 规则）。
 *
 * 配置已与 biome.json 对齐：缩进 / 行宽 / 引号 / 分号 / 尾逗号 / 箭头
 * 括号 / HTML bracketSameLine / 行尾（lf）等保持一致，避免两边切换
 * 时产生冲突 diff。
 */
export default {
  // 每行最多多少个字符换行（与 biome formatter.lineWidth 对齐）
  printWidth: 200,
  // 缩进的空格数（与 biome formatter.indentWidth 对齐）
  tabWidth: 2,
  // 使用制表符而不是空格缩进行。
  useTabs: false,
  // 使用分号, 默认true
  semi: true,
  //  使用单引号, 默认false(在jsx中配置无效, 默认都是双引号)
  singleQuote: true,
  // 引用对象中的属性时更改是否添加引号
  quoteProps: 'as-needed',
  //是否在对象属性添加空格
  bracketSpacing: true,
  // 是否缩进Vue 文件中的代码<script>和<style>标签
  vueIndentScriptAndStyle: true,
  // jsx中使用单引号）
  jsxSingleQuote: false,
  // 在对象或数组最后一个元素后面是否加逗号
  trailingComma: 'all',
  // 对象属性括号之间打印空格
  proseWrap: 'never',
  // 行 HTML（HTML、JSX、Vue、Angular）元素放在最后一行的末尾，而不是单独放在下一行
  bracketSameLine: false,
  // 箭头函数参数周围包含括号
  arrowParens: 'always',
  // 编译指示（文件已经被Prettier格式化过会再顶部添加@prettier/@format注释）
  requirePragma: false,
  insertPragma: false,
  // 为 HTML、Vue、Angular 和 Handlebars 指定全局空白敏感度
  htmlWhitespaceSensitivity: 'strict',
  // 行结束设置,auto | lf | crlf | cr
  endOfLine: 'lf',
  // 按文件类型覆盖：markdown 用 100 字符换行 + proseWrap preserve
  // - printWidth 100：避免 markdown 代码块内长函数调用被合并（默认 200 会吞掉换行）
  // - proseWrap preserve：保留作者书写的段落软换行（默认 never 会硬合并独立条目）
  // - JSON 等文件不受影响（继续走顶层 200 + biome 对齐）
  overrides: [
    {
      files: ['*.md', '*.mdx'],
      options: {
        printWidth: 100,
        proseWrap: 'preserve',
      },
    },
  ],
};
