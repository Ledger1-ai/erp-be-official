#!/usr/bin/env ts-node
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface DeploymentConfig {
  resourceGroup: string;
  appName: string;
  location: string;
  sku: string;
  runtime: string;
}

const config: DeploymentConfig = {
  resourceGroup: process.env.AZURE_RESOURCE_GROUP || 'varuni-rg',
  appName: process.env.AZURE_APP_NAME || 'varuni-backoffice',
  location: process.env.AZURE_LOCATION || 'East US',
  sku: process.env.AZURE_SKU || 'F1',
  runtime: 'NODE:18-lts'
};

function executeCommand(command: string, description: string) {
  console.log(`\n🔄 ${description}...`);
  console.log(`   Command: ${command}`);
  
  try {
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log(`✅ ${description} completed successfully`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error);
    throw error;
  }
}

function checkPrerequisites() {
  console.log('🔍 Checking prerequisites...');
  
  // Check if Azure CLI is installed
  try {
    execSync('az --version', { stdio: 'pipe' });
    console.log('✅ Azure CLI is installed');
  } catch {
    console.error('❌ Azure CLI is not installed. Please install it first:');
    console.error('   https://docs.microsoft.com/en-us/cli/azure/install-azure-cli');
    process.exit(1);
  }
  
  // Check if logged in to Azure
  try {
    execSync('az account show', { stdio: 'pipe' });
    console.log('✅ Logged in to Azure');
  } catch {
    console.error('❌ Not logged in to Azure. Please run: az login');
    process.exit(1);
  }
  
  // Check if .env.local exists for environment variables
  if (!fs.existsSync('.env.local')) {
    console.warn('⚠️  .env.local not found. Make sure to set environment variables in Azure portal.');
  } else {
    console.log('✅ .env.local found');
  }
  
  console.log('✅ All prerequisites met');
}

function createResourceGroup() {
  const command = `az group create --name ${config.resourceGroup} --location "${config.location}"`;
  executeCommand(command, `Creating resource group: ${config.resourceGroup}`);
}

function createAppService() {
  // Create App Service Plan
  const planCommand = `az appservice plan create --name ${config.appName}-plan --resource-group ${config.resourceGroup} --sku ${config.sku} --is-linux`;
  executeCommand(planCommand, 'Creating App Service Plan');
  
  // Create Web App
  const webAppCommand = `az webapp create --resource-group ${config.resourceGroup} --plan ${config.appName}-plan --name ${config.appName} --runtime "${config.runtime}"`;
  executeCommand(webAppCommand, `Creating Web App: ${config.appName}`);
}

function configureEnvironmentVariables() {
  console.log('\n🔧 Configuring environment variables...');
  
  const envVars = [
    'NODE_ENV=production',
    'NEXT_TELEMETRY_DISABLED=1',
    'SCM_DO_BUILD_DURING_DEPLOYMENT=true',
    'WEBSITE_NODE_DEFAULT_VERSION=18.19.0'
  ];
  
  // Read .env.local if it exists
  if (fs.existsSync('.env.local')) {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    
    for (const line of lines) {
      if (line.includes('=')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        
        // Skip local-only variables
        if (key === 'NODE_ENV' || key.startsWith('NEXT_PUBLIC_')) {
          continue;
        }
        
        envVars.push(`${key}=${value}`);
      }
    }
  }
  
  // Set environment variables
  const setCommand = `az webapp config appsettings set --resource-group ${config.resourceGroup} --name ${config.appName} --settings ${envVars.join(' ')}`;
  executeCommand(setCommand, 'Setting environment variables');
  
  console.log('📝 Environment variables set:');
  envVars.forEach(envVar => {
    const [key] = envVar.split('=');
    console.log(`   • ${key}`);
  });
}

function buildAndDeploy() {
  console.log('\n📦 Building application...');
  
  // Install dependencies
  executeCommand('npm ci', 'Installing dependencies');
  
  // Build the application
  executeCommand('npm run build', 'Building Next.js application');
  
  // Deploy to Azure
  const deployCommand = `az webapp up --resource-group ${config.resourceGroup} --name ${config.appName} --plan ${config.appName}-plan --sku ${config.sku} --os-type Linux --runtime "${config.runtime}"`;
  executeCommand(deployCommand, 'Deploying to Azure App Service');
}

function showDeploymentInfo() {
  console.log('\n🎉 Deployment completed successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🌐 Application URL: https://${config.appName}.azurewebsites.net`);
  console.log(`📊 Resource Group: ${config.resourceGroup}`);
  console.log(`🏠 App Service: ${config.appName}`);
  console.log(`📍 Location: ${config.location}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  console.log('\n🔗 Useful Azure CLI commands:');
  console.log(`   • View logs: az webapp log tail --resource-group ${config.resourceGroup} --name ${config.appName}`);
  console.log(`   • Restart app: az webapp restart --resource-group ${config.resourceGroup} --name ${config.appName}`);
  console.log(`   • Scale app: az appservice plan update --resource-group ${config.resourceGroup} --name ${config.appName}-plan --sku B1`);
  
  console.log('\n⚠️  Next Steps:');
  console.log('   1. Set up custom domain (if needed)');
  console.log('   2. Configure SSL certificate');
  console.log('   3. Set up Azure Cosmos DB connection');
  console.log('   4. Configure monitoring and alerts');
  console.log('   5. Set up CI/CD pipeline');
}

async function main() {
  console.log('🚀 Azure Deployment Script for Varuni Backoffice');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📍 Deploying to: ${config.location}`);
  console.log(`🏷️  Resource Group: ${config.resourceGroup}`);
  console.log(`📱 App Name: ${config.appName}`);
  console.log(`💰 SKU: ${config.sku}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    checkPrerequisites();
    createResourceGroup();
    createAppService();
    configureEnvironmentVariables();
    buildAndDeploy();
    showDeploymentInfo();
    
  } catch (error) {
    console.error('\n💥 Deployment failed!');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Error details:', error);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Ensure Azure CLI is installed and you are logged in');
    console.log('   2. Check if the app name is unique across Azure');
    console.log('   3. Verify your Azure subscription has sufficient permissions');
    console.log('   4. Make sure the build process completes successfully');
    
    process.exit(1);
  }
}

// Handle CLI arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Azure Deployment Script for Varuni Backoffice\n');
  console.log('Usage: npm run deploy:azure\n');
  console.log('Environment Variables:');
  console.log('  AZURE_RESOURCE_GROUP - Resource group name (default: varuni-rg)');
  console.log('  AZURE_APP_NAME       - App service name (default: varuni-backoffice)');
  console.log('  AZURE_LOCATION       - Azure region (default: East US)');
  console.log('  AZURE_SKU            - App service SKU (default: F1)\n');
  console.log('Prerequisites:');
  console.log('  • Azure CLI installed');
  console.log('  • Logged in to Azure (az login)');
  console.log('  • Node.js and npm installed');
  process.exit(0);
}

// Run deployment
main(); 