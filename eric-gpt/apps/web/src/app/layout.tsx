import "../index.css";
import { Providers } from '@/app/providers';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import type { Session } from "next-auth";

export const metadata = {
  title: "Eric GPT Coaching Platform",
  description: "AI-powered leadership coaching with the Jackier Method",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}