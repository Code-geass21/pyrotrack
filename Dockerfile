# ==========================================
# STAGE 1: Build the React Frontend
# ==========================================
FROM node:18-alpine AS frontend-builder
WORKDIR /build

# Copy frontend package files
COPY frontend/package*.json ./
RUN npm install

# Copy the rest of the frontend code and build it
COPY frontend/ ./
RUN npm run build

# ==========================================
# STAGE 2: Build the FastAPI Backend
# ==========================================
FROM python:3.11-slim
WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the Python backend code
COPY backend/ .

# Copy the built React files from Stage 1 into the container
COPY --from=frontend-builder /build/dist /frontend_build

# Expose the internal port
EXPOSE 8000

# Run the Uvicorn server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
