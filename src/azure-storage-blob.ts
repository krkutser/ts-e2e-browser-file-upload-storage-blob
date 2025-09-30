// ./src/azure-storage-blob.ts

import { BlobServiceClient, ContainerClient, BlockBlobParallelUploadOptions } from "@azure/storage-blob";

// ==========================
// Configurations
// ==========================
const containerName = `files`;
const sasToken = process.env.REACT_APP_AZURE_STORAGE_SAS_TOKEN;
const storageAccountName = process.env.REACT_APP_AZURE_STORAGE_RESOURCE_NAME;

// Build the full Blob Service URL
const uploadUrl = `https://${storageAccountName}.blob.core.windows.net/?${sasToken}`;
console.log("Azure Blob Storage URL:", uploadUrl);

// Initialize Blob Service Client
const blobService = new BlobServiceClient(uploadUrl);

// Get the container client
const containerClient: ContainerClient = blobService.getContainerClient(containerName);

// ==========================
// Utility: Check Storage Configuration
// ==========================
export const isStorageConfigured = (): boolean => !!storageAccountName && !!sasToken;

// ==========================
// Get all blobs in container
// ==========================
export const getBlobsInContainer = async () => {
  const returnedBlobUrls: { url: string; name: string }[] = [];

  for await (const blob of containerClient.listBlobsFlat()) {
    returnedBlobUrls.push({
      url: `https://${storageAccountName}.blob.core.windows.net/${containerName}/${blob.name}?${sasToken}`,
      name: blob.name,
    });
  }

  return returnedBlobUrls;
};

// ==========================
// Upload a single file with optional progress callback
// ==========================
const createBlobInContainer = async (
  file: File,
  options?: BlockBlobParallelUploadOptions
) => {
  const blobClient = containerClient.getBlockBlobClient(file.name);

  const uploadOptions: BlockBlobParallelUploadOptions = {
    blobHTTPHeaders: { blobContentType: file.type },
    ...options,
  };

  await blobClient.uploadBrowserData(file, uploadOptions);
};

// ==========================
// Main export: Upload file
// ==========================
const uploadFileToBlob = async (
  file: File,
  options?: BlockBlobParallelUploadOptions
) => {
  if (!file) return;
  await createBlobInContainer(file, options);
};

export default uploadFileToBlob;
