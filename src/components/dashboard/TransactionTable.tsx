import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Filter, Download } from 'lucide-react';
import { formatCurrency, formatDate, sortTransactions } from '@/lib/financialUtils';
import type { Transaction } from '@/lib/types';

export interface TransactionTableProps {
  data: Transaction[];
  pageSize?: number;
  showSearch?: boolean;
  showFilters?: boolean;
  showExport?: boolean;
}

type SortField = keyof Transaction;
type SortDirection = 'asc' | 'desc';

export function TransactionTable({ 
  data, 
  pageSize = 10, 
  showSearch = true, 
  showFilters = true,
  showExport = true
}: TransactionTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Get unique categories for filter
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(data.map(t => t.category)));
    return uniqueCategories.sort();
  }, [data]);

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = data;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.category === categoryFilter);
    }

    // Apply sorting
    return sortTransactions(filtered, sortField, sortDirection);
  }, [data, searchTerm, categoryFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = processedData.slice(startIndex, startIndex + pageSize);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4" />
      : <ArrowDown className="h-4 w-4" />;
  };

  const getTransactionTypeColor = (transaction: Transaction) => {
    if (transaction.debit_inr > 0) {
      return 'text-red-600 bg-red-50';
    }
    if (transaction.credit_inr > 0) {
      return 'text-green-600 bg-green-50';
    }
    return 'text-gray-600 bg-gray-50';
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Date', 'Description', 'Category', 'Debit', 'Credit', 'Balance'].join(','),
      ...processedData.map(t => [
        formatDate(t.date),
        `"${t.description}"`,
        `"${t.category}"`,
        t.debit_inr || 0,
        t.credit_inr || 0,
        t.balance_inr || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'transactions.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>No transactions found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            No transaction data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Transactions
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {processedData.length} of {data.length}
            </Badge>
            {showExport && (
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </CardTitle>
        <CardDescription>
          View and filter your transaction history
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Filters */}
        {(showSearch || showFilters) && (
          <div className="mb-4 flex flex-col sm:flex-row gap-4">
            {showSearch && (
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}
            
            {showFilters && (
              <div className="flex gap-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleSort('date')}
                    className="font-semibold"
                  >
                    Date {getSortIcon('date')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleSort('description')}
                    className="font-semibold"
                  >
                    Description {getSortIcon('description')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleSort('category')}
                    className="font-semibold"
                  >
                    Category {getSortIcon('category')}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleSort('debit_inr')}
                    className="font-semibold"
                  >
                    Amount {getSortIcon('debit_inr')}
                  </Button>
                </TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((transaction, index) => (
                <TableRow key={transaction.id || `${transaction.date}-${index}`}>
                  <TableCell className="font-medium">
                    {formatDate(transaction.date)}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate" title={transaction.description}>
                      {transaction.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {transaction.category.split(':').pop() || transaction.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`px-2 py-1 rounded text-sm font-medium ${getTransactionTypeColor(transaction)}`}>
                      {transaction.debit_inr > 0 
                        ? `-${formatCurrency(transaction.debit_inr)}`
                        : `+${formatCurrency(transaction.credit_inr)}`
                      }
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {transaction.balance_inr ? formatCurrency(transaction.balance_inr) : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(startIndex + pageSize, processedData.length)} of {processedData.length} transactions
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  const isActive = page === currentPage;
                  return (
                    <Button
                      key={page}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}