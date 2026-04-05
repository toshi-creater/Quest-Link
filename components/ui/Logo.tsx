type Props = {
  height?: number;
};

export function Logo({ height = 32 }: Props) {
  const width = Math.round((192 / 52) * height);
  // SVGはnext/imageの最適化対象外のため<img>を使用
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/logo.svg" alt="QuestLink" width={width} height={height} />;
}
