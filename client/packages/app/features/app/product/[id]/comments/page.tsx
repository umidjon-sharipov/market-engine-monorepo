'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Pressable,
    Text,
    View,
} from 'react-native';
import { usePathname, useRouter, useSearchParams } from 'solito/navigation';
import ScreenWrapper from 'app/components/layout/ScreenWrapper';
import { useUrlStore } from 'app/store/useUrlStore';

interface ProductComment {
    id: string;
    comment: string;
    reply?: string | null;
    rate: number;
    createdAt: string;
    images: string[];
    user: { id: string; userName: string | null; image: string | null };
}

interface CommentPage {
    data: ProductComment[];
    total: number;
    hasMore: boolean;
    nextCursor: string | null;
}

const ProductCommentsPage = () => {
    const url = useUrlStore((state) => state.url);
    const pathname = usePathname();
    const params = useSearchParams();
    const router = useRouter();
    const productId = params?.get('id') ?? pathname?.split('/')[2] ?? '';
    const [comments, setComments] = useState<ProductComment[]>([]);
    const [total, setTotal] = useState(0);
    const [cursor, setCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState('');
    const listRef = useRef<FlatList<ProductComment>>(null);
    const requestInProgress = useRef(false);

    const fetchPage = useCallback(async (after?: string, replace = false) => {
        if (!url || !productId || requestInProgress.current) return;
        requestInProgress.current = true;
        if (replace) setLoading(true);
        else setLoadingMore(true);
        setError('');
        try {
            const query = new URLSearchParams({ limit: '30' });
            if (after) query.set('cursor', after);
            const response = await fetch(
                `${url}/comments/product/${encodeURIComponent(productId)}?${query}`,
            );
            if (!response.ok) throw new Error(`Sharhlarni yuklab bo‘lmadi: ${response.status}`);
            const result: unknown = await response.json();
            if (!result || typeof result !== 'object' || !('data' in result) || !Array.isArray(result.data)) {
                throw new Error('Sharhlar noto‘g‘ri formatda qaytdi.');
            }
            const page = result as CommentPage;
            setComments(page.data);
            setTotal(page.total);
            setCursor(page.nextCursor);
            setHasMore(page.hasMore);
            if (!replace) requestAnimationFrame(() => listRef.current?.scrollToOffset({ offset: 0, animated: false }));
        } catch (requestError) {
            console.error('To‘liq sharhlar sahifasini yuklashda xatolik:', requestError);
            setError(requestError instanceof Error ? requestError.message : 'Sharhlarni yuklab bo‘lmadi.');
        } finally {
            requestInProgress.current = false;
            setLoading(false);
            setLoadingMore(false);
        }
    }, [productId, url]);

    useEffect(() => {
        setComments([]);
        setCursor(null);
        void fetchPage(undefined, true);
    }, [fetchPage]);

    const loadNextPage = useCallback(() => {
        if (hasMore && cursor) void fetchPage(cursor);
    }, [cursor, fetchPage, hasMore]);

    const renderComment = ({ item }: { item: ProductComment }) => (
        <View style={{ padding: 16, marginHorizontal: 16, marginVertical: 6, gap: 8, borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                <Text style={{ color: '#0f172a', fontWeight: '700' }}>
                    {item.user?.userName || 'Foydalanuvchi'}
                </Text>
                <Text style={{ color: '#b45309' }}>{'★'.repeat(Math.max(0, Math.min(5, item.rate)))}</Text>
            </View>
            <Text style={{ color: '#334155' }}>{item.comment}</Text>
            {item.reply ? (
                <View style={{ padding: 10, borderRadius: 10, backgroundColor: '#eff6ff' }}>
                    <Text style={{ color: '#1d4ed8', fontSize: 11, fontWeight: '700', marginBottom: 4 }}>
                        Market javobi
                    </Text>
                    <Text style={{ color: '#1e3a8a' }}>{item.reply}</Text>
                </View>
            ) : null}
            {Array.isArray(item.images) && item.images.length > 0 ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {item.images.slice(0, 5).map((image, index) => (
                        <Image
                            key={`${item.id}-${index}`}
                            source={{ uri: image }}
                            style={{ width: 88, height: 88, borderRadius: 8 }}
                            resizeMode="cover"
                        />
                    ))}
                </View>
            ) : null}
            <Text style={{ color: '#94a3b8', fontSize: 11 }}>
                {new Date(item.createdAt).toLocaleDateString()}
            </Text>
        </View>
    );

    return (
        <ScreenWrapper>
            <View style={{ flex: 1, paddingTop: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12 }}>
                    <Pressable onPress={() => router.back()}>
                        <Text style={{ color: '#2563eb', fontWeight: '700' }}>‹ Orqaga</Text>
                    </Pressable>
                    <Text style={{ color: '#111827', fontSize: 20, fontWeight: '800' }}>
                        Sharhlar ({total})
                    </Text>
                    <View style={{ width: 52 }} />
                </View>
                {loading ? (
                    <ActivityIndicator style={{ marginTop: 24 }} color="#2563eb" />
                ) : error ? (
                    <View style={{ alignItems: 'center', gap: 12, padding: 20 }}>
                        <Text accessibilityRole="alert" style={{ color: '#dc2626' }}>{error}</Text>
                        <Pressable onPress={() => void fetchPage(undefined, true)}>
                            <Text style={{ color: '#2563eb', fontWeight: '700' }}>Qayta urinish</Text>
                        </Pressable>
                    </View>
                ) : (
                    <FlatList
                        ref={listRef}
                        data={comments}
                        keyExtractor={(item) => item.id}
                        renderItem={renderComment}
                        onEndReached={loadNextPage}
                        onEndReachedThreshold={0.4}
                        ListEmptyComponent={
                            <Text style={{ color: '#64748b', textAlign: 'center', padding: 24 }}>
                                Hozircha sharhlar yo‘q.
                            </Text>
                        }
                        ListFooterComponent={loadingMore ? <ActivityIndicator style={{ padding: 16 }} color="#2563eb" /> : null}
                    />
                )}
            </View>
        </ScreenWrapper>
    );
};

export default ProductCommentsPage;
