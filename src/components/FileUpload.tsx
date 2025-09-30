// FileUpload.tsx - IMPROVED VERSION with better timeout handling

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import { Upload, FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import type { UploadSuccessData } from '@/lib/types';

interface FileUploadProps {
  onUploadSuccess: (data: UploadSuccessData) => void;
}

export function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadPhase, setUploadPhase] = useState<'uploading' | 'processing' | 'saving' | 'complete'>('uploading');
  const { toast } = useToast();

  const getPhaseMessage = (phase: typeof uploadPhase) => {
    switch (phase) {
      case 'uploading': return 'Uploading file...';
      case 'processing': return 'Processing transactions...';
      case 'saving': return 'Saving to database...';
      case 'complete': return 'Upload complete!';
    }
  };

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      const validExtensions = ['.csv', '.xlsx', '.xls'];

      const isValidType = validTypes.includes(selectedFile.type);
      const isValidExtension = validExtensions.some(ext =>
        selectedFile.name.toLowerCase().endsWith(ext)
      );

      if (isValidType || isValidExtension) {
        setFile(selectedFile);
        
        // Show file size warning for large files
        const fileSizeMB = selectedFile.size / 1024 / 1024;
        if (fileSizeMB > 10) {
          toast({
            title: "Large File Detected",
            description: `${selectedFile.name} (${fileSizeMB.toFixed(2)} MB) may take longer to process. Please be patient.`,
            variant: "default"
          });
        } else {
          toast({
            title: "File Selected",
            description: `Selected ${selectedFile.name} (${fileSizeMB.toFixed(2)} MB)`,
          });
        }
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please select a CSV or Excel file (.csv, .xlsx, .xls)",
          variant: "destructive"
        });
        // Clear the input
        event.target.value = '';
      }
    }
  }, [toast]);

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setProgress(0);
    setUploadPhase('uploading');

    // Estimate processing time based on file size
    const fileSizeMB = file.size / 1024 / 1024;
    const estimatedTimeSeconds = Math.max(10, Math.ceil(fileSizeMB * 5)); // 5 seconds per MB, min 10 seconds
    
    toast({
      title: "Upload Started",
      description: `Processing ${file.name}... Estimated time: ${estimatedTimeSeconds} seconds`,
    });

    // Enhanced progress simulation with phases
    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        currentProgress = prev;
        
        // Phase transitions based on progress
        if (prev < 30) {
          setUploadPhase('uploading');
          return prev + Math.random() * 8;
        } else if (prev < 80) {
          if (uploadPhase !== 'processing') {
            setUploadPhase('processing');
            toast({
              title: "Processing Data",
              description: "Analyzing transactions and categorizing expenses...",
            });
          }
          return prev + Math.random() * 3; // Slower progress during processing
        } else if (prev < 95) {
          if (uploadPhase !== 'saving') {
            setUploadPhase('saving');
          }
          return prev + Math.random() * 2;
        } else {
          // Don't go to 100% until we get the actual response
          return prev;
        }
      });
    }, 500);

    try {
      console.log(`[Upload] Starting upload of ${file.name} (${fileSizeMB.toFixed(2)} MB)`);
      const startTime = Date.now();
      
      const result = await apiClient.uploadFile(file, year, month);
      
      const endTime = Date.now();
      const actualTimeSeconds = Math.ceil((endTime - startTime) / 1000);
      console.log(`[Upload] Completed in ${actualTimeSeconds} seconds`);

      clearInterval(progressInterval);
      setProgress(100);
      setUploadPhase('complete');

      toast({
        title: "Upload Successful! 🎉",
        description: `Processed ${result.transactions} transactions in ${result.categories} categories (${actualTimeSeconds}s)`,
        action: <CheckCircle className="h-4 w-4" />
      });

      onUploadSuccess(result as UploadSuccessData);

      // Reset form
      setFile(null);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      clearInterval(progressInterval);
      setProgress(0);
      setUploadPhase('uploading');

      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      console.error('[Upload] Error:', errorMessage);

      // Provide different error messages based on the error type
      let userMessage = errorMessage;
      let suggestion = "";

      if (errorMessage.includes('timeout')) {
        userMessage = "Upload is taking longer than expected";
        suggestion = "Your file may still be processing in the background. Please wait a few minutes and check your dashboard, or try uploading a smaller file.";
      } else if (errorMessage.includes('too large') || errorMessage.includes('size')) {
        userMessage = "File too large to process";
        suggestion = "Please try uploading a smaller file or contact support for help with large files.";
      } else if (errorMessage.includes('format') || errorMessage.includes('invalid')) {
        userMessage = "File format not supported";
        suggestion = "Please ensure your file is a valid CSV or Excel file with transaction data.";
      }

      toast({
        title: "Upload Failed",
        description: `${userMessage}${suggestion ? `\n\n${suggestion}` : ''}`,
        variant: "destructive",
        action: <AlertCircle className="h-4 w-4" />
      });

    } finally {
      setUploading(false);
      // Reset progress after a delay
      setTimeout(() => {
        setProgress(0);
        setUploadPhase('uploading');
      }, 3000);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Upload Bank Statement
        </CardTitle>
        <CardDescription>
          Upload your CSV or Excel bank statement to analyze your financial data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Selection */}
        <div className="space-y-2">
          <Label htmlFor="file">Select File</Label>
          <Input
            id="file"
            type="file"
            accept=".csv,.xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={handleFileChange}
            disabled={uploading}
          />
          {file && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>{file.name}</span>
              <span>({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
            </div>
          )}
        </div>

        {/* Period Selection */}
        <div className="flex gap-2">
          <div className="flex-1 space-y-2">
            <Label>Year</Label>
            <Select
              value={year.toString()}
              onValueChange={(value) => setYear(parseInt(value))}
              disabled={uploading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1 space-y-2">
            <Label>Month</Label>
            <Select
              value={month.toString()}
              onValueChange={(value) => setMonth(parseInt(value))}
              disabled={uploading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value.toString()}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Progress */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {getPhaseMessage(uploadPhase)}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full"
          size="lg"
        >
          {uploading ? (
            <>
              <Clock className="mr-2 h-4 w-4 animate-spin" />
              {getPhaseMessage(uploadPhase)}
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload & Process
            </>
          )}
        </Button>

        {/* Help Text */}
        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>Supported formats:</strong></p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>CSV files with transaction data</li>
            <li>Excel files (.xlsx, .xls)</li>
            <li>Files should contain columns for date, description, amount, etc.</li>
            <li>Large files (&gt;10MB) may take several minutes to process</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}