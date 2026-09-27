'use client'
import React, { useState, useEffect, useRef } from 'react'
import { StyleSheet, Text, View, ScrollView, Pressable, Animated, Platform, UIManager } from 'react-native'
import ScreenWrapper from 'app/components/layout/ScreenWrapper'
import { useLanStorage } from 'app/store/useLanStore'
import { useNativeAnimDriver } from 'app/utils/animation';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQ_DATA = [
    {
        id: "registration",
        category: {
            uz: "Ro’yxatdan o’tish",
            en: "Registration",
            ru: "Регистрация"
        },
        items: [
            {
                id: "reg_intro",
                q: {
                    uz: "Text",
                    en: "Text",
                    ru: "Text",
                },
                a: {
                    uz: "Buyurtmani rasmiylashtirib to’lovni bajarish uchun siz ro'yxatdan o’tishingiz kerak bo'ladi. Uning yordamida ma'lumotlarni doimiy ravishda to'ldirishingiz shart bo’lmaydi. Ro'yxatdan o'tish vaqti 3 daqiqadan oshmaydi.",
                    en: "In order to place an order and complete the payment, you will need to register. This prevents you from having to repeatedly fill in your details. Registration takes no more than 3 minutes.",
                    ru: "Для оформления заказа и выполнения оплаты вам необходимо зарегистрироваться. Благодаря этому вам не придется постоянно заполнять свои данные. Время регистрации не превышает 3 минут."
                }
            },
            {
                id: "reg_app",
                q: {
                    uz: "Qanday qilib ilovada ro’yxatdan o’tish mumkin?",
                    en: "How to register in the app?",
                    ru: "Как зарегистрироваться в приложении?"
                },
                a: {
                    uz: "Uzum Market ilovasini yuklab oling:\n- App Storeda: https://clck.ru/367gQC;\arketda: https://clck.ru/367gTRa kirib «Kirish» tugmasini bosing va telefon raqamingizni kiriting, «Kodni qabul qilish» tugmasini bosing. Sizga 4 xonali tasdiqlash kodi keladi, kodni kiritasiz va o’z shaxsiy kabinetingizga kirasiz.\n\nSo’ng, ekranni yuqori o’ng qismidagi sozlama tugmasini ⚙️ bosasiz va ushbu ma’lumotlarni kiritasiz:\n- Familiya, ism, sharif;\n- Telefon raqami;\n- Elektron pochta manzili(agar istasangiz);\n- Tug’ilgan sana;\n- Jinsingizni kiritib «Saqlash» tugmasini bosasiz.\n\nShaxsiy kabinetdan chiqib ketish uchun, kabinet past qismida joylashgan «Chiqish» tugmasini bosasiz.",
                    en: "Download the Uzum Market app:\n- On App Store: https://clck.ru/367gQC;\nOpen the app, tap 'Log In', enter your phone number, and tap 'Receive Code'. You will receive a 4-digit confirmation code. Enter the code to access your personal account.\n\nThen, tap the settings icon ⚙️ in the top right corner of the screen and enter the following information:\n- Last name, first name, middle name;\n- Phone number;\n- Email address (optional);\n- Date of birth;\n- Select your gender and tap 'Save'.\n\nTo log out of your personal account, tap the 'Log Out' button located at the bottom of the profile.",
                    ru: "Скачайте приложение Uzum Market:\n- В App Store: https://clck.ru/367gQC;\nВойдите в приложение, нажмите кнопку «Войти», введите свой номер телефона и нажмите «Получить код». Вам придет 4-значный код подтверждения, введите его и войдите в свой личный кабинет.\n\nЗатем нажмите кнопку настроек ⚙️ в правом верхнем углу экрана и укажите следующие данные:\n- Фамилия, имя, отчество;\n- Номер телефона;\n- Адрес электронной почты (по желанию);\n- Дата рождения;\n- Укажите пол и нажмите кнопку «Сохранить».\n\nЧтобы выйти из личного кабинета, нажмите кнопку «Выйти» в нижней части кабинета."
                }
            },
            {
                id: "reg_web",
                q: {
                    uz: "Qanday qilib saytda ro’yxatdan o’tish mumkin?",
                    en: "How to register on the website?",
                    ru: "Как зарегистрироваться на сайте?"
                },
                a: {
                    uz: "Bizning uzum.uz sahifamizga kirib «Kirish» tugmasini bosing, bu ekranning o’ng taraf yuqori qismda bo’ladi. Telefon raqamingizni kiriting, «Kodni qabul qilish» tugmasini bosing. Sizga 4 xonali tasdiqlash kodi keladi, kodni kiritasiz va o’z shaxsiy kabinetingizga kirasiz.\n\nSo’ng, ekranni yuqori chap qismida sozlama tugmasini ⚙️ bosasiz va ushbu ma’lumotlarni kiritasiz:\n- Familiya, ism, sharif;\n- Telefon raqami;\n- Elektron pochta manzili(agar istasangiz);\n- Tug’ilgan sana;\n- Jinsingizni kiritib «Saqlash» tugmasini bosasiz.\n\nShaxsiy kabinetdan chiqib ketish uchun, o’ng qismda joylashgan ismingiz ustiga bosasiz va «Sozlamalar» qismiga kirib «Tizimdan chiqib ketish» tugmasini bosasiz.",
                    en: "Go to our website uzum.uz and click the 'Log In' button located in the upper right corner of the screen. Enter your phone number and click 'Receive Code'. You will receive a 4-digit confirmation code. Enter the code to log into your personal account.\n\nThen, click the settings icon ⚙️ in the upper left section of the screen and enter the following details:\n- Last name, first name, middle name;\n- Phone number;\n- Email address (optional);\n- Date of birth;\n- Select your gender and click 'Save'.\n\nTo log out of your personal account, click on your name in the right section, go to 'Settings', and click 'Log Out'.",
                    ru: "Перейдите на наш сайт uzum.uz и нажмите кнопку «Войти» в правом верхнем углу экрана. Введите свой номер телефона, нажмите «Получить код». Вам придет 4-значный код подтверждения, введите код и войдите в свой личный кабинет.\n\nЗатем нажмите кнопку настроек ⚙️ в верхней левой части экрана и введите следующие данные:\n- Фамилия, имя, отчество;\n- Номер телефона;\n- Адрес электронной почты (по желанию);\n- Дата рождения;\n- Укажите пол и нажмите кнопку «Сохранить».\n\nЧтобы выйти из личного кабинета, нажмите на свое имя в правой части, перейдите в раздел «Настройки» и нажмите кнопку «Выйти из системы»."
                }
            },
            {
                id: "uzum_id_what",
                q: {
                    uz: "Uzum ID nima?",
                    en: "What is Uzum ID?",
                    ru: "Что такое Uzum ID?"
                },
                a: {
                    uz: "Bu Uzum xizmatlariga kirish uchun yagona avtorizatsiya xizmatidir.",
                    en: "This is a single authorization service for accessing Uzum services.",
                    ru: "Это единый сервис авторизации для доступа к сервисам Uzum."
                }
            },
            {
                id: "uzum_id_check",
                q: {
                    uz: "Menda Uzum ID bormi?",
                    en: "Do I have an Uzum ID?",
                    ru: "Есть ли у меня Uzum ID?"
                },
                a: {
                    uz: "Agar siz Uzum Market, Uzum Bank yoki Uzum Tezkordan foydalangan bo‘lsangiz - demak, sizda Uzum ID mavjud, qo‘shimcha hech narsa rasmiylashtirish yoki yaratishning hojati yo‘q.",
                    en: "If you have used Uzum Market, Uzum Bank, or Uzum Tezkor, it means you already have an Uzum ID. There is no need to register or create anything extra.",
                    ru: "Если вы пользовались Uzum Market, Uzum Bank или Uzum Tezkor — значит, у вас уже есть Uzum ID, ничего дополнительно оформлять или создавать не нужно."
                }
            },
            {
                id: "uzum_id_login",
                q: {
                    uz: "Uzum ID yordamida qanday kirish mumkin?",
                    en: "How to log in using Uzum ID?",
                    ru: "Как войти с помощью Uzum ID?"
                },
                a: {
                    uz: "Buning uchun Uzum Market, Uzum Bank yoki Uzum Tezkor ilovalarini ishga tushirish, telefon raqamini kiritish va SMS orqali kirishni tasdiqlash kifoya.",
                    en: "To do this, simply launch the Uzum Market, Uzum Bank, or Uzum Tezkor apps, enter your phone number, and confirm the login via SMS.",
                    ru: "Для этого достаточно запустить приложения Uzum Market, Uzum Bank или Uzum Tezkor, ввести номер телефона и подтвердить вход по SMS."
                }
            },
            {
                id: "uzum_id_secure",
                q: {
                    uz: "Uzum ID bilan kirish xavfsizmi?",
                    en: "Is it safe to log in with Uzum ID?",
                    ru: "Безопасно ли входить через Uzum ID?"
                },
                a: {
                    uz: "Ha, Uzum IDdagi ma’lumotlaringiz ishonchli himoyalangan — biz zamonaviy shifrlash usullaridan foydalanamiz va shaxsiy ma’lumotlarni himoya qilish bo‘yicha qonunchilikning barcha talablariga rioya qilamiz.",
                    en: "Yes, your information in Uzum ID is securely protected — we use modern encryption methods and comply with all regulatory requirements for personal data protection.",
                    ru: "Да, ваши данные в Uzum ID надежно защищены — мы используем современные методы шифрования и соблюдаем все требования законодательства по защите персональных данных."
                }
            }
        ]
    },
    {
        id: "checkout",
        category: {
            uz: "Buyurtmani rasmiylashtirish",
            en: "Checkout",
            ru: "Оформление заказа"
        },
        items: [
            {
                id: "how_to_order",
                q: {
                    uz: "Qanday buyurtma beriladi?",
                    en: "How to place an order?",
                    ru: "Как сделать заказ?"
                },
                a: {
                    uz: "Savatga mahsulotlarni qoʻshing.\nMahsulot soni va xususiyatlarini tekshiring: masalan, hajmi va rangi.\n«Rasmiylashtirish» tugmasini bosing.\nBuyurtmani rasmiylashtirish boʻlimida yetkazib berish usulini koʻrsating - mahsulot tarqatish punktiga yoki kuryer orqali.\nBuyurtma beruvchining ma’lumotlarini kiriting va tekshiring. Nima uchun bu muhim: sizning telefoningizga buyurtma berish kodi keladi. Ma’lumotda ko’rsatilgan ism va familiya - pasportdagi bilan bir xil bo’lishi kerak. Agar siz promokod qo’llagan holda va buyurtmangiz ichida 18+ kategoriya mahsulot bo’lsa, siz ko’rsatgan ma’lumotlar pasport ma’lumoti bilan solishtiriladi.\nAgar promokodingiz bo’lsa, uni qo’llang, faol promokodlarni bizning rasmiy sahifalarimiz va https://uzum.uz/uz da, SMS va PUSH-xabarnomalarida kuzatib boring.\n\nSizga qulay bo’lgan:\n- Onlayn to’lov;\n- Uzum Nasiya muddatli to’lov;\n- Qabul qilish vaqtida Uzcard, Humo, Visa, Mastercard kartalari va naqd pul asosida to’lov turini tanlang.\n\nAgar siz keyinroq to’lashga qaror qilsangiz, buyurtma yana 30 daqiqa ichida zaxirada boʻladi.\n\nElektron xarid cheki:\n- onlayn to'lovni amalga oshirayotganda elektron xarid cheki ilovada buyurtma raqami ostida buyurtma olingandan keyin mavjud bo'ladi;\n- buyurtma muddatli to’lovga olinganda elektron xarid cheki ilovada buyurtma raqami ostida buyurtma olingandan va shartnoma faollashgandan keyin mavjud bo'ladi;\n- FastPay/QR-pass orqali to'lashda elektron xarid cheki ilovada buyurtma raqami ostida buyurtma olingandan keyin mavjud bo'ladi;\n- buyurtma to’lovi qabul qilingandan keyin amalga oshirilsa, ilovada elektron xarid cheki ko'rsatilmaydi, chunki qog'oz cheki joyida beriladi.",
                    en: "Add products to your cart.\nCheck the quantity and features of the products: for example, size and color.\nClick the 'Checkout' button.\nIn the checkout section, specify the delivery method - to a pickup point or via courier.\nEnter and verify the buyer's details. Why this matters: an order code will be sent to your phone. The first and last name provided must match your passport. If you applied a promo code and your order contains an 18+ category item, the information you provided will be matched against passport data.\nIf you have a promo code, apply it. You can follow active promo codes on our official pages, at https://uzum.uz/uz, and via SMS and PUSH notifications.\n\nChoose a payment method convenient for you:\n- Online payment;\n- Uzum Nasiya installment payment;\n- Payment upon receipt via Uzcard, Humo, Visa, Mastercard, or cash.\n\nIf you decide to pay later, the order will remain reserved for another 30 minutes.\n\nElectronic receipt:\n- When making an online payment, the electronic receipt will be available in the app under the order number after the order is received;\n- When purchased via installment, the electronic receipt will be available under the order number after receipt and contract activation;\n- When paying via FastPay/QR-pass, the electronic receipt will be available under the order number after the order is received;\n- If payment is made upon receipt, the electronic receipt will not be shown in the app, as a paper receipt is issued on the spot.",
                    ru: "Добавьте товары в корзину.\nПроверьте количество и характеристики товаров: например, размер и цвет.\nНажмите кнопку «Оформить».\nВ разделе оформления заказа укажите способ доставки — в пункт выдачи или курьером.\nВведите и проверьте данные получателя. Почему это важно: на ваш телефон придет код заказа. Имя и фамилия, указанные в данных, должны совпадать с паспортными. Если вы применили промокод и в вашем заказе есть товар категории 18+, указанные вами данные будут сверяться с паспортными данными.\nЕсли у вас есть промокод, примените его. Вы можете следить за активными промокодами на наших официальных страницах, на сайте https://uzum.uz/uz, а также в SMS и PUSH-уведомлениях.\n\nВыберите удобный для вас способ оплаты:\n- Онлайн-оплата;\n- Рассрочка Uzum Nasiya;\n- Оплата при получении картами Uzcard, Humo, Visa, Mastercard или наличными.\n\nЕсли вы решите оплатить позже, заказ будет оставаться в резерве еще 30 минут.\n\nЭлектронный чек:\n- При онлайн-оплате электронный чек будет доступен в приложении под номером заказа после получения заказа;\n- При покупке в рассрочку электронный чек будет доступен под номером заказа после получения товара и активации договора;\n- При оплате через FastPay/QR-pass электронный чек будет доступен под номером заказа после получения заказа;\n- Если оплата производится при получении, электронный чек в приложении не отображается, так как бумажный чек выдается на месте."
                }
            },
            {
                id: "stock_and_promo",
                q: {
                    uz: "Buyurtma va promokod zaxirasi qanday ishlaydi?",
                    en: "How does order and promo code reservation work?",
                    ru: "Как работает резервирование заказа и промокода?"
                },
                a: {
                    uz: "Agar siz buyurtmani rasmiylashtirib onlayn to’lov yoki muddatli to’lov turini tanlagan bo’lsangiz, ammo to’lov bajarilmagan bo’lsa, buyurtmangiz 30 daqiqaga ichida bekor qilinadi. Bu vaqtda tanlangan mahsulotlar va kiritilgan promokod boshqa qo’llanish uchun mavjud boʻlmaydi.\n\n«Mening buyurtmalarim» boʻlimida siz to’lovni yakunlashingiz yoki buyurtmani bekor qilishingiz mumkin. Buyurtmani bekor qilganingizda, savatga solingan mahsulotlar va promokod qayta tiklanadi.",
                    en: "If you have placed an order and selected online payment or installment plan, but the payment is not completed, your order will be canceled within 30 minutes. During this time, the selected items and the entered promo code will not be available for other uses.\n\nIn the 'My Orders' section, you can complete the payment or cancel the order. When you cancel the order, the items placed in the cart and the promo code will be restored.",
                    ru: "Если вы оформили заказ и выбрали способ онлайн-оплаты или рассрочки, но оплата не была произведена, ваш заказ будет отменен в течение 30 минут. В течение этого времени выбранные товары и введенный промокод будут недоступны для другого использования.\n\nВ разделе «Мои заказы» вы можете завершить оплату или отменить заказ. При отмене заказа товары, добавленные в корзину, и промокод восстанавливаются."
                }
            },
            {
                id: "edit_order",
                q: {
                    uz: "Rasmiylashtirilgan buyurtmaga mahsulotni qanday qoʻshish yoki olib tashlash mumkin?",
                    en: "How to add or remove an item from an already placed order?",
                    ru: "Как добавить или удалить товар из оформленного заказа?"
                },
                a: {
                    uz: "Biz buyurtmalarni juda tez yig’amiz va jo’natamiz — buyurtmani rasmiylashtirish va yig’ish o’rtasida bir necha daqiqa vaqt bo’ladi. Shuning uchun biz berilgan va to’langan buyurtmadan texnik jihatdan mahsulotni qo’sha yoki olib tashlay olmaymiz.\n\nAgar siz buyurtmaga qo’shimcha mahsulotlarni qo’shishni istasangiz, ularni alohida qilib buyurtma bering va birinchi berilgan buyurtma bilan olib keting. Agar siz ayrim mahsulotlarni bekor qilmoqchi bo’lsangiz, buyurtma olib ketish vaqtida ulardan voz kechishingiz mumkin.",
                    en: "We assemble and ship orders very quickly — there are only a few minutes between order placement and assembly. Therefore, we technically cannot add or remove an item from a placed and paid order.\n\nIf you want to add additional items to the order, please order them separately and collect them together with the first order. If you want to cancel certain items, you can reject them at the time of order pickup.",
                    ru: "Мы собираем и отправляем заказы очень быстро — между оформлением и сборкой проходит всего несколько минут. Поэтому технически мы не можем добавить или удалить товар из оформленного и оплаченного заказа.\n\nЕсли вы хотите добавить дополнительные товары к заказу, оформите их отдельным заказом и заберите вместе с первым. Если вы хотите отказаться от некоторых товаров, вы можете отказаться от них во время получения заказа."
                }
            },
            {
                id: "storage_time",
                q: {
                    uz: "Buyurtma qancha muddat saqlanadi?",
                    en: "How long is the order stored?",
                    ru: "Сколько времени хранится заказ?"
                },
                a: {
                    uz: "Buyurtma Uzum Market tarqatish punktiga kelib tushgan kundan boshlab 8 kun saqlanadi. Agar buyurtmani olib ketishga ulgurmayotgan bo’lsangiz, biz bilan Telegramda @Uzum_Support_Bot orqali murojaat qiling. Saqlash muddatini uzaytirib berishimiz mumkun*.\n\n*O‘zbekiston pochtasi bo‘limlaridagi tarqatish punktlarida buyurtma 8 kundan ortiq saqlanmaydi. Ushbu muddatni uzaytirish imkoniyati yo’q.",
                    en: "The order is stored for 8 days from the day it arrives at the Uzum Market pickup point. If you do not have time to pick up your order, contact us on Telegram via @Uzum_Support_Bot. We may extend the storage period*.\n\n*In pickup points located at 'O'zbekiston pochtasi' branches, orders are stored for no more than 8 days. It is not possible to extend this period.",
                    ru: "Заказ хранится в течение 8 дней со дня его поступления в пункт выдачи Uzum Market. Если вы не успеваете забрать заказ, свяжитесь с нами в Telegram через @Uzum_Support_Bot. Мы можем продлить срок хранения*.\n\n*В пунктах выдачи в отделениях Почты Узбекистана заказ хранится не более 8 дней. Возможность продления этого срока отсутствует."
                }
            },
            {
                id: "cancel_order",
                q: {
                    uz: "Rasmiylashtirilgan buyurtmani qanday bekor qilish mumkin?",
                    en: "How to cancel a placed order?",
                    ru: "Как отменить оформленный заказ?"
                },
                a: {
                    uz: "Biz buyurtmalar juda tez yig'amiz va jo'natamiz, shuning uchun siz tizimda buyurtma berilgan paytdan boshlab uni faqat 5 daqiqa ichida bekor qilishingiz mumkin. 5 daqiqadan so'ng, biz buyurtma berish joyiga yoki belgilangan shaharga yetib kelganidan keyingina bekor qilib bera olamiz.\n\nBuyurtmani bekor qilish imkoniyatini aniqlash uchun biz bilan Telegramda @Uzum_Support_Bot orqali murojaat qiling.",
                    en: "We assemble and ship orders very quickly, so you can only cancel it within 5 minutes from the moment the order is placed in the system. After 5 minutes, we can only cancel it after it arrives at the pickup location or the designated city.\n\nTo determine the possibility of canceling an order, please contact us on Telegram via @Uzum_Support_Bot.",
                    ru: "Мы собираем и отправляем заказы очень быстро, поэтому вы можете отменить его в системе только в течение 5 минут с момента оформления. По истечении 5 минут мы сможем отменить его только после того, как он прибудет в пункт выдачи или указанный город.\n\nДля уточнения возможности отмены заказа свяжитесь с нами в Telegram через @Uzum_Support_Bot."
                }
            }
        ]
    },
    {
        id: "delivery",
        category: {
            uz: "Yetkazib berish",
            en: "Delivery",
            ru: "Доставка"
        },
        items: [
            {
                id: "delivery_methods",
                q: {
                    uz: "Yetkazib berishning qanday usullari mavjud?",
                    en: "What delivery methods are available?",
                    ru: "Какие способы доставки доступны?"
                },
                a: {
                    uz: "Buyurtma tarqatish punktigacha yetkazib berish: Uzum Market buyurtma tarqatish punktiga yetkazib berish narxi buyurtma rasmiylashtirish paytida ko'rsatiladi. Shuningdek buyurtmani rasmiylashtirish jarayonida aks ettirilgan kerakli miqdorga buyurtma bersangiz, yetkazib berish bepul bo'ladi.\n\nKuryer orqali yetkazib berish: kuryer orqali yetkazib berish narxi 30 000 so'm. Ammo, savatda ko‘rsatilgan summaga buyurtma bersangiz, bizning buyurtma tarqatish punkti mavjud bo'lgan shaharning istalgan burchagiga yetkazib berish bepul.",
                    en: "Delivery to a pickup point: The cost of delivery to the Uzum Market pickup point is displayed during checkout. Also, if you place an order for the required amount reflected during the checkout process, delivery will be free.\n\nCourier delivery: The cost of courier delivery is 30,000 UZS. However, if you place an order for the amount indicated in the cart, delivery is free to any corner of the city where our pickup point is available.",
                    ru: "Доставка до пункта выдачи: Стоимость доставки в пункт выдачи Uzum Market отображается во время оформления заказа. Также, если вы сделаете заказ на необходимую сумму, указанную в процессе оформления, доставка будет бесплатной.\n\nКурьерская доставка: Стоимость курьерской доставки составляет 30 000 сумов. Однако, если вы сделаете заказ на сумму, указанную в корзине, доставка будет бесплатной в любую точку города, где есть наш пункт выдачи товаров."
                }
            },
            {
                id: "delivery_time",
                q: {
                    uz: "Buyurtma qachon yetkazib beriladi?",
                    en: "When will the order be delivered?",
                    ru: "Когда будет доставлен заказ?"
                },
                a: {
                    uz: "Mahsulot tarqatish punktlari - buyurtmani yetkazib berish sanasi to'lov bosqichida va buyurtmaning profilida ko'rsatiladi.*\n*Katta hajmdagi mahsulotlar faqat Uzum Marketning o'z tarqatish punktlariga yoki kuryer orqali uyga yetkazib berilishi mumkin. Pochta va supermarketlardagi hamkor tarqatish punktlariga bunday mahsulotlar yetkazib berilmaydi.\n\nKuryerlar buyurtmalarni 10:00 dan 22:00 ga qadar tarqatishadi. Buyurtma rasmiylashtirish vaqtida mavjud bo’lgan yetkazib berish oraliq vaqti ko’rsatiladi.\n\nAgar kuryer yetkazib berishni amalga oshirayotganda, siz o'zingizning shahringiz tashqarisidagi manzilni ko'rsatgan bo’lsangiz, biz shahar ichidagi yangi manzilni aniqlashtirish uchun siz bilan bog'lanamiz.*",
                    en: "Pickup points - the delivery date of the order is displayed at the payment stage and in the order profile.*\n*Large items can only be delivered to Uzum Market's own pickup points or to the home via courier. Such products are not delivered to partner pickup points in post offices and supermarkets.\n\nCouriers distribute orders from 10:00 AM to 10:00 PM. The available delivery time window during checkout is displayed.\n\nIf the courier is making a delivery and you specified an address outside your city, we will contact you to clarify a new address inside the city.*",
                    ru: "Пункты выдачи товаров — дата доставки заказа отображается на этапе оплаты и в профиле заказа.*\n*Крупногабаритные товары могут быть доставлены только в собственные пункты выдачи Uzum Market или на дом курьером. В партнерские пункты выдачи на почте и в супермаркетах такие товары не доставляются.\n\nКурьеры доставляют заказы с 10:00 до 22:00. Отображается интервал времени доставки, доступный при оформлении заказа.\n\nЕсли при осуществлении доставки курьером вы указали адрес за пределами вашего города, мы свяжемся с вами для уточнения нового адреса в черте города.*"
                }
            },
            {
                id: "change_pvz",
                q: {
                    uz: "Belgilangan mahsulot tarqatish punktini qanday o’zgartirish mumkin?",
                    en: "How to change the designated pickup point?",
                    ru: "Как изменить назначенный пункт выдачи товаров?"
                },
                a: {
                    uz: "Biz buyurtmalarni juda tez yigʻamiz va joʻnatamiz, shuning uchun buyurtma berilgan vaqtdan boshlab 5 daqiqa ichida yetkazib berish punktining manzilini oʻzgartirish mumkin. Buning uchun biz bilan Telegramda @Uzum_Support_Bot orqali murojaat qiling. Darhol buyurtma raqami va buyurtmani olish uchun qulay bo’lgan yetkazib berish punktining manzilini ayting — biz uni u yerga yoʻnaltiramiz.\n\nAgar 5 daqiqa ichida ulgurmagan bo’lsangiz, kerakli yetkazib berish punktiga yangi buyurtma qiling va eskisini Telegramda @Uzum_Support_Bot orqali bekor qiling.",
                    en: "We assemble and ship orders very quickly, so it is possible to change the delivery point address within 5 minutes from the time the order is placed. To do this, please contact us on Telegram via @Uzum_Support_Bot. Provide the order number and the convenient pickup point address immediately — we will redirect it there.\n\nIf you did not manage to do this within 5 minutes, place a new order to the desired pickup point and cancel the old one on Telegram via @Uzum_Support_Bot.",
                    ru: "Мы собираем и отправляем заказы очень быстро, поэтому изменить адрес пункта выдачи можно в течение 5 минут с момента оформления заказа. Для этого обратитесь к нам в Telegram через @Uzum_Support_Bot. Сразу сообщите номер заказа и адрес удобного пункта выдачи — мы перенаправим его туда.\n\nЕсли вы не успели в течение 5 минут, сделайте новый заказ в нужный пункт выдачи, а старый отмените в Telegram через @Uzum_Support_Bot."
                }
            },
            {
                id: "change_courier_date",
                q: {
                    uz: "Kuryer orqali yetkazib berish sanasini qanday o'zgartirish mumkin?",
                    en: "How to change the courier delivery date?",
                    ru: "Как изменить дату курьерской доставки?"
                },
                a: {
                    uz: "Yetkazib berish kuni ertalab soat 9:00 gacha biz bilan bog'laning va biz kuryer buyurtmani olib keladigan manzilni o'zgartirish imkoniyatini ko’rev chiqamiz. Agar siz ertalab soat 9:00 dan keyin murojaat qilsangiz, yangi manzilga yetkazib berish ertasi kuni amalga oshiriladi. Ikkala holatda ham biz bilan Telegramda @Uzum_Support_Bot orqali bog’laning.",
                    en: "Contact us by 9:00 AM on the day of delivery, and we will review the possibility of changing the address where the courier will bring the order. If you contact us after 9:00 AM, delivery to the new address will be made the next day. In both cases, please contact us on Telegram via @Uzum_Support_Bot.",
                    ru: "Свяжитесь с нами до 9:00 утра в день доставки, и мы рассмотрим возможность изменения адреса, по которому курьер привезет заказ. Если вы обратитесь после 9:00 утра, доставка по向 новому адресу будет осуществлена на следующий день. В обоих случаях свяжитесь с нами в Telegram через @Uzum_Support_Bot."
                }
            },
            {
                id: "delay_courier",
                q: {
                    uz: "Kuryerlik yetkazib berish sanasini qanday o'zgartirish mumkin?",
                    en: "How to postpone the courier delivery date?",
                    ru: "Как перенести дату курьерской доставки?"
                },
                a: {
                    uz: "Biz uni bir necha kun keyinga ko'chirishimiz mumkin. Buning uchun biz bilan Telegramda @Uzum_Support_Bot orqali bog’laning.",
                    en: "We can move it a few days later. To do this, please contact us on Telegram via @Uzum_Support_Bot.",
                    ru: "Мы можем перенести ее на несколько дней позже. Для этого свяжитесь с нами в Telegram через @Uzum_Support_Bot."
                }
            },
            {
                id: "change_courier_phone",
                q: {
                    uz: "Kuryer orqali yetkazib berish uchun ko'rsatilgan telefon raqamini qanday o'zgartirish mumkin?",
                    en: "How to change the phone number specified for courier delivery?",
                    ru: "Как изменить номер телефона, указанный для курьерской доставки?"
                },
                a: {
                    uz: "Telegramda @Uzum_Support_Bot orqali bog'laning va kuryer yetkazib berishni muvofiqlashtirishi mumkin bo'lgan joriy raqamingizni ayting.",
                    en: "Contact us on Telegram via @Uzum_Support_Bot and provide your current number that the courier can use to coordinate the delivery.",
                    ru: "Свяжитесь с нами в Telegram через @Uzum_Support_Bot и сообщите свой актуальный номер, по которому курьер сможет скоординировать доставку."
                }
            }
        ]
    },
    {
        id: "payment",
        category: {
            uz: "To’lov xizmatlari",
            en: "Payment Methods",
            ru: "Способы оплаты"
        },
        items: [
            {
                id: "payment_intro",
                q: {
                    uz: "Text",
                    en: "Text",
                    ru: "Text",
                },
                a: {
                    uz: "Sizga qulay bo’lgan to’lov uslubini tanlashingiz mumkin:\n- Uzcard, Humo kartalaridan buyurtma uchun onlayn to’lov bajaring;\n- Uzum Nasiya muddatli to’lovi orqali buyurtma rasmiylashtiring;\n- qabul qilish vaqtida Uzcard, Humo, Visa, Mastercard kartalari va naqd pul asosida to’lovni amalga oshiring.",
                    en: "You can choose a convenient payment method:\n- Make an online payment for the order using Uzcard or Humo cards;\n- Place an order through Uzum Nasiya installment plan;\n- Pay upon receipt using Uzcard, Humo, Visa, Mastercard, or cash.",
                    ru: "Вы можете выбрать удобный для вас способ оплаты:\n- Оплатите заказ онлайн с помощью карт Uzcard, Humo;\n- Оформите заказ в рассрочку через Uzum Nasiya;\n- Оплатите при получении картами Uzcard, Humo, Visa, Mastercard или наличными."
                }
            },
            {
                id: "online_payment",
                q: {
                    uz: "Onlayn-to’lov qanday amalga oshiriladi?",
                    en: "How is online payment carried out?",
                    ru: "Как осуществляется онлайн-оплата?"
                },
                a: {
                    uz: "Siz buyurtma uchun to’lovni Uzcard, Humo kartalari orqali bajarishingiz mumkin.\n\nOnlayn to’lov vaqtida siz to’lov chekini ilova shaxsiy kabinet «Mening buyurtmalarim» bo’limida «Elektron chek» tugmasini bosib olishingiz mumkin.",
                    en: "You can pay for the order using Uzcard and Humo cards.\n\nDuring online payment, you can get your payment receipt by clicking the 'Electronic Receipt' button in the 'My Orders' section of the app's personal account.",
                    ru: "Вы можете оплатить заказ с помощью карт Uzcard, Humo.\n\nПри онлайн-оплате вы можете получить чек, нажав кнопку «Электронный чек» в разделе «Мои заказы» в личном кабинете приложения."
                }
            },
            {
                id: "receive_payment",
                q: {
                    uz: "Mahsulotni qabul qilganda to’lov uslubi qanday?",
                    en: "What is the payment method upon product receipt?",
                    ru: "Каков способ оплаты при получении товара?"
                },
                a: {
                    uz: "Buyurtmani naqd pul yoki Uzcard, Humo, MasterCard va Visa orqali qabul qilish jarayonida to'lashingiz mumkin.\n\nElektron xarid cheki faqat quyidagi usullar orqali to'langan buyurtmalar uchun olinganidan keyingina ko'rsatiladi:\n- FastPay/QR-pass orqali to’langanda;\n- naqd pul yoki Humo kartasi orqali to’langanda.\n\nUzcard, Visa, Mastercard kartalari bilan to'lashda xarid cheklari buyurtma olingandan so'ng darhol beriladi. Elektron chek ko'rsatilmaydi.",
                    en: "You can pay for the order in cash or via Uzcard, Humo, MasterCard, and Visa during the receipt process.\n\nThe electronic purchase receipt is displayed after receipt only for orders paid through the following methods:\n- When paid via FastPay/QR-pass;\n- When paid via cash or Humo card.\n\nWhen paying with Uzcard, Visa, or Mastercard, purchase receipts are issued immediately after the order is received. The electronic receipt is not shown.",
                    ru: "Вы можете оплатить заказ наличными или картами Uzcard, Humo, MasterCard и Visa в процессе получения.\n\nЭлектронный товарный чек отображается после получения только для заказов, оплаченных следующими способами:\n- При оплате через FastPay/QR-pass;\n- При оплате наличными или картой Humo.\n\nПри оплате картами Uzcard, Visa, Mastercard товарные чеки выдаются сразу после получения заказа. Электронный чек не отображается."
                }
            }
        ]
    },
    {
        id: "uzum_nasiya",
        category: {
            uz: "Uzum Nasiya muddatli to’lovi",
            en: "Uzum Nasiya",
            ru: "Рассрочка Uzum Nasiya"
        },
        items: [
            {
                id: "nasiya_benefits",
                q: {
                    uz: "Uzum Nasiya muddatli to'lovining afzalliklari nimada?",
                    en: "What are the advantages of Uzum Nasiya installment plan?",
                    ru: "В чем преимущества рассрочки Uzum Nasiya?"
                },
                a: {
                    uz: "- Dastlabki to'lovsiz.\n- Oldindan to'lab yopish imkoniyati mavjud.\n- Qulay to'lov muddatlari: 3, 6, 12 yoki 24 oy.\n- Hamkorimiz Uzum Nasiya tomonidan barcha to'lov muddatlari uchun ishlatilishi mumkin bo'lgan xaridlar uchun miqdor ajratiladi.",
                    en: "- No down payment.\n- Early repayment option is available.\n- Convenient payment periods: 3, 6, 12, or 24 months.\n- An amount is allocated for purchases by our partner Uzum Nasiya, which can be used across all payment terms.",
                    ru: "- Без первоначального взноса.\n- Есть возможность досрочного погашения.\n- Удобные сроки оплаты: 3, 6, 12 или 24 месяца.\n- Нашим партнером Uzum Nasiya выделяется лимит на покупки, который можно использовать для всех сроков оплаты."
                }
            },
            {
                id: "nasiya_limits",
                q: {
                    uz: "Muddatli to'lovga xaridlar uchun qancha miqdor ajratiladi?",
                    en: "How much amount is allocated for installment purchases?",
                    ru: "Какая сумма выделяется на покупки в рассрочку?"
                },
                a: {
                    uz: "- 800 000 so'm, agar pasport yoki ID-karta ma'lumotlarini kiritib, identifikatsiyadan o'tsangiz;\n- 25 000 000 so'mgacha, agar karta raqamini kiritib, ikki yaqin insonning kontaktlarini ko'rsatsangiz.\n\nMuddatli to'lov shartlari:\n- Siz 20 yoshdan 55 yoshgacha bo'lishingiz kerak.\n- Uzum Marketda ro'yxatdan o'tgan telefon raqamingiz va SMS-xabarnomalar uchun karta raqamingizga ulangan telefon raqamingiz bir xil bo'lishi kerak.\n- Buyurtmaning eng kam miqdori 35 000 so'm bo'lishi kerak.\n- 3 oylik muddatli to'lov tanlanganda, bir xarid miqdori 5 000 000 so'mdan oshmasligi kerak.",
                    en: "- 800,000 UZS, if you pass identification by entering passport or ID-card data;\n- Up to 25,000,000 UZS, if you enter a card number and provide contacts of two close people.\n\nInstallment conditions:\n- You must be between 20 and 55 years old.\n- Your phone number registered on Uzum Market and the phone number linked to your card for SMS notifications must be identical.\n- The minimum order amount must be 35,000 UZS.\n- When choosing a 3-month installment, a single purchase amount must not exceed 5,000,000 UZS.",
                    ru: "- 800 000 сумов, если вы пройдете идентификацию, введя данные паспорта или ID-карты;\n- До 25 000 000 сумов, если вы введете номер карты и укажете контакты двух близких людей.\n\nУсловия рассрочки:\n- Ваш возраст должен быть от 20 до 55 лет.\n- Ваш номер телефона, зарегистрированный в Uzum Market, и номер телефона, привязанный к вашей карте для SMS-информирования, должны совпадать.\n- Минимальная сумма заказа должна составлять 35 000 сумов.\n- При выборе 3-месячной рассрочки сумма одной покупки не должна превышать 5 000 000 сумов."
                }
            },
            {
                id: "how_to_nasiya",
                q: {
                    uz: "Muddatli to’lovni qanday rasmiylashtirish kerak?",
                    en: "How to apply for an installment plan?",
                    ru: "Как оформить рассрочку?"
                },
                a: {
                    uz: "Uzum Market ilovasida ro'yxatdan o'ting.\nKerakli mahsulotlarni savatga soling va «Rasmiylashtirish» tugmasini bosing.\nQabul qilish usuli va shaharini tanlang:\n- Buyurtmaning Uzum Market tarqatish punktiga yetkazib berish bepul.\n- Kuryer orqali yetkazib berish 30 000 so'm.\n\nTo'lov usulida kerakli muddatga muddatli to'lovni tanlang: 3, 6, 12 yoki 24 oy va «Anketani to'ldiring» ni bosing.\nAnketada pasport ma'lumotlarini kiritib, selfi orqali shaxsingizni tasdiqlang. Shundan so'ng shartnomani SMS orqali faollashtiring va imzolang.",
                    en: "Register in the Uzum Market app.\nAdd the required items to your cart and click 'Checkout'.\nSelect the receipt method and city:\n- Delivery of the order to the Uzum Market pickup point is free.\n- Courier delivery is 30,000 UZS.\n\nIn the payment method, select the installment plan for the desired period: 3, 6, 12, or 24 months and click 'Fill out the application'.\nEnter your passport details in the application and confirm your identity via selfie. After that, activate and sign the contract via SMS.",
                    ru: "Зарегистрируйтесь в приложении Uzum Market.\nДобавьте нужные товары в корзину и нажмите кнопку «Оформить».\nВыберите способ получения и город:\n- Доставка заказа в пункт выдачи Uzum Market бесплатная.\n- Доставка курьером стоит 30 000 сумов.\n\nВ способе оплаты выберите рассрочку на нужный срок: 3, 6, 12 или 24 месяца и нажмите «Заполнить анкету».\nВведите паспортные данные в анкету и подтвердите свою личность с помощью селфи. После этого активируйте и подпишите договор по SMS."
                }
            }
        ]
    },
    {
        id: "order_receive",
        category: {
            uz: "Buyurtmani qabul qilish",
            en: "Receiving Orders",
            ru: "Получение заказа"
        },
        items: [
            {
                id: "track_order",
                q: {
                    uz: "Buyurtma holatini qanday kuzatishim mumkin?",
                    en: "How can I track my order status?",
                    ru: "Как я могу отследить статус заказа?"
                },
                a: {
                    uz: "Ilovaning «Mening buyurtmalarim» bo’limi «Barchasi» qismida kuzatishingiz mumkin. Bosqichlar:\n- «To'lovni kutmoqda» - to'lov tugallanmagan.\n- «Yig’ilmoqda» - omborda tayyorlanmoqda.\n- «Yetkazilmoqda» - buyurtma yo'lda.\n- «Olib ketish mumkin» - punktga kelgan.\n- «Xaridorga topshirildi»/«Qaytarildi» - jarayon yakunlangan.",
                    en: "You can track it in the 'All' section of the 'My Orders' department in the app. Stages:\n- 'Awaiting payment' - payment is not completed.\n- 'Assembling' - being prepared at the warehouse.\n- 'Delivering' - order is on its way.\n- 'Ready for pickup' - arrived at the point.\n- 'Handed over to buyer' / 'Returned' - process completed.",
                    ru: "Вы можете отслеживать статус в разделе «Все» вкладки «Мои заказы» в приложении. Этапы:\n- «Ожидает оплаты» — оплата не завершена.\n- «Собирается» — готовится на складе.\n- «Доставляется» — заказ в пути.\n- «Можно забрать» — прибыл в пункт выдачи.\n- «Передано покупателю»/«Возвращено» — процесс завершен."
                }
            },
            {
                id: "how_to_receive",
                q: {
                    uz: "Buyurtmani qanday qabul qila olaman?",
                    en: "How can I receive the order?",
                    ru: "Как я могу получить заказ?"
                },
                a: {
                    uz: "1. Ilovada buyurtma qabul qilish kodini tarqatish punkti ma'muriga ko'rsating.\n2. Yoki SMS/Push orqali kelgan 4 xonali kodni ayting.\n\nNima uchun pasport so'raladi: muddatli to'lov bo'lsa, promokod ishlatilgan bo'lsa yoki 18+ tovarlar mavjud bo'lganda.",
                    en: "1. Show the order pickup code in the app to the pickup point administrator.\n2. Or provide the 4-digit code received via SMS/Push.\n\nWhy a passport is requested: in case of an installment plan, if a promo code was used, or if there are 18+ items present.",
                    ru: "1. Покажите код получения заказа в приложении администратору пункта выдачи.\n2. Или назовите 4-значный код, пришедший по SMS/Push.\n\nПочему запрашивают паспорт: при рассрочке, если использован промокод или при наличии товаров категории 18+."
                }
            }
        ]
    },
    {
        id: "products_and_returns",
        category: {
            uz: "Tovar va pulni qaytarish",
            en: "Returns and Refunds",
            ru: "Возврат товара и денег"
        },
        items: [
            {
                id: "cancel_at_pvz",
                q: {
                    uz: "Menga tovarlar to‘g‘ri kelmadi. Ularni topshirish punktida qoldirsam bo‘ladimi?",
                    en: "The items did not fit me. Can I leave them at the pickup point?",
                    ru: "Мне не подошли товары. Могу ли я оставить их в пункте выдачи?"
                },
                a: {
                    uz: "Ha, bo‘ladi. Tovarlarni tekshirib, kiyib ko‘rganingizdan keyin sizga to‘g‘ri kelmasligini tushunsangiz, ularni shunchaki xodimda qoldiring. Sotuvga yaroqli ko‘rinishini va yorliqni saqlab qo‘ying.\n\nQadog‘ini ochib, shikastlab bo‘lmaydigan tovarlar (maishiy texnika, elektronika, smartfonlar) bundan mustasno.",
                    en: "Yes, you can. If after checking and trying on the items you realize they do not fit you, simply leave them with the employee. Keep the merchantable condition and the tag.\n\nItems whose packaging cannot be opened or damaged (household appliances, electronics, smartphones) are exceptions.",
                    ru: "Да, можно. Если после проверки и примерки товаров вы поняли, что они вам не подходят, просто оставьте их сотруднику. Сохраняйте товарный вид и ярлык.\n\nИсключение составляют товары, упаковку которых нельзя открывать или повреждать (бытовая техника, электроника, смартфоны)."
                }
            },
            {
                id: "return_after",
                q: {
                    uz: "Tovar to‘g‘ri kelmadi. Uni olib bo‘lgandan keyin qanday qaytarish mumkin?",
                    en: "The item did not fit. How to return it after receiving it?",
                    ru: "Товар не подошел. Как его вернуть после получения?"
                },
                a: {
                    uz: "Olganingizdan keyin 10 kon ichida uni topshirish punktiga olib boring. Sotuvga yaroqli ko‘rinishini va hamma yorliqlarni saqlang.\n\nShunchaki sifatga e’tirozsiz qaytarib bo‘lmaydigan tovarlar: Shaxsiy gigiyena, kosmetika, oziq-ovqat, ichki kiyim, meditsina buyumlari va kafolatga ega murakkab texnikalar.",
                    en: "Bring it to the pickup point within 10 days after receiving it. Keep the merchantable condition and all tags.\n\nItems that cannot be returned simply without quality complaints: Personal hygiene items, cosmetics, food products, underwear, medical items, and complex technical goods with a warranty.",
                    ru: "Принесите его в пункт выдачи в течение 10 дней после получения. Сохраняйте товарный вид и все ярлыки.\n\nТовары, которые нельзя вернуть просто так без претензий к качеству: предметы личной гигиены, косметика, продукты питания, нижнее белье, медицинские изделия и технически сложные товары, имеющие гарантию."
                }
            },
            {
                id: "refund_time",
                q: {
                    uz: "Qaytarish tasdiqlandi. Tovar pulini qachon qaytarib olaman?",
                    en: "The return is approved. When will I get the refund for the item?",
                    ru: "Возврат утвержден. Когда я получу деньги за товар?"
                },
                a: {
                    uz: "- Karta bilan onlayn to‘lagan bo‘lsangiz: 24 soat ichida qaytaramiz (bankka qarab hisobga tushishi cho'zilishi mumkin).\n- Punktda karta bilan to‘langan bo‘lsa: ariza to'ldirilgach 10 kun ichida faqat Uzcard/Humo kartaga o'tadi.\n- Naqd to'langan bo'lsa: topshirish punktining o'zida naqd qaytariladi.\n- Muddatli to'lov bo'lsa: limit darhol yoki oylik to'lov kamayish hisobiga qayta tiklanadi.",
                    en: "- If you paid online by card: we will refund within 24 hours (crediting may take longer depending on the bank).\n- If paid by card at the pickup point: it will be transferred only to an Uzcard/Humo card within 10 days after the application is filled out.\n- If paid in cash: refunded in cash directly at the pickup point.\n- If it's an installment plan: the limit is restored immediately or by reducing the monthly payment.",
                    ru: "- Если вы оплатили онлайн картой: мы вернем деньги в течение 24 часов (зачисление на счет может занять больше времени в зависимости от банка).\n- Если оплачено картой в пункте выдачи: перевод будет осуществлен только на карту Uzcard/Humo в течение 10 дней после заполнения заявления.\n- Если оплачено наличными: деньги возвращаются наличными прямо в пункте выдачи.\n- Если это рассрочка: лимит восстанавливается сразу или за счет уменьшения ежемесячного платежа."
                }
            }
        ]
    },
    {
        id: "scam_protection",
        category: {
            uz: "Internet firibgarlar",
            en: "Anti-Fraud Policy",
            ru: "Безопасность и мошенники"
        },
        items: [
            {
                id: "scam_tips",
                q: {
                    uz: "Qanday qilib firibgarlar qurboniga aylanib qolmaslik kerak?",
                    en: "How to avoid becoming a victim of scammers?",
                    ru: "Как не стать жертвой мошенников?"
                },
                a: {
                    uz: "Shubhali Telegram kanali yoki aksiyalar ko'rsangiz, darhol rasmiy @Uzum_Support_Bot orqali bizga yozing. Biz hech qachon shaxsiy kartaga pul o‘tkazishni talab qilmaymiz. To'lov faqat Uzum Market ilovasida yoki punktlarda amalga oshiriladi.\n\nIlovalarni faqat App Store va Play Market rasmiy do'konlaridan yuklab oling.",
                    en: "If you see a suspicious Telegram channel or promotions, write to us immediately via the official @Uzum_Support_Bot. We never demand transferring money to a personal card. Payment is made only within the Uzum Market app or at pickup points.\n\nDownload apps only from the official App Store and Play Market stores.",
                    ru: "Если вы увидите подозрительный Telegram-канал или акции, немедленно напишите нам через официальный бот @Uzum_Support_Bot. Мы никогда не требуем перевода денег на личную карту. Оплата производится только в приложении Uzum Market или в пунктах выдачи.\n\nСкачивайте приложения только из официальных магазинов App Store и Play Market."
                }
            }
        ]
    },
    {
        id: "low_price_guarantee",
        category: {
            uz: "«Arzon narxlar kafolati» aksiyasi",
            en: "Lowest Price Guarantee",
            ru: "Акция «Гарантия лучшей цены»"
        },
        items: [
            {
                id: "low_price_what",
                q: {
                    uz: "Arzon narxlar kafolati bu nima?",
                    en: "What is the Lowest Price Guarantee?",
                    ru: "Что такое гарантия лучшей цены?"
                },
                a: {
                    uz: "Uzum Marketdagi «Arzon narx kafolati» belgisi bor mahsulotni boshqa hamkor internet-do‘konlarida arzonroq narxda ko‘rsangiz, sizga narx farqi miqdorida promokod shaklida kompensatsiya beriladi.\n\nAriza berish uchun sotib olgandan keyin 3 kun ichida @Uzum_support_bot botiga har ikkala havolani yuborishingiz kerak.",
                    en: "If you find a product with the 'Lowest Price Guarantee' tag on Uzum Market at a lower price in other partner online stores, you will receive compensation in the form of a promo code for the price difference.\n\nTo apply, you need to send both links to the @Uzum_support_bot within 3 days after purchase.",
                    ru: "Если вы увидите товар с отметкой «Гарантия лучшей цены» на Uzum Market по более низкой цене в других партнерских интернет-магазинах, вам будет выплачена компенсация в виде промокода на сумму разницы в ценах.\n\nДля подачи заявки необходимо отправить обе ссылки в бот @Uzum_support_bot в течение 3 дней после покупки."
                }
            }
        ]
    }
];

const FaqItem = ({ item, lan, isSelected, onToggle }: { item: any, lan: string, isSelected: boolean, onToggle: () => void }) => {
    const [contentHeight, setContentHeight] = useState(0);
    const animController = useRef(new Animated.Value(0)).current;

    const onTextLayout = (e: any) => {
        const height = e.nativeEvent.layout.height;
        if (height > 0 && contentHeight === 0) {
            setContentHeight(height);
        }
    };

    useEffect(() => {
        Animated.timing(animController, {
            toValue: isSelected ? 1 : 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [isSelected, animController]);

    const heightInterpolate = animController.interpolate({
        inputRange: [0, 1],
        outputRange: [0, contentHeight > 0 ? contentHeight + 8 : 100],
    });

    const translateYInterpolate = animController.interpolate({
        inputRange: [0, 1],
        outputRange: [15, 0],
    });

    const opacityInterpolate = animController.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    return (
        <View
            style={[
                styles.faqCard,
                { backgroundColor: isSelected ? 'rgb(144, 216, 255)' : '#ffffff' }
            ]}
        >
            <Pressable
                onPress={onToggle}
                onMouseEnter={onToggle}
                style={styles.pressableArea}
            >
                {item.q && item.q[lan] ? (
                    <Text style={[
                        styles.questionText,
                        { color: isSelected ? '#ffffff' : '#1F2937' }
                    ]}>
                        {item.q[lan]}
                    </Text>
                ) : null}

                <Animated.View
                    style={[
                        styles.answerWrapper,
                        {
                            height: heightInterpolate,
                            opacity: opacityInterpolate,
                            transform: [{ translateY: translateYInterpolate }]
                        }
                    ]}
                >
                    <View
                        style={styles.measureContainer}
                        onLayout={onTextLayout}
                    >
                        <Text style={[
                            styles.answerText,
                            { color: isSelected ? '#000' : '#4B5563' }
                        ]}>
                            {item.a ? item.a[lan] : item.text?.[lan]}
                        </Text>
                    </View>
                </Animated.View>
            </Pressable>
        </View>
    );
};

const SavolJavob = () => {
    const lan = useLanStorage(state => state.lan);
    const [selectedId, setSelectedId] = useState(null);
    const [isMounted, setIsMounted] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isMounted) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 450,
                    useNativeDriver: useNativeAnimDriver,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 450,
                    useNativeDriver: useNativeAnimDriver,
                }),
            ]).start();
        }
    }, [isMounted, fadeAnim, slideAnim]);

    const toggleSelect = (id) => {
        setSelectedId(prevId => prevId === id ? null : id);
    };

    if (!isMounted) {
        return null;
    }

    return (
        <ScreenWrapper style={styles.wrapper}>
            <Animated.ScrollView
                contentContainerStyle={[
                    styles.container,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }]
                    }
                ]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Text style={styles.mainTitle}>
                        {lan === 'uz' ? 'Yordam markazi' : lan === 'en' ? 'Help Center' : lan === 'ru' ? 'Центр помощи' : 'Yordam markazi'}
                    </Text>
                    <Text style={styles.subTitle}>
                        {lan === 'uz' ? "Ko'p beriladigan savollarga javoblar" : lan === 'en' ? 'FAQ (Frequently Asked Questions)' : lan === 'ru' ? 'Часто задаваемые вопросы' : "Ko'p beriladigan savollarga javoblar"}
                    </Text>
                </View>

                {FAQ_DATA.map((section) => (
                    <View key={section.id} style={styles.sectionContainer}>
                        <Text style={styles.categoryTitle}>{section.category[lan]}</Text>

                        {section.items.map((item) => (
                            <FaqItem
                                key={item.id}
                                item={item}
                                lan={lan}
                                isSelected={selectedId === item.id}
                                onToggle={() => toggleSelect(item.id)}
                            />
                        ))}
                    </View>
                ))}
            </Animated.ScrollView>
        </ScreenWrapper>
    );
};

export default SavolJavob;

const styles = StyleSheet.create({
    wrapper: {
        backgroundColor: '#F9FAFB',
    },
    container: {
        padding: 16,
        paddingBottom: 32,
    },
    header: {
        marginBottom: 24,
        marginTop: 8,
    },
    mainTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
        letterSpacing: -0.5,
    },
    subTitle: {
        fontSize: 14,
        color: '#6B7280',
    },
    sectionContainer: {
        marginBottom: 28,
    },
    categoryTitle: {
        fontWeight: '700',
        color: 'rgb(0, 166, 255)',
        marginBottom: 12,
        letterSpacing: -0.2,
        textTransform: 'uppercase',
        fontSize: 13,
    },
    faqCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#111827',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    pressableArea: {
        width: '100%',
    },
    questionText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
        lineHeight: 22,
    },
    answerWrapper: {
        overflow: 'hidden',
    },
    measureContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
    },
    answerText: {
        fontSize: 14,
        lineHeight: 22,
        marginTop: 8,
    }
});