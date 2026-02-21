export default function ErrorMessage({ message }: { message: string }): React.JSX.Element {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <p className="text-sm text-red-700">{message}</p>
    </div>
  )
}
