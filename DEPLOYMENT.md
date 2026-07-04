# Deployment Guide

This guide gives you every small step needed to deploy the project on Render and Vercel.

## Before you start

1. Make sure your repository is already pushed to GitHub.
2. Make sure the project builds locally.
3. Confirm that the following files exist in the repository:
   - [client](client)
   - [server](server)
   - [ml-service](ml-service)
   - [vercel.json](vercel.json)
   - [render.yaml](render.yaml)

If you have not pushed the code yet, do that first.

---

## 1) Deploy the ML service on Render

### Step 1: Open Render
1. Go to https://render.com.
2. Sign in to your account.
3. Click New +.
4. Choose Web Service.

### Step 2: Connect your GitHub repository
1. Click Connect a repository.
2. Select your GitHub account.
3. Find your project repository.
4. Click Connect.

### Step 3: Configure the service
1. In the Name field, type something like: urdu-ocr-ml
2. In the Region field, choose the region closest to you.
3. In the Runtime field, choose Python.
4. In the Root Directory field, type: ml-service
   - This matters because the ML code lives inside the ml-service folder.
5. In the Build Command field, type:
   - pip install -r requirements.txt
6. In the Start Command field, type:
   - uvicorn main:app --host 0.0.0.0 --port 10000
7. If Render asks for Python version, set it to 3.11.

### Step 4: Add environment variables if needed
You may not need any variables for the first deployment, but you can add:
- PYTHON_VERSION=3.11

### Step 5: Create the service
1. Click Create Web Service.
2. Wait for Render to build and start the app.
3. When it finishes, Render will show a public URL.
4. Copy that URL and keep it safe.

### Step 6: Check the service
Open the URL in the browser and add /health at the end.
Example:
- https://your-ml-service-url.onrender.com/health

If it works, the ML service is deployed.

---

## 2) Deploy the backend on Render

### Step 1: Create another Render service
1. Go back to Render.
2. Click New +.
3. Choose Web Service again.

### Step 2: Connect the same repository
1. Click Connect a repository.
2. Select the same GitHub repo.
3. Click Connect.

### Step 3: Configure the backend service
1. In the Name field, type something like: urdu-ocr-backend
2. In the Region field, choose the same region as before.
3. In the Runtime field, choose Node.
4. In the Root Directory field, leave it blank if you want Render to use the repository root.
   - If it asks for a folder, use the repository root.
5. In the Build Command field, type:
   - npm install --prefix server
6. In the Start Command field, type:
   - npm start --prefix server

### Step 4: Add environment variables
In the Environment section, add these variables one by one:
- NODE_ENV=production
- PORT=10000
- MONGODB_URI=your_mongodb_connection_string
- ML_SERVICE_URL=https://your-ml-service-url.onrender.com
- JWT_SECRET=some-long-random-string

Important notes:
- Replace the ML service URL with the actual URL from the first Render service.
- Replace the MongoDB URI later after you create MongoDB.
- Use a long random string for JWT_SECRET.

### Step 5: Create the service
1. Click Create Web Service.
2. Wait for the backend to build.
3. When deployment finishes, Render will show a public URL.
4. Copy that URL.

### Step 6: Test the backend
Open the backend URL in your browser.
If the backend is running, you should see a response or a startup message.
You can also test:
- https://your-backend-url.onrender.com/api/health

That endpoint should respond.

---

## 3) Deploy the frontend on Vercel

### Step 1: Open Vercel
1. Go to https://vercel.com.
2. Sign in with your GitHub account.
3. Click Add New... and choose Project.

### Step 2: Import the repository
1. Select your GitHub repository.
2. Click Import.

### Step 3: Configure the project
1. In the Project Name field, type something like: urdu-ocr-frontend
2. In the Framework Preset field, choose Vite if it appears.
3. In the Root Directory field, use the repository root.
4. In the Build Command field, type:
   - npm run build --prefix client
5. In the Output Directory field, type:
   - client/dist

### Step 4: Add environment variables
In the Environment Variables section, add:
- VITE_API_BASE_URL=https://your-backend-url.onrender.com/api

Important:
- Replace the backend URL with the actual URL from your Render backend service.
- Keep /api at the end.

### Step 5: Deploy
1. Click Deploy.
2. Wait for the deployment to finish.
3. Vercel will give you a public frontend URL.
4. Open it in the browser.

### Step 6: Check the app
If everything works, the frontend should open and call the backend properly.

---

## 4) Update the Vercel rewrite file

The file [vercel.json](vercel.json) contains placeholder values.

### Step 1: Open the file
Open [vercel.json](vercel.json).

### Step 2: Replace the placeholder
Find this text:
- YOUR_RENDER_BACKEND_URL

Replace it with your real Render backend URL.

Example:
- https://urdu-ocr-backend.onrender.com

### Step 3: Save the file
Then push the change to GitHub.

Vercel will redeploy automatically after you push.

---

## 5) Set up MongoDB

The app can run without MongoDB, but prediction history will not be saved.

### Step 1: Create a MongoDB database
The easiest option is MongoDB Atlas.
1. Go to https://www.mongodb.com/atlas.
2. Create an account.
3. Create a new cluster.
4. Create a database user.
5. Allow connections from anywhere.

### Step 2: Get the connection string
MongoDB Atlas will give you a connection string like this:
- mongodb+srv://username:password@cluster0.example.mongodb.net/urdu_ocr?retryWrites=true&w=majority

### Step 3: Add it to Render
In your Render backend service, add:
- MONGODB_URI=your_connection_string

### Step 4: Redeploy
1. Save the environment variable.
2. Click Deploy Restart.
3. Wait for the backend to restart.

---

## 6) Final check

After all services are deployed:
1. Open your Vercel frontend URL.
2. Try uploading an image.
3. If the app works, deployment is successful.
4. If it fails, check these common issues:
   - Wrong ML service URL in Render
   - Wrong VITE_API_BASE_URL in Vercel
   - MongoDB URI missing or invalid
   - The model file is missing in the ML service

---

## Common problems and fixes

### Problem: Vercel shows a blank page
Fix:
- Make sure the build command is correct.
- Make sure output directory is set to client/dist.

### Problem: Backend cannot reach ML service
Fix:
- Check that ML_SERVICE_URL points to the correct Render URL.
- Make sure the ML service is running.

### Problem: Image prediction fails
Fix:
- Check whether the ML service is healthy.
- Check whether the model file exists.
- Check the Render logs.

### Problem: History is not saving
Fix:
- Add a valid MONGODB_URI.
- Restart the backend service.
