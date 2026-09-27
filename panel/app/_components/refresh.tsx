import { API_URL } from "@/lib/api"
import { useTokenStore } from "../_store/useTokenStore"

export const refreshToken = async () => {
    try {
        const store = useTokenStore.getState();
        
        const activeAccount = store.accounts.find(acc => acc.email === store.activeEmail);
        const currentRefreshToken = activeAccount?.refreshToken;

        if (!currentRefreshToken) {
            console.log('Refresh token topilmadi');
            return;
        }
        console.log(`Token eskirdi va backend dan olib kelinmoqda eski token ${currentRefreshToken}`)
        const req = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken: currentRefreshToken })
        });

        const data = await req.json();
        console.log(`So'rov yakunlandi backend bergan token ${data.accessToken}`)

        if (req.ok && activeAccount) {
            store.addOrUpdateAccount({
                email: activeAccount.email,
                userName: activeAccount.userName,
                image: activeAccount.image,
                accessToken: data.accessToken,
                refreshToken: data.refreshToken
            });
            return data.accessToken;
        } else if (req.status === 401 && store.activeEmail) {
            store.removeAccount(store.activeEmail);
        }
    } catch (err) {
        console.log('Refresh token xatoligi:', err);
    }
}