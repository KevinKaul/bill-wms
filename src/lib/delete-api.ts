/**
 * 客户端删除API方法
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

    // 添加认证token
    if (getToken) {
      const token = await getToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    const response = await fetch(url, {
      method,
      headers,
      ...(data && { body: JSON.stringify(data) }),
    });


    const result = await response.json();
    return result;
  } catch (error) {
    console.error("API request failed:", error);
    return {
      success: false,
      error: {
        code: "REQUEST_FAILED",
        message: error instanceof Error ? error.message : "请求失败",
      },
    };
  }
}

/**
 * 客户端删除API方法
 */
export const deleteApi = {
  // 产品删除
  deleteProduct: async (id: string, getToken: () => Promise<string | null>) => {
    return clientApiRequest(`/api/v1/products/${id}`, "DELETE", undefined, getToken);
  },

  // 供应商删除
  deleteSupplier: async (id: string, getToken: () => Promise<string | null>) => {
    return clientApiRequest(`/api/v1/suppliers/${id}`, "DELETE", undefined, getToken);
  },

  // 采购单删除
  deletePurchaseOrder: async (id: string, getToken: () => Promise<string | null>) => {
    return clientApiRequest(`/api/v1/purchase/orders/${id}`, "DELETE", undefined, getToken);
  },

  // 采购计划删除
  deletePurchasePlan: async (id: string, getToken: () => Promise<string | null>) => {
    return clientApiRequest(`/api/v1/purchase/plans/${id}`, "DELETE", undefined, getToken);
  },

  // 生产单删除
  deleteProductionOrder: async (id: string, getToken: () => Promise<string | null>) => {
    return clientApiRequest(`/api/v1/production/orders/${id}`, "DELETE", undefined, getToken);
  },
};
