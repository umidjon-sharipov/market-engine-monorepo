'use client'
const API_URL = process.env.NEXT_PUBLIC_API_URL

import Image from "next/image";
import React, { useState, useEffect } from "react";
interface Product {
    id: number;
    title: string;
    description: {
        uz: string;
        en: string;
        ru: string;
    };
    price: number;
}
const ProductsGet = () => {
    const [data, setData] = useState<Product[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${API_URL}/api/products`);
                if (!response.ok) {
                    throw new Error('Failed to fetch data');
                }
                const result: Product[] = await response.json();
                console.log(result);
                setData(result);
            } catch (error) {
                if (error instanceof Error) {
                    console.error('Error fetching data:', error.message);
                } else {
                    console.error('An unexpected error occurred:', error);
                }
            }
        };

        fetchData();
    }, []);
    return (
        <div className="space-y-6">
            <div className="space-y-1.5">
                <h1 className="text-4xl font-extrabold tracking-tight dark:text-white text-neutral-900">GET Request</h1>
            </div>
            <section className="text-gray-600 body-font">
                <div className="container mx-auto">
                    <div className="flex flex-wrap -m-4">
                        {
                            data.map(item => (
                                <div className="p-4 md:w-1/3" key={item.id}>
                                    <div className="h-full border-2 border-gray-200 border-opacity-60 rounded-3xl overflow-hidden">
                                        <Image className="lg:h-48 md:h-36 w-full object-cover object-center" src="https://dummyimage.com/720x400" alt="blog" width={500} height={300} />
                                        <div className="p-6 flex flex-col justify-between">
                                            <h2 className="tracking-widest text-xs title-font font-medium text-gray-400 mb-1">ID: {item.id}</h2>
                                            <h1 className="title-font text-lg font-medium text-white mb-3">{item.title}</h1>
                                            <p className="leading-relaxed mb-3">{item.description.uz}</p>
                                            <div className="flex items-center flex-wrap">
                                                <a className="text-sky-500 inline-flex items-center md:mb-2 lg:mb-0">Learn More
                                                    <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M5 12h14"></path>
                                                        <path d="M12 5l7 7-7 7"></path>
                                                    </svg>
                                                </a>
                                                <span className="text-gray-400 mr-3 inline-flex items-center lg:ml-auto md:ml-0 ml-auto leading-none text-sm pr-3 py-1 border-r-2 border-gray-200">
                                                    <svg className="w-4 h-4 mr-1" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                        <circle cx="12" cy="12" r="3"></circle>
                                                    </svg>1.2K
                                                </span>
                                                <span className="text-gray-400 inline-flex items-center leading-none text-sm">
                                                    <svg className="w-4 h-4 mr-1" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                                        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"></path>
                                                    </svg>6
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        }
                        {
                            data.length === 0 && (
                                Array(20).fill(null).map((_, index) => (
                                    <div key={index} className="p-4 md:w-1/3 progress-loader">
                                        <div className="h-full border-2 border-gray-200 border-opacity-60 rounded-3xl overflow-hidden animate-pulse">
                                            <div className="lg:h-48 md:h-36 w-full bg-gray-300"></div>

                                            <div className="p-6">
                                                <div className="h-3 bg-gray-300 rounded w-1/4 mb-2"></div>

                                                <div className="h-5 bg-gray-300 rounded w-1/2 mb-4"></div>

                                                <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
                                                <div className="h-4 bg-gray-300 rounded w-5/6 mb-4"></div>

                                                <div className="flex items-center flex-wrap pt-2">
                                                    <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                                                    <div className="h-4 bg-gray-300 rounded w-8 ml-auto mr-3"></div>
                                                    <div className="h-4 bg-gray-300 rounded w-6"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                                ))
                        }
                    </div>
                </div>
            </section>
        </div>
    );
}

export default ProductsGet