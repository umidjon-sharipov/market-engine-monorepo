'use client'
import React, { useState, useEffect } from 'react'
import Slider from '@/app/_components/Slider'
interface Rating {
    rate: number;
    count: number;
}

interface Product {
    id: number;
    title: string;
    price: number;
    description: string;
    category: string;
    image: string;
    rating: Rating;
}

const SliderGet = () => {
    const [count, setCount] = useState(0)
    const [products, setProducts] = useState<Product[]>([]);

    useEffect(() => {
        const fetchproducts = async () => {
            try {
                const response = await fetch(`https://fakestoreapi.com/products`);
                if (!response.ok) {
                    throw new Error('Failed to fetch products');
                }
                const result: Product[] = await response.json();
                console.log(result);
                setProducts(result);
            } catch (error) {
                if (error instanceof Error) {
                    console.error('Error fetching products:', error.message);
                } else {
                    console.error('An unexpected error occurred:', error);
                }
            }
        };

        fetchproducts();
    }, []);
    return (
        <>
            <h1>slider</h1>
            <Slider products={products} />
        </>
    )
}

export default SliderGet
