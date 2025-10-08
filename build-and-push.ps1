# 517 Cycling Station - Docker Build and Push Script (Windows PowerShell)
# Usage: .\build-and-push.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  517 Cycling Station Docker Build" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$DOCKER_USERNAME = "chuntangman"
$IMAGE_TAG = "latest"

$FRONTEND_IMAGE = "${DOCKER_USERNAME}/517-frontend:${IMAGE_TAG}"
$BACKEND_IMAGE = "${DOCKER_USERNAME}/517-backend:${IMAGE_TAG}"
$DATAGEAR_IMAGE = "${DOCKER_USERNAME}/517-datagear:${IMAGE_TAG}"

# Check Docker
Write-Host "Checking Docker..." -ForegroundColor Yellow
docker version | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker is not running. Please start Docker Desktop" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Docker is running" -ForegroundColor Green
Write-Host ""

# Login to Docker Hub
Write-Host "Login to Docker Hub..." -ForegroundColor Yellow
Write-Host ""
Write-Host "If you use GitHub to login Docker Hub:" -ForegroundColor Cyan
Write-Host "1. Visit https://hub.docker.com/settings/security" -ForegroundColor White
Write-Host "2. Click 'New Access Token'" -ForegroundColor White
Write-Host "3. Create a Token and copy it" -ForegroundColor White
Write-Host "4. Use Token as password to login" -ForegroundColor White
Write-Host ""
Write-Host "Logging in..." -ForegroundColor Yellow

docker login -u $DOCKER_USERNAME
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Docker Hub login failed" -ForegroundColor Red
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "  1. Username is correct: $DOCKER_USERNAME" -ForegroundColor White
    Write-Host "  2. Use Access Token instead of password" -ForegroundColor White
    exit 1
}
Write-Host "[OK] Login successful" -ForegroundColor Green
Write-Host ""

# Build Frontend Image
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "[1/3] Building Frontend Image..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
docker build `
    --build-arg VITE_API_BASE_URL=http://47.122.117.45:3000 `
    --build-arg VITE_DATAGEAR_URL=http://47.122.117.45:50401 `
    --build-arg VITE_AMAP_API_KEY=b7fb4f223f6cbffc2d995a508d10f7cd `
    -t $FRONTEND_IMAGE `
    -f Dockerfile .

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Frontend image build failed" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Frontend image built: $FRONTEND_IMAGE" -ForegroundColor Green
Write-Host ""

# Build Backend Image
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "[2/3] Building Backend Image..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
docker build -t $BACKEND_IMAGE -f server/Dockerfile ./server

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Backend image build failed" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Backend image built: $BACKEND_IMAGE" -ForegroundColor Green
Write-Host ""

# Build DataGear Image
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "[3/3] Building DataGear Image..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
docker build -t $DATAGEAR_IMAGE -f datagear-5.5.0/Dockerfile ./datagear-5.5.0

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: DataGear image build failed" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] DataGear image built: $DATAGEAR_IMAGE" -ForegroundColor Green
Write-Host ""

# Show Images
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Built Images:" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
docker images | Select-String -Pattern "517-"
Write-Host ""

# Ask to push
$push = Read-Host "Push images to Docker Hub? (y/n)"
if ($push -ne "y" -and $push -ne "Y") {
    Write-Host "Push canceled. Script finished." -ForegroundColor Yellow
    exit 0
}

# Push Images
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Pushing images to Docker Hub..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "Pushing frontend image..." -ForegroundColor Cyan
docker push $FRONTEND_IMAGE
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Frontend image push failed" -ForegroundColor Red
    exit 1
}

Write-Host "Pushing backend image..." -ForegroundColor Cyan
docker push $BACKEND_IMAGE
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Backend image push failed" -ForegroundColor Red
    exit 1
}

Write-Host "Pushing DataGear image..." -ForegroundColor Cyan
docker push $DATAGEAR_IMAGE
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: DataGear image push failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "[SUCCESS] All images pushed to Docker Hub!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Images:" -ForegroundColor Cyan
Write-Host "  Frontend:  $FRONTEND_IMAGE" -ForegroundColor White
Write-Host "  Backend:   $BACKEND_IMAGE" -ForegroundColor White
Write-Host "  DataGear:  $DATAGEAR_IMAGE" -ForegroundColor White
Write-Host ""
Write-Host "Next: Upload docker-compose.prod.yml to Linux server 47.122.117.45" -ForegroundColor Yellow
Write-Host ""