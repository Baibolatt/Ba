import type { NotificationItem } from "@/lib/types";

export const notifications: NotificationItem[] = [
  {
    id: "n-1",
    title: "Заказ PH-241024-02 принят",
    text: "Мы собираем товары на складе. Уведомим, когда заказ будет готов.",
    date: "24 октября, 14:20",
    read: false,
    href: "/account/orders/ph-241024-02",
  },
  {
    id: "n-2",
    title: "Товар снова в наличии",
    text: "Масляный фильтр ГрандФильтр GF-1042 доступен для заказа.",
    date: "23 октября, 09:05",
    read: false,
    href: "/product/gf-1042",
  },
  {
    id: "n-3",
    title: "Заказ PH-241022-01 собран",
    text: "Заказ ждёт вас в пункте выдачи «Жибек Жолы, 12».",
    date: "22 октября, 18:40",
    read: true,
    href: "/account/orders/ph-241022-01",
  },
  {
    id: "n-4",
    title: "Добро пожаловать в PartsHub",
    text: "Мы добавили подборки по категориям и быстрый поиск по артикулу.",
    date: "1 октября, 10:00",
    read: true,
    href: "/catalog",
  },
];
