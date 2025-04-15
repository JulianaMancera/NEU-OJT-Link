import React from "react";


export const handleFileChange = (setFiles: React.Dispatch<React.SetStateAction<File []>> ,e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);

      setFiles(( prevFiles: File[]) => [...prevFiles, ...selectedFiles]);
    }
  };



