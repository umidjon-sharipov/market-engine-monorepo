'use client'
import React from 'react'
import Image from 'next/image'
import { useApikeyStore } from '@/app/_store/useApikeyStore'
const API_URL = process.env.NEXT_PUBLIC_API_URL

const SliderPost = () => {
    const apikey = useApikeyStore(state => state.apikey)
    const postSlider = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        try {
            const response = await fetch(`${API_URL}/api/sliders`, {
                method: 'POST',
                headers: {
                    'api-key': apikey
                },
                body: formData
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Slider yaratilmadi');
            }

            const result = await response.json();
            console.log("Muvaffaqiyatli saqlandi! 🎉", result);
            alert("Slider muvaffaqiyatli qo'shildi!");

            e.currentTarget.reset();
        } catch (error: any) {
            console.error('To\'liq xatolik:', error);
            alert(`Xatolik: ${error.message}`);
        }
    }

    return (
        <div className='flex flex-col gap-4'>
            <form action="" method="post" className='flex flex-col gap-4' onSubmit={postSlider}>
                <div className="relative">
                    <input type="text" name='link' className="rounded-[1rem] bg-sky-200/10 border border-sky-500/40 py-2 px-10 w-full outline-none" placeholder="slider linkini yozing..." required />
                    <div className="absolute top-0 left-2 h-full flex items-center justify-center">
                        <Image src='/chain.png' alt="link" width={20} height={20} />
                    </div>
                </div>
                <input type="file" accept="image/*" name='image' className="rounded-[1rem] bg-sky-200/10 border border-sky-500/40 py-2 px-4 w-full outline-none" />

                <button type="submit" className="w-full bg-sky-600 hover:bg-sky-700 duration-300 text-white rounded-2xl py-3 text-xl font-semibold select-none capitalize mt-4">
                    databasega yozish
                </button>
            </form>
        </div>
    )
}

export default SliderPost
