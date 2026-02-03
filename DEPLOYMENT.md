# Deployment Guide

This project is a **Vite + React** application. You can deploy it for free using **Vercel** or **Netlify**.

## Status Update
I have initialized a local Git repository for you. To deploy with the recommended method, you need to push this code to GitHub, GitLab, or Bitbucket.

## Option 1: Vercel (Best for functionality)

1.  **Create a Repo**: Go to [GitHub](https://github.com/new) and create a new empty repository.
2.  **Push Code**: Run these commands in your terminal (replace `YOUR_REPO_URL` with the one from GitHub):
    ```bash
    git remote add origin YOUR_REPO_URL
    git branch -M main
    git push -u origin main
    ```
3.  **Deploy**:
    *   Go to [vercel.com](https://vercel.com/) -> **Add New Project**.
    *   Import your new repository.
    *   **Environment Variables**:
        *   `VITE_SUPABASE_URL`: (Copy from your `.env` file)
        *   `VITE_SUPABASE_PUBLISHABLE_KEY`: (Copy from your `.env` file)
    *   Click **Deploy**.

## Option 2: Netlify (Drag & Drop - Easiest / No Git required)

If you don't want to set up GitHub right now, use this method:

1.  **Locate Build Folder**: I have already built the project. The files are in `e:\qorb-main\qorb-main\dist`.
2.  **Go to Netlify**: Visit [Netlify Drop](https://app.netlify.com/drop).
3.  **Upload**: Drag and drop the `dist` folder from your file explorer into the Netlify browser window.
4.  **Configure Env Vars (Important)**:
    *   Once deployed, go to **Site settings** -> **Environment variables**.
    *   Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
    *   **Re-deploy**: You may need to trigger a re-deploy for these to take effect.

## Summary
*   **Vercel** is better for long-term (updates automatically when you push code).
*   **Netlify Drop** is faster for right now (no GitHub setup needed).
