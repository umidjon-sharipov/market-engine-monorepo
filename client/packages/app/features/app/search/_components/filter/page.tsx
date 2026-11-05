'use client';

import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { usePathname, useRouter } from 'solito/navigation';
import { useInputStorage } from 'app/store/useInputStore';
import SearchCatalog from '../SearchCatalog';

const FilterSearch = () => {
    const pathname = usePathname();
    const router = useRouter();
    const inputValue = useInputStorage((state) => state.input);
    const routeTerm = pathname?.split('/')[2] ?? '';

    useEffect(() => {
        if (Platform.OS === 'web' && inputValue.trim() !== routeTerm) {
            const path = inputValue.trim()
                ? `/search/${encodeURIComponent(inputValue.trim())}`
                : '/search';
            router.replace(path);
        }
    }, [inputValue, routeTerm, router]);

    let decodedRouteTerm = routeTerm;
    try {
        decodedRouteTerm = decodeURIComponent(routeTerm);
    } catch (error) {
        console.error('Search URL noto‘g‘ri encode qilingan:', error);
    }

    return <SearchCatalog searchTerm={Platform.OS === 'web' ? decodedRouteTerm : inputValue} />;
};

export default FilterSearch;
