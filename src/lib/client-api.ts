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
        return clientApiRequest(
          "/api/v1/suppliers",
          "POST",
          supplierData,
          getToken
        );
      },

      updateSupplier: async (id: string, supplierData: any) => {
        return clientApiRequest(
          `/api/v1/suppliers/${id}`,
          "PUT",
          supplierData,
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
  };
}
