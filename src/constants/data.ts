import { NavItem } from '@/types';

export type Product = {
  photo_url: string;
  name: string;
  description: string;
  created_at: string;
  price: number;
  id: number;
  category: string;
  updated_at: string;
};

//Info: The following data is used for the sidebar navigation and Cmd K bar.
export const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard/overview',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['d', 'd'],
    items: [] // Empty array as there are no child items for Dashboard
  },
  {
    title: '产品管理',
    url: '/dashboard/product',
    icon: 'product',
    shortcut: ['p', 'p'],
    isActive: false,
    items: [] // No child items
  },
  {
    title: '采购管理',
    url: '#',
    icon: 'billing',
    isActive: false,
    items: [
      {
        title: '采购计划',
        url: '/dashboard/purchase/plan',
        icon: 'page'
      },
      {
        title: '采购单',
        url: '/dashboard/purchase/order',
        icon: 'post'
      }
    ]
  },
  {
    title: '加工管理',
    url: '#',
    icon: 'settings',
    isActive: false,
    items: [
      {
        title: '加工单',
        url: '/dashboard/production/order',
        icon: 'settings'
      }
    ]
  },
  {
    title: '库存管理',
    url: '#',
    icon: 'product',
    isActive: false,
    items: [
      {
        title: '库存管理',
        url: '/dashboard/inventory',
        icon: 'product',
        items: [
          {
            title: '批次管理',
            url: '/dashboard/inventory/batch'
          },
          {
            title: '原材料批次',
            url: '/dashboard/inventory/batch/raw-material'
          },
          {
            title: '成品批次',
            url: '/dashboard/inventory/batch/finished-product'
          },
          {
            title: '库存调整',
            url: '/dashboard/inventory/adjustment'
          },
          {
            title: '库存移动',
            url: '/dashboard/inventory/movement'
          }
        ]
      },
      {
        title: '批次管理',
        url: '/dashboard/inventory/batch',
        icon: 'kanban'
      },
      {
        title: '移动记录',
        url: '/dashboard/inventory/movement',
        icon: 'arrowRight'
      },
      {
        title: '库存调整',
        url: '/dashboard/inventory/adjust',
        icon: 'userPen'
      }
    ]
  },
  {
    title: '供应商管理',
    url: '/dashboard/supplier',
    icon: 'supplier',
    shortcut: ['s', 's'],
    isActive: false,
    items: [] // No child items
  },
  {
    title: 'Account',
    url: '#', // Placeholder as there is no direct link for the parent
    icon: 'billing',
    isActive: true,

    items: [
      {
        title: 'Profile',
        url: '/dashboard/profile',
        icon: 'userPen',
        shortcut: ['m', 'm']
      },
      {
        title: 'Login',
        shortcut: ['l', 'l'],
        url: '/',
        icon: 'login'
      }
    ]
  },
  {
    title: 'Kanban',
    url: '/dashboard/kanban',
    icon: 'kanban',
    shortcut: ['k', 'k'],
    isActive: false,
    items: [] // No child items
  }
];

export interface SaleUser {
  id: number;
  name: string;
  email: string;
  amount: string;
  image: string;
  initials: string;
}

export const recentSalesData: SaleUser[] = [
  {
    id: 1,
    name: 'Olivia Martin',
    email: 'olivia.martin@email.com',
    amount: '+$1,999.00',
    image: 'https://api.slingacademy.com/public/sample-users/1.png',
    initials: 'OM'
  },
  {
    id: 2,
    name: 'Jackson Lee',
    email: 'jackson.lee@email.com',
    amount: '+$39.00',
    image: 'https://api.slingacademy.com/public/sample-users/2.png',
    initials: 'JL'
  },
  {
    id: 3,
    name: 'Isabella Nguyen',
    email: 'isabella.nguyen@email.com',
    amount: '+$299.00',
    image: 'https://api.slingacademy.com/public/sample-users/3.png',
    initials: 'IN'
  },
  {
    id: 4,
    name: 'William Kim',
    email: 'will@email.com',
    amount: '+$99.00',
    image: 'https://api.slingacademy.com/public/sample-users/4.png',
    initials: 'WK'
  },
  {
    id: 5,
    name: 'Sofia Davis',
    email: 'sofia.davis@email.com',
    amount: '+$39.00',
    image: 'https://api.slingacademy.com/public/sample-users/5.png',
    initials: 'SD'
  }
];
