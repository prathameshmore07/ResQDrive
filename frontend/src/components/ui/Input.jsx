import React from 'react';

export default function Input({
  label,
  error,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  className = '',
  disabled = false,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`form-group ${className}`.trim()}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label} {required && <span style={{ color: 'var(--accent)' }}>*</span>}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        className={`form-input ${error ? 'error' : ''}`.trim()}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        {...props}
      />
      {error && (
        <span style={{ fontSize: '11px', color: 'var(--error)', marginTop: '2px' }}>
          {error}
        </span>
      )}
    </div>
  );
}
