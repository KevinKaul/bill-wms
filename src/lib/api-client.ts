/**
 * API客户端服务
 * 提供与后端API交互的方法
 */

import "server-only";
import { auth } from "@clerk/nextjs/server";

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
};

/**
 * 获取基础URL
 */
function getBaseUrl(): string {
  // 在服务器端，我们需要构建完整的URL
  if (typeof window === "undefined") {
    // 服务器端：使用环境变量或默认的localhost
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const vercelUrl = process.env.VERCEL_URL;

    if (appUrl && appUrl !== "undefined") {
      return appUrl;
    }
    if (vercelUrl && vercelUrl !== "undefined") {
      return `https://${vercelUrl}`;
    }

    // 对于开发环境，检查当前端口
    const port = process.env.PORT || "3000";
    return `http://localhost:${port}`;
  }
  // 客户端：使用相对路径即可
  return "";
}

/**
 * 客户端API请求方法（使用Clerk的useAuth hook获取token）
 */
async function clientApiRequest<T>(
  url: string,
  method: string,
  data?: any,
  getToken?: () => Promise<string | null>
): Promise<ApiResponse<T>> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // 如果提供了getToken函数，获取token
    if (getToken) {
      try {
        const token = await getToken();
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
      } catch (authError) {
        console.warn("获取客户端认证token失败:", authError);
      }
    }

    const options: RequestInit = {
      method,
      headers,
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    const result = await response.json();

    return result as ApiResponse<T>;
  } catch (error) {
    console.error("客户端API请求错误:", error);
    return {
      success: false,
      error: {
        code: "REQUEST_FAILED",
        message: "请求失败，请检查网络连接",
      },
    };
  }
}

/**
 * 通用API请求方法（服务器端）
 */
async function apiRequest<T>(
  url: string,
  method: string,
  data?: any,
  customToken?: string
): Promise<ApiResponse<T>> {
  try {
    // 构建完整的URL
    const baseUrl = getBaseUrl();
    const fullUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;

    // 准备请求头
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // 获取认证token
    let token = customToken;
    if (!token && typeof window === "undefined") {
      // 服务器端：从Clerk获取session token
      try {
        const { getToken } = await auth();
        token = (await getToken()) || undefined;
      } catch (authError) {
        console.warn("获取认证token失败:", authError);
      }
    }

    // 如果有token，添加到请求头
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const options: RequestInit = {
      method,
      headers,
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(fullUrl, options);
    const result = await response.json();

    return result as ApiResponse<T>;
  } catch (error) {
    console.error("API请求错误:", error);
    return {
      success: false,
      error: {
        code: "REQUEST_FAILED",
        message: "请求失败，请检查网络连接",
      },
    };
  }
}

/**
 * 产品API服务
 */
export const productsApi = {
  /**
   * 创建产品
   */
  createProduct: async (productData: any) => {
    return apiRequest("/api/v1/products", "POST", productData);
  },

  /**
   * 获取产品列表
   */
  getProducts: async (params: {
    page?: number;
    pageSize?: number;
    search?: string;
    type?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append("page", params.page.toString());
    if (params.pageSize)
      queryParams.append("pageSize", params.pageSize.toString());
    if (params.search) queryParams.append("search", params.search);
    if (params.type) queryParams.append("type", params.type);
    if (params.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);

    const url = `/api/v1/products?${queryParams.toString()}`;
    return apiRequest(url, "GET");
  },

  /**
   * 获取单个产品详情
   */
  getProduct: async (id: string) => {
    return apiRequest(`/api/v1/products/${id}`, "GET");
  },

  /**
   * 更新产品
   */
  updateProduct: async (id: string, productData: any) => {
    return apiRequest(`/api/v1/products/${id}`, "PUT", productData);
  },

  /**
   * 删除产品
   */
  deleteProduct: async (id: string) => {
    return apiRequest(`/api/v1/products/${id}`, "DELETE");
  },
};

/**
 * 供应商API服务
 */
export const suppliersApi = {
  /**
   * 创建供应商
   */
  createSupplier: async (supplierData: any) => {
    return apiRequest("/api/v1/suppliers", "POST", supplierData);
  },

  /**
   * 获取供应商列表
   */
  getSuppliers: async (params: {
    page?: number;
    per_page?: number;
    search?: string;
    type?: string;
    status?: string;
    sort?: string;
    order?: "asc" | "desc";
  }) => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append("page", params.page.toString());
    if (params.per_page)
      queryParams.append("per_page", params.per_page.toString());
    if (params.search) queryParams.append("search", params.search);
    if (params.type) queryParams.append("type", params.type);
    if (params.status) queryParams.append("status", params.status);
    if (params.sort) queryParams.append("sort", params.sort);
    if (params.order) queryParams.append("order", params.order);

    const url = `/api/v1/suppliers?${queryParams.toString()}`;
    return apiRequest(url, "GET");
  },

  /**
   * 获取单个供应商详情
   */
  getSupplier: async (id: string) => {
    return apiRequest(`/api/v1/suppliers/${id}`, "GET");
  },

  /**
   * 更新供应商
   */
  updateSupplier: async (id: string, supplierData: any) => {
    return apiRequest(`/api/v1/suppliers/${id}`, "PUT", supplierData);
  },

  /**
   * 删除供应商
   */
  deleteSupplier: async (id: string) => {
    return apiRequest(`/api/v1/suppliers/${id}`, "DELETE");
  },
};

/**
 * 存储API服务
 */
export const storageApi = {
  /**
   * 上传文件
   */
  uploadFile: async (file: File, folder: string = "products") => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const baseUrl = getBaseUrl();
      const fullUrl = `${baseUrl}/api/storage/upload`;

      // 准备请求头
      const headers: Record<string, string> = {};

      // 获取认证token
      if (typeof window === "undefined") {
        // 服务器端：从Clerk获取session token
        try {
          const { getToken } = await auth();
          const token = await getToken();
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }
        } catch (authError) {
          console.warn("获取上传认证token失败:", authError);
        }
      }

      const response = await fetch(fullUrl, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "上传失败");
      }

      return await response.json();
    } catch (error) {
      console.error("API上传错误:", error);
      throw error;
    }
  },
};

/**
 * 采购API服务
 */
export const purchaseApi = {
  /**
   * 获取采购单列表
   */
  getPurchaseOrders: async (params: {
    page?: number;
    per_page?: number;
    search?: string;
    status?: string;
    payment_status?: string;
    delivery_status?: string;
    sort?: string;
    order?: "asc" | "desc";
  }) => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append("page", params.page.toString());
    if (params.per_page) queryParams.append("per_page", params.per_page.toString());
    if (params.search) queryParams.append("search", params.search);
    if (params.status) queryParams.append("status", params.status);
    if (params.payment_status) queryParams.append("payment_status", params.payment_status);
    if (params.delivery_status) queryParams.append("delivery_status", params.delivery_status);
    if (params.sort) queryParams.append("sort", params.sort);
    if (params.order) queryParams.append("order", params.order);

    const url = `/api/v1/purchase/orders?${queryParams.toString()}`;
    return apiRequest(url, "GET");
  },

  /**
   * 获取采购计划列表
   */
  getPurchasePlans: async (params: {
    page?: number;
    per_page?: number;
    search?: string;
    status?: string;
    sort?: string;
    order?: "asc" | "desc";
  }) => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append("page", params.page.toString());
    if (params.per_page) queryParams.append("per_page", params.per_page.toString());
    if (params.search) queryParams.append("search", params.search);
    if (params.status) queryParams.append("status", params.status);
    if (params.sort) queryParams.append("sort", params.sort);
    if (params.order) queryParams.append("order", params.order);

    const url = `/api/v1/purchase/plans?${queryParams.toString()}`;
    return apiRequest(url, "GET");
  },

  /**
   * 创建采购单
   */
  createPurchaseOrder: async (orderData: any) => {
    return apiRequest("/api/v1/purchase/orders", "POST", orderData);
  },

  /**
   * 创建采购计划
   */
  createPurchasePlan: async (planData: any) => {
    return apiRequest("/api/v1/purchase/plans", "POST", planData);
  },
};

/**
 * 库存API服务
 */
export const inventoryApi = {
  /**
   * 获取库存概览
   */
  getInventoryOverview: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    productType?: string;
    lowStock?: boolean;
    hasStock?: boolean;
  }) => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.search) queryParams.append("search", params.search);
    if (params.productType) queryParams.append("productType", params.productType);
    if (params.lowStock !== undefined) queryParams.append("lowStock", params.lowStock.toString());
    if (params.hasStock !== undefined) queryParams.append("hasStock", params.hasStock.toString());

    const url = `/api/v1/inventory/overview?${queryParams.toString()}`;
    return apiRequest(url, "GET");
  },

  /**
   * 获取批次列表
   */
  getBatches: async (params: {
    page?: number;
    per_page?: number;
    sort?: string;
    batchNumber?: string;
    productSku?: string;
    sourceType?: string;
    productId?: string;
  }) => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append("page", params.page.toString());
    if (params.per_page) queryParams.append("per_page", params.per_page.toString());
    if (params.sort) queryParams.append("sort", params.sort);
    if (params.batchNumber) queryParams.append("batchNumber", params.batchNumber);
    if (params.productSku) queryParams.append("productSku", params.productSku);
    if (params.sourceType) queryParams.append("sourceType", params.sourceType);
    if (params.productId) queryParams.append("productId", params.productId);

    const url = `/api/v1/inventory/batches?${queryParams.toString()}`;
    return apiRequest(url, "GET");
  },

  /**
   * 获取移动记录列表
   */
  getMovements: async (params: {
    page?: number;
    per_page?: number;
    sort?: string;
    movementNumber?: string;
    batchNumber?: string;
    productSku?: string;
    type?: string;
    sourceType?: string;
    batchId?: string;
    productId?: string;
  }) => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append("page", params.page.toString());
    if (params.per_page) queryParams.append("per_page", params.per_page.toString());
    if (params.sort) queryParams.append("sort", params.sort);
    if (params.movementNumber) queryParams.append("movementNumber", params.movementNumber);
    if (params.batchNumber) queryParams.append("batchNumber", params.batchNumber);
    if (params.productSku) queryParams.append("productSku", params.productSku);
    if (params.type) queryParams.append("type", params.type);
    if (params.sourceType) queryParams.append("sourceType", params.sourceType);
    if (params.batchId) queryParams.append("batchId", params.batchId);
    if (params.productId) queryParams.append("productId", params.productId);

    const url = `/api/v1/inventory/movements?${queryParams.toString()}`;
    return apiRequest(url, "GET");
  },
};

/**
 * 创建客户端API实例（用于客户端组件）
 * 使用方法：
 * ```
 * import { useAuth } from '@clerk/nextjs';
 * import { createClientApi } from '@/lib/api-client';
 *
 * function MyComponent() {
 *   const { getToken } = useAuth();
 *   const clientApi = createClientApi(getToken);
 *   // 使用 clientApi.products.getProducts() 等
 * }
 * ```
 */
export function createClientApi(getToken: () => Promise<string | null>) {
  return {
    products: {
      createProduct: async (productData: any) => {
        return clientApiRequest(
          "/api/v1/products",
          "POST",
          productData,
          getToken
        );
      },

      getProducts: async (params: {
        page?: number;
        pageSize?: number;
        search?: string;
        type?: string;
        sortBy?: string;
        sortOrder?: "asc" | "desc";
      }) => {
        const queryParams = new URLSearchParams();

        if (params.page) queryParams.append("page", params.page.toString());
        if (params.pageSize)
          queryParams.append("pageSize", params.pageSize.toString());
        if (params.search) queryParams.append("search", params.search);
        if (params.type) queryParams.append("type", params.type);
        if (params.sortBy) queryParams.append("sortBy", params.sortBy);
        if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);

        const url = `/api/v1/products?${queryParams.toString()}`;
        return clientApiRequest(url, "GET", undefined, getToken);
      },

      getProduct: async (id: string) => {
        return clientApiRequest(
          `/api/v1/products/${id}`,
          "GET",
          undefined,
          getToken
        );
      },

      updateProduct: async (id: string, productData: any) => {
        return clientApiRequest(
          `/api/v1/products/${id}`,
          "PUT",
          productData,
          getToken
        );
      },

      deleteProduct: async (id: string) => {
        return clientApiRequest(
          `/api/v1/products/${id}`,
          "DELETE",
          undefined,
          getToken
        );
      },
    },

    storage: {
      uploadFile: async (file: File, folder: string = "products") => {
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("folder", folder);

          const headers: Record<string, string> = {};

          // 获取token并添加到请求头
          if (getToken) {
            try {
              const token = await getToken();
              if (token) {
                headers.Authorization = `Bearer ${token}`;
              }
            } catch (authError) {
              console.warn("获取上传认证token失败:", authError);
            }
          }

          const response = await fetch("/api/storage/upload", {
            method: "POST",
            headers,
            body: formData,
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || "上传失败");
          }

          return await response.json();
        } catch (error) {
          console.error("客户端上传错误:", error);
          throw error;
        }
      },
    },

    inventory: {
      getInventoryOverview: async (params: {
        page?: number;
        limit?: number;
        search?: string;
        productType?: string;
        lowStock?: boolean;
        hasStock?: boolean;
      }) => {
        const queryParams = new URLSearchParams();

        if (params.page) queryParams.append("page", params.page.toString());
        if (params.limit) queryParams.append("limit", params.limit.toString());
        if (params.search) queryParams.append("search", params.search);
        if (params.productType) queryParams.append("productType", params.productType);
        if (params.lowStock !== undefined) queryParams.append("lowStock", params.lowStock.toString());
        if (params.hasStock !== undefined) queryParams.append("hasStock", params.hasStock.toString());

        const url = `/api/v1/inventory/overview?${queryParams.toString()}`;
        return clientApiRequest(url, "GET", undefined, getToken);
      },

      getBatches: async (params: {
        page?: number;
        per_page?: number;
        sort?: string;
        batchNumber?: string;
        productSku?: string;
        sourceType?: string;
        productId?: string;
      }) => {
        const queryParams = new URLSearchParams();

        if (params.page) queryParams.append("page", params.page.toString());
        if (params.per_page) queryParams.append("per_page", params.per_page.toString());
        if (params.sort) queryParams.append("sort", params.sort);
        if (params.batchNumber) queryParams.append("batchNumber", params.batchNumber);
        if (params.productSku) queryParams.append("productSku", params.productSku);
        if (params.sourceType) queryParams.append("sourceType", params.sourceType);
        if (params.productId) queryParams.append("productId", params.productId);

        const url = `/api/v1/inventory/batches?${queryParams.toString()}`;
        return clientApiRequest(url, "GET", undefined, getToken);
      },

      getMovements: async (params: {
        page?: number;
        per_page?: number;
        sort?: string;
        movementNumber?: string;
        batchNumber?: string;
        productSku?: string;
        type?: string;
        sourceType?: string;
        batchId?: string;
        productId?: string;
      }) => {
        const queryParams = new URLSearchParams();

        if (params.page) queryParams.append("page", params.page.toString());
        if (params.per_page) queryParams.append("per_page", params.per_page.toString());
        if (params.sort) queryParams.append("sort", params.sort);
        if (params.movementNumber) queryParams.append("movementNumber", params.movementNumber);
        if (params.batchNumber) queryParams.append("batchNumber", params.batchNumber);
        if (params.productSku) queryParams.append("productSku", params.productSku);
        if (params.type) queryParams.append("type", params.type);
        if (params.sourceType) queryParams.append("sourceType", params.sourceType);
        if (params.batchId) queryParams.append("batchId", params.batchId);
        if (params.productId) queryParams.append("productId", params.productId);

        const url = `/api/v1/inventory/movements?${queryParams.toString()}`;
        return clientApiRequest(url, "GET", undefined, getToken);
      },
    },
  };
}
