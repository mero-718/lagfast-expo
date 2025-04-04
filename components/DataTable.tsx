import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions,
  Modal,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import debounce from 'lodash/debounce';
import DeleteConfirmationModal from './DeleteConfirmationModal';

interface Column {
  key: string;
  title: string;
  flex?: number;
  render?: (item: any) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps {
  data: any[];
  columns: Column[];
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKeys?: string[];
  itemsPerPage?: number;
  loading?: boolean;
  emptyMessage?: string;
  onRowPress?: (item: any) => void;
  onAddPress?: () => void;
  addButtonText?: string;
  showAddButton?: boolean;
  showActions?: boolean;
  onEditPress?: (item: any) => void;
  onDeletePress?: (item: any) => void;
}

const DataTable: React.FC<DataTableProps> = ({
  data,
  columns,
  searchable = true,
  searchPlaceholder = 'Search...',
  searchKeys = [],
  itemsPerPage = 7,
  loading = false,
  emptyMessage = 'No data found',
  onRowPress,
  onAddPress,
  addButtonText = 'Add',
  showAddButton = false,
  showActions = false,
  onEditPress,
  onDeletePress,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string, items: any[]) => {
      if (!query.trim()) {
        setFilteredData(items);
      } else {
        const filtered = items.filter(item => 
          searchKeys.some(key => 
            item[key]?.toString().toLowerCase().includes(query.toLowerCase())
          )
        );
        setFilteredData(filtered);
      }
    }, 300),
    [searchKeys]
  );

  // Update filtered data when search query or data changes
  useEffect(() => {
    debouncedSearch(searchQuery, data);
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQuery, data, debouncedSearch]);

  // Sort data
  const sortData = (data: any[]) => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // Handle sort
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Calculate pagination
  useEffect(() => {
    const sortedData = sortData(filteredData);
    const total = Math.ceil(sortedData.length / itemsPerPage);
    setTotalPages(total);
    if (currentPage > total && total > 0) {
      setCurrentPage(total);
    }
  }, [filteredData, itemsPerPage, currentPage, sortConfig]);

  // Get current page data
  const getCurrentPageData = () => {
    const sortedData = sortData(filteredData);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = (item: any) => {
    setItemToDelete(item);
    setDeleteConfirmModal(true);
  };

  // Handle delete action
  const handleDeleteAction = () => {
    if (itemToDelete && onDeletePress) {
      onDeletePress(itemToDelete);
    }
    setDeleteConfirmModal(false);
    setItemToDelete(null);
  };

  // Render table header
  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      {columns.map((column, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.tableHeaderCell, { flex: column.flex || 1 }]}
          onPress={() => column.sortable && handleSort(column.key)}
          disabled={!column.sortable}
        >
          <Text style={styles.tableHeaderText}>
            {column.title}
          </Text>
          {column.sortable && (
            <View style={styles.sortIconContainer}>
              <Ionicons
                name={sortConfig?.key === column.key && sortConfig.direction === 'asc' ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={sortConfig?.key === column.key ? '#f4511e' : '#666'}
              />
            </View>
          )}
        </TouchableOpacity>
      ))}
      {showActions && (
        <View style={[styles.tableHeaderCell, { flex: 1 }]}>
          <Text style={styles.tableHeaderText}>Actions</Text>
        </View>
      )}
    </View>
  );

  // Render table row
  const renderTableRow = ({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity 
      style={[
        styles.tableRow,
        index % 2 === 0 ? styles.evenRow : styles.oddRow
      ]}
      onPress={() => onRowPress && onRowPress(item)}
      activeOpacity={onRowPress ? 0.7 : 1}
    >
      {columns.map((column, colIndex) => (
        <View 
          key={colIndex} 
          style={[
            styles.tableCell, 
            { flex: column.flex || 1 }
          ]}
        >
          {column.render ? (
            column.render(item)
          ) : (
            <Text style={styles.tableCellText}>
              {item[column.key]?.toString() || ''}
            </Text>
          )}
        </View>
      ))}
      
      {showActions && (
        <View style={[styles.tableCell, styles.actionCell, { flex: 1 }]}>
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, { marginRight: -10 }]}
              onPress={() => onEditPress && onEditPress(item)}
            >
              <Ionicons name="pencil" size={18} color="#2196F3" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleDeleteConfirm(item)}
            >
              <Ionicons name="trash" size={18} color="#F44336" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  // Render pagination controls
  const renderPagination = () => {
    const pageNumbers = [];
    const maxVisiblePages = 7;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <View style={styles.pagination}>
        {/* First Page */}
        <TouchableOpacity 
          style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
          onPress={() => handlePageChange(1)}
          disabled={currentPage === 1}
        >
          <Ionicons name="chevron-back-outline" size={18} color={currentPage === 1 ? '#ccc' : '#f4511e'} />
          <Ionicons name="chevron-back-outline" size={18} color={currentPage === 1 ? '#ccc' : '#f4511e'} style={styles.secondIcon} />
        </TouchableOpacity>

        {/* Previous Page */}
        <TouchableOpacity 
          style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
          onPress={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <Ionicons name="chevron-back-outline" size={18} color={currentPage === 1 ? '#ccc' : '#f4511e'} />
        </TouchableOpacity>

        {/* Page Numbers */}
        {startPage > 1 && (
          <Text style={styles.paginationEllipsis}>...</Text>
        )}

        {pageNumbers.map(number => (
          <TouchableOpacity
            key={number}
            style={[
              styles.paginationNumberButton,
              currentPage === number && styles.paginationNumberButtonActive
            ]}
            onPress={() => handlePageChange(number)}
          >
            <Text style={[
              styles.paginationNumberText,
              currentPage === number && styles.paginationNumberTextActive
            ]}>
              {number}
            </Text>
          </TouchableOpacity>
        ))}

        {endPage < totalPages && (
          <Text style={styles.paginationEllipsis}>...</Text>
        )}

        {/* Next Page */}
        <TouchableOpacity 
          style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
          onPress={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <Ionicons name="chevron-forward-outline" size={18} color={currentPage === totalPages ? '#ccc' : '#f4511e'} />
        </TouchableOpacity>

        {/* Last Page */}
        <TouchableOpacity 
          style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
          onPress={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          <Ionicons name="chevron-forward-outline" size={18} color={currentPage === totalPages ? '#ccc' : '#f4511e'} />
          <Ionicons name="chevron-forward-outline" size={18} color={currentPage === totalPages ? '#ccc' : '#f4511e'} style={styles.secondIcon} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search and Add Button */}
      <View style={styles.toolbar}>
        {searchable && (
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={24} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        )}
        
        {showAddButton && (
          <TouchableOpacity style={styles.addButton} onPress={onAddPress}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Table */}
      {renderTableHeader()}
      
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
      ) : (
        <>
          <FlatList
            data={getCurrentPageData()}
            renderItem={renderTableRow}
            keyExtractor={(item, index) => index.toString()}
            style={styles.tableBody}
            ListEmptyComponent={
              <Text style={styles.emptyText}>{emptyMessage}</Text>
            }
          />
          
          {filteredData.length > 0 && renderPagination()}
        </>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        visible={deleteConfirmModal}
        onClose={() => setDeleteConfirmModal(false)}
        onConfirm={handleDeleteAction}
        itemName={itemToDelete?.username || itemToDelete?.name || 'this item'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 18,
  },
  toolbar: {
    flexDirection: 'row',
    padding: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 12,
    height: 50,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableHeader: {
    flexDirection: 'row',
    padding: 16,
    marginTop: 25,
    backgroundColor: '#e0e0e0',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  tableHeaderCell: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  tableHeaderText: {
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  sortIconContainer: {
    marginLeft: 5,
  },
  tableBody: {
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  evenRow: {
    backgroundColor: '#fff',
  },
  oddRow: {
    backgroundColor: '#f9f9f9',
  },
  tableCell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableCellText: {
    fontSize: 14,
    textAlign: 'center',
  },
  actionCell: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    padding: 8,
    marginHorizontal: 2,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    fontSize: 16,
    color: '#666',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  paginationButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  paginationButtonDisabled: {
    backgroundColor: '#f5f5f5',
  },
  secondIcon: {
    marginLeft: -12,
  },
  paginationNumberButton: {
    padding: 8,
    minWidth: 36,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationNumberButtonActive: {
    backgroundColor: '#f4511e',
  },
  paginationNumberText: {
    fontSize: 14,
    color: '#666',
  },
  paginationNumberTextActive: {
    color: '#fff',
  },
  paginationEllipsis: {
    marginHorizontal: 8,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  modalButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default DataTable; 