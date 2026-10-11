'use client';

import React from 'react';

// ─── Button ───────────────────────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center gap-2 font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]';

  const variants = {
    primary:
      'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm border border-transparent',
    secondary:
      'bg-primary-50 text-primary-700 hover:bg-primary-100 focus:ring-primary-500 border border-primary-200/50',
    outline:
      'border border-line bg-surface text-ink hover:bg-canvas hover:border-ink-soft/40 focus:ring-primary-500',
    ghost:
      'text-ink-soft hover:text-ink hover:bg-primary-50/60 focus:ring-primary-500 border border-transparent',
    danger:
      'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm border border-transparent',
    success:
      'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 shadow-sm border border-transparent',
    warning:
      'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-400 shadow-sm border border-transparent',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    icon: 'p-2 text-sm',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {!isLoading && leftIcon && <span className="inline-flex items-center">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="inline-flex items-center">{rightIcon}</span>}
    </button>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, className = '', padding = 'md' }: CardProps) {
  const paddings = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' };
  return (
    <div
      className={`bg-surface rounded-xl border border-line shadow-card text-ink ${paddings[padding]} ${className}`}
    >
      {children}
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

export function Badge({ children, className = '', variant = 'default' }: BadgeProps) {
  const variantStyles = {
    default: 'bg-canvas text-ink-soft border border-line',
    primary: 'bg-primary-50 text-primary-700 border border-primary-200',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    danger: 'bg-red-50 text-red-700 border border-red-200',
    info: 'bg-blue-50 text-blue-700 border border-blue-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  // Mapping preset status ke gaya semantik
  const map: Record<string, { label: string; dot: string; bg: string; text: string; border: string }> = {
    // Reservasi
    pending: { label: 'Menunggu', dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    approved: { label: 'Disetujui', dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
    rejected: { label: 'Ditolak', dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200' },
    cancelled: { label: 'Dibatalkan', dot: 'bg-gray-400', bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
    completed: { label: 'Selesai', dot: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },

    // Laporan
    in_progress: { label: 'Diproses', dot: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
    resolved: { label: 'Selesai', dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },

    // User status
    active: { label: 'Aktif', dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
    pending_verification: { label: 'Perlu Verifikasi', dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    suspended: { label: 'Dinonaktifkan', dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200' },

    // Fasilitas
    available: { label: 'Tersedia', dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
    maintenance: { label: 'Pemeliharaan', dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    unavailable: { label: 'Tidak Aktif', dot: 'bg-gray-400', bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
  };

  const current = map[status] || {
    label: status,
    dot: 'bg-gray-400',
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${current.bg} ${current.text} ${current.border} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      {current.label}
    </span>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      {/* Content */}
      <div
        className={`relative bg-surface text-ink rounded-2xl border border-line shadow-float w-full ${sizes[size]} max-h-[90vh] overflow-y-auto transform transition-all`}
      >
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-line">
            <h3 className="text-lg font-bold font-heading text-ink">{title}</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-canvas transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────

interface TableProps {
  headers: string[];
  children: React.ReactNode;
  emptyMessage?: string;
  isEmpty?: boolean;
}

export function Table({
  headers,
  children,
  emptyMessage = 'Tidak ada data.',
  isEmpty = false,
}: TableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface shadow-xs">
      <table className="min-w-full divide-y divide-line">
        <thead className="bg-canvas">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="px-4 py-3 text-left text-xs font-semibold text-ink-soft uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-surface divide-y divide-line/60">
          {isEmpty ? (
            <tr>
              <td
                colSpan={headers.length}
                className="px-4 py-12 text-center text-ink-muted text-sm"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-ink">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`w-full px-3.5 py-2 rounded-md border text-sm transition-colors text-ink placeholder:text-ink-muted
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
            ${error ? 'border-red-400 bg-red-50/50' : 'border-line bg-surface hover:border-ink-soft/40'}
            disabled:bg-canvas disabled:text-ink-muted disabled:cursor-not-allowed
            ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
        {!error && helperText && (
          <p className="text-xs text-ink-muted">{helperText}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

// ─── Select ───────────────────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-ink">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <select
          id={inputId}
          ref={ref}
          className={`w-full px-3.5 py-2 rounded-md border text-sm transition-colors text-ink
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
            ${error ? 'border-red-400 bg-red-50/50' : 'border-line bg-surface hover:border-ink-soft/40'}
            disabled:bg-canvas disabled:text-ink-muted disabled:cursor-not-allowed
            ${className}`}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';

// ─── Textarea ─────────────────────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-ink">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          className={`w-full px-3.5 py-2.5 rounded-md border text-sm transition-colors text-ink placeholder:text-ink-muted
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
            ${error ? 'border-red-400 bg-red-50/50' : 'border-line bg-surface hover:border-ink-soft/40'}
            disabled:bg-canvas disabled:text-ink-muted disabled:cursor-not-allowed
            resize-y min-h-[100px]
            ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
        {!error && helperText && (
          <p className="text-xs text-ink-muted">{helperText}</p>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

// ─── Alert ────────────────────────────────────────────────────────────────────

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Alert({ type, title, children, className = '' }: AlertProps) {
  const styles = {
    success: {
      container: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      icon: (
        <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    error: {
      container: 'bg-red-50 border-red-200 text-red-900',
      icon: (
        <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    warning: {
      container: 'bg-amber-50 border-amber-200 text-amber-900',
      icon: (
        <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    info: {
      container: 'bg-primary-50 border-primary-200 text-primary-900',
      icon: (
        <svg className="w-5 h-5 text-primary-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
  };

  const style = styles[type];

  return (
    <div className={`flex gap-3 p-4 rounded-md border ${style.container} ${className}`}>
      <div className="mt-0.5">{style.icon}</div>
      <div className="flex-1">
        {title && <p className="font-semibold text-sm mb-1">{title}</p>}
        <div className="text-sm leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

// ─── Loading Spinner ──────────────────────────────────────────────────────────

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <svg
      className={`animate-spin text-primary-600 ${sizes[size]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-4 rounded-xl border border-dashed border-line bg-surface/50">
      <div className="mx-auto mb-3 flex items-center justify-center w-14 h-14 rounded-2xl bg-canvas text-ink-muted">
        {icon || (
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        )}
      </div>
      <h3 className="text-base font-bold font-heading text-ink">{title}</h3>
      {description && <p className="mt-1 text-sm text-ink-soft max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  // Generate numbered pages (max 5 around current)
  const getPages = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-4 border-t border-line text-sm">
      <div className="text-ink-soft text-xs sm:text-sm">
        Halaman <span className="font-semibold text-ink">{page}</span> dari{' '}
        <span className="font-semibold text-ink">{totalPages}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          ← Prev
        </Button>

        <div className="hidden sm:flex items-center gap-1">
          {getPages().map((p, idx) =>
            typeof p === 'number' ? (
              <button
                key={idx}
                onClick={() => onPageChange(p)}
                className={`w-8 h-8 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  p === page
                    ? 'bg-primary-600 text-white shadow-xs'
                    : 'text-ink-soft hover:bg-canvas hover:text-ink'
                }`}
              >
                {p}
              </button>
            ) : (
              <span key={idx} className="px-1 text-ink-muted">
                {p}
              </span>
            )
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next →
        </Button>
      </div>
    </div>
  );
}

// ─── StatCard (Fase 2) ────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  variant?: 'primary' | 'accent' | 'success' | 'warning';
  className?: string;
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  variant = 'primary',
  className = '',
}: StatCardProps) {
  const iconTints = {
    primary: 'bg-primary-50 text-primary-600 border-primary-200/50',
    accent: 'bg-purple-50 text-accent border-purple-200/50',
    success: 'bg-emerald-50 text-emerald-600 border-emerald-200/50',
    warning: 'bg-amber-50 text-amber-600 border-amber-200/50',
  };

  return (
    <Card className={`flex items-start justify-between p-6 ${className}`}>
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">{label}</p>
        <p className="text-3xl font-bold font-heading text-ink mt-2">{value}</p>
        {trend && <p className="text-xs text-ink-soft mt-1.5">{trend}</p>}
      </div>
      {icon && (
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-xs ${iconTints[variant]}`}
        >
          {icon}
        </div>
      )}
    </Card>
  );
}

// ─── Avatar (Fase 2) ──────────────────────────────────────────────────────────

interface AvatarProps {
  name: string;
  role?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ name, role, size = 'md', className = '' }: AvatarProps) {
  const initials = name
    ? name
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base font-semibold',
  };

  // Color by role
  const roleColor =
    role === 'admin'
      ? 'bg-purple-100 text-purple-800 border-purple-200'
      : role === 'officer'
      ? 'bg-amber-100 text-amber-800 border-amber-200'
      : 'bg-primary-100 text-primary-800 border-primary-200';

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold border flex-shrink-0 ${roleColor} ${sizeClasses[size]} ${className}`}
      title={name}
    >
      {initials}
    </div>
  );
}

// ─── Skeleton (Fase 3) ────────────────────────────────────────────────────────

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-line/80 rounded-md ${className}`} />;
}

// ─── Breadcrumb (Fase 3) ──────────────────────────────────────────────────────

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-2 text-xs text-ink-soft mb-6">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={idx}>
            {item.href && !isLast ? (
              <a href={item.href} className="hover:text-primary-600 transition-colors">
                {item.label}
              </a>
            ) : (
              <span className={isLast ? 'font-semibold text-ink' : ''}>{item.label}</span>
            )}
            {!isLast && (
              <svg className="w-3.5 h-3.5 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

// ─── Error Modal & Hook ───────────────────────────────────────────────────────

export { ErrorModal } from './ErrorModal';
export type { ErrorModalProps } from './ErrorModal';

export function useErrorPopup() {
  const [errorPopup, setErrorPopup] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isConnectionError: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    isConnectionError: false,
  });

  const triggerErrorPopup = React.useCallback(
    (title: string, message: string, isConnection = false) => {
      setErrorPopup({
        isOpen: true,
        title,
        message,
        isConnectionError: isConnection,
      });
    },
    []
  );

  const closeErrorPopup = React.useCallback(() => {
    setErrorPopup((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return { errorPopup, triggerErrorPopup, closeErrorPopup };
}

