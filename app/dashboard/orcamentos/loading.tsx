export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-8 bg-slate-200 rounded-md w-48 mb-4 animate-pulse"></div>
          <div className="h-4 bg-slate-200 rounded-md w-96 animate-pulse"></div>
        </div>

        {/* Search and filters skeleton */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 mb-6 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="h-10 bg-slate-200 rounded-md flex-1 animate-pulse"></div>
            <div className="h-10 bg-slate-200 rounded-md w-32 animate-pulse"></div>
            <div className="h-10 bg-slate-200 rounded-md w-32 animate-pulse"></div>
          </div>
        </div>

        {/* Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm">
              <div className="h-6 bg-slate-200 rounded-md w-3/4 mb-4 animate-pulse"></div>
              <div className="space-y-3">
                <div className="h-4 bg-slate-200 rounded-md w-full animate-pulse"></div>
                <div className="h-4 bg-slate-200 rounded-md w-2/3 animate-pulse"></div>
                <div className="h-4 bg-slate-200 rounded-md w-1/2 animate-pulse"></div>
              </div>
              <div className="flex gap-2 mt-4">
                <div className="h-8 bg-slate-200 rounded-md w-20 animate-pulse"></div>
                <div className="h-8 bg-slate-200 rounded-md w-20 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
