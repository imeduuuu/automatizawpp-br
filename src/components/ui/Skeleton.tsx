type SkeletonProps = {
  height?: number;
};

export function Skeleton({ height = 16 }: SkeletonProps) {
  return <div className="ds-skeleton" style={{ height }} />;
}
