import { useState, useEffect, useCallback } from "react";
import { useTus } from "use-tus";
import { openDB } from "idb";

const FILE_DB_NAME = "chat-files";
const FILE_STORE_NAME = "files";

export function useResumableUploads(baseUrl, roomId, autoResume = true) {
  if (!roomId) return;

  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState([]);
  const [uploads, setUploads] = useState({});

  const saveFileToDB = async (file) => {
    const db = await openDB(FILE_DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore(FILE_STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
      },
    });
    await db.put(FILE_STORE_NAME, {
      file,
      name: file.name,
      type: file.type,
      size: file.size,
    });
  };

  const loadFilesFromDB = async () => {
    const db = await openDB(FILE_DB_NAME, 1);
    const allFiles = await db.getAll(FILE_STORE_NAME);
    const loadedFiles = allFiles.map((f) => f.file);
    setFiles(loadedFiles);

    // Auto-resume unfinished uploads
    if (autoResume) {
      loadedFiles.forEach((file) => {
        uploadFile(file, file.type, "", () => {});
      });
    }
  };

  const removeFileFromDB = async (file) => {
    const db = await openDB(FILE_DB_NAME, 1);
    const allFiles = await db.getAll(FILE_STORE_NAME);
    const entry = allFiles.find(
      (f) => f.file.name === file.name && f.file.size === file.size,
    );
    if (entry) await db.delete(FILE_STORE_NAME, entry.id);
  };

  useEffect(() => {
    loadFilesFromDB();
  }, []);

  // --- handle file selection ---
  const addFiles = async (selectedFiles, fileRules, maxSize) => {
    const invalid = [];
    const valid = [];

    for (const file of selectedFiles) {
      const ext = file.name.split(".").pop().toLowerCase();
      const allowed = Object.values(fileRules).some((rule) =>
        rule.extensions.has(ext),
      );
      if (!allowed || file.size > maxSize) {
        invalid.push(file);
      } else {
        valid.push(file);
        await saveFileToDB(file);
        if (autoResume) {
          uploadFile(file, getFileType(file), "", () => {});
        }
      }
    }

    if (invalid.length > 0) {
      const msgs = invalid.map((f) => {
        const ext = f.name.split(".").pop().toLowerCase();
        if (!Object.values(fileRules).some((rule) => rule.extensions.has(ext)))
          return `${f.name} (invalid type)`;
        if (f.size > maxSize)
          return `${f.name} (exceeds ${maxSize / 1024 / 1024}MB)`;
        return f.name;
      });
      setErrors(msgs);
    }

    setFiles((prev) => [...prev, ...valid]);
  };

  // --- upload files using use-tus ---
  const uploadFile = useCallback(
    (file, type, caption, onSuccess) => {
      const { startUpload, progress, error, isUploading } = useTus(file, {
        endpoint: `${baseUrl}/uploads`,
        retryDelays: [0, 1000, 3000, 5000],
        metadata: {
          filename: file.name,
          filetype: file.type,
          room_id: roomId,
          type,
          caption: caption || "",
        },
        onSuccess: async (uploadUrl) => {
          await removeFileFromDB(file);
          if (onSuccess) onSuccess(uploadUrl);
        },
      });

      setUploads((prev) => ({
        ...prev,
        [file.name]: { progress, error, isUploading },
      }));
      startUpload();
    },
    [baseUrl, roomId],
  );

  // --- remove file locally ---
  const removeFiles = (file) => {
    setFiles((prev) => prev.filter((f) => f !== file));
    removeFileFromDB(file);
    setUploads((prev) => {
      const copy = { ...prev };
      delete copy[file.name];
      return copy;
    });
  };

  return {
    files,
    errors,
    uploads,
    addFiles,
    removeFiles,
    uploadFile,
  };
}
