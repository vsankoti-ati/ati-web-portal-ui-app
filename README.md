# ATI Web Portal UI App

A Next.js web portal application for managing employees, projects, timesheets, leave, and more.

## Setup

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   
   Copy the `.env.example` file to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   
   Update the `.env.local` file with your API base URL:
   ```
   NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
   ```
   
   For production, update the URL to your production API endpoint.

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Docker Deployment

### Building the Docker Image

1. **Build the image:**
   ```bash
   docker build -t ati-web-portal-ui \
     --build-arg NEXT_PUBLIC_API_BASE_URL=https://your-api-url.com \
     .
   ```

   **If the build fails, try the simplified Dockerfile:**
   ```bash
   docker build -f Dockerfile.simple -t ati-web-portal-ui \
     --build-arg NEXT_PUBLIC_API_BASE_URL=https://your-api-url.com \
     .
   ```

2. **Run the container:**
   ```bash
   docker run -p 3000:3000 \
     -e NEXT_PUBLIC_API_BASE_URL=https://your-api-url.com \
     ati-web-portal-ui
   ```

### Using Docker Compose

1. **Set environment variables:**
   Create a `.env` file or export the variable:
   ```bash
   export NEXT_PUBLIC_API_BASE_URL=https://your-api-url.com
   ```

2. **Run with docker-compose:**
   ```bash
   docker-compose up -d
   ```

3. **Stop the container:**
   ```bash
   docker-compose down
   ```

### Deploy to Azure Container Apps

1. **Build the image:**
   ```bash
   docker build -t ati-web-portal-ui \
     --build-arg NEXT_PUBLIC_API_BASE_URL=https://ati-webportal-api--0000014.kindfield-c58c025e.eastus.azurecontainerapps.io \
     .
   ```

2. **Tag for Azure Container Registry:**
   ```bash
   docker tag ati-web-portal-ui <your-registry>.azurecr.io/ati-web-portal-ui:latest
   ```

3. **Login to Azure Container Registry:**
   ```bash
   az acr login --name <your-registry>
   ```

4. **Push the image:**
   ```bash
   docker push <your-registry>.azurecr.io/ati-web-portal-ui:latest
   ```

5. **Deploy to Azure Container Apps:**
   ```bash
   az containerapp update \
     --name ati-web-portal-ui \
     --resource-group <your-resource-group> \
     --image <your-registry>.azurecr.io/ati-web-portal-ui:latest \
     --set-env-vars NEXT_PUBLIC_API_BASE_URL=https://your-azure-api.azurecontainerapps.io
   ```

### Troubleshooting Docker Build

If you encounter build errors:

1. **Test the build locally first:**
   ```bash
   npm install
   npm run build
   ```
   This will show you the exact error that's happening.

2. **Use the simplified Dockerfile:**
   The `Dockerfile.simple` doesn't use standalone mode and is easier to build:
   ```bash
   docker build -f Dockerfile.simple -t ati-web-portal-ui .
   ```

3. **Check build logs for details:**
   ```bash
   docker build -t ati-web-portal-ui . 2>&1 | tee build.log
   ```

4. **Clear Docker cache:**
   ```bash
   docker system prune -a
   docker build --no-cache -t ati-web-portal-ui .
   ```

5. **Common fixes:**
   - Ensure all dependencies are in `package.json`
   - Make sure `NEXT_PUBLIC_API_BASE_URL` is set (either via --build-arg or will use default)
   - Check that TypeScript/ESLint errors are being ignored in `next.config.js`

## Environment Variables

- `NEXT_PUBLIC_API_BASE_URL`: The base URL for the backend API (required)

## Project Structure

- `/src/app` - Next.js app router pages
- `/src/components` - Reusable React components
- `.env.local` - Local environment variables (not committed to git)
- `.env.example` - Template for environment variables
- `.env.production` - Production environment variables
- `Dockerfile` - Docker configuration for containerization
- `docker-compose.yml` - Docker Compose configuration

## Health Check

The application includes a health check endpoint accessible at `/api/health` for monitoring container health in Azure Container Apps.
