import { Toaster } from '@/components/ui/sonner'

export default function Toast() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: '#0D1117',
          border: '1px solid rgba(230, 237, 243, 0.06)',
          color: '#E6EDF3',
        },
      }}
    />
  )
}
