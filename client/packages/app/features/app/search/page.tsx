'use client';

import React from 'react';
import SearchCatalog from './_components/SearchCatalog';
import { useInputStorage } from 'app/store/useInputStore';

const Search = () => {
    const searchTerm = useInputStorage((state) => state.input);
    return <SearchCatalog searchTerm={searchTerm} />;
};

export default Search;
