import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
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
  const { toast } = useToast();

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
        toast({
          title: "File Selected",
          description: `Selected ${selectedFile.name}`,
        });
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

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 15;
      });
    }, 300);

    try {
      const result = await apiClient.uploadFile(file, year, month);
      
      clearInterval(progressInterval);
      setProgress(100);

      toast({
        title: "Upload Successful",
        description: result.message || `Processed ${result.transactions} transactions`,
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
      
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
        action: <AlertCircle className="h-4 w-4" />
      });
    } finally {
      setUploading(false);
      // Reset progress after a delay
      setTimeout(() => setProgress(0), 2000);
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Bank Statement
        </CardTitle>
        <CardDescription>
          Upload your CSV or Excel bank statement to analyze your financial data
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* File Selection */}
        <div className="space-y-2">
          <Label htmlFor="file-upload">Select File</Label>
          <div className="relative">
            <Input
              id="file-upload"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              disabled={uploading}
              className="cursor-pointer"
            />
            {file && (
              <div className="mt-2 flex items-center gap-2 p-2 bg-muted rounded-md">
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Period Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
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

          <div className="space-y-2">
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
            <div className="flex justify-between items-center">
              <Label>Uploading...</Label>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
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
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload & Process
            </>
          )}
        </Button>

        {/* Help Text */}
        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Supported formats:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• CSV files with transaction data</li>
            <li>• Excel files (.xlsx, .xls)</li>
            <li>• Files should contain columns for date, description, amount, etc.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}