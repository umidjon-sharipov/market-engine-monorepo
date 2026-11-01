'use client'
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, TextInput, useWindowDimensions, Animated, Platform, GestureResponderEvent, TouchableOpacity, ViewStyle, Image } from 'react-native';
import { useNativeAnimDriver } from 'app/utils/animation';
import ScreenWrapper from 'app/components/layout/ScreenWrapper';
import ProductCart from 'app/components/UI/ProductCart';
import { useLanStorage } from 'app/store/useLanStore';
import { useSearchParams } from 'solito/navigation';
import { useInputStorage } from 'app/store/useInputStore';
import { usePathname } from 'solito/navigation';
import { UniversalImage } from 'app/components/UI/UniversalImage';
import HeartPng from 'app/features/app/assets/heart.png'
import { LinearGradient } from 'expo-linear-gradient'
import { useCartStore } from "app/store/useCartStore";
import { useYoqtirilganStore } from "app/store/useYoqtirilganStore";
import CartPng from 'app/features/app/assets/cart.png'
import CheckPng from 'app/features/app/assets/check.png'
import CheckedPng from 'app/features/app/assets/checked.png'
import { useRouter } from 'solito/navigation';
import Slider from 'app/components/UI/Slider';
import ProductSlider from 'app/components/UI/ProductSlider';
import accesStarPng from 'app/features/app/assets/acces-star.png'
import starPng from 'app/features/app/assets/star.png'
import { useModalStore } from 'app/store/useModalStore';
import { useUrlStore } from 'app/store/useUrlStore';
import { useTokenStore } from 'app/store/useTokenStore';
import { fetchWithAuth } from 'app/features/app/auth/fetchWithAuth';
import { pickCommentImages, type PickedCommentImage } from 'app/utils/pickCommentImages';

interface ProductComment {
    id: string;
    comment: string;
    reply?: string | null;
    rate: number;
    createdAt: string;
    images: string[];
    user: { id: string; userName: string | null; image: string | null };
}

interface EditableCommentImage extends PickedCommentImage {
    file?: File;
}

interface OptionItem {
    id: string;
    includeProductId: string | null;
    includedProduct: {
        id: string;
        title: string;
        price: number;
        images: string[];
    } | null;
}

interface OptionGroup {
    id: string;
    title: string;
    isOptional: boolean;
    searchEnabled: boolean;
    items: OptionItem[];
}

interface Product {
    id: string;
    title: string;
    price: number;
    marketId: string;
    description: { uz: string, ru: string, en: string };
    categoryId: string;
    discountId: string;
    gradient: string[];
    images: string[];
    quantity: number;
    options: OptionGroup[];
}

const ProductID = () => {
    const theme: string = 'light';
    const url = useUrlStore(state => state.url)
    const lan = useLanStorage(state => state.lan);
    const inputValue = useInputStorage(state => state.input);
    const pathname = usePathname();
    const [selectedOptions, setSelectedOptions] = useState<Record<string, Record<string, string>>>({});
    const [selectionError, setSelectionError] = useState('');
    const [comments, setComments] = useState<ProductComment[]>([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [commentRate, setCommentRate] = useState(5);
    const [commentImages, setCommentImages] = useState<EditableCommentImage[]>([]);
    const [ownCommentId, setOwnCommentId] = useState<string | null>(null);
    const [commentSubmitting, setCommentSubmitting] = useState(false);
    const [commentError, setCommentError] = useState('');
    const { width: windowWidth } = useWindowDimensions();
    const router = useRouter();
    const isTabletView = windowWidth < 1000 && windowWidth > 500;
    const isMobileView = windowWidth < 500;

    const searchParams = useSearchParams();
    const searchId = searchParams?.get('id');
    const optionQuery = searchParams?.get('options') ?? null;

    const pathSegments = pathname?.split('/')[2]?.split(',') || [];
    const productIdToFind = searchId || pathSegments[0];
    const productsIDs = pathSegments.slice(1);

    const [nextProducts, setNextProducts] = useState<Product[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [moon, setMoon] = useState(3);
    const [count, setCount] = useState(0)

    const { cart, toggleCart } = useCartStore();
    const authToken = useTokenStore((state) => state.token);

    const product: Product | undefined = products.find(p => String(p.id) === String(productIdToFind));
    const currentSelections = product ? selectedOptions[String(product.id)] ?? {} : {};
    const isInCart = cart.some(item =>
        String(item.id) === String(product?.id) &&
        Object.keys(item.optionSelections ?? {}).length === Object.keys(currentSelections).length &&
        Object.entries(currentSelections).every(([groupId, optionId]) => item.optionSelections?.[groupId] === optionId)
    );
    const toggleYoqtirilgan = useYoqtirilganStore(state => state.toggleYoqtirilgan);
    const yoqtirilganIds = useYoqtirilganStore(state => state.yoqtirilganIds);
    const setModal = useModalStore(state => state.setModal)
    const modal = useModalStore(state => state.modal)

    useEffect(() => {
        if (!product) return;

        let parsedSelections: Record<string, string> = {};
        if (optionQuery) {
            try {
                const parsed: unknown = JSON.parse(optionQuery);
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                    parsedSelections = Object.fromEntries(
                        Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
                    );
                }
            } catch {
                parsedSelections = {};
            }
        }

        const validSelections = Object.fromEntries(product.options.flatMap(group => {
            const selectedId = parsedSelections[group.id];
            return selectedId && group.items.some(option => option.id === selectedId && option.includedProduct)
                ? [[group.id, selectedId] as [string, string]]
                : [];
        }));
        setSelectedOptions(previous => ({ ...previous, [String(product.id)]: validSelections }));
    }, [product, optionQuery]);

    useEffect(() => {
        if (!product || !url) return;
        const controller = new AbortController();
        const loadComments = async () => {
            setCommentsLoading(true);
            setCommentError('');
            try {
                const query = new URLSearchParams({ productId: String(product.id) });
                const response = await fetch(`${url}/comments?${query}`, {
                    signal: controller.signal,
                });
                if (!response.ok) {
                    throw new Error(`Product sharhlarini yuklab bo‘lmadi: ${response.status}`);
                }
                const result: unknown = await response.json();
                if (!result || typeof result !== 'object' || !('data' in result) || !Array.isArray(result.data)) {
                    throw new Error('Sharhlar noto‘g‘ri formatda qaytdi.');
                }
                const loadedComments = result.data as ProductComment[];
                setComments(loadedComments);
                if (authToken) {
                    const profileResponse = await fetchWithAuth(`${url}/auth/profile`, {
                        signal: controller.signal,
                    });
                    if (profileResponse.ok) {
                        const profile: unknown = await profileResponse.json();
                        const userId = profile && typeof profile === 'object' && 'id' in profile &&
                            typeof profile.id === 'string' ? profile.id : null;
                        const mine = loadedComments.find((comment) => comment.user?.id === userId);
                        setOwnCommentId(mine?.id ?? null);
                        if (mine) {
                            setCommentText(mine.comment);
                            setCommentRate(mine.rate);
                            setCommentImages(Array.isArray(mine.images)
                                ? mine.images.filter((image): image is string => typeof image === 'string')
                                    .map((uri) => ({ uri, fileName: 'review-image', type: 'image/*' }))
                                : []);
                        } else {
                            setCommentText('');
                            setCommentRate(5);
                            setCommentImages([]);
                        }
                    }
                } else {
                    setOwnCommentId(null);
                }
            } catch (error) {
                if (controller.signal.aborted) return;
                console.error('Product sharhlarini yuklashda xatolik:', error);
                setCommentError('Sharhlarni yuklab bo‘lmadi.');
            } finally {
                if (!controller.signal.aborted) setCommentsLoading(false);
            }
        };
        void loadComments();
        return () => controller.abort();
    }, [authToken, product?.id, url]);

    const handleOptionSelect = (productId: string, groupId: string, optionId: string) => {
        const group = product?.options.find((item) => item.id === groupId);
        const currentSelection = selectedOptions[productId] ?? {};
        const nextSelections = { ...currentSelection };
        if (group?.isOptional && currentSelection[groupId] === optionId) {
            delete nextSelections[groupId];
        } else {
            nextSelections[groupId] = optionId;
        }
        setSelectedOptions(previous => ({ ...previous, [productId]: nextSelections }));
        setSelectionError('');

        const params = new URLSearchParams(searchParams?.toString() ?? '');
        if (Object.keys(nextSelections).length > 0) {
            params.set('options', JSON.stringify(nextSelections));
        } else {
            params.delete('options');
        }
        router.replace(`${pathname ?? ''}?${params.toString()}`);
    };

    const handleAddToCart = (buyNow = false) => {
        if (!product) return;
        const missingOption = product.options.find(
            (group) => !group.isOptional && !currentSelections[group.id],
        );
        if (missingOption) {
            setSelectionError(`“${missingOption.title}” uchun mahsulot tanlang.`);
            return;
        }
        setSelectionError('');
        if (!isInCart) toggleCart(product.id, currentSelections);
        if (buyNow) router.push('/checkout');
    };

    const handleSubmitComment = async () => {
        if (!product) return;
        const comment = commentText.trim();
        if (!authToken) {
            setCommentError('Sharh qoldirish uchun tizimga kiring.');
            return;
        }
        if (!comment) {
            setCommentError('Sharh matnini kiriting.');
            return;
        }
        if (comment.length > 400) {
            setCommentError('Sharh 400 belgidan oshmasligi kerak.');
            return;
        }

        setCommentSubmitting(true);
        setCommentError('');
        try {
            const formData = new FormData();
            if (!ownCommentId) formData.append('productId', product.id);
            formData.append('comment', comment);
            formData.append('rate', String(commentRate));
            if (ownCommentId) {
                formData.append('existingImages', JSON.stringify(
                    commentImages.filter((image) => !image.file).map((image) => image.uri),
                ));
            }
            for (const image of commentImages) {
                if (image.file) {
                    formData.append('images', image.file);
                } else if (image.uri.startsWith('file://')) {
                    formData.append('images', {
                        uri: image.uri,
                        type: image.type,
                        name: image.fileName,
                    } as never);
                }
            }
            const response = await fetchWithAuth(
                `${url}/comments${ownCommentId ? `/${ownCommentId}` : ''}`,
                { method: ownCommentId ? 'PATCH' : 'POST', body: formData },
            );
            if (!response.ok) {
                const errorBody: unknown = await response.json().catch(() => null);
                const message = errorBody && typeof errorBody === 'object' && 'message' in errorBody
                    ? String(errorBody.message)
                    : `Sharhni yuborib bo‘lmadi: ${response.status}`;
                throw new Error(message);
            }
            const updated = await response.json() as ProductComment;
            setOwnCommentId(updated.id);
            setComments((previous) => [
                updated,
                ...previous.filter((item) => item.id !== updated.id),
            ].slice(0, 20));
        } catch (error) {
            console.error('Product sharhini yuborishda xatolik:', error);
            setCommentError(error instanceof Error ? error.message : 'Sharh yuborilmadi.');
        } finally {
            setCommentSubmitting(false);
        }
    };

    const handleDeleteComment = async () => {
        if (!ownCommentId || !url) return;
        try {
            const response = await fetchWithAuth(`${url}/comments/${ownCommentId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error(`Sharhni o‘chirib bo‘lmadi: ${response.status}`);
            setComments((previous) => previous.filter((item) => item.id !== ownCommentId));
            setOwnCommentId(null);
            setCommentText('');
            setCommentRate(5);
            setCommentImages([]);
        } catch (error) {
            console.error('Product sharhini o‘chirishda xatolik:', error);
            setCommentError(error instanceof Error ? error.message : 'Sharh o‘chirilmadi.');
        }
    };

    const appendPickedImages = (picked: EditableCommentImage[]) => {
        setCommentImages((current) => [...current, ...picked].slice(0, 5));
    };

    useEffect(() => {
        setModal('product')

        return () => {
            setModal('')
        }
    }, [])

    const [elementHeight, setElementHeight] = useState<number>(500);
    const elementRef = useRef<any>(null);

    const scaleAnim = useRef(new Animated.Value(0)).current;
    const btnScaleAnim = useRef(new Animated.Value(1)).current;

    const handleButtonPressIn = () => {
        Animated.spring(btnScaleAnim, {
            toValue: 0.96,
            useNativeDriver: useNativeAnimDriver,
        }).start();
    };

    const handleButtonPressOut = () => {
        Animated.spring(btnScaleAnim, {
            toValue: 1,
            friction: 3,
            useNativeDriver: useNativeAnimDriver,
        }).start();
    };

    const handleFavoritePress = (e: GestureResponderEvent) => {
        e.stopPropagation();
        if (!product) return;
        toggleYoqtirilgan(product.id);

        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 120,
                useNativeDriver: useNativeAnimDriver,
            }),
            Animated.timing(scaleAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: useNativeAnimDriver,
            }),
        ]).start();
    };

    const heartScale = scaleAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.4],
    });

    const moonAnimate = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(moonAnimate, {
            toValue: moon,
            duration: 300,
            useNativeDriver: false
        }).start()
    }, [moon])

    const moonLeft = moonAnimate.interpolate({
        inputRange: [3, 6, 12, 24],
        outputRange: ['75%', '50%', '25%', '0%'],
        extrapolate: 'clamp'
    });

    const measureHeight = () => {
        if (Platform.OS === 'web' && elementRef.current) {
            const height = elementRef.current.offsetHeight;
            if (height > 0) {
                setElementHeight(height);
            }
        }
    };

    useEffect(() => {
        if (Platform.OS === 'web') {
            const timer = setTimeout(measureHeight, 150);
            window.addEventListener('resize', measureHeight);

            return () => {
                clearTimeout(timer);
                window.removeEventListener('resize', measureHeight);
            };
        }
    }, [loading]);

    const handleLayout = (event: any) => {
        if (Platform.OS !== 'web') {
            const { height } = event.nativeEvent.layout;
            if (height > 0) {
                setElementHeight(height);
            }
        }
    };

    useEffect(() => {
        if (products.length === 0) return;

        const currentPathIds = pathname?.split('/')[2]?.split(',').map(item => item.trim()).filter(Boolean) || [];
        const remainingIds = searchId ? currentPathIds : currentPathIds.slice(1);

        const saralanganMaxsulotlar = products.filter(maxsulot => {
            return remainingIds.map(String).includes(String(maxsulot.id));
        });
        setNextProducts(saralanganMaxsulotlar);
    }, [products, pathname, searchId]);

    useEffect(() => {
        if (loading || products.length === 0) return;

        const VISIBLE_ITEMS = 5;
        const maxScrollIndex = Math.max(0, products.length - VISIBLE_ITEMS);

        const timer = setInterval(() => {
            setCount(prev => {
                return prev < maxScrollIndex ? prev + 1 : 0;
            });
        }, 5000);

        return () => clearInterval(timer);
    }, [loading, products.length]);

    useEffect(() => {
        const fetchSearchProducts = async () => {
            try {
                const response = await fetch(`${url}/products`);
                const data = await response.json();
                setProducts(data);
            } catch (error) {
                console.error("Ma'lumot yuklashda xatolik:", error);
            } finally {
                setLoading(false);
            }
        };

        if (url) {
            fetchSearchProducts();
        }
    }, [url]);


    const totalPrice = product
        ? product.price + product.options.reduce((sum, group) => {
            const selectedId = currentSelections[group.id];
            return sum + (
                group.items.find(option => option.id === selectedId)?.includedProduct?.price ?? 0
            );
        }, 0)
        : 0;
    const averageRating = comments.length
        ? comments.reduce((total, comment) => total + comment.rate, 0) / comments.length
        : 0;


    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="rgba(115, 185, 255, 0.85)" />
            </View>
        );
    }

    if (!product) {
        return (
            <View style={styles.center}>
                <Text>Mahsulot topilmadi</Text>
            </View>
        );
    }

    return (
        <ScreenWrapper color={product.gradient}>
            <View style={isMobileView ? styles.mobileContainer : undefined}>
                <View style={{ width: '100%', flexDirection: (isTabletView || isMobileView) ? 'column' : 'row', gap: 16 }}>

                    <View style={[
                        { flex: 7, flexDirection: 'row', gap: 16 },
                        isMobileView && styles.mobileImageStickySection
                    ]}>
                        <View style={{ flex: 3, flexDirection: 'row', gap: 20 }}>
                            {(isTabletView || isMobileView) ? null : (
                                <View style={{ flex: 15, height: isTabletView ? 400 : isMobileView ? 300 : elementHeight, gap: 8 }}>
                                    <ProductSlider
                                        sliders={product.images.map((img: string, idx: number) => ({
                                            id: String(idx),
                                            image: img
                                        }))}
                                        count={count}
                                        setCount={setCount}
                                    />
                                </View>
                            )}
                            <View style={{ flex: 85, height: isTabletView ? 400 : isMobileView ? 350 : elementHeight, gap: 5 }}>
                                <Slider bg='#FFFFFF00' sliders={
                                    product.images.map((img: string, idx: number) => ({
                                        id: String(idx),
                                        image: img,
                                        link: '',
                                        marketId: product.marketId || ''
                                    }))} link={false} count={count} setCount={setCount} />
                            </View>
                        </View>

                        {!(isTabletView || isMobileView) ? (
                            <ScrollView style={{ flex: 2, height: elementHeight, padding: 10, gap: 8, flexDirection: 'column', position: 'relative' }}>

                                <LinearGradient
                                    colors={['rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0)']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 0, y: 1 }}
                                    style={[
                                        {
                                            height: 50,
                                            width: '100%',
                                            pointerEvents: 'none',
                                            zIndex: 10,
                                        },
                                        Platform.OS === 'web'
                                            ? { position: 'sticky' as unknown as ViewStyle['position'], top: 0 }
                                            : { position: 'absolute', top: 0 }
                                    ]}
                                />

                                <View style={{ padding: 0, gap: 8 }}>
                                    <Text style={{ fontSize: 18, fontWeight: '600', textTransform: 'capitalize' }}>{product.title}</Text>
                                    <View style={{ flexDirection: 'row', gap: 4 }}>
                                        {
                                            Array.from({ length: Math.round(averageRating) }, (_, index) => index + 1).map((_, index) =>
                                                <UniversalImage
                                                    key={index}
                                                    src={accesStarPng}
                                                    alt={product.title}
                                                    width={20}
                                                    height={20}
                                                    resizeMode='contain'
                                                />
                                            )
                                        }
                                        {
                                            Array.from({ length: 5 - Math.round(averageRating) }, (_, index) => index + 1).map((_, index) =>
                                                <UniversalImage
                                                    key={index}
                                                    src={starPng}
                                                    alt={product.title}
                                                    width={20}
                                                    height={20}
                                                    resizeMode='contain'
                                                />
                                            )
                                        }
                                        <Text>{averageRating.toFixed(1)} | {comments.length} sharh</Text>



                                    </View>
                                </View>

                                <View style={{ width: '100%', gap: 4, flexDirection: 'column' }}>
                                    {product.options && product.options.length > 0 && (
                                        <View style={styles.container}>
                                            <Text style={[styles.mainTitle, theme === 'dark' ? styles.textDark : styles.textLight]}>
                                                Konfiguratsiyani o&apos;zgartirish:
                                            </Text>
                                            <View style={styles.groupContainer}>
                                                {product?.options?.map((optGroup, optIdx) => {
                                                    const activeVal = selectedOptions[product.id]?.[optGroup.id];
                                                    return (
                                                        <View
                                                            key={optIdx}
                                                            style={[
                                                                styles.card,
                                                                theme === 'dark' ? styles.cardDark : styles.cardLight
                                                            ]}
                                                        >
                                                            <Text style={[styles.groupTitle, theme === 'dark' ? styles.groupTitleDark : styles.groupTitleLight]}>
                                                                {optGroup.title}{optGroup.isOptional ? ' · ixtiyoriy' : ' · tanlash majburiy'}
                                                            </Text>
                                                            <View style={styles.optionsList}>
                                                                {optGroup.items.map((opt, valIdx) => {
                                                                    const isSelected = activeVal === opt.id;

                                                                    return (
                                                                        <TouchableOpacity
                                                                            key={opt.id}
                                                                            onPress={() => handleOptionSelect(String(product.id), optGroup.id, opt.id)}
                                                                            disabled={!opt.includedProduct}
                                                                            activeOpacity={0.7}
                                                                            style={[
                                                                                styles.optionButton,
                                                                                isSelected
                                                                                    ? styles.buttonSelected
                                                                                    : theme === 'dark'
                                                                                        ? styles.buttonDark
                                                                                        : styles.buttonLight
                                                                            ]}
                                                                        >
                                                                            <Text style={[
                                                                                styles.buttonText,
                                                                                isSelected
                                                                                    ? styles.textSelected
                                                                                    : theme === 'dark'
                                                                                        ? styles.textDark
                                                                                        : styles.textLight
                                                                            ]}>
                                                                                {opt.includedProduct?.title ?? 'Mahsulot mavjud emas'}
                                                                            </Text>
                                                                            <Text style={[
                                                                                styles.priceText,
                                                                                isSelected
                                                                                    ? styles.textSelected
                                                                                    : theme === 'dark'
                                                                                        ? styles.priceDark
                                                                                        : styles.priceLight
                                                                            ]}>
                                                                                {opt.includedProduct
                                                                                    ? `+${opt.includedProduct.price.toLocaleString()} UZS`
                                                                                    : 'Tanlab bo‘lmaydi'}
                                                                            </Text>
                                                                        </TouchableOpacity>
                                                                    );
                                                                })}
                                                            </View>
                                                        </View>
                                                    );
                                                })}
                                            </View>
                                        </View>
                                    )}
                                </View>

                                <LinearGradient
                                    colors={['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.4)']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 0, y: 1 }}
                                    style={[
                                        {
                                            height: 50,
                                            width: '100%',
                                            pointerEvents: 'none',
                                            marginTop: 10,
                                            zIndex: 10,
                                        },
                                        Platform.OS === 'web'
                                            ? { position: 'sticky' as unknown as ViewStyle['position'], bottom: 0 }
                                            : { position: 'absolute', bottom: 0 }
                                    ]}
                                />

                            </ScrollView>
                        ) : null}
                    </View>

                    <View
                        style={[
                            { flex: 3, gap: 8 },
                            isMobileView && styles.mobileContentOverlay
                        ]}
                        ref={Platform.OS === 'web' ? elementRef : undefined}
                        onLayout={handleLayout}
                    >
                        <View style={{ width: '100%', paddingTop: 50, gap: 5, borderRadius: 28, backgroundColor: 'rgba(115, 185, 255, 0.2)' }}>
                            <View style={{ width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.4)', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, gap: 22 }}>
                                {(isTabletView || isMobileView) ? <Text style={{ fontWeight: '700', fontSize: 20 }}>{product.title}</Text> : null}
                                <Text style={{ fontWeight: '700', fontSize: 30, color: '#111' }}>{totalPrice} so'm</Text>
                                <Text style={{ fontWeight: '400', fontSize: 14, textDecorationLine: 'line-through', color: 'gray' }}>{((product.price / 100) * 120).toFixed(0)}</Text>

                                <View style={{ width: '100%' }}>
                                    <View style={{ width: '100%', padding: 4, backgroundColor: 'rgba(220, 238, 255, 0.9)', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
                                        <View style={{ width: '100%', gap: 4, flexDirection: 'row', position: 'relative' }}>
                                            <Animated.View style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: 12, position: 'absolute', top: 0, left: moonLeft, width: '25%', height: '100%' }}>
                                            </Animated.View>
                                            <Pressable onPress={() => setMoon(24)} style={{ padding: 6, borderRadius: 12, flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                                <Text style={{ fontWeight: '700', color: `${moon === 24 ? 'rgba(10, 20, 30, 1)' : 'rgba(20, 40, 60, 0.85)'}` }}>24 oy</Text>
                                            </Pressable>
                                            <Pressable onPress={() => setMoon(12)} style={{ padding: 6, borderRadius: 12, flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                                <Text style={{ fontWeight: '700', color: `${moon === 12 ? 'rgba(10, 20, 30, 1)' : 'rgba(20, 40, 60, 0.85)'}` }}>12 oy</Text>
                                            </Pressable>
                                            <Pressable onPress={() => setMoon(6)} style={{ padding: 6, borderRadius: 12, flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                                <Text style={{ fontWeight: '700', color: `${moon === 6 ? 'rgba(10, 20, 30, 1)' : 'rgba(20, 40, 60, 0.85)'}` }}>6 oy</Text>
                                            </Pressable>
                                            <Pressable onPress={() => setMoon(3)} style={{ padding: 6, borderRadius: 12, flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                                <Text style={{ fontWeight: '700', color: `${moon === 3 ? 'rgba(10, 20, 30, 1)' : 'rgba(20, 40, 60, 0.85)'}` }}>3 oy</Text>
                                            </Pressable>
                                        </View>
                                    </View>
                                    <Pressable style={{ width: '100%', padding: 8, backgroundColor: 'rgba(37, 146, 255, 0.48)', borderBottomLeftRadius: 16, borderBottomRightRadius: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text><Text style={{ padding: 3, backgroundColor: 'rgba(80, 160, 240, 0.95)', borderRadius: 12, fontWeight: 'bold', fontSize: 16, color: 'rgba(255, 255, 255, 1)' }}>{(product.price / moon).toFixed(0)} so'm</Text> × {moon} oy</Text>
                                        <Text style={{ fontSize: 16 }}>{'>'}</Text>
                                    </Pressable>
                                </View>

                                <View style={{ width: '100%', flexDirection: 'row', gap: 16 }}>
                                    <Animated.View style={{ flex: 9, transform: [{ scale: btnScaleAnim }] }}>
                                        <Pressable
                                            onPressIn={handleButtonPressIn}
                                            onPressOut={handleButtonPressOut}
                                            onPress={() => handleAddToCart(true)}
                                            style={{ backgroundColor: 'rgba(115, 185, 255, 0.85)', padding: 14, borderRadius: 16, justifyContent: 'center', alignItems: 'center' }}
                                        >
                                            <Text style={{ fontSize: 16, fontWeight: '700', textTransform: 'capitalize', color: '#fff' }}>1 klikda xarid qilish</Text>
                                        </Pressable>
                                    </Animated.View>
                                    <Pressable onPress={handleFavoritePress} style={{ backgroundColor: 'rgba(135, 206, 235, 0.2)', padding: 12, borderRadius: 16, flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                        <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                                            <UniversalImage
                                                src={yoqtirilganIds.includes(product.id) ? 'https://i.ibb.co/XkFkG62y/image.png' : 'https://i.ibb.co/GfZzh6Y7/heart.png'}
                                                alt="Favorite Icon"
                                                width={24}
                                                height={24}
                                                resizeMode="contain"
                                            />
                                        </Animated.View>
                                    </Pressable>
                                </View>

                                {selectionError ? (
                                    <Text accessibilityRole="alert" style={{ color: '#dc2626', fontSize: 13 }}>
                                        {selectionError}
                                    </Text>
                                ) : null}

                                <View style={{ flexDirection: 'row', width: '100%', gap: 16 }}>
                                    <Animated.View style={{ flex: 8, transform: [{ scale: btnScaleAnim }] }}>
                                        <Pressable
                                            onPressIn={handleButtonPressIn}
                                            onPressOut={handleButtonPressOut}
                                            onPress={(e: any) => {
                                                e.stopPropagation();
                                                handleAddToCart();
                                            }}
                                            style={[styles.button, isInCart ? styles.buttonInCart : styles.button, { width: '100%' }]}>
                                            <Text style={[styles.buttonText, isInCart && styles.buttonTextInCart]}>{isInCart ? 'savatda ✓' : 'savatga qo\'shish'}</Text>
                                        </Pressable>
                                    </Animated.View>
                                    {isInCart ? (
                                        <Pressable onPress={() => router.push('/savat')} style={{
                                            flex: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(135, 206, 235, 0.2)', borderRadius: 14, borderWidth: 1,
                                            borderColor: 'rgba(115, 185, 255, 0.85)',
                                        }}>
                                            <UniversalImage
                                                src={CartPng}
                                                alt={product.title}
                                                width={30}
                                                height={30}
                                                resizeMode='contain'
                                            />
                                        </Pressable>
                                    ) : null}
                                </View>

                                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                                    <UniversalImage
                                        src={CheckPng}
                                        alt='check'
                                        width={30}
                                        height={30}
                                        resizeMode='contain'
                                    />
                                    <Text>{product.quantity} dona xarid qilish mumkin</Text>
                                </View>
                                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                                    <View>
                                        <UniversalImage
                                            src={CartPng}
                                            alt='cart'
                                            width={30}
                                            height={30}
                                            resizeMode='contain'
                                        />
                                        <UniversalImage
                                            style={{ position: 'absolute', bottom: 0, right: 0 }}
                                            src={CheckedPng}
                                            alt='check'
                                            width={10}
                                            height={10}
                                            resizeMode='contain'
                                        />
                                    </View>
                                    <Text>Bu haftada 5 kishi sotib oldi</Text>
                                </View>
                            </View>
                            <View style={{ position: 'absolute', top: 0, left: 0, flexDirection: 'row', justifyContent: 'space-between', width: '100%', padding: 10 }}>
                                <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'snow', textTransform: 'capitalize' }}>yozgi chegirmalar <Text style={{ fontSize: 20 }}>{'>'}</Text></Text>
                                <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'snow', textTransform: 'capitalize' }}>{new Date().getSeconds()} kun qoldi</Text>
                            </View>
                        </View>
                    </View>

                </View>
                <View style={{ padding: 12 }}>
                    <Text>
                        {typeof product.description === 'string'
                            ? product.description
                            : product.description?.[lan as keyof typeof product.description] || product.description?.uz}
                    </Text>

                    <View style={{ marginTop: 24, gap: 12 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                            <Text style={{ color: '#111827', fontSize: 20, fontWeight: '800' }}>
                                Sharhlar ({comments.length})
                            </Text>
                            {product ? (
                                <Pressable onPress={() => router.push(
                                    Platform.OS === 'web'
                                        ? `/product/${product.id}/comments`
                                        : `/productComments?id=${product.id}`,
                                )}>
                                    <Text style={{ color: '#2563eb', fontWeight: '700' }}>Barcha sharhlar</Text>
                                </Pressable>
                            ) : null}
                        </View>
                        {commentsLoading ? (
                            <ActivityIndicator color="#2563eb" />
                        ) : comments.length === 0 ? (
                            <Text style={{ color: '#64748b' }}>Hozircha sharhlar yo‘q.</Text>
                        ) : (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ gap: 12, paddingVertical: 2 }}
                            >
                                {comments.map((comment) => (
                                    <View
                                        key={comment.id}
                                        style={{
                                            width: Math.min(windowWidth * 0.82, 360),
                                            gap: 8,
                                            padding: 14,
                                            borderRadius: 14,
                                            borderWidth: 1,
                                            borderColor: '#e2e8f0',
                                            backgroundColor: 'rgba(255,255,255,0.82)',
                                        }}
                                    >
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                                            <Text style={{ color: '#0f172a', fontWeight: '700' }}>
                                                {comment.user?.userName || 'Foydalanuvchi'}
                                            </Text>
                                            <Text style={{ color: '#b45309' }}>
                                                {'★'.repeat(Math.max(0, Math.min(5, comment.rate)))}
                                            </Text>
                                        </View>
                                        <Text style={{ color: '#334155' }}>{comment.comment}</Text>
                                        {comment.reply ? (
                                            <View style={{ padding: 10, borderRadius: 10, backgroundColor: '#eff6ff' }}>
                                                <Text style={{ color: '#1d4ed8', fontSize: 11, fontWeight: '700', marginBottom: 4 }}>
                                                    Market javobi
                                                </Text>
                                                <Text style={{ color: '#1e3a8a' }}>{comment.reply}</Text>
                                            </View>
                                        ) : null}
                                        {Array.isArray(comment.images) && comment.images.length > 0 ? (
                                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                                                {comment.images.slice(0, 5).map((image, index) => (
                                                    <Image
                                                        key={`${comment.id}-${index}`}
                                                        source={{ uri: image }}
                                                        style={{ width: 72, height: 72, borderRadius: 8 }}
                                                        resizeMode="cover"
                                                    />
                                                ))}
                                            </ScrollView>
                                        ) : null}
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Text style={{ color: '#94a3b8', fontSize: 11 }}>
                                                {new Date(comment.createdAt).toLocaleDateString()}
                                            </Text>
                                            {comment.id === ownCommentId ? (
                                                <Pressable onPress={handleDeleteComment}>
                                                    <Text style={{ color: '#dc2626', fontSize: 12, fontWeight: '700' }}>O‘chirish</Text>
                                                </Pressable>
                                            ) : null}
                                        </View>
                                    </View>
                                ))}
                            </ScrollView>
                        )}
                        {commentError ? (
                            <Text accessibilityRole="alert" style={{ color: '#dc2626' }}>
                                {commentError}
                            </Text>
                        ) : null}
                        {authToken ? (
                            <View style={{ gap: 10 }}>
                                <Text style={{ color: '#334155', fontWeight: '700' }}>Bahoyingiz</Text>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    {[1, 2, 3, 4, 5].map((rate) => (
                                        <Pressable key={rate} onPress={() => setCommentRate(rate)}>
                                            <Text style={{ color: rate <= commentRate ? '#f59e0b' : '#cbd5e1', fontSize: 24 }}>★</Text>
                                        </Pressable>
                                    ))}
                                </View>
                                <TextInput
                                    value={commentText}
                                    onChangeText={setCommentText}
                                    placeholder="Mahsulot haqida fikringiz..."
                                    maxLength={400}
                                    multiline
                                    textAlignVertical="top"
                                    style={{
                                        minHeight: 90,
                                        borderWidth: 1,
                                        borderColor: '#cbd5e1',
                                        borderRadius: 12,
                                        padding: 12,
                                        color: '#0f172a',
                                        backgroundColor: '#fff',
                                    }}
                                />
                                <View style={{ gap: 8 }}>
                                    <Text style={{ color: '#334155', fontWeight: '700' }}>
                                        Rasmlar ({commentImages.length}/5)
                                    </Text>
                                    {Platform.OS === 'web' ? (
                                        <label style={{ alignSelf: 'flex-start', color: '#2563eb', fontWeight: '700', cursor: 'pointer' }}>
                                            Rasm tanlash
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                disabled={commentImages.length >= 5}
                                                style={{ display: 'none' }}
                                                onChange={(event) => {
                                                    const selected = Array.from(event.currentTarget.files ?? [])
                                                        .slice(0, 5 - commentImages.length);
                                                    appendPickedImages(selected.map((file) => ({
                                                        uri: URL.createObjectURL(file),
                                                        fileName: file.name,
                                                        type: file.type || 'image/jpeg',
                                                        file,
                                                    })));
                                                    event.currentTarget.value = '';
                                                }}
                                            />
                                        </label>
                                    ) : (
                                        <Pressable
                                            disabled={commentImages.length >= 5}
                                            onPress={async () => {
                                                try {
                                                    appendPickedImages(await pickCommentImages(5 - commentImages.length));
                                                } catch (error) {
                                                    setCommentError(error instanceof Error ? error.message : 'Rasm tanlashda xatolik.');
                                                }
                                            }}
                                        >
                                            <Text style={{ color: '#2563eb', fontWeight: '700' }}>Rasm tanlash</Text>
                                        </Pressable>
                                    )}
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                                        {commentImages.map((image, index) => (
                                            <View key={`${image.uri}-${index}`} style={{ position: 'relative' }}>
                                                <Image source={{ uri: image.uri }} style={{ width: 72, height: 72, borderRadius: 8 }} />
                                                <Pressable
                                                    accessibilityLabel="Rasmni olib tashlash"
                                                    onPress={() => setCommentImages((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                                                    style={{ position: 'absolute', right: 2, top: 2, width: 22, height: 22, borderRadius: 11, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' }}
                                                >
                                                    <Text style={{ color: '#fff', fontSize: 14 }}>×</Text>
                                                </Pressable>
                                            </View>
                                        ))}
                                    </ScrollView>
                                </View>
                                <Pressable
                                    onPress={handleSubmitComment}
                                    disabled={commentSubmitting}
                                    style={{
                                        alignSelf: 'flex-start',
                                        backgroundColor: commentSubmitting ? '#94a3b8' : '#2563eb',
                                        paddingVertical: 11,
                                        paddingHorizontal: 18,
                                        borderRadius: 10,
                                    }}
                                >
                                    <Text style={{ color: '#fff', fontWeight: '700' }}>
                                        {commentSubmitting ? 'Yuborilmoqda...' : ownCommentId ? 'Sharhni yangilash' : 'Sharh qoldirish'}
                                    </Text>
                                </Pressable>
                            </View>
                        ) : (
                            <Pressable onPress={() => router.push('/auth')}>
                                <Text style={{ color: '#2563eb', fontWeight: '700' }}>
                                    Sharh qoldirish uchun tizimga kiring
                                </Text>
                            </Pressable>
                        )}
                    </View>

                    {(isTabletView || isMobileView) ? (

                        product.options && product.options.length > 0 && (
                            <View style={styles.container}>
                                <Text style={[styles.mainTitle, theme === 'dark' ? styles.textDark : styles.textLight]}>
                                    Konfiguratsiyani o&apos;zgartirish:
                                </Text>
                                <View style={styles.groupContainer}>
                                    {product.options.map((optGroup, optIdx) => {
                                        const activeVal = selectedOptions[product.id]?.[optGroup.id];
                                        return (
                                            <View
                                                key={optIdx}
                                                style={[
                                                    styles.card,
                                                    theme === 'dark' ? styles.cardDark : styles.cardLight
                                                ]}
                                            >
                                                <Text style={[styles.groupTitle, theme === 'dark' ? styles.groupTitleDark : styles.groupTitleLight]}>
                                                    {optGroup.title}{optGroup.isOptional ? ' · ixtiyoriy' : ' · tanlash majburiy'}
                                                </Text>
                                                <View style={styles.optionsList}>
                                                    {optGroup.items.map((opt, valIdx) => {
                                                        const isSelected = activeVal === opt.id;

                                                        return (
                                                            <TouchableOpacity
                                                                key={opt.id}
                                                                onPress={() => handleOptionSelect(String(product.id), optGroup.id, opt.id)}
                                                                disabled={!opt.includedProduct}
                                                                activeOpacity={0.7}
                                                                style={[
                                                                    styles.optionButton,
                                                                    isSelected
                                                                        ? styles.buttonSelected
                                                                        : theme === 'dark'
                                                                            ? styles.buttonDark
                                                                            : styles.buttonLight
                                                                ]}
                                                            >
                                                                <Text style={[
                                                                    styles.buttonText,
                                                                    isSelected
                                                                        ? styles.textSelected
                                                                        : theme === 'dark'
                                                                            ? styles.textDark
                                                                            : styles.textLight
                                                                ]}>
                                                                    {opt.includedProduct?.title ?? 'Mahsulot mavjud emas'}
                                                                </Text>
                                                                <Text style={[
                                                                    styles.priceText,
                                                                    isSelected
                                                                        ? styles.textSelected
                                                                        : theme === 'dark'
                                                                            ? styles.priceDark
                                                                            : styles.priceLight
                                                                ]}>
                                                                    {opt.includedProduct
                                                                        ? `+${opt.includedProduct.price.toLocaleString()} UZS`
                                                                        : 'Tanlab bo‘lmaydi'}
                                                                </Text>
                                                            </TouchableOpacity>
                                                        );
                                                    })}
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
                        )

                    ) : null}
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', padding: 12 }}>
                    {nextProducts.map((p: Product, index: number) => (
                        <ProductCart bg='rgba(255, 255, 255, 0.3)' key={p.id} product={p} products={nextProducts} index={index} />
                    ))}
                </View>
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mobileContainer: {
        paddingBottom: 20,
    },
    mobileImageStickySection: {
        position: 'sticky' as any,
        top: 10,
        zIndex: 1,
        backgroundColor: '#fff',
    },
    mobileContentOverlay: {
        zIndex: 2,
        elevation: 5,
    },
    button: {
        backgroundColor: 'rgba(115, 185, 255, 0.85)',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonInCart: {
        backgroundColor: 'rgba(135, 206, 235, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(115, 185, 255, 0.85)',
    },
    buttonText: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 16,
    },
    buttonTextInCart: {
        color: 'rgba(115, 185, 255, 0.85)',
    },
    container: {
        gap: 16,
    },
    mainTitle: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    groupContainer: {
        gap: 12,
    },
    card: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    cardDark: {
        backgroundColor: 'rgba(24, 24, 27, 0.4)',
        borderColor: '#27272a',
    },
    cardLight: {
        backgroundColor: '#f9fafb',
        borderColor: '#e4e4e7',
    },
    groupTitle: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'capitalize',
        marginBottom: 12,
        letterSpacing: 1,
    },
    groupTitleDark: {
        color: '#a1a1aa',
    },
    groupTitleLight: {
        color: '#52525b',
    },
    optionsList: {
        gap: 8,
    },
    optionButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    buttonSelected: {
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        borderColor: 'rgba(14, 165, 233, 0.5)',
    },
    buttonDark: {
        backgroundColor: 'rgba(39, 39, 42, 0.2)',
        borderColor: '#27272a',
    },
    buttonLight: {
        backgroundColor: '#ffffff',
        borderColor: '#e4e4e7',
    },
    optionButtonText: {
        fontSize: 12,
        fontWeight: '500',
        textTransform: 'capitalize',
    },
    priceText: {
        fontSize: 12,
        fontWeight: '600',
    },
    textDark: {
        color: '#d4d4d8',
    },
    textLight: {
        color: '#3f3f46',
    },
    textSelected: {
        color: '#0ea5e9',
    },
    priceDark: {
        color: '#71717a',
    },
    priceLight: {
        color: '#a1a1aa',
    }
});

export default ProductID;
