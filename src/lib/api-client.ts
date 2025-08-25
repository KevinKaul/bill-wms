/**
 * API客户端服务
 * 提供与后端API交互的方法
 */

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
 * 通用API请求方法
 */
async function apiRequest<T>(
  url: string,
  method: string,
  data?: any
): Promise<ApiResponse<T>> {
  try {
    // 构建完整的URL
    const baseUrl = getBaseUrl();
    const fullUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;

    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
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
  updateProduct: async (sku: string, productData: any) => {
    return apiRequest(`/api/v1/products/${sku}`, "PUT", productData);
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

      const response = await fetch(fullUrl, {
        method: "POST",
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
