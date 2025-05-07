import "../index.css";
import { Providers } from "./providers";

export const metadata = {
  title: "Eric GPT Coaching Platform",
  description: "AI-powered leadership coaching with the Jackier Method",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}