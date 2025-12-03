
import { apiRequest } from "../utils/api"; 

const BASE = `${import.meta.env.VITE_SUPABASE_FUNCTION_URL}/make-server-c9aabe87`;


export const adminApi = {
  // ---------------------------
  // FETCH ALL RAW BUSINESSES
  // ---------------------------
  async getRawBusinesses(token: string) {
    return apiRequest(`${BASE}/businesses/raw`, {
      method: "GET"
    }, token);
  },

  // ---------------------------
  // UPDATE A SINGLE BUSINESS
  // ---------------------------
  async updateBusiness(id: number, data: any, token: string) {
    return apiRequest(`${BASE}/businesses/raw/${id}`, {
      method: "PUT",
      body: JSON.stringify(data)
    }, token);
  },

  // ---------------------------
  // DELETE A BUSINESS
  // ---------------------------
  async deleteBusiness(id: number, token: string) {
    return apiRequest(`${BASE}/businesses/raw/${id}`, {
      method: "DELETE"
    }, token);
  },

  // ---------------------------
  // BULK OVERWRITE (Used for CSV upload)
  // ---------------------------
  async replaceAllBusinesses(businesses: any[], token: string) {
    return apiRequest(`${BASE}/businesses/raw`, {
      method: "POST",
      body: JSON.stringify({ businesses })
    }, token);
  },

  // ---------------------------
  // MANUAL TRAIN BUTTON
  // ---------------------------
  async trainModel() {
    return apiRequest(`${BASE}/train`, {
      method: "POST"
    });
  },

  // ---------------------------
  // ADMIN DASHBOARD METRICS
  // ---------------------------
  async getAdminStats(token: string) {
    return apiRequest(`${BASE}/admin/stats`, {
      method: "GET",
    }, token);
  },

  // ---------------------------
  // ANALYTICS HISTORY
  // ---------------------------
  async getAnalyses(token: string) {
    return apiRequest(`${BASE}/analysis/history`, {
      method: "GET",
    }, token);
  }
};
