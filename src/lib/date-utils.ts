import { addDays, parse, format, isValid } from 'date-fns';

// Calculate return date based on book type
export const calculateReturnDate = (borrowDate: string, bookType: string): string => {
  try {
    const date = parse(borrowDate, 'dd/MM/yyyy', new Date());
    
    if (!isValid(date)) {
      throw new Error('Invalid date format');
    }

    let daysToAdd: number;
    const bookTypeLower = bookType.toLowerCase();
    
    if (bookTypeLower === 'pelajaran') {
      daysToAdd = 3;
    } else if (bookTypeLower === 'bacaan') {
      daysToAdd = 7;
    } else {
      daysToAdd = 7; // Default to 7 days for unknown types
    }

    const returnDate = addDays(date, daysToAdd);
    return format(returnDate, 'dd/MM/yyyy');
  } catch (error) {
    console.error('Error calculating return date:', error);
    return borrowDate; // Return original date if calculation fails
  }
};

// Check if a borrowing is overdue
export const isOverdue = (returnDate: string, status: string): boolean => {
  if (status !== 'Dipinjam') return false;
  
  try {
    const returnD = parse(returnDate, 'dd/MM/yyyy', new Date());
    const today = new Date();
    
    if (!isValid(returnD)) return false;
    
    return returnD < today;
  } catch (error) {
    console.error('Error checking overdue status:', error);
    return false;
  }
};

// Format date for display
export const formatDate = (dateString: string): string => {
  try {
    const date = parse(dateString, 'dd/MM/yyyy', new Date());
    if (!isValid(date)) return dateString;
    return format(date, 'dd MMMM yyyy');
  } catch (error) {
    return dateString;
  }
};

// Get current date in DD/MM/YYYY format
export const getCurrentDate = (): string => {
  return format(new Date(), 'dd/MM/yyyy');
};

// Validate date format
export const isValidDateFormat = (dateString: string): boolean => {
  try {
    const date = parse(dateString, 'dd/MM/yyyy', new Date());
    return isValid(date);
  } catch {
    return false;
  }
};
