export default function LoadingSpinner({ message }: { message?: string }): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      {message && <p className="text-sm text-gray-500 mt-3">{message}</p>}
    </div>
  )
}
