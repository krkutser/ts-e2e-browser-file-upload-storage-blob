// ./src/azure-storage-blob.ts

// THIS IS SAMPLE CODE ONLY - NOT MEANT FOR PRODUCTION USE
import { BlobServiceClient, ContainerClient, BlockBlobParallelUploadOptions } from "@azure/storage-blob";

// ----------------------
// CONFIGURATION
// ----------------------
const containerName = `files`; // make sure this matches your Azure container
const sasToken = process.env.REACT_APP_AZURE_STORAGE_SAS_TOKEN;
const storageAccountName = process.env.REACT_APP_AZURE_STORAGE_RESOURCE_NAME;

// build upload URL
const uploadUrl = `https://${storageAccountName}.blob.core.windows.net/?${sasToken}`;
console.log("Azure Blob Storage URL:", uploadUrl);

// get BlobServiceClient
const blobService = new BlobServiceClient(uploadUrl);

// get ContainerClient
const containerClient: ContainerClient = blobService.getContainerClient(containerName);

// ----------------------
// HELPER FUNCTIONS
// ----------------------

// Check if storage is configured
export const isStorageConfigured = (): boolean => {
  return !!storageAccountName && !!sasToken;
};

// Get list of blobs in container
export const getBlobsInContainer = async () => {
  const returnedBlobUrls: { url: string; name: string }[] = [];

  for await (const blob of containerClient.listBlobsFlat()) {
    const blobItem = {
      url: `https://${storageAccountName}.blob.core.windows.net/${containerName}/${blob.name}?${sasToken}`,
      name: blob.name,
    };
    returnedBlobUrls.push(blobItem);
  }

  return returnedBlobUrls;
};

// Upload a single file to container with optional progress reporting
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

// Main export: upload a file
const uploadFileToBlob = async (
  file: File,
  options?: BlockBlobParallelUploadOptions
) => {
  if (!file) return;
  await createBlobInContainer(file, options);
};

export default uploadFileToBlob;
