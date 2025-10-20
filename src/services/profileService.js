// Profile service aligned with Supabase 'user_profiles' schema
// Maps questionnaire form data to normalized DB columns and vice versa.

import { supabase } from '../lib/supabase';

const table = 'user_profiles';

// Helper: convert questionnaire form data -> DB row
function mapFormToRow(formData, userId, { setOnboarding = false } = {}) {
  const toNumber = (v) => {
    if (v === undefined || v === null || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  return {
    user_id: userId,
    household_members: formData.householdMembers ? parseInt(formData.householdMembers, 10) : null,
    monthly_income: toNumber(formData.monthlyIncome),
    has_debt: formData.hasDebt === 'yes' ? true : formData.hasDebt === 'no' ? false : null,
    debt_amount: toNumber(formData.debtAmount),
    savings_goal: formData.savingsGoal ?? null,
    primary_expenses: Array.isArray(formData.primaryExpenses) ? formData.primaryExpenses : [],
    budgeting_experience: formData.budgetingExperience ?? null,
    financial_goals: Array.isArray(formData.financialGoals) ? formData.financialGoals : [],
    ...(setOnboarding ? { onboarding_completed: true } : {}),
  };
}

// Helper: DB row -> questionnaire-friendly object
function mapRowToForm(row) {
  if (!row) return null;
  return {
    // For Questionnaire
    householdMembers: row.household_members != null ? String(row.household_members) : '',
    monthlyIncome: row.monthly_income != null ? String(row.monthly_income) : '',
    hasDebt: row.has_debt === true ? 'yes' : row.has_debt === false ? 'no' : '',
    debtAmount: row.debt_amount != null ? String(row.debt_amount) : '',
    savingsGoal: row.savings_goal ?? '',
    primaryExpenses: row.primary_expenses ?? [],
    budgetingExperience: row.budgeting_experience ?? '',
    financialGoals: row.financial_goals ?? [],
    // For UserProfile
    full_name: row.full_name ?? '',
    email: row.email ?? '',
  };
}

// Helper: convert profile form data -> DB row
function mapProfileFormToRow(formData, userId) {
  const toNumber = (v) => {
    if (v === undefined || v === null || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  return {
    user_id: userId,
    full_name: formData.full_name || null,
    email: formData.email || null,
    household_members: formData.household_members ? parseInt(formData.household_members, 10) : null,
    monthly_income: toNumber(formData.monthly_income),
    has_debt: formData.has_debt === 'yes' ? true : formData.has_debt === 'no' ? false : null,
    debt_amount: toNumber(formData.debt_amount),
    savings_goal: formData.savings_goal || null,
    budgeting_experience: formData.budgeting_experience || null,
    financial_goals: Array.isArray(formData.financial_goals) ? formData.financial_goals : [],
  };
}

const ProfileService = {

  // Clear cache for a specific user
  clearCache(userId) {
    try {
      // Clear localStorage cache
      localStorage.removeItem(`profile_${userId}`);
      console.log('ProfileService: Cache cleared for user:', userId);
    } catch (error) {
      console.error('ProfileService: Error clearing cache:', error);
    }
  },

  // Get raw profile row for a user - always fetch from database with validation
  async getProfile(userId) {
    try {
      console.log('ProfileService: Fetching profile from database for user:', userId);

      const baseSelect = 'user_id, full_name, email, onboarding_completed, household_members, monthly_income, has_debt, debt_amount, savings_goal, primary_expenses, budgeting_experience, financial_goals, created_at, updated_at';

      const { data, error } = await supabase
        .from(table)
        .select(baseSelect)
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('ProfileService: Database error:', error);
        return { success: false, error: error.message };
      }

      let row = data || null;
      let cachedAuthUser = null;

      const loadAuthUser = async () => {
        if (cachedAuthUser) {
          return cachedAuthUser;
        }
        try {
          const { data: authData, error: authError } = await supabase.auth.getUser();
          if (authError) {
            console.warn('ProfileService: Unable to fetch auth user for profile repair:', authError);
            return null;
          }
          cachedAuthUser = authData?.user ?? null;
          return cachedAuthUser;
        } catch (authErr) {
          console.warn('ProfileService: Exception fetching auth user for profile repair:', authErr);
          return null;
        }
      };

      const buildFallbackName = (authUser) => {
        if (!authUser) return 'New User';
        return (
          authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          (authUser.email ? authUser.email.split('@')[0] : null) ||
          'New User'
        );
      };

      if (!row) {
        const authUser = await loadAuthUser();

        if (!authUser) {
          console.warn('ProfileService: Profile missing and no auth user available to backfill');
          return { success: false, error: 'Profile not found and unable to create default profile' };
        }

        const fallbackName = buildFallbackName(authUser);
        const now = new Date().toISOString();

        const { data: inserted, error: insertErr } = await supabase
          .from(table)
          .upsert(
            {
              user_id: authUser.id,
              email: authUser.email,
              full_name: fallbackName,
              onboarding_completed: false,
              created_at: now,
              updated_at: now
            },
            { onConflict: 'user_id' }
          )
          .select()
          .maybeSingle();

        if (insertErr) {
          console.error('ProfileService: Failed to create default profile row:', insertErr);
          return { success: false, error: insertErr.message };
        }

        row = inserted;
      }

      const authUser = await loadAuthUser();
      const updates = {};

      if ((!row.email || row.email === '') && authUser?.email) {
        updates.email = authUser.email;
      }

      if (!row.full_name || row.full_name === '') {
        updates.full_name = buildFallbackName(authUser);
      }

      if (Object.keys(updates).length > 0) {
        updates.updated_at = new Date().toISOString();
        const { data: healedRow, error: healErr } = await supabase
          .from(table)
          .update(updates)
          .eq('user_id', userId)
          .select()
          .maybeSingle();

        if (healErr) {
          console.warn('ProfileService: Unable to update missing profile fields:', healErr);
          row = { ...row, ...updates };
        } else if (healedRow) {
          row = healedRow;
        } else {
          row = { ...row, ...updates };
        }
      }

      // Normalise optional JSON columns to prevent null/undefined issues downstream
      row.primary_expenses = Array.isArray(row.primary_expenses) ? row.primary_expenses : [];
      row.financial_goals = Array.isArray(row.financial_goals) ? row.financial_goals : [];

      console.log('ProfileService: Profile fetched and auto-healed successfully from database');
      return { success: true, data: row };
    } catch (err) {
      console.error('ProfileService: Exception getting profile:', err);
      return { success: false, error: err.message };
    }
  },


  // Save entire profile (used by questionnaire completion)
  async saveProfile(formData, userId) {
    try {
      const timings = {};
      let t0 = performance.now();
      const row = mapFormToRow(formData, userId, { setOnboarding: true });
      const now = new Date().toISOString();

      // Ensure we include email if the table enforces NOT NULL on email
      let userEmail = null;
      try {
        const t1 = performance.now();
        const { data: userData } = await supabase.auth.getUser();
        timings.getUser = performance.now() - t1;
        userEmail = userData?.user?.email || null;
      } catch (_) {}

      // Try update first
      const t2 = performance.now();
      const { data: updated, error: updateErr } = await supabase
        .from(table)
        .update({ ...row, ...(userEmail ? { email: userEmail } : {}), updated_at: now })
        .eq('user_id', userId)
        .select()
        .maybeSingle();
      timings.update = performance.now() - t2;

      if (!updateErr && updated) {
        console.log('[ProfileService] Timings:', timings);
        return { success: true, data: updated };
      }

      // If no row existed, insert
      const t3 = performance.now();
      const { data: inserted, error: insertErr } = await supabase
        .from(table)
        .insert({ ...row, ...(userEmail ? { email: userEmail } : {}), created_at: now, updated_at: now })
        .select()
        .single();
      timings.insert = performance.now() - t3;

      console.log('[ProfileService] Timings:', timings);
      if (insertErr) return { success: false, error: insertErr.message };
      return { success: true, data: inserted };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // Create a minimal persisted profile row if none exists
  async createBasicProfile(user) {
    try {
      if (!user?.id) return { success: false, error: 'No user' };
      const now = new Date().toISOString();
      const basic = {
        user_id: user.id,
        email: user.email || null,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        onboarding_completed: false,
        created_at: now,
        updated_at: now
      };
      const { data, error } = await supabase
        .from(table)
        .upsert(basic, { onConflict: 'user_id' })
        .select()
        .maybeSingle();
      if (error) return { success: false, error: error.message };
      // prime cache
      this._profileCache.set(`profile_${user.id}`, { data, timestamp: Date.now() });
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // Update specific fields on the profile row
  async updateProfile(userId, updates) {
    try {
      console.log('ProfileService: Updating profile for user:', userId, 'updates:', updates);
      
      if (!userId) {
        return { success: false, error: 'User ID is required' };
      }
      
      if (!updates || Object.keys(updates).length === 0) {
        return { success: false, error: 'No updates provided' };
      }
      
      const now = new Date().toISOString();
      
      // Convert updates to proper format
      const formattedUpdates = {
        ...updates,
        updated_at: now
      };
      
      // Handle debt fields properly
      if (updates.has_debt !== undefined) {
        formattedUpdates.has_debt = updates.has_debt === 'yes' ? true : updates.has_debt === 'no' ? false : null;
      }
      
      // Validate required fields if they're being updated
      if (updates.full_name && (!updates.full_name.trim() || updates.full_name.trim().length < 2)) {
        return { success: false, error: 'Full name must be at least 2 characters long' };
      }
      
      const { data, error } = await supabase
        .from(table)
        .update(formattedUpdates)
        .eq('user_id', userId)
        .select()
        .maybeSingle();

      if (error) {
        console.error('ProfileService: Error updating profile:', error);
        return { success: false, error: error.message };
      }
      
      if (!data) {
        console.error('ProfileService: No data returned after update');
        return { success: false, error: 'Profile not found or update failed' };
      }
      
      // Clear cache to ensure fresh data
      this.clearCache(userId);
      
      console.log('ProfileService: Profile updated successfully:', data);
      return { success: true, data };
    } catch (err) {
      console.error('ProfileService: Exception updating profile:', err);
      return { success: false, error: err.message || 'An unexpected error occurred' };
    }
  },


  // Check username availability
  async checkUsernameAvailability(username) {
    try {
      console.log('ProfileService: Checking username availability:', username);
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .eq('username', username)
        .maybeSingle();

      if (error) {
        console.error('ProfileService: Error checking username availability:', error);
        return { success: false, error: error.message };
      }
      
      const available = !data;
      console.log('ProfileService: Username available:', available);
      return { success: true, available };
    } catch (err) {
      console.error('ProfileService: Exception checking username availability:', err);
      return { success: false, error: err.message };
    }
  },

  // Return questionnaire-friendly data assembled from columns
  async getFormattedProfile(userId) {
    const res = await this.getProfile(userId);
    if (!res.success) return res;
    if (!res.data) return { success: true, data: null };
    return { success: true, data: mapRowToForm(res.data) };
  },

  // Return onboarding completion status
  async getOnboardingStatus(userId) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('onboarding_completed')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) return { success: false, error: error.message };
      return { success: true, completed: !!data?.onboarding_completed };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // Save entire profile form data
  async saveProfileForm(formData, userId) {
    try {
      console.log('ProfileService: Saving profile form for user:', userId);
      const row = mapProfileFormToRow(formData, userId);
      const now = new Date().toISOString();

      // Try update first
      const { data: updated, error: updateErr } = await supabase
        .from(table)
        .update({ ...row, updated_at: now })
        .eq('user_id', userId)
        .select()
        .maybeSingle();

      if (!updateErr && updated) {
        this.clearCache(userId);
        return { success: true, data: updated };
      }

      // If no row existed, insert
      const { data: inserted, error: insertErr } = await supabase
        .from(table)
        .insert({ ...row, created_at: now, updated_at: now })
        .select()
        .single();

      if (insertErr) return { success: false, error: insertErr.message };
      this.clearCache(userId);
      return { success: true, data: inserted };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};

export default ProfileService;