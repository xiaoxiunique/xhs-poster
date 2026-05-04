# Xiaohongshu post maker

*Automatically synced with your [v0.dev](https://v0.dev) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/xiaoxiuniques-projects/rpost)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/14x0hHWvp1z)

## Overview

This repository will stay in sync with your deployed chats on [v0.dev](https://v0.dev).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.dev](https://v0.dev).

## Deployment

Your project is live at:

**[https://vercel.com/xiaoxiuniques-projects/rpost](https://vercel.com/xiaoxiuniques-projects/rpost)**

## Build your app

Continue building your app on:

**[https://v0.dev/chat/projects/14x0hHWvp1z](https://v0.dev/chat/projects/14x0hHWvp1z)**

## Storage

This app no longer connects directly to Neon/Postgres or Vercel Blob. Runtime data is stored through the external `host-server` API in host-server PostgreSQL `xhs_poster_*` tables, and uploaded images are stored in Cloudflare R2.

Required local environment:

```env
HOST_SERVER_URL=https://host.movenotes.club
XHS_POSTER_API_TOKEN=replace-with-host-server-token
```

## How It Works

1. Create and modify your project using [v0.dev](https://v0.dev)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository
