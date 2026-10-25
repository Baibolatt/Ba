export type CategorySlug =
  | "brakes"
  | "filters"
  | "oils"
  | "engine"
  | "suspension"
  | "electric";

export type CategoryIcon =
  | "brake"
  | "filter"
  | "droplet"
  | "gear"
  | "spring"
  | "battery";

export type Category = {
  slug: CategorySlug;
  name: string;
  shortName: string;
  description: string;
  icon: CategoryIcon;
};

export type Specification = {
  label: string;
  value: string;
};

export type Product = {
  id: string;
  name: string;
  brand: string;
  article: string;
  categorySlug: CategorySlug;
  price: number;
  oldPrice?: number;
  stock: number;
  unit: string;
  description: string;
  specs: Specification[];
  badge?: "Хит" | "Новинка";
};

export type StockLevel = "in" | "low" | "out";

export type OrderStatus = "processing" | "assembling" | "delivered" | "cancelled";

export type OrderItem = {
  productId: string;
  qty: number;
};

export type Order = {
  id: string;
  number: string;
  date: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  address: string;
  delivery: string;
  payment: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  text: string;
  date: string;
  read: boolean;
  href?: string;
};

export type Profile = {
  name: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  address: string;
};

export const categories: Category[] = [
  {
    slug: "brakes",
    name: "Тормозная система",
    shortName: "Тормоза",
    description: "Колодки, диски, суппорты",
    icon: "brake",
  },
  {
    slug: "filters",
    name: "Фильтры",
    shortName: "Фильтры",
    description: "Масляные, воздушные, салонные",
    icon: "filter",
  },
  {
    slug: "oils",
    name: "Масла и жидкости",
    shortName: "Масла",
    description: "Моторные масла, антифризы",
    icon: "droplet",
  },
  {
    slug: "engine",
    name: "Двигатель",
    shortName: "Двигатель",
    description: "Ремни, ролики, прокладки",
    icon: "gear",
  },
  {
    slug: "suspension",
    name: "Подвеска",
    shortName: "Подвеска",
    description: "Амортизаторы, пружины, рычаги",
    icon: "spring",
  },
  {
    slug: "electric",
    name: "Электрика",
    shortName: "Электрика",
    description: "Аккумуляторы, свечи, датчики",
    icon: "battery",
  },
];

export const products: Product[] = [
  {
    id: "tl-2418",
    name: "Колодки тормозные передние",
    brand: "ТехноЛайн",
    article: "TL-2418",
    categorySlug: "brakes",
    price: 3290,
    oldPrice: 3990,
    stock: 24,
    unit: "комплект",
    description:
      "Комплект передних тормозных колодок для повседневной эксплуатации. Малошумный керамический состав устойчив к перегреву и пыли.",
    specs: [
      { label: "Тип", value: "Колодки дисковые" },
      { label: "Ось", value: "Передняя" },
      { label: "Количество в упаковке", value: "4 шт." },
      { label: "Материал", value: "Керамика" },
      { label: "Гарантия", value: "12 месяцев" },
    ],
    badge: "Хит",
  },
  {
    id: "ae-5520",
    name: "Диск тормозной вентилируемый",
    brand: "АвтоЭра",
    article: "AE-5520",
    categorySlug: "brakes",
    price: 5490,
    stock: 8,
    unit: "шт.",
    description:
      "Вентилируемый тормозной диск с антикоррозийным покрытием. Равномерный отвод тепла и стабильное торможение под нагрузкой.",
    specs: [
      { label: "Тип", value: "Диск вентилируемый" },
      { label: "Диаметр", value: "300 мм" },
      { label: "Толщина", value: "28 мм" },
      { label: "Количество отверстий", value: "5" },
      { label: "Гарантия", value: "12 месяцев" },
    ],
  },
  {
    id: "mk-1130",
    name: "Суппорт тормозной задний левый",
    brand: "МоторКрафт",
    article: "MK-1130",
    categorySlug: "brakes",
    price: 12900,
    stock: 2,
    unit: "шт.",
    description:
      "Задний левый суппорт в сборе. Чугунный корпус, защитное покрытие и проверенная геометрия посадочных мест.",
    specs: [
      { label: "Сторона", value: "Задняя левая" },
      { label: "Тип", value: "Суппорт в сборе" },
      { label: "Материал", value: "Чугун" },
      { label: "Гарантия", value: "12 месяцев" },
    ],
  },
  {
    id: "gf-1042",
    name: "Фильтр масляный",
    brand: "ГрандФильтр",
    article: "GF-1042",
    categorySlug: "filters",
    price: 690,
    stock: 56,
    unit: "шт.",
    description:
      "Масляный фильтр с многослойной фильтрующей бумагой и обратным клапаном. Подходит для планового обслуживания.",
    specs: [
      { label: "Тип", value: "Масляный" },
      { label: "Резьба", value: "M20×1.5" },
      { label: "Высота", value: "79 мм" },
      { label: "Гарантия", value: "12 месяцев" },
    ],
    badge: "Хит",
  },
  {
    id: "gf-2205",
    name: "Фильтр воздушный панельный",
    brand: "ГрандФильтр",
    article: "GF-2205",
    categorySlug: "filters",
    price: 1150,
    stock: 14,
    unit: "шт.",
    description:
      "Панельный воздушный фильтр с высокой пылеёмкостью. Сохраняет стабильный поток воздуха и защищает двигатель.",
    specs: [
      { label: "Тип", value: "Воздушный" },
      { label: "Форма", value: "Панельный" },
      { label: "Длина", value: "285 мм" },
      { label: "Ширина", value: "190 мм" },
    ],
  },
  {
    id: "op-540",
    name: "Масло моторное 5W-40, 4 л",
    brand: "ОйлПро",
    article: "OP-540",
    categorySlug: "oils",
    price: 3890,
    oldPrice: 4490,
    stock: 32,
    unit: "канистра",
    description:
      "Синтетическое моторное масло для бензиновых и дизельных двигателей. Стабильная вязкость в городском цикле.",
    specs: [
      { label: "Вязкость", value: "5W-40" },
      { label: "Объём", value: "4 л" },
      { label: "Допуск", value: "API SN" },
      { label: "Тип", value: "Синтетическое" },
    ],
    badge: "Хит",
  },
  {
    id: "op-g12",
    name: "Антифриз G12, 5 л",
    brand: "ОйлПро",
    article: "OP-G12",
    categorySlug: "oils",
    price: 1490,
    stock: 3,
    unit: "канистра",
    description:
      "Готовый к применению антифриз класса G12. Защищает систему охлаждения от коррозии и замерзания.",
    specs: [
      { label: "Класс", value: "G12" },
      { label: "Объём", value: "5 л" },
      { label: "Цвет", value: "Красный" },
      { label: "Температура", value: "до −40 °C" },
    ],
  },
  {
    id: "tl-8802",
    name: "Ремень ГРМ",
    brand: "ТехноЛайн",
    article: "TL-8802",
    categorySlug: "engine",
    price: 2750,
    stock: 0,
    unit: "шт.",
    description:
      "Зубчатый ремень ГРМ из HNBR. Устойчив к растяжению и высоким температурам. Перед заказом уточните артикул у менеджера.",
    specs: [
      { label: "Тип", value: "Ремень ГРМ" },
      { label: "Количество зубьев", value: "153" },
      { label: "Ширина", value: "25 мм" },
      { label: "Материал", value: "HNBR" },
    ],
  },
  {
    id: "ae-7701",
    name: "Свеча зажигания иридиевая",
    brand: "АвтоЭра",
    article: "AE-7701",
    categorySlug: "electric",
    price: 890,
    stock: 120,
    unit: "шт.",
    description:
      "Иридиевая свеча зажигания с ресурсом до 60 000 км. Стабильная искра и уверенный запуск в холодное время.",
    specs: [
      { label: "Тип", value: "Иридиевая" },
      { label: "Резьба", value: "M14×1.25" },
      { label: "Зазор", value: "0.8 мм" },
      { label: "Количество", value: "1 шт." },
    ],
    badge: "Новинка",
  },
  {
    id: "mk-3310",
    name: "Амортизатор передний газомасляный",
    brand: "МоторКрафт",
    article: "MK-3310",
    categorySlug: "suspension",
    price: 7950,
    stock: 6,
    unit: "шт.",
    description:
      "Передний газомасляный амортизатор для городских дорог. Собран и проверен на стенде, готов к установке.",
    specs: [
      { label: "Ось", value: "Передняя" },
      { label: "Тип", value: "Газомасляный" },
      { label: "Сторона", value: "Универсальная" },
      { label: "Гарантия", value: "12 месяцев" },
    ],
  },
  {
    id: "sp-6120",
    name: "Пружина подвески передняя",
    brand: "СевероПартс",
    article: "SP-6120",
    categorySlug: "suspension",
    price: 4200,
    stock: 2,
    unit: "шт.",
    description:
      "Передняя пружина стандартной жёсткости с защитным покрытием. Восстанавливает штатную высоту кузова.",
    specs: [
      { label: "Ось", value: "Передняя" },
      { label: "Тип", value: "Пружина подвески" },
      { label: "Высота", value: "340 мм" },
      { label: "Жёсткость", value: "Стандарт" },
    ],
  },
  {
    id: "sp-600",
    name: "Аккумулятор 60 Ач",
    brand: "СевероПартс",
    article: "SP-600",
    categorySlug: "electric",
    price: 9800,
    oldPrice: 10900,
    stock: 5,
    unit: "шт.",
    description:
      "Необслуживаемый аккумулятор для легковых автомобилей. Устойчив к глубоким разрядам и низким температурам.",
    specs: [
      { label: "Ёмкость", value: "60 Ач" },
      { label: "Пусковой ток", value: "540 А" },
      { label: "Полярность", value: "Обратная" },
      { label: "Габариты", value: "242×175×190 мм" },
    ],
  },
];

export const brands = Array.from(new Set(products.map((product) => product.brand)));

export const profile: Profile = {
  name: "Алексей",
  lastName: "Смирнов",
  email: "alexey@example.ru",
  phone: "+7 (900) 123-45-67",
  city: "Москва",
  address: "ул. Складская, 12, кв. 45",
};

export const orders: Order[] = [
  {
    id: "ph-241024-02",
    number: "PH-241024-02",
    date: "24 октября 2026",
    status: "processing",
    items: [
      { productId: "ae-5520", qty: 1 },
      { productId: "ae-7701", qty: 4 },
    ],
    total: 9050,
    address: "Москва, ул. Складская, 12, кв. 45",
    delivery: "Курьером",
    payment: "Счёт для юрлица",
  },
  {
    id: "ph-241022-01",
    number: "PH-241022-01",
    date: "22 октября 2026",
    status: "assembling",
    items: [
      { productId: "op-540", qty: 1 },
      { productId: "gf-2205", qty: 1 },
    ],
    total: 5040,
    address: "Москва, пункт выдачи «Складская, 12»",
    delivery: "Самовывоз",
    payment: "При получении",
  },
  {
    id: "ph-241018-03",
    number: "PH-241018-03",
    date: "18 октября 2026",
    status: "delivered",
    items: [
      { productId: "tl-2418", qty: 2 },
      { productId: "gf-1042", qty: 1 },
    ],
    total: 7270,
    address: "Москва, ул. Складская, 12, кв. 45",
    delivery: "Курьером",
    payment: "Картой при получении",
  },
];

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
    text: "Заказ ждёт вас в пункте выдачи «Складская, 12».",
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

export const orderStatusLabels: Record<OrderStatus, string> = {
  processing: "Обрабатывается",
  assembling: "Собирается",
  delivered: "Доставлен",
  cancelled: "Отменён",
};

export function formatPrice(value: number): string {
  return `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
}

export function productCountLabel(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  const word =
    mod10 === 1 && mod100 !== 11
      ? "товар"
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? "товара"
        : "товаров";
  return `${count} ${word}`;
}

export function stockLevel(product: Product): StockLevel {
  if (product.stock <= 0) return "out";
  if (product.stock <= 3) return "low";
  return "in";
}

export function getProduct(id: string): Product | undefined {
  return products.find((product) => product.id === id);
}

export function getCategory(slug: string): Category | undefined {
  return categories.find((category) => category.slug === slug);
}

export function getProductsByCategory(slug: string): Product[] {
  if (slug === "all") return products;
  return products.filter((product) => product.categorySlug === slug);
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  return products
    .filter(
      (item) =>
        item.id !== product.id &&
        (item.categorySlug === product.categorySlug ||
          item.brand === product.brand),
    )
    .slice(0, limit);
}

export function searchProducts(query: string): Product[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  return products.filter((product) =>
    [product.name, product.article, product.brand]
      .join(" ")
      .toLowerCase()
      .includes(normalized),
  );
}

export function getOrder(id: string): Order | undefined {
  return orders.find((order) => order.id === id);
}

export function orderItemsCount(order: Order): number {
  return order.items.reduce((sum, item) => sum + item.qty, 0);
}
