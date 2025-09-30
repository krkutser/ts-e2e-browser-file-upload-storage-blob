// ./src/App.tsx
import React, { useState, useEffect } from 'react';
import uploadFileToBlob, { isStorageConfigured, getBlobsInContainer } from './azure-storage-blob';
import DisplayImagesFromContainer from './ContainerImages';

const storageConfigured = isStorageConfigured();

interface UploadFile {
  file: File;
  progress: number; // 0-100
  speed: number; // bytes/sec
  eta: number; // seconds remaining
}

const App = (): JSX.Element => {
  // All blobs in container
  const [blobList, setBlobList] = useState<{ url: string; name: string }[]>([]);
  
  // Files selected for upload
  const [filesToUpload, setFilesToUpload] = useState<UploadFile[]>([]);
  
  // UI / form management
  const [uploading, setUploading] = useState<boolean>(false);
  const [inputKey, setInputKey] = useState(Math.random().toString(36));

  // Fetch existing blobs from container
  useEffect(() => {
    getBlobsInContainer().then((list) => setBlobList(list));
  }, [filesToUpload]);

  // Handle file selection
  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList) return;

    const filesArray: UploadFile[] = Array.from(fileList).map(f => ({
      file: f,
      progress: 0,
      speed: 0,
      eta: 0,
    }));

    setFilesToUpload(filesArray);
  };

  // Handle upload
  const onFileUpload = async () => {
    if (!filesToUpload || filesToUpload.length === 0) return;

    setUploading(true);

    // Update progress per file
    const updateFileProgress = (fileName: string, progress: number, speed: number, eta: number) => {
      setFilesToUpload(prev =>
        prev.map(f =>
          f.file.name === fileName ? { ...f, progress, speed, eta } : f
        )
      );
    };

    // Upload all files in parallel
    await Promise.all(
      filesToUpload.map(async (f) => {
        const startTime = Date.now();
        let lastLoaded = 0;

        await uploadFileToBlob(f.file, {
          onProgress: (ev: { loadedBytes: number }) => {
            const now = Date.now();
            const elapsedSec = (now - startTime) / 1000;

            const loaded = ev.loadedBytes;
            const speed = elapsedSec > 0 ? (loaded - lastLoaded) / elapsedSec : 0; // bytes/sec
            const eta = speed > 0 ? (f.file.size - loaded) / speed : 0;
            const progress = Math.round((loaded / f.file.size) * 100);

            lastLoaded = loaded;

            updateFileProgress(f.file.name, progress, speed, eta);
          },
        });
      })
    );

    setUploading(false);
    setInputKey(Math.random().toString(36));
    setFilesToUpload([]);
  };

  // Display form and upload progress
  const DisplayForm = () => (
    <div>
      <input type="file" multiple onChange={onFileChange} key={inputKey} />
      <button type="button" onClick={onFileUpload} disabled={uploading || filesToUpload.length === 0}>
        Upload!
      </button>

      {filesToUpload.map(f => (
        <div key={f.file.name} style={{ marginBottom: 10 }}>
          <strong>{f.file.name}</strong> - {f.progress}%
          <div style={{ background: "#eee", height: 10, width: 300 }}>
            <div
              style={{
                width: `${f.progress}%`,
                background: "green",
                height: "100%",
              }}
            />
          </div>
          <div>
            {f.speed > 0 && (
              <>
                Speed: {(f.speed / 1024 / 1024).toFixed(2)} MB/s | ETA: {Math.round(f.eta)} sec
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <h1>Upload file to Azure Blob Storage</h1>
      {storageConfigured ? DisplayForm() : <div>Storage is not configured.</div>}
      <hr />
      {storageConfigured && blobList.length > 0 && <DisplayImagesFromContainer blobList={blobList} />}
    </div>
  );
};

export default App;
