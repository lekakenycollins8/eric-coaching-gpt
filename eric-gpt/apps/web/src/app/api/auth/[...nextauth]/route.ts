import NextAuth from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import type { NextAuthOptions } from 'next-auth';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import clientPromise from '../../../../lib/mongodb';
import type { Adapter } from 'next-auth/adapters';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

/**
 * NextAuth.js configuration with EmailProvider (magic links)
 * Uses Nodemailer for sending emails and MongoDB for storing sessions and users
 */
export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise) as Adapter,
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      // Custom magic link email template
      sendVerificationRequest: async ({ identifier, url, provider }) => {
        const { host } = new URL(url);
        const transport = nodemailer.createTransport(provider.server);
        const result = await transport.sendMail({
          to: identifier,
          from: provider.from,
          subject: `Sign in to Eric GPT Coaching Platform`,
          text: `Sign in to Eric GPT Coaching Platform\n\nClick the link below to sign in to your account:\n${url}\n\nIf you did not request this email, you can safely ignore it.`,
          html: `
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #2F855A;">Eric GPT Coaching Platform</h1>
              </div>
              <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
                <h2>Sign in to your account</h2>
                <p>Click the button below to sign in to your account:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${url}" style="background-color: #2F855A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Sign in</a>
                </div>
                <p style="margin-top: 30px; font-size: 14px; color: #666;">
                  If you did not request this email, you can safely ignore it.<br>
                  For security, this link will expire in 24 hours and can only be used once.
                </p>
              </div>
              <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
                <p>&copy; 2025 Eric GPT Coaching Platform. All rights reserved.</p>
              </div>
            </div>
          `,
        });
        const failed = result.rejected.concat(result.pending).filter(Boolean);
        if (failed.length) {
          throw new Error(`Email(s) (${failed.join(', ')}) could not be sent`);
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify-request',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    session: ({ session, user, token }) => {
      if (token) {
        session.user.id = token.id as string;
      } else if (user) {
        session.user.id = user.id;
      }
      return session;
    },
    jwt: ({ token, user }) => {
      // Add user ID to the JWT token
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production', // Only use secure in production
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development' ? true : false, // Explicitly disable in production
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
