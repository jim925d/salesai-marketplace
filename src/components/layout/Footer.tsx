import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-border bg-midnight">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ice/10">
                <span className="text-sm font-bold text-ice">S</span>
              </div>
              <span className="font-serif text-lg text-foreground">
                SalesAI
              </span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              The marketplace for AI-powered sales tools.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-medium text-foreground">Product</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  to="/store"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Browse Apps
                </Link>
              </li>
              <li>
                <Link
                  to="/dev"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  For Developers
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-medium text-foreground">Company</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <span className="text-sm text-muted-foreground">About</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">Security</span>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-medium text-foreground">Legal</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <span className="text-sm text-muted-foreground">Privacy</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">Terms</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-6">
          <p className="text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} SalesAI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
