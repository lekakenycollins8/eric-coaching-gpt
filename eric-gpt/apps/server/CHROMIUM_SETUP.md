# Setting Up Chromium for PDF Generation on Vercel

This document explains how to set up the Chromium binary for PDF generation on Vercel.

## Overview

The Eric GPT Coaching Platform uses Puppeteer to generate PDFs for submissions and trackers. In production on Vercel, we use a specialized approach with `puppeteer-core` and `@sparticuz/chromium-min` to ensure compatibility with Vercel's serverless environment.

## Required Environment Variables

Add these environment variables to your Vercel project:

1. `CHROMIUM_PATH` - URL to your hosted Chromium binary
2. `AWS_LAMBDA_JS_RUNTIME` - Set to `nodejs22.x` to fix shared library issues on Fluid Compute

## Hosting the Chromium Binary

You need to host the Chromium binary somewhere accessible (e.g., S3, GitHub Releases). Here's how to create and host it:

### Option 1: Use a pre-built binary

1. Download a pre-built binary from: https://github.com/Sparticuz/chromium/releases
2. Upload it to your preferred hosting service (S3, GitHub Releases, etc.)
3. Set the `CHROMIUM_PATH` environment variable to the URL of your hosted binary

### Option 2: Build your own binary

1. Install the package locally:
   ```
   npm install @sparticuz/chromium-min
   ```

2. Build the binary:
   ```
   npx @sparticuz/chromium-min install
   ```

3. The binary will be in `node_modules/@sparticuz/chromium-min/.local-chromium/`

4. Compress and upload this binary to your hosting service

## Vercel Configuration

The `vercel.json` file has been configured with:

- Increased memory (3008MB) for PDF generation routes
- Extended execution time (60 seconds)
- Required environment variables

## Local Development

For local development, the code will automatically use the regular Puppeteer package if available. This ensures a smooth development experience while maintaining production compatibility.

## Troubleshooting

If you encounter issues with PDF generation on Vercel:

1. Check the Vercel logs for specific error messages
2. Verify that the `CHROMIUM_PATH` environment variable is correctly set
3. Ensure the Chromium binary is accessible from the URL
4. Check if you're hitting memory or execution time limits
