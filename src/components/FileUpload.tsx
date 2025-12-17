// FileUpload.tsx - MULTI-USER VERSION with optimized timeout handling

import { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { Upload, FileText, AlertCircle, CheckCircle, Clock, Lock, RefreshCcw } from 'lucide-react';
import type { UploadSuccessData } from '@/lib/types';

interface FileUploadProps {
  onUploadSuccess: (data: UploadSuccessData) => void;
}

export function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const { user, loading: authLoading } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadPhase, setUploadPhase] = useState<'uploading' | 'processing' | 'saving' | 'complete'>('uploading');
  const { toast } = useToast();
  
  // Ref to prevent repeating toasts during the simulation interval
  const toastShownRef = useRef<Record<string, boolean>>({
    processing: false,
    saving: false
  });

  const getPhaseMessage = (phase: typeof uploadPhase) => {
    switch (phase) {
      case 'uploading': return 'Uploading file...';
      case 'processing': return 'Processing transactions...';
      case 'saving': return 'Saving to database...';
      case 'complete': return 'Upload complete!';
    }
  };

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upload files",
        variant: "destructive"
      });
      return;
    }

    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
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
        
        const fileSizeMB = selectedFile.size / 1024 / 1024;
        if (fileSizeMB > 10) {
          toast({
            title: "Large File Detected",
            description: `${selectedFile.name} (${fileSizeMB.toFixed(2)} MB) may take longer to process.`,
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
        event.target.value = '';
      }
    }
  }, [toast, user]);

  const handleUpload = async () => {
    if (!user) return;
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setUploadPhase('uploading');
    toastShownRef.current = { processing: false, saving: false };

    const fileSizeMB = file.size / 1024 / 1024;
    const estimatedTimeSeconds = Math.max(10, Math.ceil(fileSizeMB * 5));
    
    toast({
      title: "Upload Started",
      description: `Processing ${file.name}... Estimated time: ${estimatedTimeSeconds}s`,
    });

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev < 30) {
          return prev + Math.random() * 8;
        } else if (prev < 80) {
          if (!toastShownRef.current.processing) {
            setUploadPhase('processing');
            toastShownRef.current.processing = true;
            toast({
              title: "Processing Data",
              description: "Analyzing transactions and categorizing expenses...",
            });
          }
          return prev + Math.random() * 3;
        } else if (prev < 95) {
          if (!toastShownRef.current.saving) {
            setUploadPhase('saving');
            toastShownRef.current.saving = true;
          }
          return prev + Math.random() * 2;
        } else {
          return prev;
        }
      });
    }, 500);

    try {
      const startTime = Date.now();
      const result = await apiClient.uploadFile(file, year, month);
      const actualTimeSeconds = Math.ceil((Date.now() - startTime) / 1000);

      clearInterval(progressInterval);
      setProgress(100);
      setUploadPhase('complete');

      toast({
        title: "Upload Successful! 🎉",
        description: `Processed ${result.transactions} transactions in ${result.categories} categories (${actualTimeSeconds}s)`,
        action: <CheckCircle className="h-4 w-4" />
      });

      onUploadSuccess(result as UploadSuccessData);
      setFile(null);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      clearInterval(progressInterval);
      const errorMessage = error instanceof Error ? error.message : "";

      // Handle Timeout specifically as a "Success but Pending" state
      if (errorMessage.toLowerCase().includes('timeout') || errorMessage.toLowerCase().includes('longer than expected')) {
        setProgress(100);
        setUploadPhase('complete');
        
        toast({
          title: "Upload Sent Successfully",
          description: "Upload has been done. Since the file is large, it will take a few more seconds to finish processing. Please refresh your page in a moment to see the changes.",
          variant: "default", // Changed from destructive
          duration: 10000,
          action: <RefreshCcw className="h-4 w-4" />
        });

        // Clear file anyway as it's being handled by the server
        setFile(null);
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        // Handle actual hard errors (wrong format, auth, etc.)
        setProgress(0);
        setUploadPhase('uploading');
        
        let userMessage = "An unknown error occurred";
        if (errorMessage.includes('too large')) userMessage = "File too large to process";
        else if (errorMessage.includes('format')) userMessage = "File format not supported";
        else if (errorMessage.includes('authenticated')) userMessage = "Authentication error";

        toast({
          title: "Upload Failed",
          description: userMessage,
          variant: "destructive",
          action: <AlertCircle className="h-4 w-4" />
        });
      }
    } finally {
      setUploading(false);
      setTimeout(() => {
        setProgress(0);
        setUploadPhase('uploading');
      }, 3000);
    }
  };

  if (!authLoading && !user) {
    return (
      <Card className="w-full max-w-md mx-auto shadow-lg border-border/50">
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            Authentication Required
          </CardTitle>
          <CardDescription className="text-sm">
            Please sign in with your Google account to upload financial data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Your financial data will be securely stored and private.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (authLoading) {
    return (
      <Card className="w-full max-w-md mx-auto shadow-lg border-border/50">
        <CardContent className="text-center py-10">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </CardContent>
      </Card>
    );
  }

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' },
    { value: 3, label: 'March' }, { value: 4, label: 'April' },
    { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' },
    { value: 9, label: 'September' }, { value: 10, label: 'October' },
    { value: 11, label: 'November' }, { value: 12, label: 'December' },
  ];

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-border/50">
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          Upload Bank Statement
        </CardTitle>
        <CardDescription className="text-sm">
          Upload your CSV or Excel bank statement to analyze your financial data
        </CardDescription>
        {user && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Uploading as:</span>
            <span className="font-medium text-primary">{user.email}</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="file">Select File</Label>
          <Input
            id="file"
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            disabled={uploading}
          />
          {file && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <div className="flex-1 space-y-2">
            <Label>Year</Label>
            <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))} disabled={uploading}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{years.map((y) => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex-1 space-y-2">
            <Label>Month</Label>
            <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))} disabled={uploading}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{months.map((m) => <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

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

        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full shadow-md hover:shadow-lg transition-all"
          size="lg"
        >
          {uploading ? (
            <>
              <Clock className="mr-2 h-5 w-5 animate-spin" />
              <span className="font-semibold">{getPhaseMessage(uploadPhase)}</span>
            </>
          ) : (
            <>
              <Upload className="mr-2 h-5 w-5" />
              <span className="font-semibold">Upload & Process</span>
            </>
          )}
        </Button>

        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>Supported formats:</strong> CSV, .xlsx, .xls</p>
          <p className="text-xs">Large files (&gt;10MB) may take several minutes. If the connection times out, please refresh your dashboard after a minute.</p>
        </div>
      </CardContent>
    </Card>
  );
}