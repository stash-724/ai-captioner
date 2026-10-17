import { Link } from 'react-router'
import { buttonClasses } from '../components/ui'

export default function NotFoundPage() {
  return (
    <div className="py-24 text-center">
      <p className="font-serif text-7xl text-orange-600">404</p>
      <h1 className="mt-4 text-2xl font-semibold">This page has no caption</h1>
      <p className="mt-2 text-zinc-500">Or any content at all. Let's get you back.</p>
      <Link to="/" className={`${buttonClasses('primary')} mt-8`}>
        Back to the feed
      </Link>
    </div>
  )
}
