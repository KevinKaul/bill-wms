'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ChevronsUpDown } from 'lucide-react';
import { createClientApi } from '@/lib/client-api';
import Image from 'next/image';

export interface Product {
  id: string;
  sku: string;
  name: string;
  type: 'RAW_MATERIAL' | 'FINISHED_PRODUCT';
  reference_purchase_price?: number;
  guide_unit_price?: number;
  image?: string | null;
}

export interface ProductSelectorProps {
  value?: string;
  onValueChange: (productId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  showPrice?: boolean;
  productType?: 'RAW_MATERIAL' | 'FINISHED_PRODUCT';
}

export function ProductSelector({
  value,
  onValueChange,
  placeholder = '选择产品',
  disabled = false,
  showPrice = true,
  productType,
}: ProductSelectorProps) {
  const { getToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Load selected product details
  useEffect(() => {
    if (!value) {
      setSelectedProduct(null);
      return;
    }

    const loadSelectedProduct = async () => {
      try {
        const clientApi = createClientApi(getToken);
        const response = await clientApi.products.getProducts({
          pageSize: 1,
          search: value,
        });

        if (response.success && response.data) {
          const data = response.data as any;
          const product = data.products?.find((p: any) => p.id === value);
          if (product) {
            setSelectedProduct({
              id: product.id,
              sku: product.sku,
              name: product.name,
              type: product.type,
              reference_purchase_price: product.reference_purchase_price,
              guide_unit_price: product.guide_unit_price,
              image: product.image,
            });
          }
        }
      } catch (error) {
        console.error('Failed to load selected product:', error);
      }
    };

    loadSelectedProduct();
  }, [value, getToken]);

  const searchProducts = useCallback(async (search: string) => {
    setLoading(true);
    try {
      const clientApi = createClientApi(getToken);
      const response = await clientApi.products.getProducts({
        pageSize: 500,
        search: search || undefined,
        type: productType,
      });

      if (response.success && response.data) {
        const data = response.data as any;
        const productList = (data.products || []).map((p: any) => ({
          id: p.id,
          sku: p.sku,
          name: p.name,
          type: p.type,
          reference_purchase_price: p.reference_purchase_price,
          guide_unit_price: p.guide_unit_price,
          image: p.image,
        }));
        setProducts(productList);
      }
    } catch (error) {
      console.error('Failed to search products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [getToken, productType]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (open) {
        searchProducts(searchValue);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue, open, searchProducts]);

  const rawMaterials = products.filter(p => p.type === 'RAW_MATERIAL');
  const finishedProducts = products.filter(p => p.type === 'FINISHED_PRODUCT');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedProduct ? (
            <div className='flex items-center gap-2 flex-1 min-w-0'>
              {selectedProduct.image && (
                <div className='relative w-6 h-6 flex-shrink-0 rounded overflow-hidden'>
                  <Image
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    fill
                    className='object-cover'
                    sizes='24px'
                  />
                </div>
              )}
              <Badge variant='outline' className='text-xs flex-shrink-0'>
                {selectedProduct.sku}
              </Badge>
              <span className='truncate'>{selectedProduct.name}</span>
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="搜索产品..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <div className="inline-block animate-spin">⏳</div> 加载中...
            </div>
          ) : products.length === 0 ? (
            <CommandEmpty>未找到产品</CommandEmpty>
          ) : (
            <div className="max-h-64 overflow-auto">
              {rawMaterials.length > 0 && (
                <CommandGroup>
                  <CommandItem disabled className="text-xs font-semibold text-muted-foreground py-1.5 flex justify-between">
                    <span>原材料</span>
                    <span className="text-xs text-muted-foreground">({rawMaterials.length})</span>
                  </CommandItem>
                  {rawMaterials.map((product) => (
                    <CommandItem
                      key={product.id}
                      value={`${product.sku} ${product.name}`}
                      onSelect={() => {
                        onValueChange(product.id);
                        setSelectedProduct(product);
                        setOpen(false);
                        setSearchValue('');
                      }}
                      className={value === product.id ? 'bg-accent' : ''}
                    >
                      <div className='flex items-center gap-2 flex-1 min-w-0'>
                        {product.image && (
                          <div className='relative w-8 h-8 flex-shrink-0 rounded overflow-hidden'>
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              className='object-cover'
                              sizes='32px'
                            />
                          </div>
                        )}
                        <Badge variant='outline' className='text-xs flex-shrink-0'>
                          {product.sku}
                        </Badge>
                        <span className='truncate'>{product.name}</span>
                        {showPrice && product.reference_purchase_price && (
                          <Badge variant='secondary' className='text-xs flex-shrink-0'>
                            ¥{product.reference_purchase_price}
                          </Badge>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {finishedProducts.length > 0 && (
                <CommandGroup>
                  <CommandItem disabled className="text-xs font-semibold text-muted-foreground py-1.5 flex justify-between">
                    <span>成品</span>
                    <span className="text-xs text-muted-foreground">({finishedProducts.length})</span>
                  </CommandItem>
                  {finishedProducts.map((product) => (
                    <CommandItem
                      key={product.id}
                      value={`${product.sku} ${product.name}`}
                      onSelect={() => {
                        onValueChange(product.id);
                        setSelectedProduct(product);
                        setOpen(false);
                        setSearchValue('');
                      }}
                      className={value === product.id ? 'bg-accent' : ''}
                    >
                      <div className='flex items-center gap-2 flex-1 min-w-0'>
                        {product.image && (
                          <div className='relative w-8 h-8 flex-shrink-0 rounded overflow-hidden'>
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              className='object-cover'
                              sizes='32px'
                            />
                          </div>
                        )}
                        <Badge variant='outline' className='text-xs flex-shrink-0'>
                          {product.sku}
                        </Badge>
                        <span className='truncate'>{product.name}</span>
                        {showPrice && product.guide_unit_price && (
                          <Badge variant='secondary' className='text-xs flex-shrink-0'>
                            ¥{product.guide_unit_price}
                          </Badge>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
