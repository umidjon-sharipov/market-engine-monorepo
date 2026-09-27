'use client'
import React, { useState } from 'react'

interface ProductOptionGroupProps {
    groupIndex: number;
}

const ProductOptionGroup = ({ groupIndex }: ProductOptionGroupProps) => {
    const [optionNum, setOptionNum] = useState(1);

    const displayGroupNum = groupIndex + 1;

    return (
        <div className='flex flex-col gap-6 bg-sky-100/10 rounded-2xl p-6 max-[500px]:p-4'>
            <div className='flex gap-4 max-[500px]:flex-col'>
                <input
                    type="text"
                    name={`option${displayGroupNum}Name`}
                    className="rounded-[1rem] max-[500px]:text-sm bg-sky-200/10 border border-sky-500/40 py-2 px-4 w-1/2 max-[500px]:w-full outline-none"
                    placeholder={`mahsulotning ${displayGroupNum} - qismini nomini yozing...`}
                />
                <div className="flex gap-4 w-1/2 max-[500px]:w-full">
                    <button
                        type='button'
                        className="px-2 py-2 rounded-xl max-[500px]:p-1 max-[500px]:text-sm capitalize active:scale-[0.9] hover:bg-sky-600/40 duration-200 font-semibold w-full bg-sky-600/60"
                        onClick={() => setOptionNum(prev => prev + 1)}
                    >
                        qo'shish
                    </button>
                    <button
                        type='button'
                        className="px-2 py-2 rounded-xl max-[500px]:p-1 max-[500px]:text-sm capitalize active:scale-[0.9] hover:bg-rose-600/40 duration-200 font-semibold w-full bg-rose-600/60"
                        onClick={() => { optionNum > 1 && setOptionNum(prev => prev - 1) }}
                    >
                        o'chirish
                    </button>
                </div>
            </div>

            {Array.from({ length: optionNum }).map((_, index) => {
                const displayOptionNum = index + 1;
                return (
                    <div key={index} className='flex flex-col gap-3 bg-sky-50/10 rounded-2xl p-4 max-[500px]:p-2'>
                        <input
                            type="text"
                            name={`option${displayGroupNum}Name${displayOptionNum}`}
                            className="rounded-[1rem] max-[500px]:text-[10px] bg-sky-200/10 border border-sky-500/40 py-2 px-4 w-full outline-none"
                            placeholder={`mahsulotning ${displayGroupNum} - qismining ${displayOptionNum} - optionini nomini yozing...`}
                        />
                        <input
                            type="number"
                            name={`option${displayGroupNum}Value${displayOptionNum}`}
                            className="rounded-[1rem] max-[500px]:text-[10px] bg-sky-200/10 border border-sky-500/40 py-2 px-4 w-full outline-none"
                            placeholder={`mahsulotning ${displayGroupNum} - qismining ${displayOptionNum} - optionini narxini yozing...`}
                        />
                    </div>
                );
            })}
        </div>
    )
}

export default ProductOptionGroup;