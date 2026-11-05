export const mockUsers = [
    { id: 1, name: 'Ali Valiyev', email: 'ali@mail.uz', role: 'admin', status: 'active' },
    { id: 2, name: 'Sara Karimova', email: 'sara@mail.uz', role: 'user', status: 'active' },
    { id: 3, name: 'John Smith', email: 'john@mail.com', role: 'user', status: 'inactive' },
    { id: 4, name: 'Maria Ivanova', email: 'maria@mail.ru', role: 'moderator', status: 'active' },
];

export const mockComplaints = [
    { id: 1, subject: 'Yetkazib berish kechikdi', from: 'ali@mail.uz', date: '2026-07-25', priority: 'high', status: 'pending' },
    { id: 2, subject: 'Noto\'g\'ri mahsulot', from: 'sara@mail.uz', date: '2026-07-24', priority: 'medium', status: 'inProgress' },
    { id: 3, subject: 'To\'lov muammosi', from: 'john@mail.com', date: '2026-07-23', priority: 'low', status: 'resolved' },
];

export const mockReactions = [
    { id: 1, product: 'iPhone 15 Pro', type: 'like', count: 142, user: 'ali@mail.uz' },
    { id: 2, product: 'Samsung Galaxy S24', type: 'dislike', count: 8, user: 'sara@mail.uz' },
    { id: 3, product: 'MacBook Air M3', type: 'like', count: 89, user: 'maria@mail.ru' },
];

export const mockComments = [
    { id: 1, author: 'Ali V.', content: 'Juda yaxshi mahsulot!', product: 'iPhone 15 Pro', status: 'approved' },
    { id: 2, author: 'Sara K.', content: 'Yetkazib berish tez bo\'ldi', product: 'AirPods Pro', status: 'pending' },
    { id: 3, author: 'John S.', content: 'Quality is great', product: 'MacBook Air M3', status: 'approved' },
];

export const mockProducts = [
    { id: 1, title: 'iPhone 15 Pro', price: 12990000, category: 'Phones', stock: 45 },
    { id: 2, title: 'Samsung Galaxy S24', price: 8990000, category: 'Phones', stock: 32 },
    { id: 3, title: 'MacBook Air M3', price: 15990000, category: 'Laptops', stock: 12 },
    { id: 4, title: 'AirPods Pro', price: 2490000, category: 'Audio', stock: 78 },
];

export const mockStock = [
    { id: 1, product: 'iPhone 15 Pro', quantity: 45, minLevel: 10, status: 'inStock' },
    { id: 2, product: 'Samsung Galaxy S24', quantity: 32, minLevel: 10, status: 'inStock' },
    { id: 3, product: 'MacBook Air M3', quantity: 5, minLevel: 10, status: 'lowStock' },
    { id: 4, product: 'AirPods Pro', quantity: 78, minLevel: 15, status: 'inStock' },
];

export const mockOrders = [
    { id: 1001, customer: 'Ali Valiyev', total: 12990000, status: 'delivered', date: '2026-07-26' },
    { id: 1002, customer: 'Sara Karimova', total: 2490000, status: 'processing', date: '2026-07-26' },
    { id: 1003, customer: 'John Smith', total: 8990000, status: 'processing', date: '2026-07-25' },
    { id: 1004, customer: 'Maria Ivanova', total: 15990000, status: 'cancelled', date: '2026-07-24' },
];

export const mockDashboard = {
    revenue: 45280000,
    orders: 1284,
    users: 3420,
    products: 156,
    salesData: [
        { month: 'Jan', sales: 4200 },
        { month: 'Feb', sales: 3800 },
        { month: 'Mar', sales: 5100 },
        { month: 'Apr', sales: 4600 },
        { month: 'May', sales: 6200 },
        { month: 'Jun', sales: 5800 },
        { month: 'Jul', sales: 7100 },
    ],
    topProducts: [
        { name: 'iPhone 15 Pro', sales: 234 },
        { name: 'AirPods Pro', sales: 189 },
        { name: 'MacBook Air M3', sales: 156 },
    ],
};

export function getMockData(path: string) {
    if (path.includes('/users')) return mockUsers;
    if (path.includes('/complaints')) return mockComplaints;
    if (path.includes('/reactions/comments')) return mockComments;
    if (path.includes('/reactions')) return mockReactions;
    if (path.includes('/products')) return mockProducts;
    if (path.includes('/stock')) return mockStock;
    if (path.includes('/orders')) return mockOrders;
    if (path.includes('/dashboard')) return mockDashboard;
    return [];
}
