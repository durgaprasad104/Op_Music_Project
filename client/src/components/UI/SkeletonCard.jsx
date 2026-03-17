export default function SkeletonCard() {
  return (
    <div className="glass rounded-2xl overflow-hidden p-3">
      <div className="skeleton aspect-video rounded-xl mb-3" />
      <div className="skeleton h-3.5 rounded mb-2 w-3/4" />
      <div className="skeleton h-3 rounded w-1/2" />
      <div className="flex justify-between items-center mt-3">
        <div className="skeleton h-3 rounded w-16" />
        <div className="skeleton h-3 rounded w-10" />
      </div>
    </div>
  )
}
