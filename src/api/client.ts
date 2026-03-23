const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4545/api/v1";

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  headers?: Record<string, string>;
}

class APIClient {
  private baseUrl: string;
  private static redirectingToLogin = false;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  }

  private handleUnauthorized() {
    if (typeof window === "undefined") return;

    // Clear local auth state on session expiration / invalid credentials.
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch {
      // Ignore storage access errors (e.g. privacy mode).
    }

    if (APIClient.redirectingToLogin) return;
    APIClient.redirectingToLogin = true;
    window.location.href = "/login";
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = "GET", body, headers = {} } = options;

    const token = this.getToken();
    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...headers,
    };

    if (token) {
      requestHeaders["Authorization"] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (body && method !== "GET") {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        this.handleUnauthorized();
      }
      const error = await response.json().catch(() => ({ error: "Request failed" }));
      throw new Error(error.error || "Request failed");
    }
    if (response.status === 204) {
      return undefined as T;
    }
    const text = await response.text();
    if (!text) {
      return undefined as T;
    }
    return JSON.parse(text) as T;
  }

  // Auth
  async login(email: string, password: string) {
    return this.request<{ user: User; token: string }>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
  }

  async register(data: RegisterRequest) {
    return this.request<{ user: User; token: string }>("/auth/register", {
      method: "POST",
      body: data,
    });
  }

  async getProfile() {
    return this.request<User>("/auth/profile");
  }

  // Users
  async updateProfile(data: UpdateProfileRequest) {
    return this.request<User>("/users/me", {
      method: "PUT",
      body: data,
    });
  }

  async getUser(id: string) {
    return this.request<User>(`/users/${id}`);
  }

  async getUserByBusinessId(businessId: string) {
    return this.request<User>(`/users/business/${businessId}`);
  }

  // Collections
  async createCollection(data: CreateCollectionRequest) {
    return this.request<SeedCollection>("/collections", {
      method: "POST",
      body: data,
    });
  }

  async getCollections(params?: { status?: string; limit?: number; offset?: number }) {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.limit) query.set("limit", params.limit.toString());
    if (params?.offset) query.set("offset", params.offset.toString());
    return this.request<PaginatedResponse<SeedCollection>>(`/collections?${query}`);
  }

  async getMyCollections(params?: { limit?: number; offset?: number }) {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", params.limit.toString());
    if (params?.offset) query.set("offset", params.offset.toString());
    return this.request<PaginatedResponse<SeedCollection>>(`/collections/me?${query}`);
  }

  async getCollectorCollections(collectorId: string, params?: { limit?: number; offset?: number }) {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", params.limit.toString());
    if (params?.offset) query.set("offset", params.offset.toString());
    return this.request<PaginatedResponse<SeedCollection>>(`/collections/collector/${collectorId}?${query}`);
  }

  async getMyStats() {
    return this.request<CollectorStats>("/collections/me/stats");
  }

  async getMyLocations() {
    return this.request<LocationPoint[]>("/collections/me/locations");
  }

  async updateCollection(id: string, data: UpdateCollectionRequest) {
    return this.request<SeedCollection>(`/collections/${id}`, {
      method: "PUT",
      body: data,
    });
  }

  async deleteCollection(id: string) {
    return this.request(`/collections/${id}`, {
      method: "DELETE",
    });
  }

  async acceptCollection(id: string, nurseryId: string) {
    return this.request<SeedBatch>(`/collections/${id}/accept`, {
      method: "POST",
      body: { nursery_id: nurseryId },
    });
  }

  // Nurseries
  async getNurseries(params?: { type?: string; limit?: number; offset?: number }) {
    const query = new URLSearchParams();
    if (params?.type) query.set("type", params.type);
    if (params?.limit) query.set("limit", params.limit.toString());
    if (params?.offset) query.set("offset", params.offset.toString());
    return this.request<PaginatedResponse<Nursery>>(`/nurseries?${query}`);
  }

  async getMyNurseries() {
    return this.request<NurseryCollector[]>("/nurseries/me");
  }

  async getNursery(id: string) {
    return this.request<Nursery>(`/nurseries/${id}`);
  }

  async getNurseryHierarchy(id: string) {
    return this.request<Nursery>(`/nurseries/${id}/hierarchy`);
  }

  async getNurseryStats(id: string) {
    return this.request<NurseryStats>(`/nurseries/${id}/stats`);
  }

  async getNurseryBatches(nurseryId: string, params?: { limit?: number; offset?: number }) {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", params.limit.toString());
    if (params?.offset) query.set("offset", params.offset.toString());
    return this.request<PaginatedResponse<SeedBatch>>(`/collections/nursery/${nurseryId}/batches?${query}`);
  }

  async createNursery(data: CreateNurseryRequest) {
    return this.request<Nursery>("/nurseries", {
      method: "POST",
      body: data,
    });
  }

  async deleteNursery(id: string) {
    return this.request(`/nurseries/${id}`, {
      method: "DELETE",
    });
  }

  async updateNursery(id: string, data: UpdateNurseryRequest) {
    return this.request<Nursery>(`/nurseries/${id}`, {
      method: "PUT",
      body: data,
    });
  }

  async approveNursery(id: string) {
    return this.request<Nursery>(`/nurseries/${id}/verify`, {
      method: "PATCH",
    });
  }

  async addCollectorToNursery(nurseryId: string, collectorId: string) {
    return this.request(`/nurseries/${nurseryId}/collectors`, {
      method: "POST",
      body: { collector_id: collectorId },
    });
  }

  async getNurseryCollectors(nurseryId: string) {
    return this.request<NurseryCollector[]>(`/nurseries/${nurseryId}/collectors`);
  }

  async removeCollectorFromNursery(nurseryId: string, collectorId: string) {
    return this.request(`/nurseries/${nurseryId}/collectors/${collectorId}`, {
      method: "DELETE",
    });
  }

  async createCollectorForNursery(
    nurseryId: string,
    data: CreateCollectorForNurseryRequest
  ) {
    return this.request<{ success: boolean; collector?: User }>(`/nurseries/${nurseryId}/collectors`, {
      method: "POST",
      body: data,
    });
  }

  // Inventory requests
  async createInventoryRequest(data: CreateInventoryRequest) {
    return this.request<InventoryRequest>("/inventory-requests", {
      method: "POST",
      body: data,
    });
  }

  async getInventoryRequests(params: { nursery_id: string; limit?: number; offset?: number }) {
    const query = new URLSearchParams();
    query.set("nursery_id", params.nursery_id);
    if (params.limit) query.set("limit", params.limit.toString());
    if (params.offset) query.set("offset", params.offset.toString());
    return this.request<PaginatedResponse<InventoryRequest>>(`/inventory-requests?${query}`);
  }

  async getInventoryRequest(id: string) {
    return this.request<InventoryRequest>(`/inventory-requests/${id}`);
  }

  async approveInventoryRequest(id: string, notes?: string) {
    return this.request<InventoryRequest>(`/inventory-requests/${id}/approve`, {
      method: "POST",
      body: { notes },
    });
  }

  async rejectInventoryRequest(id: string, notes?: string) {
    return this.request<InventoryRequest>(`/inventory-requests/${id}/reject`, {
      method: "POST",
      body: { notes },
    });
  }

  async fulfillInventoryRequest(id: string, notes?: string) {
    return this.request<InventoryRequest>(`/inventory-requests/${id}/fulfill`, {
      method: "POST",
      body: { notes },
    });
  }

  // Sales (POS)
  async createSale(data: CreateSaleRequest) {
    return this.request<Sale>("/sales", {
      method: "POST",
      body: data,
    });
  }

  async getSales(params?: { nursery_id?: string; limit?: number; offset?: number }) {
    const query = new URLSearchParams();
    if (params?.nursery_id) query.set("nursery_id", params.nursery_id);
    if (params?.limit) query.set("limit", params.limit.toString());
    if (params?.offset) query.set("offset", params.offset.toString());
    return this.request<PaginatedResponse<Sale>>(`/sales?${query}`);
  }

  async getSale(id: string) {
    return this.request<Sale>(`/sales/${id}`);
  }

  async getSalesStats(params?: { nursery_id?: string }) {
    const query = new URLSearchParams();
    if (params?.nursery_id) query.set("nursery_id", params.nursery_id);
    return this.request<SalesStats>(`/sales/stats?${query}`);
  }

  async updateSalePaymentStatus(id: string, data: UpdateSalePaymentStatusRequest) {
    return this.request<Sale>(`/sales/${id}/payment-status`, {
      method: "PATCH",
      body: data,
    });
  }

  // Species
  async getSpecies(params?: { limit?: number; offset?: number }) {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", params.limit.toString());
    if (params?.offset) query.set("offset", params.offset.toString());
    return this.request<PaginatedResponse<Species>>(`/species?${query}`);
  }

  async getSpeciesById(id: string) {
    return this.request<Species>(`/species/${id}`);
  }

  async searchSpecies(query: string, limit = 20) {
    return this.request<Species[]>(`/species/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  }

  async createSpecies(data: CreateSpeciesRequest) {
    return this.request<Species>("/species", {
      method: "POST",
      body: data,
    });
  }

  async updateSpecies(id: string, data: UpdateSpeciesRequest) {
    return this.request<Species>(`/species/${id}`, {
      method: "PUT",
      body: data,
    });
  }

  async deleteSpecies(id: string) {
    return this.request(`/species/${id}`, {
      method: "DELETE",
    });
  }

  // Mother Trees
  async getMotherTrees(params?: { limit?: number; offset?: number }) {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", params.limit.toString());
    if (params?.offset) query.set("offset", params.offset.toString());
    return this.request<PaginatedResponse<MotherTree>>(`/mother-trees?${query}`);
  }

  async createMotherTree(data: CreateMotherTreeRequest) {
    return this.request<MotherTree>("/mother-trees", {
      method: "POST",
      body: data,
    });
  }

  async updateMotherTree(id: string, data: UpdateMotherTreeRequest) {
    return this.request<MotherTree>(`/mother-trees/${id}`, {
      method: "PUT",
      body: data,
    });
  }

  async deleteMotherTree(id: string) {
    return this.request(`/mother-trees/${id}`, {
      method: "DELETE",
    });
  }

  async getNearbyMotherTrees(lat: number, lng: number, radius = 10) {
    return this.request<MotherTree[]>(`/mother-trees/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
  }

  async getMotherTreesBySpecies(speciesId: string) {
    return this.request<MotherTree[]>(`/mother-trees/species/${speciesId}`);
  }

  // Chat
  async sendMessage(data: SendMessageRequest) {
    return this.request<ChatMessage>("/chat/messages", {
      method: "POST",
      body: data,
    });
  }

  async getChatRooms() {
    return this.request<ChatRoom[]>("/chat/rooms");
  }

  async getMessages(roomId: string, params?: { limit?: number; offset?: number }) {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", params.limit.toString());
    if (params?.offset) query.set("offset", params.offset.toString());
    return this.request<ChatMessage[]>(`/chat/rooms/${roomId}/messages?${query}`);
  }

  async markAsRead(roomId: string) {
    return this.request(`/chat/rooms/${roomId}/read`, { method: "POST" });
  }

  async getUnreadCount() {
    return this.request<{ count: number }>("/chat/unread");
  }

  // Notifications
  async getNotifications(params?: { limit?: number; offset?: number }) {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", params.limit.toString());
    if (params?.offset) query.set("offset", params.offset.toString());
    return this.request<Notification[]>(`/notifications?${query}`);
  }

  async markNotificationRead(id: string) {
    return this.request(`/notifications/${id}/read`, { method: "POST" });
  }

  async getUnreadNotificationCount() {
    return this.request<{ count: number }>("/notifications/unread");
  }

  // Admin endpoints
  async getAllCollections(params?: { status?: string; limit?: number; offset?: number }) {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.limit) query.set("limit", params.limit.toString());
    if (params?.offset) query.set("offset", params.offset.toString());
    return this.request<PaginatedResponse<SeedCollection>>(`/collections?${query}`);
  }

  async getAllNurseries(params?: { type?: string; limit?: number; offset?: number }) {
    const query = new URLSearchParams();
    if (params?.type) query.set("type", params.type);
    if (params?.limit) query.set("limit", params.limit.toString());
    if (params?.offset) query.set("offset", params.offset.toString());
    return this.request<PaginatedResponse<Nursery>>(`/nurseries?${query}`);
  }

  async getAllMotherTrees(params?: { limit?: number; offset?: number }) {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", params.limit.toString());
    if (params?.offset) query.set("offset", params.offset.toString());
    return this.request<PaginatedResponse<MotherTree>>(`/mother-trees?${query}`);
  }

  async getAllUsers(params?: { role?: string; limit?: number; offset?: number }) {
    const query = new URLSearchParams();
    if (params?.role) query.set("role", params.role);
    if (params?.limit) query.set("limit", params.limit.toString());
    if (params?.offset) query.set("offset", params.offset.toString());
    return this.request<PaginatedResponse<User>>(`/users?${query}`);
  }

  async approveUser(id: string) {
    return this.request<User>(`/users/${id}/verify`, {
      method: "PATCH",
    });
  }

  async getAdminStats() {
    // Aggregate stats from multiple endpoints
    const [collections, nurseries, motherTrees, species] = await Promise.all([
      this.request<PaginatedResponse<SeedCollection>>("/collections?limit=1000"),
      this.request<PaginatedResponse<Nursery>>("/nurseries?limit=100"),
      this.request<PaginatedResponse<MotherTree>>("/mother-trees?limit=100"),
      this.request<PaginatedResponse<Species>>("/species?limit=100"),
    ]);

    const totalQuantity = collections.data.reduce((sum, c) => sum + (c.quantity || 0), 0);
    const totalPlanted = collections.data
      .filter(c => c.status === "planted")
      .reduce((sum, c) => sum + (c.quantity || 0), 0);
    
    // Fetch stats from all nurseries to get germination rates
    const nurseryStatsPromises = nurseries.data.slice(0, 10).map(n => 
      this.getNurseryStats(n.id).catch(() => null)
    );
    const nurseryStats = await Promise.all(nurseryStatsPromises);
    const validStats = nurseryStats.filter((s): s is NurseryStats => s !== null);
    
    // Calculate aggregate germination rate from nursery stats
    const germinationRates = validStats.filter(s => s.germination_rate > 0);
    const avgGerminationRate = germinationRates.length > 0
      ? germinationRates.reduce((sum, s) => sum + s.germination_rate, 0) / germinationRates.length
      : 0;
    
    // Calculate survival rate based on distributed vs current stock
    const totalDistributed = validStats.reduce((sum, s) => sum + (s.distributed_count || 0), 0);
    const totalSeedlings = validStats.reduce((sum, s) => sum + (s.total_seedlings || 0), 0);
    const survivalRate = totalSeedlings > 0 && totalDistributed > 0
      ? Math.min(100, (totalDistributed / totalSeedlings) * 100)
      : 0;

    return {
      totalSeeds: totalQuantity,
      verifiedMotherTrees: motherTrees.total,
      germinationRate: avgGerminationRate,
      survivalRate: survivalRate,
      activeNurseries: nurseries.total,
      activeRegions: new Set(collections.data.map(c => c.region).filter(Boolean)).size || 1,
      totalPlanted: totalPlanted,
      // Carbon sequestration: ~35kg CO2 per planted tree per year (young tree estimate)
      // Based on research: young trees sequester 10-25kg CO2/year, mature trees 20-50kg/year
      carbonSequestered: (totalPlanted * 0.035) / 1000, // Convert kg to tonnes
      speciesDiversity: species.total,
    };
  }

  // Uploads
  async uploadFile(file: File, folder?: string) {
    const formData = new FormData();
    formData.append("file", file);

    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const query = folder ? `?folder=${folder}` : "";
    const response = await fetch(`${this.baseUrl}/uploads${query}`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    return response.json();
  }

  async uploadMultiple(files: File[], folder?: string) {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const query = folder ? `?folder=${folder}` : "";
    const response = await fetch(`${this.baseUrl}/uploads/multiple${query}`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    return response.json();
  }
}

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: "collector" | "super_nursery" | "community_nursery" | "regional_nursery" | "partner" | "admin";
  region?: string;
  business_id: string;
  business_name?: string;
  business_description?: string;
  business_logo?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  profile_photo?: string;
  bio?: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  catalogue?: CollectorSpecies[];
}

export interface CollectorSpecies {
  id: string;
  species_id: string;
  species: Species;
  notes?: string;
  is_available: boolean;
}

export interface Species {
  id: string;
  created_at?: string;
  updated_at?: string;
  scientific_name: string;
  common_name?: string;
  local_name?: string;
  family?: string;
  description?: string;
  ecological_zone?: string;
  native_region?: string;
  growth_rate?: string;
  max_height?: number;
  life_span?: number;
  seeds_per_kg?: number;
  germination_days?: number;
  germination_rate?: number;
  uses?: string;
  conservation_status?: string;
  photo_url?: string;
  is_active?: boolean;
}

export interface MotherTree {
  id: string;
  tree_id: string;
  species_id: string;
  species?: Species;
  latitude: number;
  longitude: number;
  region?: string;
  district?: string;
  village?: string;
  age?: number;
  height?: number;
  health_status?: string;
  photo_url?: string;
  registered_date: string;
}

export interface Nursery {
  id: string;
  created_at?: string;
  updated_at?: string;
  nursery_id: string;
  name: string;
  type: "regional" | "super" | "community";
  description?: string;
  logo?: string;
  location?: string;
  region?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  capacity: number;
  current_stock: number;
  active_batches?: number;
  germination_rate?: number;
  operator_id: string;
  operator?: User;
  parent_nursery_id?: string;
  parent_nursery?: Nursery;
  child_nurseries?: Nursery[];
  regional_nursery_id?: string;
  regional_nursery?: Nursery;
  contact_email?: string;
  contact_phone?: string;
  offers_seedlings: boolean;
  offers_training: boolean;
  offers_contracts: boolean;
  is_active: boolean;
  is_verified: boolean;
}

export interface NurseryCollector {
  id: string;
  nursery_id: string;
  nursery: Nursery;
  collector_id: string;
  collector?: User;
  status: string;
  joined_at: string;
}

export interface SeedCollection {
  id: string;
  collection_number: string;
  batch_number?: string;
  status: "pending" | "approved" | "rejected" | "in_nursery" | "distributed" | "planted";
  species_id?: string;
  species?: Species;
  species_name?: string;
  mother_tree_id?: string;
  mother_tree?: MotherTree;
  quantity: number;
  unit: "count" | "kg" | "g";
  latitude?: number;
  longitude?: number;
  region?: string;
  district?: string;
  village?: string;
  collector_id: string;
  collector?: User;
  target_nursery_id?: string;
  target_nursery?: Nursery;
  collection_date: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewer?: User;
  review_notes?: string;
  photos?: string;
  quality_rating?: number;
  additional_info?: string;
}

export interface SeedBatch {
  id: string;
  batch_number: string;
  status: string;
  species_id: string;
  species?: Species;
  nursery_id: string;
  nursery?: Nursery;
  initial_quantity: number;
  current_quantity: number;
  unit: string;
  germination_rate?: number;
  received_date: string;
}

export interface InventoryRequest {
  id: string;
  from_nursery_id: string;
  from_nursery?: Nursery;
  to_nursery_id: string;
  to_nursery?: Nursery;
  requested_by_id: string;
  requested_by?: User;
  reviewed_by_id?: string;
  reviewed_by?: User;
  source_batch_id?: string;
  target_batch_id?: string;
  species_id: string;
  species?: Species;
  quantity: number;
  unit: "count" | "kg" | "g";
  status: "pending" | "approved" | "rejected" | "fulfilled";
  notes?: string;
  review_notes?: string;
  reviewed_at?: string;
  fulfilled_at?: string;
  created_at?: string;
}

export interface Sale {
  id: string;
  sale_number: string;
  batch_id: string;
  batch?: SeedBatch;
  species_id: string;
  species?: Species;
  quantity: number;
  unit: "count" | "kg" | "g";
  price_per_unit: number;
  total_amount: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  nursery_id: string;
  payment_status: "pending" | "paid" | "failed" | "refunded";
  payment_method?: "flutterwave" | "cash" | "bank_transfer" | "mobile_money";
  transaction_reference?: string;
  paid_at?: string;
  sale_date: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ChatRoom {
  id: string;
  name?: string;
  user1?: User;
  user2?: User;
  nursery?: Nursery;
  last_message?: string;
  last_message_at?: string;
  is_active: boolean;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  sender?: User;
  type: "text" | "notification" | "availability" | "order";
  content: string;
  species?: Species;
  quantity?: number;
  unit?: string;
  is_read: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  reference_type?: string;
  reference_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface CollectorStats {
  total_collections: number;
  pending_reviews: number;
  approved: number;
  rejected: number;
  total_quantity: number;
  unique_species: number;
}

export interface SalesStats {
  total_sales: number;
  total_revenue: number;
  pending_count: number;
  paid_count: number;
}

export interface NurseryStats {
  total_batches: number;
  active_batches: number;
  total_seedlings: number;
  current_stock: number;
  germination_rate: number;
  distributed_count: number;
}

export interface LocationPoint {
  latitude: number;
  longitude: number;
  count: number;
  region?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

// Request types
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: string;
  region?: string;
  district?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  capacity?: number;
  business_name?: string;
  business_description?: string;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  business_name?: string;
  business_description?: string;
  business_logo?: string;
  bio?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  profile_photo?: string;
}

export interface CreateCollectorForNurseryRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
}

export interface CreateCollectionRequest {
  species_id?: string;
  species_name?: string;
  mother_tree_id?: string;
  quantity: number;
  unit: string;
  latitude?: number;
  longitude?: number;
  region?: string;
  district?: string;
  village?: string;
  target_nursery_id?: string;
  collection_date?: string;
  additional_info?: string;
  photos?: string[];
}

export interface UpdateCollectionRequest {
  status?: string;
  review_notes?: string;
  quality_rating?: number;
}

export interface CreateNurseryRequest {
  name: string;
  type: string;
  description?: string;
  location?: string;
  region?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  capacity: number;
  parent_nursery_id?: string;
  regional_nursery_id?: string;
  contact_email?: string;
  contact_phone?: string;
  offers_seedlings?: boolean;
  offers_training?: boolean;
  offers_contracts?: boolean;

  // Provision a dedicated user account that can log in as `super_nursery`
  // and manage the created super nursery.
  super_operator_name?: string;
  super_operator_email?: string;
  super_operator_password?: string;
  super_operator_phone?: string;
  super_operator_address?: string;
}

export interface UpdateNurseryRequest {
  name?: string;
  description?: string;
  location?: string;
  region?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  capacity?: number;
  contact_email?: string;
  contact_phone?: string;
  offers_seedlings?: boolean;
  offers_training?: boolean;
  offers_contracts?: boolean;
}

export interface CreateInventoryRequest {
  from_nursery_id: string;
  to_nursery_id: string;
  species_id: string;
  quantity: number;
  unit: "count" | "kg" | "g";
  notes?: string;
}

export interface CreateSaleRequest {
  batch_id: string;
  quantity: number;
  price_per_unit: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  payment_method?: "flutterwave" | "cash" | "bank_transfer" | "mobile_money";
  transaction_reference?: string;
  notes?: string;
}

export interface UpdateSalePaymentStatusRequest {
  payment_status: "pending" | "paid" | "failed" | "refunded";
  transaction_reference?: string;
}

export interface CreateMotherTreeRequest {
  species_id: string;
  latitude: number;
  longitude: number;
  region?: string;
  district?: string;
  village?: string;
  ecological_zone?: string;
  age?: number;
  height?: number;
  dbh?: number;
  crown_diameter?: number;
  health_status?: string;
  photo_url?: string;
  notes?: string;
}

export interface UpdateMotherTreeRequest {
  species_id?: string;
  latitude?: number;
  longitude?: number;
  region?: string;
  district?: string;
  village?: string;
  ecological_zone?: string;
  age?: number;
  height?: number;
  dbh?: number;
  crown_diameter?: number;
  health_status?: string;
  photo_url?: string;
  notes?: string;
}

export interface CreateSpeciesRequest {
  scientific_name: string;
  common_name?: string;
  local_name?: string;
  family?: string;
  description?: string;
  ecological_zone?: string;
  native_region?: string;
  growth_rate?: string;
  max_height?: number;
  life_span?: number;
  seeding_season_start?: number;
  seeding_season_end?: number;
  seeds_per_kg?: number;
  germination_days?: number;
  germination_rate?: number;
  uses?: string;
  conservation_status?: string;
  photo_url?: string;
}

export interface UpdateSpeciesRequest {
  scientific_name?: string;
  common_name?: string;
  local_name?: string;
  family?: string;
  description?: string;
  ecological_zone?: string;
  native_region?: string;
  growth_rate?: string;
  max_height?: number;
  life_span?: number;
  seeding_season_start?: number;
  seeding_season_end?: number;
  seeds_per_kg?: number;
  germination_days?: number;
  germination_rate?: number;
  uses?: string;
  conservation_status?: string;
  photo_url?: string;
  is_active?: boolean;
}

export interface SendMessageRequest {
  room_id?: string;
  recipient_id?: string;
  content: string;
  type?: string;
  species_id?: string;
  quantity?: number;
  unit?: string;
}

export const api = new APIClient(BASE_URL);
export default api;
