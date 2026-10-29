export default function StaleLabel({ updatedAt }) {
  const minutes = updatedAt
    ? Math.max(0, Math.floor((Date.now() - new Date(updatedAt).getTime()) / 60000))
    : null
  const stale = minutes === null || minutes >= 30

  return (
    <span className={stale ? 'text-amber-700' : 'text-slate-500'}>
      {stale ? 'Queue data may be out of date' : `Updated ${minutes} min ago`}
    </span>
  )
}
