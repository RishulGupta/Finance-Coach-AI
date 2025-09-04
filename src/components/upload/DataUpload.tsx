import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UploadedFile {
  name: string;
  size: number;
  status: 'uploading' | 'success' | 'error';
  progress: number;
}

export function DataUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      processFiles(selectedFiles);
    }
  };

  const processFiles = (fileList: File[]) => {
    const newFiles: UploadedFile[] = fileList.map(file => ({
      name: file.name,
      size: file.size,
      status: 'uploading',
      progress: 0
    }));

    setFiles(prev => [...prev, ...newFiles]);

    // Simulate file upload process
    newFiles.forEach((file, index) => {
      const interval = setInterval(() => {
        setFiles(prev => prev.map(f => {
          if (f.name === file.name) {
            const newProgress = Math.min(f.progress + 10, 100);
            return {
              ...f,
              progress: newProgress,
              status: newProgress === 100 ? 'success' : 'uploading'
            };
          }
          return f;
        }));
      }, 200);

      setTimeout(() => {
        clearInterval(interval);
      }, 2000);
    });
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gradient-primary mb-2">Upload Financial Data</h2>
        <p className="text-muted-foreground">
          Upload your bank statements, transaction files, or CSV exports to analyze your spending patterns.
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Supported formats: CSV, XLSX, PDF. Files are processed securely and stored encrypted.
        </AlertDescription>
      </Alert>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`financial-card border-2 border-dashed transition-colors ${
          isDragging ? 'border-primary bg-primary/5' : 'border-border'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center py-12">
          <Upload className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Drop files here or click to upload</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Drag and drop your files here, or click the button below
          </p>
          
          <input
            type="file"
            multiple
            accept=".csv,.xlsx,.pdf"
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button variant="outline" className="cursor-pointer">
              Choose Files
            </Button>
          </label>
        </div>
      </motion.div>

      {files.length > 0 && (
        <div className="financial-card">
          <h3 className="text-lg font-semibold mb-4">Upload Progress</h3>
          <div className="space-y-4">
            {files.map((file, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 p-4 border border-border rounded-lg"
              >
                <FileText className="h-8 w-8 text-primary" />
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{file.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Progress value={file.progress} className="flex-1" />
                    <span className="text-sm text-muted-foreground">
                      {file.progress}%
                    </span>
                  </div>
                </div>

                <div className="ml-4">
                  {file.status === 'success' && (
                    <Check className="h-5 w-5 text-secondary" />
                  )}
                  {file.status === 'uploading' && (
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}