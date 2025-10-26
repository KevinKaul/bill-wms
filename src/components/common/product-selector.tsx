'use client';

import { useState, useCallback } from 'react';
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
import { Check, ChevronsUpDown } from 'lucide-react';

export interface Product {
  id: string;
  sku: string;
  name: string;
  type: 'RAW_MATERIAL' | 'FINISHED_PRODUCT';
  reference_purchase_price?: number;
  guide_unit_price?: number;
}

export interface ProductSelectorProps {
  value?: string;
  onValueChange: (productId: string) => void;
  products: Product[];
  loading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  showPrice?: boolean;
}

export function ProductSelector({
  value,
  onValueChange,
  products,
  loading = false,
  placeholder = '选择产品',
  disabled = false,
  showPrice = true,
}: ProductSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const selectedProduct = products.find(p => p.id === value);

  const rawMaterials = products.filter(p => p.type === 'RAW_MATERIAL');
  const finishedProducts = products.filter(p => p.type === 'FINISHED_PRODUCT');

  const filterProducts = useCallback((items: Product[]) => {
    if (!searchValue) return items;
    return items.filter(p =>
      p.sku.toLowerCase().includes(searchValue.toLowerCase()) ||
      p.name.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [searchValue]);

  const filteredRawMaterials = filterProducts(rawMaterials);
  const filteredFinishedProducts = filterProducts(finishedProducts);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between"
          disabled={disabled || loading}
        >
          {selectedProduct ? (
            <div className='flex items-center space-x-2'>
              <Badge variant='outline' className='text-xs'>
                {selectedProduct.sku}
              </Badge>
              <span>{selectedProduct.name}</span>
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
              {filteredRawMaterials.length > 0 && (
                <CommandGroup>
                  <CommandItem disabled className="text-xs font-semibold text-muted-foreground py-1.5">
                    原材料
                  </CommandItem>
                  {filteredRawMaterials.map((product) => (
                    <CommandItem
                      key={product.id}
                      value={`${product.sku} ${product.name}`}
                      onSelect={() => {
                        onValueChange(product.id);
                        setOpen(false);
                        setSearchValue('');
                      }}
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${
                          value === product.id ? 'opacity-100' : 'opacity-0'
                        }`}
                      />
                      <div className='flex items-center space-x-2'>
                        <Badge variant='outline' className='text-xs'>
                          {product.sku}
                        </Badge>
                        <span>{product.name}</span>
                        {showPrice && product.reference_purchase_price && (
                          <Badge variant='secondary' className='text-xs'>
                            ¥{product.reference_purchase_price}
                          </Badge>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {filteredFinishedProducts.length > 0 && (
                <CommandGroup>
                  <CommandItem disabled className="text-xs font-semibold text-muted-foreground py-1.5">
                    成品
                  </CommandItem>
                  {filteredFinishedProducts.map((product) => (
                    <CommandItem
                      key={product.id}
                      value={`${product.sku} ${product.name}`}
                      onSelect={() => {
                        onValueChange(product.id);
                        setOpen(false);
                        setSearchValue('');
                      }}
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${
                          value === product.id ? 'opacity-100' : 'opacity-0'
                        }`}
                      />
                      <div className='flex items-center space-x-2'>
                        <Badge variant='outline' className='text-xs'>
                          {product.sku}
                        </Badge>
                        <span>{product.name}</span>
                        {showPrice && product.guide_unit_price && (
                          <Badge variant='secondary' className='text-xs'>
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
