import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Tag,
  MapPinned,
  Plus,
  Search,
  Edit2,
  Trash2,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  RefreshCw,
  Download,
  Upload,
  Loader2,
  CheckCircle,
  AlertCircle,
  Brain,
  AlertTriangle,
  X,
  LucideIcon,
} from 'lucide-react';
import { supabase } from "../../lib/supabase";
import * as api from "../../lib/api-client";
import { toast } from "sonner";



// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Business {
  id: string;
  business_name: string;
  category: string;
  street: string;
  coordinates: string;
  zone_type: string;
  status: 'active' | 'inactive';
}

export type TrainingStatusType = 'idle' | 'training' | 'success' | 'error';

// ============================================================================
// STATS CARD COMPONENT
// ============================================================================

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  bgColor?: string;
}

function StatsCard({ title, value, icon: Icon, bgColor = 'bg-purple-50' }: StatsCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-600 text-sm mb-2">{title}</p>
          <p className="text-3xl text-gray-900">{value}</p>
        </div>
        <div className={`${bgColor} p-3 rounded-lg`}>
          <Icon className="w-6 h-6 text-purple-600" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SEARCH FILTERS COMPONENT
// ============================================================================

interface SearchFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  zoneFilter: string;
  onZoneChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  categories: string[];
  zones: string[];
}

function SearchFilters({
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  zoneFilter,
  onZoneChange,
  statusFilter,
  onStatusChange,
  categories,
  zones,
}: SearchFiltersProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search Bar */}
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by business name, category, or street..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={categoryFilter}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Zone Filter */}
        <div className="hidden md:block">
          <select
            value={zoneFilter}
            onChange={(e) => onZoneChange(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="">All Zones</option>
            {zones.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mobile Zone & Status Filters */}
      <div className="grid grid-cols-2 gap-4 mt-4 md:hidden">
        <select
          value={zoneFilter}
          onChange={(e) => onZoneChange(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
        >
          <option value="">All Zones</option>
          {zones.map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Desktop Status Filter */}
      <div className="hidden md:block mt-4">
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
    </div>
  );
}

// ============================================================================
// SEED DATA TABLE COMPONENT
// ============================================================================

interface SeedDataTableProps {
  businesses: Business[];
  onEdit: (business: Business) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, newStatus: 'active' | 'inactive') => void;
}

function SeedDataTable({ businesses, onEdit, onDelete, onToggleStatus }: SeedDataTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof Business | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const itemsPerPage = 10;

  // Sorting logic
  const sortedBusinesses = [...businesses].sort((a, b) => {
    if (!sortField) return 0;

    const aValue = a[sortField];
    const bValue = b[sortField];

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedBusinesses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBusinesses = sortedBusinesses.slice(startIndex, endIndex);

  const handleSort = (field: keyof Business) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('business_name')}
              >
                <div className="flex items-center gap-2">
                  Business Name
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('category')}
              >
                <div className="flex items-center gap-2">
                  Category
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                Address
              </th>
              <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                Coordinates
              </th>
              <th
                className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('zone_type')}
              >
                <div className="flex items-center gap-2">
                  Zone Type
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-2">
                  Status
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="px-6 py-3 text-right text-xs text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {currentBusinesses.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  No businesses found. Add your first business to get started.
                </td>
              </tr>
            ) : (
              currentBusinesses.map((business) => (
                <tr key={business.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-gray-900">{business.business_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                      {business.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-gray-600 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {business.street}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{business.coordinates}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-purple-100 text-purple-800">
                      {business.zone_type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() =>
                        onToggleStatus(business.id, business.status === 'active' ? 'inactive' : 'active')
                      }
                      className="group"
                    >
                      {business.status === 'active' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-green-100 text-green-800 group-hover:bg-green-200 transition-colors">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-gray-100 text-gray-800 group-hover:bg-gray-200 transition-colors">
                          Inactive
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit(business)}
                        className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(business.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(endIndex, businesses.length)} of {businesses.length} entries
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded-lg transition-colors ${currentPage === page ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ADD/EDIT BUSINESS MODAL COMPONENT
// ============================================================================

interface AddEditBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (business: Omit<Business, 'id'>) => void;
  business?: Business | null;
  categories: string[];
  zones: string[];
}

function AddEditBusinessModal({
  isOpen,
  onClose,
  onSave,
  business,
  categories,
  zones,
}: AddEditBusinessModalProps) {
  const [formData, setFormData] = useState({
    business_name: '',
    category: '',
    street: '',
    coordinates: '',
    zone_type: '',
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    if (business) {
      setFormData({
        business_name: business.business_name,
        category: business.category,
        street: business.street,
        coordinates: business.coordinates,
        zone_type: business.zone_type,
        status: business.status,
      });
    } else {
      setFormData({
        business_name: '',
        category: categories[0] || '',
        street: '',
        coordinates: '',
        zone_type: zones[0] || '',
        status: 'active',
      });
    }
  }, [business, isOpen, categories, zones]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl text-gray-900">{business ? 'Edit Business' : 'Add New Business'}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Business Name */}
          <div>
            <label htmlFor="business_name" className="block text-sm text-gray-700 mb-2">
              Business Name *
            </label>
            <input
              type="text"
              id="business_name"
              value={formData.business_name}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter business name"
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm text-gray-700 mb-2">
              Category *
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Address/Street */}
          <div>
            <label htmlFor="street" className="block text-sm text-gray-700 mb-2">
              Address / Street *
            </label>
            <input
              type="text"
              id="street"
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter street address"
            />
          </div>

          {/* Coordinates */}
          <div>
            <label htmlFor="coordinates" className="block text-sm text-gray-700 mb-2">
              Coordinates *
            </label>
            <input
              type="text"
              id="coordinates"
              value={formData.coordinates}
              onChange={(e) => setFormData({ ...formData, coordinates: e.target.value })}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., 40.7128, -74.0060"
            />
          </div>

          {/* Zone Type */}
          <div>
            <label htmlFor="zone_type" className="block text-sm text-gray-700 mb-2">
              Zone Type *
            </label>
            <select
              id="zone_type"
              value={formData.zone_type}
              onChange={(e) => setFormData({ ...formData, zone_type: e.target.value })}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
            >
              {zones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </div>

          {/* Status Toggle */}
          <div>
            <label className="block text-sm text-gray-700 mb-3">Status</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'active' })}
                className={`flex-1 px-4 py-2.5 rounded-lg transition-colors ${formData.status === 'active'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'inactive' })}
                className={`flex-1 px-4 py-2.5 rounded-lg transition-colors ${formData.status === 'inactive'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                Inactive
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              {business ? 'Save Changes' : 'Add Business'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// DATASET ACTIONS COMPONENT
// ============================================================================

interface DatasetActionsProps {
  onRefresh: () => void;
  onDownload: () => void;
  onUpload: (file: File) => void;
  onReset: () => void;
  isLoading?: boolean;
}

function DatasetActions({ onRefresh, onDownload, onUpload, onReset, isLoading = false }: DatasetActionsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/csv') {
      onUpload(file);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      alert('Please upload a valid CSV file');
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-gray-700 mr-2">Dataset Actions:</span>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>

        <button
          onClick={onDownload}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          Download CSV
        </button>

        <button
          onClick={handleUploadClick}
          className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
        >
          <Upload className="w-4 h-4" />
          Upload CSV
        </button>
        <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />

        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors ml-auto"
        >
          <Trash2 className="w-4 h-4" />
          Reset Dataset
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// TRAINING STATUS COMPONENT
// ============================================================================

interface TrainingStatusProps {
  status: TrainingStatusType;
  message?: string;
}

function TrainingStatus({ status, message }: TrainingStatusProps) {
  if (status === 'idle') return null;

  const statusConfig = {
    training: {
      icon: Loader2,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-600',
      defaultMessage: 'Training ML model... Calculating optimal K-value and enhanced data.',
      animate: true,
    },
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconColor: 'text-green-600',
      defaultMessage: 'Training complete! Model updated successfully.',
      animate: false,
    },
    error: {
      icon: AlertCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconColor: 'text-red-600',
      defaultMessage: 'Training failed. Please check logs and try again.',
      animate: false,
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig];
  const Icon = config.icon;

  return (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4 shadow-sm`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 bg-white rounded-lg ${config.iconColor}`}>
          <Brain className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Icon className={`w-5 h-5 ${config.iconColor} ${config.animate ? 'animate-spin' : ''}`} />
            <span className={`${config.textColor}`}>
              {status === 'training' && 'ML Training In Progress'}
              {status === 'success' && 'Training Complete'}
              {status === 'error' && 'Training Error'}
            </span>
          </div>
          <p className={`text-sm ${config.textColor}`}>{message || config.defaultMessage}</p>
          {status === 'training' && (
            <div className="mt-3">
              <div className="w-full bg-white rounded-full h-2 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CONFIRM MODAL COMPONENT
// ============================================================================

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning';
}

function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      buttonBg: 'bg-red-600 hover:bg-red-700',
    },
    warning: {
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      buttonBg: 'bg-yellow-600 hover:bg-yellow-700',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div className="flex items-start gap-3">
            <div className={`${styles.iconBg} p-2 rounded-lg`}>
              <AlertTriangle className={`w-6 h-6 ${styles.iconColor}`} />
            </div>
            <div>
              <h2 className="text-lg text-gray-900">{title}</h2>
              <p className="text-sm text-gray-600 mt-1">{message}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 p-6">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-6 py-2.5 text-white ${styles.buttonBg} rounded-lg transition-colors`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SAMPLE DATA
// ============================================================================

const sampleBusinesses: Business[] = [
  {
    id: '1',
    business_name: 'Starbucks Coffee',
    category: 'Cafe',
    street: '123 Main Street',
    coordinates: '40.7128, -74.0060',
    zone_type: 'Commercial',
    status: 'active',
  },
  {
    id: '2',
    business_name: 'Urban Fitness Gym',
    category: 'Fitness',
    street: '456 Oak Avenue',
    coordinates: '40.7580, -73.9855',
    zone_type: 'Residential',
    status: 'active',
  },
  {
    id: '3',
    business_name: 'Tech Solutions Inc',
    category: 'Technology',
    street: '789 Innovation Drive',
    coordinates: '40.7489, -73.9680',
    zone_type: 'Business',
    status: 'active',
  },
  {
    id: '4',
    business_name: 'Green Market',
    category: 'Grocery',
    street: '321 Park Lane',
    coordinates: '40.7614, -73.9776',
    zone_type: 'Commercial',
    status: 'inactive',
  },
  {
    id: '5',
    business_name: 'The Book Haven',
    category: 'Retail',
    street: '654 Library Road',
    coordinates: '40.7549, -73.9840',
    zone_type: 'Commercial',
    status: 'active',
  },
];

// ============================================================================
// MAIN SEED DATA MANAGEMENT COMPONENT
// ============================================================================

export default function SeedDataManagement() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [zoneFilter, setZoneFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [businessToDelete, setBusinessToDelete] = useState<string | null>(null);
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatusType>('idle');
  const [isLoading, setIsLoading] = useState(false);

  // Live stats from database
  const [totalBusinesses, setTotalBusinesses] = useState(0);
  const [totalCategories, setTotalCategories] = useState(0);
  const [totalZones, setTotalZones] = useState(0);

  // Get unique categories and zones for filters
  const categories = Array.from(new Set(businesses.map((b) => b.category))).sort();
  const zones = Array.from(new Set(businesses.map((b) => b.zone_type))).sort();

  // Filter businesses
  useEffect(() => {
    let filtered = [...businesses];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.business_name.toLowerCase().includes(term) ||
          b.category.toLowerCase().includes(term) ||
          b.street.toLowerCase().includes(term)
      );
    }

    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter((b) => b.category === categoryFilter);
    }

    // Zone filter
    if (zoneFilter) {
      filtered = filtered.filter((b) => b.zone_type === zoneFilter);
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter((b) => b.status === statusFilter);
    }

    setFilteredBusinesses(filtered);
  }, [businesses, searchTerm, categoryFilter, zoneFilter, statusFilter]);

  // Load data from Supabase
  useEffect(() => {
    loadBusinesses();
    loadStats();
  }, []);

  // Load live stats from database
  const loadStats = async () => {
    try {
      console.log('📊 Loading stats from Supabase...');

      // Get total count of businesses
      const { count: businessCount, error: countError } = await supabase
        .from('business_raw')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('❌ Error getting business count:', countError);
        throw countError;
      }
      console.log('✅ Business count:', businessCount);
      setTotalBusinesses(businessCount || 0);

      // Get unique categories count
      const { data: categoryData, error: categoryError } = await supabase
        .from('business_raw')
        .select('general_category');

      if (categoryError) {
        console.error('❌ Error getting categories:', categoryError);
        throw categoryError;
      }
      const uniqueCategories = new Set(categoryData?.map((row: any) => row.general_category) || []);
      console.log('✅ Unique categories:', uniqueCategories.size, 'Categories:', Array.from(uniqueCategories));
      setTotalCategories(uniqueCategories.size);

      // Get unique zone types count
      const { data: zoneData, error: zoneError } = await supabase
        .from('business_raw')
        .select('zone_type');

      if (zoneError) {
        console.error('❌ Error getting zone types:', zoneError);
        throw zoneError;
      }
      const uniqueZones = new Set(zoneData?.map((row: any) => row.zone_type) || []);
      console.log('✅ Unique zone types:', uniqueZones.size, 'Zones:', Array.from(uniqueZones));
      setTotalZones(uniqueZones.size);

      console.log('✨ Stats loaded successfully!');
    } catch (error) {
      console.error("❌ Error loading stats:", error);
      toast.error("Failed to load statistics");
    }
  };

  const loadBusinesses = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('business_raw')
        .select('*');

      if (error) throw error;

      const mappedBusinesses: Business[] = (data || []).map((row: any) => ({
        id: row.business_id.toString(),
        business_name: row.business_name,
        category: row.general_category,
        street: row.street,
        coordinates: `${row.latitude}, ${row.longitude}`,
        zone_type: row.zone_type,
        status: row.status as 'active' | 'inactive',
      }));

      setBusinesses(mappedBusinesses);
    } catch (error) {
      console.error("Error loading raw businesses:", error);
      toast.error("Failed to load businesses");
    } finally {
      setIsLoading(false);
    }
  };

  const saveBusinesses = async (updated: Business[]) => {
    try {
      // 1. Delete all existing raw data (simple overwrite strategy)
      const { error: deleteError } = await supabase
        .from('business_raw')
        .delete()
        .neq('business_id', 0); // Delete all rows where ID is not 0

      if (deleteError) throw deleteError;

      // 2. Prepare rows for insertion
      const rows = updated.map((b) => {
        const [lat, lng] = b.coordinates.split(',').map((c) => parseFloat(c.trim()));
        return {
          business_id: parseInt(b.id) || Date.now(),
          business_name: b.business_name,
          general_category: b.category,
          street: b.street,
          latitude: lat || 0,
          longitude: lng || 0,
          zone_type: b.zone_type,
          status: b.status,
        };
      });

      if (rows.length > 0) {
        const { error: insertError } = await supabase
          .from('business_raw')
          .insert(rows);

        if (insertError) throw insertError;
      }

      // Refresh stats after saving
      await loadStats();
      toast.success("Data saved successfully");
    } catch (e) {
      console.error("Error saving businesses:", e);
      toast.error("Failed to save changes");
    }
  };


  const triggerTraining = async () => {
    setTrainingStatus("training");

    try {
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;

      if (token) {
        await api.trainModel(token);
        setTrainingStatus("success");
      } else {
        console.warn("No auth token for training API");
        setTrainingStatus("error");
      }

      setTimeout(() => setTrainingStatus("idle"), 5000);
    } catch (err) {
      console.error("Training error:", err);
      setTrainingStatus("error");
      setTimeout(() => setTrainingStatus("idle"), 5000);
    }
  };


  const handleAddBusiness = (businessData: Omit<Business, "id">) => {
    const newBusiness: Business = {
      ...businessData,
      id: Date.now().toString(),
    };

    const updated = [...businesses, newBusiness];
    setBusinesses(updated);
    saveBusinesses(updated);
    // triggerTraining(); // Removed: DB trigger handles this automatically
  };


  const handleEditBusiness = (businessData: Omit<Business, "id">) => {
    if (!editingBusiness) return;

    const updated = businesses.map((b) =>
      b.id === editingBusiness.id
        ? { ...businessData, id: editingBusiness.id }
        : b
    );

    setBusinesses(updated);
    setEditingBusiness(null);
    saveBusinesses(updated);
    // triggerTraining(); // Removed: DB trigger handles this automatically
  };


  const handleDeleteBusiness = (id: string) => {
    setBusinessToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!businessToDelete) return;

    const updated = businesses.filter((b) => b.id !== businessToDelete);
    setBusinesses(updated);
    saveBusinesses(updated);
    setBusinessToDelete(null);
    // triggerTraining(); // Removed: DB trigger handles this automatically
  };




  const handleToggleStatus = (id: string, newStatus: "active" | "inactive") => {
    const updated = businesses.map((b) =>
      b.id === id ? { ...b, status: newStatus } : b
    );

    setBusinesses(updated);
    saveBusinesses(updated);
    // triggerTraining(); // Removed: DB trigger handles this automatically
  };


  const handleRefresh = () => {
    loadBusinesses();
    loadStats();
  };

  const handleDownload = () => {
    // Convert to CSV
    const headers = ['Business Name', 'Category', 'Street', 'Coordinates', 'Zone Type', 'Status'];
    const rows = businesses.map((b) => [b.business_name, b.category, b.street, b.coordinates, b.zone_type, b.status]);

    const csv = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');

    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seed-data-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',');

        const newBusinesses: Business[] = lines
          .slice(1)
          .filter((line) => line.trim())
          .map((line, index) => {
            const values = line.split(',').map((v) => v.replace(/^"|"$/g, '').trim());
            return {
              id: Date.now().toString() + index,
              business_name: values[0] || '',
              category: values[1] || '',
              street: values[2] || '',
              coordinates: values[3] || '',
              zone_type: values[4] || '',
              status: (values[5]?.toLowerCase() === 'active' ? 'active' : 'inactive') as 'active' | 'inactive',
            };
          });

        if (newBusinesses.length > 0) {
          setBusinesses(newBusinesses);
          saveBusinesses(newBusinesses);
          // triggerTraining(); // Removed: DB trigger handles this automatically
        }
      } catch (error) {
        console.error('Error parsing CSV:', error);
        alert('Error parsing CSV file. Please check the format.');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    setIsResetModalOpen(true);
  };

  const confirmReset = () => {
    setBusinesses([]);
    saveBusinesses([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl text-gray-900 mb-2">Seed Data Management</h1>
              <p className="text-gray-600">Manage your K-Means clustering dataset and trigger ML training</p>
            </div>
            <button
              onClick={() => {
                setEditingBusiness(null);
                setIsAddEditModalOpen(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Add Business
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Training Status */}
        <TrainingStatus status={trainingStatus} />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard title="Total Businesses" value={totalBusinesses} icon={Building2} bgColor="bg-purple-50" />
          <StatsCard title="Categories" value={totalCategories} icon={Tag} bgColor="bg-blue-50" />
          <StatsCard title="Zone Types" value={totalZones} icon={MapPinned} bgColor="bg-green-50" />
        </div>

        {/* Dataset Actions */}
        <DatasetActions
          onRefresh={handleRefresh}
          onDownload={handleDownload}
          onUpload={handleUpload}
          onReset={handleReset}
          isLoading={isLoading}
        />

        {/* Search & Filters */}
        <SearchFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          zoneFilter={zoneFilter}
          onZoneChange={setZoneFilter}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          categories={categories}
          zones={zones}
        />

        {/* Data Table */}
        <SeedDataTable
          businesses={filteredBusinesses}
          onEdit={(business) => {
            setEditingBusiness(business);
            setIsAddEditModalOpen(true);
          }}
          onDelete={handleDeleteBusiness}
          onToggleStatus={handleToggleStatus}
        />
      </div>

      {/* Add/Edit Modal */}
      <AddEditBusinessModal
        isOpen={isAddEditModalOpen}
        onClose={() => {
          setIsAddEditModalOpen(false);
          setEditingBusiness(null);
        }}
        onSave={editingBusiness ? handleEditBusiness : handleAddBusiness}
        business={editingBusiness}
        categories={categories.length > 0 ? categories : ['Cafe', 'Retail', 'Technology', 'Fitness', 'Grocery']}
        zones={zones.length > 0 ? zones : ['Commercial', 'Residential', 'Business', 'Industrial']}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setBusinessToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Business"
        message="Are you sure you want to delete this business? This action cannot be undone and will trigger model retraining."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={confirmReset}
        title="Reset Seed Dataset"
        message="Are you sure you want to reset the entire seed dataset? This will delete all business entries and cannot be undone."
        confirmText="Reset All Data"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
