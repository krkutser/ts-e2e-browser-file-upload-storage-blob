// ./src/App.tsx

import React, { useState, useEffect } from 'react';
import uploadFileToBlob, { isStorageConfigured, getBlobsInContainer } from './azure-storage-blob';
import DisplayImagesFromContainer from './ContainerImages';
const storageConfigured = isStorageConfigured();

const App = (): JSX.Element => {
  // all blobs in container
  const [blobList, setBlobList] = useState<string[]>([]);

  // current file to upload into container
  interface UploadFile {
  file: File;
  progress: number; // 0-100
  speed: number; // bytes/sec
  eta: number; // seconds remaining
}

  const [filesToUpload, setFilesToUpload] = useState<UploadFile[]>([]);
  const [fileUploaded, setFileUploaded] = useState<string>('');

  // UI/form management
  const [uploading, setUploading] = useState<boolean>(false);
  const [inputKey, setInputKey] = useState(Math.random().toString(36));

  // *** GET FILES IN CONTAINER ***
  useEffect(() => {
    getBlobsInContainer().then((list:any) =>{
      // prepare UI for results
      setBlobList(list);
    })
  }, [fileUploaded]);

  const onFileChange = (event: any) => {
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

  };

  const onFileUpload = async () => {
  if (!filesToUpload || filesToUpload.length === 0) return;

  setUploading(true);

  // Helper to update state per file
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

      // @ts-ignore
      await uploadFileToBlob(f.file, {
        onProgress: (ev: { loadedBytes: number }) => {
          const now = Date.now();
          const elapsedSec = (now - startTime) / 1000;

          const loaded = ev.loadedBytes;
          const speed = (loaded - lastLoaded) / elapsedSec; // bytes/sec
          const eta = speed > 0 ? (f.file.size - loaded) / speed : 0;
          const progress = Math.round((loaded / f.file.size) * 100);

          lastLoaded = loaded;

          updateFileProgress(f.file.name, progress, speed, eta);
        },
      });
    })
  );

  setUploading(false);
  // Reset input key to allow re-selecting same files
  setInputKey(Math.random().toString(36));
};


  };

  // display form
  const DisplayForm = () => (
    <div>
      <input type="file" multiple onChange={onFileChange} key={inputKey || ''} />
      <button type="submit" onClick={onFileUpload}>
        Upload!
          </button>
    </div>
  )

  return (
    <div>
      <h1>Upload file to Azure Blob Storage</h1>
      {storageConfigured && !uploading && DisplayForm()}
      {storageConfigured && uploading && <div>Uploading</div>}
      <hr />
      {storageConfigured && blobList.length > 0 && <DisplayImagesFromContainer blobList={blobList}/>}
      {!storageConfigured && <div>Storage is not configured.</div>}
    </div>
  );
};

export default App;




