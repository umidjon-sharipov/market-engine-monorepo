import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type {
    ConfigurableProduct,
    OptionSelections,
    ProductOption,
} from './productConfiguration';
import { optionSelectionKey } from './productConfiguration';

type Props = {
    product: ConfigurableProduct;
    selections: OptionSelections;
    onSelect: (key: string, optionId: string, isOptional: boolean) => void;
    path?: string[];
    depth?: number;
};

export default function ProductOptionConfigurator({
    product,
    selections,
    onSelect,
    path = [],
    depth = 0,
}: Props) {
    if (!product.options?.length || depth >= 8) return null;

    return (
        <View style={{ gap: 10, marginLeft: depth ? 12 : 0 }}>
            {product.options.map((group: ProductOption) => {
                const key = optionSelectionKey(path, group.id);
                const selectedId = selections[key] ?? (path.length === 0 ? selections[group.id] : undefined);
                const selectedItem = group.items.find((item) => item.id === selectedId);
                return (
                    <View
                        key={key}
                        style={{
                            gap: 8,
                            borderWidth: 1,
                            borderColor: '#cbd5e1',
                            borderRadius: 12,
                            padding: 12,
                            backgroundColor: '#fff',
                        }}
                    >
                        <Text style={{ color: '#0f172a', fontWeight: '700' }}>
                            {group.title}{group.isOptional ? ' · ixtiyoriy' : ' · tanlash majburiy'}
                        </Text>
                        {group.items.map((item) => {
                            const included = item.includedProduct;
                            const active = selectedId === item.id;
                            return (
                                <View key={item.id} style={{ gap: 8 }}>
                                    <Pressable
                                        disabled={!included}
                                        onPress={() => onSelect(key, item.id, group.isOptional)}
                                        style={{
                                            borderWidth: 1,
                                            borderColor: active ? '#2563eb' : '#e2e8f0',
                                            backgroundColor: active ? '#eff6ff' : '#fff',
                                            borderRadius: 9,
                                            padding: 10,
                                            opacity: included ? 1 : 0.5,
                                        }}
                                    >
                                        <Text style={{ color: '#0f172a', fontWeight: '600' }}>
                                            {included?.title ?? 'Hozir mavjud emas'}
                                        </Text>
                                        <Text style={{ color: '#475569', fontSize: 13 }}>
                                            {included ? `+${included.price.toLocaleString()} so‘m` : 'Omborda qoldiq yo‘q'}
                                        </Text>
                                    </Pressable>
                                    {active && included?.options?.length ? (
                                        <ProductOptionConfigurator
                                            product={included}
                                            selections={selections}
                                            onSelect={onSelect}
                                            path={[...path, item.id]}
                                            depth={depth + 1}
                                        />
                                    ) : null}
                                </View>
                            );
                        })}
                    </View>
                );
            })}
        </View>
    );
}
