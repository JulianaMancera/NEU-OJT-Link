
  export const handleDrop = ( setFiles: React.Dispatch<React.SetStateAction<File[]>>,e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles((prevFiles) => [...prevFiles, ...droppedFiles]);
  };

