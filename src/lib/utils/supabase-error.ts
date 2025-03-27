import { PostgrestError } from '@supabase/supabase-js';

export function handleSupabaseError(error: PostgrestError | Error): string {
  if ('code' in error) {
    // Handle PostgrestError
    switch (error.code) {
      case '23505': // unique_violation
        return 'This record already exists.';
      case '23503': // foreign_key_violation
        return 'This operation cannot be completed due to related records.';
      case '42P01': // undefined_table
        return 'Database table not found.';
      case '42501': // insufficient_privilege
        return 'You do not have permission to perform this action.';
      default:
        return error.message || 'An unexpected database error occurred.';
    }
  } else {
    // Handle regular Error
    if (error.message.includes('Failed to fetch')) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }
    return error.message || 'An unexpected error occurred.';
  }
}

export function isSupabaseError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'details' in error
  );
} 