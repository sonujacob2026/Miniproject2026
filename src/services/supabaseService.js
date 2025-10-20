// Enhanced Supabase service with session timeout handling
import { supabase, sessionManager } from '../lib/supabase';

class SupabaseService {
  constructor() {
    this.retryAttempts = 3;
    this.retryDelay = 1000;
  }

  // Enhanced query method with session timeout handling
  async query(operation, retryCount = 0) {
    try {
      // Ensure session is valid before making the request
      const sessionCheck = await sessionManager.ensureValidSession();
      
      if (!sessionCheck.valid) {
        console.warn('Session invalid, attempting refresh...');
        const refreshed = await sessionManager.handleSessionTimeout();
        
        if (!refreshed && retryCount < this.retryAttempts) {
          console.log(`Retrying operation (attempt ${retryCount + 1}/${this.retryAttempts})...`);
          await this.delay(this.retryDelay * (retryCount + 1));
          return this.query(operation, retryCount + 1);
        }
        
        if (!refreshed) {
          throw new Error('Session expired. Please sign in again.');
        }
      }

      // Execute the operation
      const result = await operation();
      
      // Check if the result indicates a session timeout
      if (result.error && this.isSessionTimeoutError(result.error)) {
        console.warn('Session timeout detected in response, attempting refresh...');
        
        if (retryCount < this.retryAttempts) {
          const refreshed = await sessionManager.handleSessionTimeout();
          if (refreshed) {
            console.log(`Retrying operation after session refresh (attempt ${retryCount + 1}/${this.retryAttempts})...`);
            await this.delay(this.retryDelay * (retryCount + 1));
            return this.query(operation, retryCount + 1);
          }
        }
        
        throw new Error('Session expired. Please sign in again.');
      }
      
      return result;
    } catch (error) {
      console.error('SupabaseService query error:', error);
      
      // Check if this is a session timeout error
      if (this.isSessionTimeoutError(error) && retryCount < this.retryAttempts) {
        console.log(`Session timeout error detected, retrying (attempt ${retryCount + 1}/${this.retryAttempts})...`);
        await this.delay(this.retryDelay * (retryCount + 1));
        return this.query(operation, retryCount + 1);
      }
      
      throw error;
    }
  }

  // Check if error is related to session timeout
  isSessionTimeoutError(error) {
    if (!error) return false;
    
    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code || '';
    
    return (
      errorMessage.includes('session') ||
      errorMessage.includes('token') ||
      errorMessage.includes('expired') ||
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('invalid') ||
      errorCode === 'PGRST301' || // PostgREST unauthorized
      errorCode === 'PGRST116' || // PostgREST JWT expired
      errorCode === 'invalid_grant' ||
      errorCode === 'invalid_request'
    );
  }

  // Delay utility
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Enhanced select method
  async select(table, options = {}) {
    return this.query(async () => {
      let query = supabase.from(table).select(options.select || '*');
      
      if (options.eq) {
        Object.entries(options.eq).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }
      
      if (options.order) {
        query = query.order(options.order.column, { ascending: options.order.ascending !== false });
      }
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.range) {
        query = query.range(options.range.from, options.range.to);
      }
      
      return await query;
    });
  }

  // Enhanced insert method
  async insert(table, data) {
    return this.query(async () => {
      return await supabase.from(table).insert(data);
    });
  }

  // Enhanced update method
  async update(table, data, conditions) {
    return this.query(async () => {
      let query = supabase.from(table).update(data);
      
      if (conditions.eq) {
        Object.entries(conditions.eq).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }
      
      return await query;
    });
  }

  // Enhanced delete method
  async delete(table, conditions) {
    return this.query(async () => {
      let query = supabase.from(table).delete();
      
      if (conditions.eq) {
        Object.entries(conditions.eq).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }
      
      return await query;
    });
  }

  // Enhanced upsert method
  async upsert(table, data, options = {}) {
    return this.query(async () => {
      return await supabase.from(table).upsert(data, options);
    });
  }
}

// Create singleton instance
const supabaseService = new SupabaseService();

export default supabaseService;



