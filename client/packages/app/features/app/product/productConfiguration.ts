export interface ConfigurableProduct {
    id: string;
    title: string;
    price: number;
    options: ProductOption[];
}

export interface ProductOption {
    id: string;
    title: string;
    isOptional: boolean;
    items: ProductOptionItem[];
}

export interface ProductOptionItem {
    id: string;
    includeProductId: string | null;
    includedProduct?: ConfigurableProduct | null;
}

export type OptionSelections = Record<string, string>;

export function optionSelectionKey(path: string[], groupId: string) {
    return path.length ? `${path.join('/')}/${groupId}` : groupId;
}

export function evaluateConfiguration(
    product: ConfigurableProduct,
    selections: OptionSelections,
) {
    const visitedKeys = new Set<string>();
    const missingGroups: ProductOption[] = [];
    const selected: Array<{
        key: string;
        group: ProductOption;
        item: ProductOptionItem;
        product: ConfigurableProduct;
        parentProductId: string;
        path: string[];
    }> = [];
    let totalPrice = product.price;

    const visit = (current: ConfigurableProduct, path: string[]) => {
        for (const group of current.options ?? []) {
            const key = optionSelectionKey(path, group.id);
            visitedKeys.add(key);
            const selectedItemId = selections[key] ??
                (path.length === 0 ? selections[group.id] : undefined);
            const item = group.items.find(
                (candidate) => candidate.id === selectedItemId && candidate.includedProduct,
            );
            if (!item?.includedProduct) {
                if (!group.isOptional) missingGroups.push(group);
                continue;
            }
            const childPath = [...path, item.id];
            selected.push({
                key,
                group,
                item,
                product: item.includedProduct,
                parentProductId: current.id,
                path: childPath,
            });
            totalPrice += item.includedProduct.price;
            visit(item.includedProduct, childPath);
        }
    };

    visit(product, []);
    const validSelections = Object.fromEntries(
        Object.entries(selections).filter(([key, value]) => visitedKeys.has(key) && !!value),
    );
    return {
        totalPrice,
        missingGroups,
        selected,
        validSelections,
    };
}
