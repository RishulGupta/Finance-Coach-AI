import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  transactionCount?: number;
  categoryCount?: number;
  message?: string;
}

interface DataUploadProps {
  onUploadSuccess?: (data: any) => void;
  maxFiles?: number;
}

export function DataUpload({ onUploadSuccess, maxFiles = 5 }: DataUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    
    const isValidType = validTypes.includes(file.type);
    const isValidExtension = validExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );

    return isValidType || isValidExtension;
  };

  const addFile = (file: File) => {
    if (!validateFile(file)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload CSV or Excel files (.csv, .xlsx, .xls)",
        variant: "destructive"
      });
      return;
    }

    if (files.length >= maxFiles) {
      toast({
        title: "Maximum Files Reached",
        description: `You can only upload up to ${maxFiles} files at a time`,
        variant: "destructive"
      });
      return;
    }

    const newFile: UploadedFile = {
      id: Math.random().toString(36).substring(7),
      name: file.name,
      size: file.size,
      status: 'uploading',
      progress: 0
    };

    setFiles(prev => [...prev, newFile]);
    uploadFile(file, newFile.id);
  };

  const uploadFile = async (file: File, fileId: string) => {
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map(f => 
          f.id === fileId && f.progress < 90 
            ? { ...f, progress: f.progress + Math.random() * 15 }
            : f
        ));
      }, 300);

      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      
      const result = await apiClient.uploadFile(file, currentYear, currentMonth);
      
      clearInterval(progressInterval);
      
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { 
              ...f, 
              status: 'success',
              progress: 100,
              transactionCount: result.transactions,
              categoryCount: result.categories,
              message: result.message
            }
          : f
      ));

      toast({
        title: "Upload Successful",
        description: `Processed ${result.transactions} transactions`,
      });

      if (onUploadSuccess) {
        onUploadSuccess(result);
      }

    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { 
              ...f, 
              status: 'error',
              progress: 0,
              message: error instanceof Error ? error.message : 'Upload failed'
            }
          : f
      ));

      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    droppedFiles.forEach(addFile);
  }, [files.length, maxFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    selectedFiles.forEach(addFile);
    
    // Reset input
    e.target.value = '';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-400 drop-shadow-md" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusBadge = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return <Badge variant="secondary">Uploading</Badge>;
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800 shadow-md">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
    }
  };

  return (
    <div className="w-full space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Bank Statements
          </CardTitle>
          <CardDescription>
            Upload your bank statements or transaction files to analyze your spending patterns with AI.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver 
                ? 'border-primary bg-primary/10' 
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">
              Drag and drop your bank statements here, or click the button below
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Supports CSV and Excel files (.csv, .xlsx, .xls)
            </p>
            
            <Input
              type="file"
              accept=".csv,.xlsx,.xls"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            
            <Button asChild>
              <label htmlFor="file-upload" className="cursor-pointer">
                <FileText className="h-4 w-4 mr-2" />
                Select Files
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Files</CardTitle>
            <CardDescription>
              Track the progress of your file uploads
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((file) => (
                <div
  key={file.id}
  className="flex items-center justify-between p-4 border border-white/10 rounded-xl bg-[rgba(255,255,255,0.05)] backdrop-blur-md
             hover:scale-[1.02] hover:border-primary/50 hover:shadow-lg transition-all duration-300"
>

                  <div className="flex items-center gap-3">
                    {getStatusIcon(file.status)}
                    <div className="flex-1">
                      <div className="font-medium">{file.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatFileSize(file.size)}
                      </div>
                      
                      {file.status === 'uploading' && (
                        <Progress value={file.progress} className="mt-2 w-48" />
                      )}
                      
                      {file.status === 'success' && file.transactionCount && (
                        <div className="text-sm text-green-600 mt-1">
                          Processed {file.transactionCount} transactions in {file.categoryCount} categories
                        </div>
                      )}
                      
                      {file.status === 'error' && file.message && (
                        <div className="text-sm text-red-600 mt-1">
                          Error: {file.message}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusBadge(file.status)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      disabled={file.status === 'uploading'}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}