import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6">
      <h1 className="font-serif text-6xl text-ice">404</h1>
      <p className="mt-4 text-lg text-muted-foreground">Page not found</p>
      <Link
        to="/"
        className="mt-6 text-sm text-ice underline underline-offset-4 hover:text-ice/80"
      >
        Back to home
      </Link>
    </div>
  )
}
