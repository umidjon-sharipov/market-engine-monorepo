'use client';
import { useApikeyStore } from "@/app/_store/useApikeyStore";
const API_URL = process.env.NEXT_PUBLIC_API_URL

const ProductsDelete = () => {
    const apikey = useApikeyStore(state => state.apikey)
    const handleDelete = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());
        console.log(data);

        if (!data.ID) {
            alert("Iltimos, o'chirmoqchi bo'lgan mahsulot ID sini yozing!");
            return;
        }

        e.currentTarget.reset();

        try {
            const response = await fetch(`${API_URL}/api/products`, {
                method: 'DELETE',
                headers: {
                    'api-key': apikey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ID: data.ID }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete product');
            }

            const result = await response.json();
            console.log(result);
            alert(`Muvaffaqiyatli: ${result.message}`);
        } catch (error: any) {
            console.error('Error deleting product:', error);
            alert("Xatolik: " + error.message);
        }
    }

    return (
        <div className="space-y-6">
            <div className="space-y-1.5">
                <h1 className="text-4xl font-extrabold tracking-tight dark:text-white text-neutral-900">DELETE Request</h1>
            </div>

            <form className="flex gap-4 flex-col" onSubmit={handleDelete}>
                <input type="number" name='ID' className="rounded-[1rem] bg-sky-200/10 border border-rose-500/40 py-2 px-4 w-full outline-none" placeholder="o'chirilayotgan mahsulot ID sini yozing..." />
                <button type="submit" className="f-full bg-rose-700/80 hover:bg-rose-600/40 duration-300 text-white rounded-2xl py-2 text-2xl font-semibold select-none capitalize">database dan o'chirish</button>
            </form>
        </div>
    );
}

export default ProductsDelete