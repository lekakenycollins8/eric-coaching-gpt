export const metadata = {
  title: 'Eric GPT',
  description: 'Eric GPT - AI Coaching Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
