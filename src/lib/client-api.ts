/**
 * 客户端API服务
 * 专门用于客户端组件的API调用
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
 * 客户端API请求方法
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
 * 创建客户端API实例（用于客户端组件）
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

    suppliers: {
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
        return clientApiRequest(url, "GET", undefined, getToken);
      },

      createSupplier: async (supplierData: any) => {
        // Convert camelCase to snake_case for API
        const apiData = {
          code: supplierData.code,
          name: supplierData.name,
          account: supplierData.account,
          type: supplierData.type,
          contact_person: supplierData.contactPerson,
          phone: supplierData.phone,
          email: supplierData.email,
          address: supplierData.address,
          bank_name: supplierData.bankName,
          account_name: supplierData.accountName,
          remark: supplierData.remark,
        };
        return clientApiRequest(
          "/api/v1/suppliers",
          "POST",
          apiData,
          getToken
        );
      },

      updateSupplier: async (id: string, supplierData: any) => {
        // Convert camelCase to snake_case for API
        const apiData = {
          code: supplierData.code,
          name: supplierData.name,
          account: supplierData.account,
          type: supplierData.type,
          contact_person: supplierData.contactPerson,
          phone: supplierData.phone,
          email: supplierData.email,
          address: supplierData.address,
          bank_name: supplierData.bankName,
          account_name: supplierData.accountName,
          remark: supplierData.remark,
          status: supplierData.status,
        };
        return clientApiRequest(
          `/api/v1/suppliers/${id}`,
          "PUT",
          apiData,
          getToken
        );
      },

      deleteSupplier: async (id: string) => {
        return clientApiRequest(
          `/api/v1/suppliers/${id}`,
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

      // 库存调整相关API
      createAdjustment: async (adjustmentData: {
        product_id: string;
        type: 'increase' | 'decrease';
        quantity: number;
        unit_cost?: number;
        reason: string;
        remark?: string;
      }) => {
        return clientApiRequest(
          "/api/v1/inventory/adjustments",
          "POST",
          adjustmentData,
          getToken
        );
      },

      getAdjustments: async (params: {
        page?: number;
        per_page?: number;
        product_id?: string;
        type?: string;
        reason?: string;
        date_from?: string;
        date_to?: string;
        sort?: string;
        order?: 'asc' | 'desc';
      }) => {
        const queryParams = new URLSearchParams();

        if (params.page) queryParams.append("page", params.page.toString());
        if (params.per_page) queryParams.append("per_page", params.per_page.toString());
        if (params.product_id) queryParams.append("product_id", params.product_id);
        if (params.type) queryParams.append("type", params.type);
        if (params.reason) queryParams.append("reason", params.reason);
        if (params.date_from) queryParams.append("date_from", params.date_from);
        if (params.date_to) queryParams.append("date_to", params.date_to);
        if (params.sort) queryParams.append("sort", params.sort);
        if (params.order) queryParams.append("order", params.order);

        const url = `/api/v1/inventory/adjustments?${queryParams.toString()}`;
        return clientApiRequest(url, "GET", undefined, getToken);
      },
    },

    // 生产模块API
    production: {
      getOrders: async (params: {
        page?: number;
        per_page?: number;
        search?: string;
        product_id?: string;
        supplier_id?: string;
        status?: string;
        payment_status?: string;
        date_from?: string;
        date_to?: string;
        sort?: string;
        order?: 'asc' | 'desc';
      }) => {
        const queryParams = new URLSearchParams();

        if (params.page) queryParams.append("page", params.page.toString());
        if (params.per_page) queryParams.append("per_page", params.per_page.toString());
        if (params.search) queryParams.append("search", params.search);
        if (params.product_id) queryParams.append("product_id", params.product_id);
        if (params.supplier_id) queryParams.append("supplier_id", params.supplier_id);
        if (params.status) queryParams.append("status", params.status.toUpperCase());
        if (params.payment_status) queryParams.append("payment_status", params.payment_status.toUpperCase());
        if (params.date_from) queryParams.append("date_from", params.date_from);
        if (params.date_to) queryParams.append("date_to", params.date_to);
        if (params.sort) queryParams.append("sort", params.sort);
        if (params.order) queryParams.append("order", params.order);

        const url = `/api/v1/production/orders?${queryParams.toString()}`;
        return clientApiRequest(url, "GET", undefined, getToken);
      },
    },
  };
}
