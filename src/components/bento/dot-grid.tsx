/**
 * 页头背后的点阵背景（照搬参考站那颗 fixed 小星星云）。
 *
 * 就是一格 16px 的圆点阵，再用 `mask-image` 的椭圆径向渐变把它四周晕开，
 * 所以只有屏幕中间一块看得见，边缘自然消失 —— 不至于变成一张廉价网格纸。
 *
 * 🔴 `dark:hidden`：**只有日间模式才渲染**。暗色下页面是 #000212 的夜空，
 *    再铺点阵会显脏；参考站暗色下靠网格容器自己的紫色辉光（见 BentoGrid）撑气氛。
 *
 * `bottom-1/4` + `-z-10`：只铺上面 3/4，且沉到所有内容下面。
 */
export function DotGrid() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 bottom-1/4 -z-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-[length:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] dark:hidden"
    />
  );
}
