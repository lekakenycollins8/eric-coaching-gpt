import { NextAuthOptions } from 'next-auth';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import EmailProvider from 'next-auth/providers/email';
import clientPromise from './mongodb';
import type { Adapter } from 'next-auth/adapters';
import nodemailer from 'nodemailer';
import 'server-only';

/**
 * NextAuth.js configuration with EmailProvider (magic links)
 * Uses Nodemailer for sending emails and MongoDB for storing sessions and users
 */
export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise as any) as Adapter,
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
          subject: `Sign in to Eric GPT Coaching`,
          text: `Sign in to Eric GPT Coaching\n\n${url}\n\nIf you did not request this email, you can safely ignore it.`,
          html: `
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
              <h2 style="color: #333; text-align: center; margin-bottom: 30px;">Eric GPT Coaching</h2>
              <p style="font-size: 16px; line-height: 1.5; margin-bottom: 30px;">Click the button below to sign in to your Eric GPT Coaching account.</p>
              <div style="text-align: center; margin-bottom: 30px;">
                <a href="${url}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Sign In</a>
              </div>
              <p style="font-size: 14px; color: #666; margin-bottom: 10px;">If the button doesn't work, you can also click on this link:</p>
              <p style="font-size: 14px; margin-bottom: 30px;"><a href="${url}" style="color: #4F46E5;">${url}</a></p>
              <p style="font-size: 14px; color: #666; text-align: center; margin-bottom: 10px;">If you did not request this email, you can safely ignore it.</p>
              <p style="font-size: 12px; color: #999; text-align: center;">&copy; ${new Date().getFullYear()} Eric GPT Coaching. All rights reserved.</p>
            </div>
          `,
        });
        
        const failed = result.rejected.concat(result.pending).filter(Boolean);
        if (failed.length) {
          throw new Error(`Email(s) (${failed.join(", ")}) could not be sent`);
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify-request',
    error: '/auth/error',
  },
  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user && token?.sub) {
        // Add the user ID to the session with proper type handling
        session.user = {
          ...session.user,
          id: token.sub
        };
      }
      return session;
    },
    jwt: async ({ token, user }) => {
      if (user) {
        // Add the user ID to the token
        token.id = user.id;
      }
      return token;
    },
  },
};
