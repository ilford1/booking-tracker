# PowerShell script to update Supabase environment variables
# Usage: .\update-env.ps1

Write-Host "🚀 Updating Supabase Environment Configuration" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Prompt for new project details
$projectRef = Read-Host "Enter your new Supabase project reference (e.g., 'abcdefghij')"
$anonKey = Read-Host "Enter your new anonymous/public API key" -AsSecureString
$serviceKey = Read-Host "Enter your new service role key" -AsSecureString
$dbPassword = Read-Host "Enter your database password" -AsSecureString

# Convert secure strings back to plain text for file writing
$anonKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($anonKey))
$serviceKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($serviceKey))
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword))

# Update .env file
$envContent = @"
# Supabase Configuration for Booking Tracker
# Updated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
SUPABASE_URL=https://$projectRef.supabase.co
SUPABASE_ANON_KEY=$anonKeyPlain
SUPABASE_SERVICE_ROLE_KEY=$serviceKeyPlain

# Database Configuration
DATABASE_URL=postgresql://postgres:$dbPasswordPlain@db.$projectRef.supabase.co:5432/postgres

# Application Configuration
NODE_ENV=development
PORT=3000
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8

Write-Host ""
Write-Host "✅ Environment configuration updated successfully!" -ForegroundColor Green
Write-Host "📁 Updated file: .env" -ForegroundColor Yellow
Write-Host "🔗 Project URL: https://$projectRef.supabase.co" -ForegroundColor Cyan

# Clear sensitive variables from memory
$anonKeyPlain = $null
$serviceKeyPlain = $null
$dbPasswordPlain = $null
