# 🚀 Fixing Vercel Backend Connection

Your application works on localhost but fails on Vercel primarily because of **environment variable configuration** and **database connectivity**.

## 1. Set Backend Environment Variables (Vercel)
Go to your **Backend Project** in Vercel > Settings > Environment Variables and add:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `MONGO_URI` | `mongodb+srv://...` | Get this from [MongoDB Atlas](https://www.mongodb.com/products/platform/atlas-database) |
| `CORS_ORIGIN` | `https://phatak-radar.vercel.app` | Your frontend's live URL |

## 2. Set Frontend Environment Variables (Vercel)
Go to your **Frontend Project** in Vercel > Settings > Environment Variables and add:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://your-backend.vercel.app/api` | Your backend's live URL |

> [!TIP]
> If you are using the new unified `vercel.json` I created at the root, you may be able to deploy both from a single project. In that case, `VITE_API_URL` can be simply `/api`.

## 3. What I fixed in the code
1.  **Backend Startup**: Wrapped a top-level RailRadar API request in a try-catch block. Previously, if this external API was slow or down, the entire backend would crash on startup.
2.  **Environment Files**: Updated `.env` files in both directories with production placeholders and clear instructions.
3.  **Error Logging**: Improved MongoDB connection logging to tell you exactly if the `MONGO_URI` is missing in production.
4.  **Unified Routing**: Created a root `vercel.json` to support monorepo-style deployment (frontend + backend on one domain).

## Next Steps
1.  **Push these changes** to your GitHub repository.
2.  **Check Vercel Build Logs** to ensure the backend is connecting to the database.
3.  **Update the environment variables** in the Vercel dashboard as shown above.
